import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Stripe from 'stripe';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { Product, ProductDocument, ProductType } from '../products/schemas/product.schema';
import { Business, BusinessDocument } from '../businesses/schemas/business.schema';

@Injectable()
export class StripeSyncService {
    private stripe: Stripe;
    private readonly logger = new Logger(StripeSyncService.name);
    private readonly environment: string;

    constructor(
        private configService: ConfigService,
        @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        @InjectModel(Business.name) private businessModel: Model<BusinessDocument>,
    ) {
        const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (!secretKey) {
            throw new Error('STRIPE_SECRET_KEY is not defined');
        }
        this.stripe = new Stripe(secretKey, {
            apiVersion: '2025-11-17.clover' as any,
        });
        this.environment = this.configService.get<string>('NODE_ENV') || 'development';
    }

    /**
     * Synchronize a Service with Stripe with locking and retry logic
     */
    async syncService(serviceId: string): Promise<void> {
        const now = new Date();
        const lockDuration = 10 * 60 * 1000; // 10 minutes

        const currentLiveMode = this.configService.get<string>('STRIPE_SECRET_KEY')?.startsWith('sk_live') || false;

        // 1. Acquire Lock
        const service = await this.serviceModel.findOneAndUpdate(
            {
                _id: new Types.ObjectId(serviceId),
                $or: [
                    { 'stripe.syncStatus': { $in: ['PENDING', 'ERROR', null] } },
                    { 'stripe.syncStatus': { $exists: false } },
                    { 'stripe.livemode': { $ne: currentLiveMode } },
                    {
                        'stripe.syncStatus': 'SYNCING',
                        'stripe.syncLockedAt': { $lt: new Date(Date.now() - lockDuration) }
                    }
                ]
            },
            {
                $set: {
                    'stripe.syncStatus': 'SYNCING',
                    'stripe.syncLockedAt': now
                }
            },
            { new: true }
        );

        if (!service) {
            this.logger.debug(`Service ${serviceId} already syncing or synced. skipping.`);
            return;
        }

        try {
            this.logger.log(`Syncing service to Stripe: ${service.name} (${service._id})`);

            const environmentMismatch = service.stripe?.livemode !== currentLiveMode;
            let stripeProductId = environmentMismatch ? null : service.stripe?.productId;

            if (!stripeProductId) {
                const product = await this.stripe.products.create({
                    name: service.name,
                    description: service.description || `Service: ${service.name}`,
                    metadata: {
                        businessId: service.businessId || '',
                        internalId: service._id.toString(),
                        type: 'SERVICE',
                        environment: this.environment,
                    },
                });
                stripeProductId = product.id;
            } else {
                await this.stripe.products.update(stripeProductId, {
                    name: service.name,
                    description: service.description || `Service: ${service.name}`,
                });
            }

            // Ensure Price exists/is correct
            const currentPriceId = environmentMismatch ? null : service.stripe?.priceId;
            let shouldCreatePrice = !currentPriceId;

            if (currentPriceId) {
                try {
                    const stripePrice = await this.stripe.prices.retrieve(currentPriceId);
                    if (stripePrice.unit_amount !== Math.round(service.price * 100)) {
                        shouldCreatePrice = true;
                    }
                } catch (e) {
                    shouldCreatePrice = true; // Price might be deleted in Stripe
                }
            }

            let finalPriceId = currentPriceId;
            if (shouldCreatePrice) {
                const business = await this.businessModel.findById(service.businessId);
                const currency = (business?.settings?.currency || 'mxn').toLowerCase();

                const price = await this.stripe.prices.create({
                    product: stripeProductId,
                    unit_amount: Math.round(service.price * 100),
                    currency,
                    metadata: {
                        businessId: service.businessId || '',
                        internalId: service._id.toString(),
                    },
                });
                finalPriceId = price.id;
            }

            // Success Transition
            await this.serviceModel.findByIdAndUpdate(serviceId, {
                $set: {
                    'stripe.productId': stripeProductId,
                    'stripe.priceId': finalPriceId,
                    'stripe.livemode': this.configService.get<string>('STRIPE_SECRET_KEY')?.startsWith('sk_live') || false,
                    'stripe.syncStatus': 'SYNCED',
                    'stripe.lastSyncedAt': now,
                    'stripe.lastSyncError': null,
                    'stripe.retryCount': 0,
                    'stripe.nextRetryAt': null,
                    stripePriceId: finalPriceId, // legacy field
                }
            });

            this.logger.log(`Service successfully synced: ${service.name}`);
        } catch (error: any) {
            await this.handleSyncError(this.serviceModel, serviceId, service.stripe?.retryCount || 0, error.message);
        }
    }

    /**
     * Synchronize a Product (Package/Pass) with Stripe with locking and retry logic
     */
    async syncProduct(productId: string): Promise<void> {
        const now = new Date();
        const lockDuration = 10 * 60 * 1000;

        const currentLiveMode = this.configService.get<string>('STRIPE_SECRET_KEY')?.startsWith('sk_live') || false;

        const productEntity = await this.productModel.findOneAndUpdate(
            {
                _id: new Types.ObjectId(productId),
                $or: [
                    { 'stripe.syncStatus': { $in: ['PENDING', 'ERROR', null] } },
                    { 'stripe.syncStatus': { $exists: false } },
                    { 'stripe.livemode': { $ne: currentLiveMode } },
                    {
                        'stripe.syncStatus': 'SYNCING',
                        'stripe.syncLockedAt': { $lt: new Date(Date.now() - lockDuration) }
                    }
                ]
            },
            {
                $set: {
                    'stripe.syncStatus': 'SYNCING',
                    'stripe.syncLockedAt': now
                }
            },
            { new: true }
        );

        if (!productEntity) return;

        try {
            this.logger.log(`Syncing product to Stripe: ${productEntity.name} (${productEntity._id})`);

            const environmentMismatch = productEntity.stripe?.livemode !== currentLiveMode;
            let stripeProductId = environmentMismatch ? null : productEntity.stripe?.productId;

            if (!stripeProductId) {
                const stripeProduct = await this.stripe.products.create({
                    name: productEntity.name,
                    description: productEntity.description || `Product: ${productEntity.name}`,
                    metadata: {
                        businessId: productEntity.businessId,
                        internalId: (productEntity as any)._id.toString(),
                        type: productEntity.type === ProductType.Package ? 'PACKAGE' : 'PASS',
                        environment: this.environment,
                    },
                });
                stripeProductId = stripeProduct.id;
            } else {
                await this.stripe.products.update(stripeProductId, {
                    name: productEntity.name,
                    description: productEntity.description || `Product: ${productEntity.name}`,
                });
            }

            const currentPriceId = environmentMismatch ? null : productEntity.stripe?.priceId;
            let shouldCreatePrice = !currentPriceId;

            if (currentPriceId) {
                try {
                    const stripePrice = await this.stripe.prices.retrieve(currentPriceId);
                    if (stripePrice.unit_amount !== Math.round(productEntity.price * 100)) {
                        shouldCreatePrice = true;
                    }
                } catch (e) {
                    shouldCreatePrice = true;
                }
            }

            let finalPriceId = currentPriceId;
            if (shouldCreatePrice) {
                const business = await this.businessModel.findById(productEntity.businessId);
                const currency = (business?.settings?.currency || 'mxn').toLowerCase();

                const price = await this.stripe.prices.create({
                    product: stripeProductId,
                    unit_amount: Math.round(productEntity.price * 100),
                    currency,
                    metadata: {
                        businessId: productEntity.businessId,
                        internalId: (productEntity as any)._id.toString(),
                    },
                });
                finalPriceId = price.id;
            }

            await this.productModel.findByIdAndUpdate(productId, {
                $set: {
                    'stripe.productId': stripeProductId,
                    'stripe.priceId': finalPriceId,
                    'stripe.livemode': this.configService.get<string>('STRIPE_SECRET_KEY')?.startsWith('sk_live') || false,
                    'stripe.syncStatus': 'SYNCED',
                    'stripe.lastSyncedAt': now,
                    'stripe.lastSyncError': null,
                    'stripe.retryCount': 0,
                    'stripe.nextRetryAt': null,
                    stripePriceId: finalPriceId,
                }
            });

            this.logger.log(`Product successfully synced: ${productEntity.name}`);
        } catch (error: any) {
            await this.handleSyncError(this.productModel, productId, productEntity.stripe?.retryCount || 0, error.message);
        }
    }

    /**
     * Common error handler for sync operations with exponential backoff
     */
    private async handleSyncError(model: Model<any>, id: string, currentRetry: number, errorMessage: string) {
        this.logger.error(`Failed to sync entity ${id}: ${errorMessage}`);

        const nextRetry = currentRetry + 1;
        const backoffMinutes = this.getBackoffMinutes(nextRetry);
        const nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

        await model.findByIdAndUpdate(id, {
            $set: {
                'stripe.syncStatus': 'ERROR',
                'stripe.lastSyncError': errorMessage,
                'stripe.retryCount': nextRetry,
                'stripe.nextRetryAt': nextRetryAt
            }
        });
    }

    /**
     * Backoff sequence: 1 min, 5 min, 15 min, 1h, 6h, cap 24h
     */
    private getBackoffMinutes(retryCount: number): number {
        const sequence = [1, 5, 15, 60, 360]; // 1m, 5m, 15m, 1h, 6h
        if (retryCount <= sequence.length) {
            return sequence[retryCount - 1];
        }
        return 1440; // 24h cap
    }
}

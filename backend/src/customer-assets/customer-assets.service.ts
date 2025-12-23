import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CustomerAsset, CustomerAssetDocument, AssetStatus } from './schemas/customer-asset.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';

@Injectable()
export class CustomerAssetsService {
    constructor(
        @InjectModel(CustomerAsset.name) private assetModel: Model<CustomerAssetDocument>,
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    ) { }

    async createFromPurchase(businessId: string, clientEmail: string, productId: string, clientPhone?: string, stripeSessionId?: string, stripePaymentIntentId?: string) {
        // Idempotency check: if stripeSessionId is provided, check if we already processed this session
        if (stripeSessionId) {
            const existing = await this.assetModel.findOne({ stripeSessionId });
            if (existing) {
                console.log(`[IDEMPOTENCY] CustomerAsset already exists for Stripe session: ${stripeSessionId}`);
                return existing;
            }
        }

        const product = await this.productModel.findById(productId);
        if (!product) throw new BadRequestException('Product not found');

        const expiresAt = product.validityDays
            ? new Date(Date.now() + product.validityDays * 24 * 60 * 60 * 1000)
            : undefined;

        const asset = new this.assetModel({
            businessId,
            clientEmail,
            clientPhone,
            productId: new Types.ObjectId(productId),
            totalUses: product.isUnlimited ? 0 : (product.totalUses || 1),
            remainingUses: product.isUnlimited ? 0 : (product.totalUses || 1),
            isUnlimited: product.isUnlimited || false,
            expiresAt,
            status: AssetStatus.Active,
            stripeSessionId,
            stripePaymentIntentId,
        });

        return asset.save();
    }

    async findActiveAssets(businessId: string, clientEmail: string, serviceId?: string, clientPhone?: string) {
        const now = new Date();

        const identifierMatch: any[] = [{ clientEmail }];
        if (clientPhone) {
            identifierMatch.push({ clientPhone });
        }

        const query: any = {
            businessId,
            $or: identifierMatch,
            status: AssetStatus.Active,
            $and: [
                {
                    $or: [
                        { isUnlimited: true },
                        { remainingUses: { $gt: 0 } }
                    ]
                },
                {
                    $or: [
                        { expiresAt: { $exists: false } },
                        { expiresAt: { $gt: now } }
                    ]
                }
            ]
        };

        const assets = await this.assetModel.find(query).populate('productId').lean();

        // Filter by allowed services if serviceId is provided
        if (serviceId) {
            return assets.filter((asset: any) => {
                const product = asset.productId as Product;
                return !product.allowedServiceIds?.length || product.allowedServiceIds.includes(serviceId);
            });
        }

        return assets;
    }

    /**
     * Consumes one use from the asset.
     * Uses findOneAndUpdate for atomic decrement to prevent race conditions.
     */
    async consumeUse(assetId: string, options?: { email?: string; phone?: string; referenceDate?: Date }) {
        const now = new Date();
        const compareDate = (options?.referenceDate && options.referenceDate > now) ? options.referenceDate : now;

        // First find to check if it's unlimited and verify ownership
        const existing = await this.assetModel.findById(assetId);
        if (!existing) throw new BadRequestException('Asset not found');

        // Verify ownership if contact info is provided
        if (options) {
            const matchesEmail = options.email && existing.clientEmail === options.email;
            const matchesPhone = options.phone && existing.clientPhone === options.phone;

            if (options.email || options.phone) {
                if (!matchesEmail && !matchesPhone) {
                    throw new BadRequestException('El paquete seleccionado no pertenece a tu cuenta (email/teléfono)');
                }
            }
        }

        let updatedAsset;

        if (existing.isUnlimited) {
            // Atomic update for unlimited: just track usage
            updatedAsset = await this.assetModel.findOneAndUpdate(
                {
                    _id: assetId,
                    status: AssetStatus.Active,
                    $or: [
                        { expiresAt: { $exists: false } },
                        { expiresAt: { $gt: compareDate } }
                    ]
                },
                {
                    $inc: { timesUsed: 1 },
                    $set: { lastUsedAt: now }
                },
                { new: true }
            );
        } else {
            // Atomic update for limited: decrement uses
            updatedAsset = await this.assetModel.findOneAndUpdate(
                {
                    _id: assetId,
                    status: AssetStatus.Active,
                    remainingUses: { $gt: 0 },
                    $or: [
                        { expiresAt: { $exists: false } },
                        { expiresAt: { $gt: compareDate } }
                    ]
                },
                {
                    $inc: { remainingUses: -1, timesUsed: 1 },
                    $set: { lastUsedAt: now }
                },
                { new: true }
            );
        }

        if (!updatedAsset) {
            throw new BadRequestException({
                message: 'El paquete no está disponible para esta fecha, no tiene usos restantes o ha expirado.',
                code: 'ASSET_EXPIRED_FOR_DATE'
            });
        }

        // Check if we just consumed the last use for limited assets
        if (!updatedAsset.isUnlimited && updatedAsset.remainingUses === 0) {
            updatedAsset.status = AssetStatus.Consumed;
            await updatedAsset.save();
        }

        return updatedAsset;
    }

    async refundUse(assetId: string) {
        const existing = await this.assetModel.findById(assetId);
        if (!existing) return null;

        if (existing.isUnlimited) {
            // For unlimited, we "refund" by decrementing timesUsed if we want accuracy,
            // though usually it doesn't matter much.
            return this.assetModel.findOneAndUpdate(
                { _id: assetId },
                { $inc: { timesUsed: -1 } },
                { new: true }
            );
        }

        // Atomic increment for refund
        const asset = await this.assetModel.findOneAndUpdate(
            { _id: assetId },
            {
                $inc: { remainingUses: 1, timesUsed: -1 },
                $set: { status: AssetStatus.Active } // Reactive if it was Consumed
            },
            { new: true }
        );

        return asset;
    }

    async findByBusiness(businessId: string) {
        return this.assetModel.find({ businessId })
            .populate('productId')
            .sort({ createdAt: -1 })
            .lean();
    }
}

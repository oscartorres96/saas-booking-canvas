import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as cron from 'node-cron';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { StripeSyncService } from './stripe-sync.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeSyncCronService implements OnModuleInit {
    private readonly logger = new Logger(StripeSyncCronService.name);

    constructor(
        @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        private readonly stripeSyncService: StripeSyncService,
        private readonly configService: ConfigService,
    ) { }

    onModuleInit() {
        this.scheduleRetries();
        this.logger.log('Stripe Sync Retry Cron Job scheduled (every 5 minutes)');

        // Initial run after a short delay to allow system to settle
        setTimeout(() => {
            this.processServiceRetries();
            this.processProductRetries();
        }, 10000);
    }

    private scheduleRetries() {
        // Runs every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            await this.processServiceRetries();
            await this.processProductRetries();
        });
    }

    private async processServiceRetries() {
        const now = new Date();
        const currentLiveMode = this.configService.get<string>('STRIPE_SECRET_KEY')?.startsWith('sk_live') || false;

        const pendingServices = await this.serviceModel.find({
            $or: [
                { 'stripe.syncStatus': 'ERROR', 'stripe.nextRetryAt': { $lte: now } },
                { 'stripe.syncStatus': 'PENDING' },
                { 'stripe.syncStatus': { $exists: false } },
                // Detect environment mismatch even if SYNCED
                { 'stripe.syncStatus': 'SYNCED', 'stripe.livemode': { $ne: currentLiveMode } }
            ]
        }).limit(20).exec();

        if (pendingServices.length > 0) {
            this.logger.log(`Syncing ${pendingServices.length} pending/error services (Current Livemode: ${currentLiveMode})`);
            for (const service of pendingServices) {
                await this.stripeSyncService.syncService((service as any)._id.toString());
            }
        }
    }

    private async processProductRetries() {
        const now = new Date();
        const currentLiveMode = this.configService.get<string>('STRIPE_SECRET_KEY')?.startsWith('sk_live') || false;

        const pendingProducts = await this.productModel.find({
            $or: [
                { 'stripe.syncStatus': 'ERROR', 'stripe.nextRetryAt': { $lte: now } },
                { 'stripe.syncStatus': 'PENDING' },
                { 'stripe.syncStatus': { $exists: false } },
                // Detect environment mismatch even if SYNCED
                { 'stripe.syncStatus': 'SYNCED', 'stripe.livemode': { $ne: currentLiveMode } }
            ]
        }).limit(20).exec();

        if (pendingProducts.length > 0) {
            this.logger.log(`Syncing ${pendingProducts.length} pending/error products (Current Livemode: ${currentLiveMode})`);
            for (const product of pendingProducts) {
                await this.stripeSyncService.syncProduct((product as any)._id.toString());
            }
        }
    }
}

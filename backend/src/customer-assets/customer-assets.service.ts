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

    async createFromPurchase(businessId: string, clientEmail: string, productId: string) {
        const product = await this.productModel.findById(productId);
        if (!product) throw new BadRequestException('Product not found');

        const expiresAt = product.validityDays
            ? new Date(Date.now() + product.validityDays * 24 * 60 * 60 * 1000)
            : undefined;

        const asset = new this.assetModel({
            businessId,
            clientEmail,
            productId: new Types.ObjectId(productId),
            totalUses: product.totalUses || 1,
            remainingUses: product.totalUses || 1,
            expiresAt,
            status: AssetStatus.Active,
        });

        return asset.save();
    }

    async findActiveAssets(businessId: string, clientEmail: string, serviceId?: string) {
        const now = new Date();
        const query: any = {
            businessId,
            clientEmail,
            status: AssetStatus.Active,
            remainingUses: { $gt: 0 },
            // Ensure asset has not expired
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gt: now } }
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
    async consumeUse(assetId: string) {
        const now = new Date();

        // Atomic update: only decrement if uses > 0 and not expired
        const asset = await this.assetModel.findOneAndUpdate(
            {
                _id: assetId,
                status: AssetStatus.Active,
                remainingUses: { $gt: 0 },
                $or: [
                    { expiresAt: { $exists: false } },
                    { expiresAt: { $gt: now } }
                ]
            },
            {
                $inc: { remainingUses: -1 }
            },
            { new: true }
        );

        if (!asset) {
            throw new BadRequestException('El paquete no está disponible, no tiene usos restantes o ha expirado.');
        }

        // Check if we just consumed the last use
        if (asset.remainingUses === 0) {
            asset.status = AssetStatus.Consumed;
            await asset.save();
        }

        return asset;
    }

    async refundUse(assetId: string) {
        // Atomic increment for refund
        const asset = await this.assetModel.findOneAndUpdate(
            { _id: assetId },
            {
                $inc: { remainingUses: 1 },
                $set: { status: AssetStatus.Active } // Reactive if it was Consumed
            },
            { new: true }
        );

        return asset;
    }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { StripeSyncService } from '../stripe/stripe-sync.service';

@Injectable()
export class ProductsService {
    constructor(
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        private readonly stripeSyncService: StripeSyncService,
    ) { }

    async create(businessId: string, data: any) {
        if (data.isUnlimited) {
            data.totalUses = 0;
        }
        const product = new this.productModel({
            ...data,
            businessId,
            stripe: { syncStatus: 'PENDING', productId: null, priceId: null }
        });
        const saved = await product.save();

        // Trigger async sync
        this.stripeSyncService.syncProduct((saved as any)._id.toString()).catch(err => {
            console.error('Failed to trigger initial stripe sync for product:', err);
        });

        return saved;
    }

    async findAll(businessId: string) {
        return this.productModel.find({ businessId, active: true }).lean();
    }

    async findOne(id: string) {
        const product = await this.productModel.findById(id).lean();
        if (!product) throw new NotFoundException('Product not found');
        return product;
    }

    async update(id: string, data: any) {
        const updated = await this.productModel.findByIdAndUpdate(id, {
            ...data,
            'stripe.syncStatus': 'PENDING'
        }, { new: true });

        if (!updated) throw new NotFoundException('Product not found');

        // Trigger async sync
        this.stripeSyncService.syncProduct((updated as any)._id.toString()).catch(err => {
            console.error('Failed to trigger stripe sync for product on update:', err);
        });

        return updated;
    }

    async remove(id: string) {
        return this.productModel.findByIdAndUpdate(id, { active: false }).lean();
    }
}

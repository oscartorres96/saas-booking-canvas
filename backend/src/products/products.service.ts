import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductsService {
    constructor(
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    ) { }

    async create(businessId: string, data: any) {
        const product = new this.productModel({
            ...data,
            businessId,
        });
        return product.save();
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
        return this.productModel.findByIdAndUpdate(id, data, { new: true }).lean();
    }

    async remove(id: string) {
        return this.productModel.findByIdAndUpdate(id, { active: false }).lean();
    }
}

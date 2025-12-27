import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomerAsset, CustomerAssetSchema } from './schemas/customer-asset.schema';
import { CustomerAssetsService } from './customer-assets.service';
import { CustomerAssetsController } from './customer-assets.controller';
import { Product, ProductSchema } from '../products/schemas/product.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: CustomerAsset.name, schema: CustomerAssetSchema },
            { name: Product.name, schema: ProductSchema },
        ]),
    ],
    controllers: [CustomerAssetsController],
    providers: [CustomerAssetsService],
    exports: [CustomerAssetsService],
})
export class CustomerAssetsModule { }

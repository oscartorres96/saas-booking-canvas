import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/product.schema';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuthModule } from '../auth/auth.module';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
        forwardRef(() => import('../stripe/stripe.module').then(m => m.StripeModule)),
        AuthModule,
    ],
    controllers: [ProductsController],
    providers: [ProductsService, JwtAuthGuard],
    exports: [ProductsService],
})
export class ProductsModule { }

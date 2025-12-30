
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    console.log('\n--- STRIPE SYNC RESET MIGRATION ---\n');

    const productModel = app.get<Model<ProductDocument>>(getModelToken(Product.name));
    const serviceModel = app.get<Model<ServiceDocument>>(getModelToken(Service.name));

    console.log('Resetting syncStatus to PENDING for all active Products...');
    const productResult = await productModel.updateMany(
        { active: true },
        { $set: { 'stripe.syncStatus': 'PENDING' } }
    );
    console.log(`Updated ${productResult.modifiedCount} products.`);

    console.log('\nResetting syncStatus to PENDING for all active Services...');
    const serviceResult = await serviceModel.updateMany(
        { active: true },
        { $set: { 'stripe.syncStatus': 'PENDING' } }
    );
    console.log(`Updated ${serviceResult.modifiedCount} services.`);

    console.log('\nMigration complete. The sync cron job will now re-sync these items in the correct environment.');

    await app.close();
    process.exit(0);
}

bootstrap();

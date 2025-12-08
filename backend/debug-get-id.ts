
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { BusinessesService } from './src/businesses/businesses.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const businessesService = app.get(BusinessesService);

    const business = await businessesService.businessModel.findOne({ businessName: 'Clinica la última esperanza' }).lean();

    if (business) {
        console.log(`FOUND_BUSINESS_ID: ${business._id}`);
        console.log(`FOUND_BUSINESS_NAME: ${business.businessName}`);
    } else {
        console.log('BUSINESS_NOT_FOUND');
    }

    await app.close();
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { BusinessesService } from '../businesses/businesses.service';
import { ServicesService } from '../services/services.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
    const businessesService = app.get(BusinessesService);
    const servicesService = app.get(ServicesService);

    const businessId = '6941cf07956e9c7046a13829';
    const ownerAuth = { userId: 'system-bot', role: 'owner' };

    console.log('--- Business Data ---');
    try {
        const business = (await businessesService.findAll(ownerAuth as any)).find((b: any) => b._id.toString() === businessId);
        console.log(JSON.stringify(business, null, 2));

        console.log('\n--- Services Data ---');
        const services = await servicesService.findAll(ownerAuth as any, businessId);
        console.log(JSON.stringify(services, null, 2));
    } catch (error) {
        console.error('Error fetching data:', error);
    }

    await app.close();
    process.exit(0);
}

bootstrap();

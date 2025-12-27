import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { BusinessesService } from '../businesses/businesses.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
    const businessesService = app.get(BusinessesService);

    const businessId = '6941cf07956e9c7046a13829';
    const ownerAuth = { userId: 'system-bot', role: 'owner' };

    try {
        const businesses: any = await businessesService.findAll(ownerAuth as any);
        const business = businesses.find((b: any) => b._id.toString() === businessId);

        if (business) {
            console.log('BOOKING_CONFIG:', JSON.stringify(business.bookingConfig, null, 2));
            console.log('PAYMENT_CONFIG:', JSON.stringify(business.paymentConfig, null, 2));
            console.log('PAYMENT_MODE:', business.paymentMode);
            console.log('STRIPE_CONNECT_ID:', business.stripeConnectAccountId);
        } else {
            console.log('Business not found');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }

    await app.close();
    process.exit(0);
}

bootstrap();

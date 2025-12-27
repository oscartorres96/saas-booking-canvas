import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ServicesService } from '../services/services.service';
import { UserRole } from '../users/schemas/user.schema';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
    const servicesService = app.get(ServicesService);

    const businessId = '6941cf07956e9c7046a13829';
    const ownerAuth = { userId: 'system-bot', role: UserRole.Owner };

    console.log('🚀 Creating Spinning Test service...');

    try {
        const service = await servicesService.create({
            name: 'Spinning ($1)',
            durationMinutes: 60,
            price: 1,
            description: 'Clase de prueba técnica de 1 peso.',
            active: true,
            requirePayment: true,
            businessId,
        }, ownerAuth as any);

        console.log('✅ Service created successfully:', service._id);
    } catch (error) {
        console.error('❌ Failed to create service:', error);
    }

    await app.close();
    process.exit(0);
}

bootstrap();

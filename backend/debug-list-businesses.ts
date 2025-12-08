
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { BusinessesService } from './src/businesses/businesses.service';
import { UserRole } from './src/users/schemas/user.schema';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const businessesService = app.get(BusinessesService);

    console.log('Listing all businesses...');
    const businesses = await businessesService.findAll({ role: 'owner', userId: 'system' } as any);

    businesses.forEach(b => {
        console.log(`ID: ${b._id}, Name: ${b.name}, BusinessName: ${b.businessName}, Phone: ${b.phone}`);
    });

    await app.close();
}
bootstrap();

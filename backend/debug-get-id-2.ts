
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { BusinessesService } from './src/businesses/businesses.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    // Suppress logs
    app.useLogger(false);

    const businessesService = app.get(BusinessesService);

    // Create a mock owner user
    const mockOwner = { role: 'owner', userId: 'system' };

    const businesses = await businessesService.findAll(mockOwner as any);
    const target = businesses.find(b => b.businessName === 'Clinica la última esperanza');

    if (target) {
        console.log(`\n>>> FOUND_ID: ${target._id} <<<\n`);
    } else {
        console.log('\n>>> NOT_FOUND <<<\n');
    }

    await app.close();
}
bootstrap();

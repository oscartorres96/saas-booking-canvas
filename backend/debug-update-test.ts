
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { BusinessesService } from './src/businesses/businesses.service';

const TARGET_ID = '693504e6612a80da780b25fa';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    app.useLogger(false);
    const businessesService = app.get(BusinessesService);

    console.log(`\nAttempting updateSettings for ${TARGET_ID}...`);

    const mockUser = {
        userId: 'mock-user-id',
        role: 'business',
        businessId: TARGET_ID // Matching ID
    };

    try {
        const result = await businessesService.updateSettings(TARGET_ID, {
            businessName: 'Clinica Updated via Script',
            description: 'Updated via script'
        }, mockUser as any);
        console.log('\n>>> SUCCESS <<<\n');
        console.log('Result name:', result.businessName);
    } catch (e) {
        console.error('\n>>> ERROR <<<\n', e);
    }

    await app.close();
}
bootstrap();

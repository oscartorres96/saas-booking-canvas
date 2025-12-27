import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BusinessesService } from './businesses/businesses.service';

/**
 * Migration script to fix invalid paymentPolicy values in existing businesses
 * Run with: npm run migrate:payment-policy
 */
async function migrate() {
    console.log('🚀 Starting migration...');

    const app = await NestFactory.createApplicationContext(AppModule);
    const businessesService = app.get(BusinessesService);

    try {
        // Get all businesses (as owner to bypass auth)
        const businesses = await businessesService.findAll({
            userId: 'migration-script',
            role: 'owner'
        });

        console.log(`📊 Found ${businesses.length} businesses to check`);

        let migratedCount = 0;

        for (const business of businesses) {
            const policy = business.paymentConfig?.paymentPolicy;

            if (policy && policy !== 'RESERVE_ONLY' && policy !== 'PAY_BEFORE_BOOKING' && policy !== 'PACKAGE_OR_PAY') {
                console.log(`🔧 Migrating business: ${business.businessName || business.name} (ID: ${business._id})`);
                console.log(`   Old policy: "${policy}" -> New policy: "PACKAGE_OR_PAY"`);

                // Load full document and save (this will trigger the pre-save hook)
                await businessesService.updateSettings(
                    business._id.toString(),
                    {}, // Empty update to trigger save
                    { userId: 'migration-script', role: 'owner' }
                );

                migratedCount++;
            }
        }

        console.log(`✅ Migration complete! Migrated ${migratedCount} businesses.`);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await app.close();
    }
}

migrate();

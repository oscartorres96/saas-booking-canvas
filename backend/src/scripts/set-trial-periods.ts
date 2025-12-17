/**
 * Migration Script: Set 14-Day Trial for Existing Businesses
 * 
 * This script adds a 14-day trial period to all existing businesses
 * that don't have a trialEndsAt date yet.
 * 
 * How to run:
 * npx ts-node src/scripts/set-trial-periods.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Business } from '../businesses/schemas/business.schema';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const businessModel = app.get<Model<Business>>(getModelToken('Business'));

    console.log('🔍 Finding businesses without trial dates...');

    // Get all businesses without trialEndsAt
    const businessesWithoutTrial = await businessModel.find({
        $or: [
            { trialEndsAt: { $exists: false } },
            { trialEndsAt: null }
        ]
    });

    console.log(`📊 Found ${businessesWithoutTrial.length} businesses without trial dates`);

    if (businessesWithoutTrial.length === 0) {
        console.log('✅ All businesses already have trial dates set');
        await app.close();
        process.exit(0);
    }

    // Calculate trial end date (14 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    console.log(`\n📅 Setting trial end date to: ${trialEndDate.toLocaleDateString()}`);
    console.log('⏳ Processing...\n');

    let updatedCount = 0;

    for (const business of businessesWithoutTrial) {
        await businessModel.findByIdAndUpdate(business._id, {
            trialEndsAt: trialEndDate,
            subscriptionStatus: 'trial', // Ensure they're in trial status
        });

        console.log(`✅ ${business.businessName || business.name} - Trial until ${trialEndDate.toLocaleDateString()}`);
        updatedCount++;
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Updated: ${updatedCount} businesses`);
    console.log(`📅 Trial end date: ${trialEndDate.toISOString()}`);
    console.log(`\n💡 Tip: You can manually adjust these dates in the Admin panel or MongoDB`);

    await app.close();
    process.exit(0);
}

bootstrap().catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
});

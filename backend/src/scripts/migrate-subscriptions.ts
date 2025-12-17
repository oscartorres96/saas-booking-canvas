/**
 * Migration Script: Add Subscriptions to Existing Businesses
 * 
 * Run this script ONCE to create subscription records for all existing businesses
 * that don't have one yet.
 * 
 * How to run:
 * 1. Save this file as: backend/src/scripts/migrate-subscriptions.ts
 * 2. Run: npx ts-node src/scripts/migrate-subscriptions.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Business } from '../businesses/schemas/business.schema';
import { Subscription } from '../stripe/schemas/subscription.schema';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);

    const businessModel = app.get<Model<Business>>(getModelToken('Business'));
    const subscriptionModel = app.get<Model<Subscription>>(getModelToken('Subscription'));

    console.log('🔍 Finding businesses without subscriptions...');

    // Get all businesses
    const allBusinesses = await businessModel.find();
    console.log(`📊 Total businesses: ${allBusinesses.length}`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const business of allBusinesses) {
        // Check if subscription already exists
        const existingSub = await subscriptionModel.findOne({
            businessId: String(business._id),
        });

        if (existingSub) {
            console.log(`⏭️  Skipping ${business.businessName} - already has subscription`);
            skippedCount++;
            continue;
        }

        // Create a "grandfathered" subscription record
        const newSubscription = await subscriptionModel.create({
            userId: business.ownerUserId,
            businessId: String(business._id),
            // No Stripe IDs - this is a legacy/grandfathered subscription
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            priceId: 'legacy_grandfathered', // Special price ID for legacy users
            status: 'active', // Grant them active status
            // Set a far future date so they never "expire"
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date('2099-12-31'),
        });

        // Update business to active subscription status
        await businessModel.findByIdAndUpdate(business._id, {
            subscriptionStatus: 'active',
        });

        console.log(`✅ Created legacy subscription for: ${business.businessName}`);
        migratedCount++;
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Migrated: ${migratedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`📊 Total: ${allBusinesses.length}`);

    await app.close();
    process.exit(0);
}

bootstrap().catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
});

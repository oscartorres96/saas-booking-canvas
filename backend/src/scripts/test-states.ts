/**
 * TEST SCRIPT: Toggle User States for Testing Expiration Logic
 * 
 * Usage:
 * npx ts-node src/scripts/test-states.ts <email> <state>
 * 
 * States:
 * - TRIAL_ACTIVE    (14 days left)
 * - TRIAL_ENDING    (2 days left -> Yellow Banner)
 * - TRIAL_EXPIRED   (Expired 1 day ago -> Blocking Modal)
 * - SUB_ACTIVE      (Paid subscription OK)
 * - SUB_PAST_DUE    (Payment failed -> Red Banner)
 * - SUB_EXPIRED     (Canceled & Ended -> Blocking Modal)
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Business } from '../businesses/schemas/business.schema';
import { UsersService } from '../users/users.service';
import { Subscription } from '../stripe/schemas/subscription.schema';

async function bootstrap() {
    const args = process.argv.slice(2);
    const email = args[0];
    const mode = args[1]?.toUpperCase();

    if (!email || !mode) {
        console.error('❌ Usage: npx ts-node src/scripts/test-states.ts <email> <mode>');
        console.error('Available Modes: TRIAL_ACTIVE, TRIAL_ENDING, TRIAL_EXPIRED, SUB_ACTIVE, SUB_PAST_DUE, SUB_EXPIRED');
        process.exit(1);
    }

    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);
    const businessModel = app.get<Model<Business>>(getModelToken('Business'));
    const subscriptionModel = app.get<Model<Subscription>>(getModelToken('Subscription'));

    console.log(`🔍 Looking for user: ${email}...`);
    const user = await usersService.findByEmail(email);

    if (!user) {
        console.error('❌ User not found');
        await app.close();
        process.exit(1);
    }

    if (!user.businessId) {
        console.error('❌ User has no business ID');
        await app.close();
        process.exit(1);
    }

    const businessId = user.businessId;
    console.log(`✅ Found business: ${businessId}`);

    const now = new Date();
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(now.getDate() + 2);

    const oneDayAgo = new Date();
    oneDayAgo.setDate(now.getDate() - 1);

    const fourteenDaysFromNow = new Date();
    fourteenDaysFromNow.setDate(now.getDate() + 14);

    console.log(`🔄 Applying mode: ${mode}...`);

    switch (mode) {
        case 'TRIAL_ACTIVE':
            await businessModel.findByIdAndUpdate(businessId, {
                subscriptionStatus: 'trial',
                trialEndsAt: fourteenDaysFromNow
            });
            // Clean up old subs
            await subscriptionModel.deleteMany({ businessId });
            console.log('✅ Set to TRIAL_ACTIVE (14 days left)');
            break;

        case 'TRIAL_ENDING':
            await businessModel.findByIdAndUpdate(businessId, {
                subscriptionStatus: 'trial',
                trialEndsAt: twoDaysFromNow
            });
            // Clean up old subs
            await subscriptionModel.deleteMany({ businessId });
            console.log('✅ Set to TRIAL_ENDING (2 days left) -> Expect Yellow Banner');
            break;

        case 'TRIAL_EXPIRED':
            await businessModel.findByIdAndUpdate(businessId, {
                subscriptionStatus: 'trial',
                trialEndsAt: oneDayAgo
            });
            // Clean up old subs
            await subscriptionModel.deleteMany({ businessId });
            console.log('✅ Set to TRIAL_EXPIRED (Expired 1 day ago) -> Expect Blocking Modal');
            break;

        case 'SUB_ACTIVE':
            await businessModel.findByIdAndUpdate(businessId, {
                subscriptionStatus: 'active',
                trialEndsAt: null
            });
            await subscriptionModel.findOneAndUpdate(
                { businessId },
                { status: 'active', currentPeriodEnd: fourteenDaysFromNow },
                { upsert: true }
            );
            console.log('✅ Set to SUB_ACTIVE (Paid Plan OK)');
            break;

        case 'SUB_PAST_DUE':
            // Check if user already has a subscription with a real customer ID
            const existingSub = await subscriptionModel.findOne({ businessId });
            const realCustomerId = existingSub?.stripeCustomerId && !existingSub.stripeCustomerId.startsWith('cus_TEST_FAKE')
                ? existingSub.stripeCustomerId
                : 'cus_TEST_FAKE_' + Math.floor(Math.random() * 10000);

            await businessModel.findByIdAndUpdate(businessId, {
                subscriptionStatus: 'past_due',
                trialEndsAt: null
            });
            await subscriptionModel.findOneAndUpdate(
                { businessId },
                {
                    status: 'past_due',
                    stripeCustomerId: realCustomerId, // Use real ID if available, otherwise fake
                    currentPeriodEnd: fourteenDaysFromNow
                },
                { upsert: true }
            );
            console.log('✅ Set to SUB_PAST_DUE (Payment Failed) -> Expect Red Banner');
            break;

        case 'SUB_EXPIRED':
            await businessModel.findByIdAndUpdate(businessId, {
                subscriptionStatus: 'active', // or canceled, usually business status reflects it too
                // But our logic checks subscription doc heavily.
                trialEndsAt: null
            });
            await subscriptionModel.findOneAndUpdate(
                { businessId },
                {
                    status: 'canceled',
                    currentPeriodEnd: oneDayAgo
                },
                { upsert: true }
            );
            console.log('✅ Set to SUB_EXPIRED (Canceled & Ended) -> Expect Blocking Modal');
            break;

        default:
            console.error('❌ Unknown mode');
    }

    await app.close();
    process.exit(0);
}

bootstrap().catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
});

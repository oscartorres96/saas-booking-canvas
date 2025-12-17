// @ts-nocheck
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Business, BusinessDocument } from '../businesses/schemas/business.schema';
import { Subscription, SubscriptionDocument } from '../stripe/schemas/subscription.schema';
import { Payment, PaymentDocument } from '../stripe/schemas/payment.schema';

async function bootstrap() {
    const targetEmail = process.argv[2];
    if (!targetEmail) {
        console.error('❌ Please provide an email address as argument.');
        process.exit(1);
    }

    const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });

    console.log(`🚀 Connected to Context`);
    console.log(`🔍 Looking for user: ${targetEmail}...`);

    const UserModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    const BusinessModel = app.get<Model<BusinessDocument>>(getModelToken(Business.name));
    const SubscriptionModel = app.get<Model<SubscriptionDocument>>(getModelToken(Subscription.name));
    const PaymentModel = app.get<Model<PaymentDocument>>(getModelToken(Payment.name));

    // 1. Find User
    const user = await UserModel.findOne({ email: targetEmail });
    if (!user) {
        console.error(`❌ User not found: ${targetEmail}`);
        await app.close();
        process.exit(1);
    }
    console.log(`✅ Found user: ${user._id} (${user.name})`);

    // 2. Find Business
    let business = null;
    // Try by ID first
    if (user.businessId) {
        business = await BusinessModel.findById(user.businessId);
    }

    // Fallback: Use ownerUserId (correct field name, not ownerId)
    if (!business) {
        business = await BusinessModel.findOne({ ownerUserId: user._id });
    }

    if (!business) {
        console.error('❌ Business not found for user.');
        await app.close();
        process.exit(1);
    }
    console.log(`✅ Found business: ${business._id} (${business.name})`);

    const businessId = business._id.toString();
    const userId = user._id.toString();

    // 3. Clear data
    await SubscriptionModel.deleteMany({ businessId });
    await PaymentModel.deleteMany({ businessId });
    console.log('🧹 Cleared existing billing data.');

    // 4. Create Active Subscription
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - 1);

    const fakeDetails = {
        stripeCustomerId: user.stripeCustomerId || `cus_FAKE_${Date.now()}`,
        stripeSubscriptionId: `sub_FAKE_${Date.now()}`,
        priceId: process.env.STRIPE_PRICE_ID_MONTHLY || 'price_1Sf5dUQ12BYwu1Gtc44DvB2d',
    };

    const newSub = await SubscriptionModel.create({
        userId,
        businessId,
        stripeCustomerId: fakeDetails.stripeCustomerId,
        stripeSubscriptionId: fakeDetails.stripeSubscriptionId,
        priceId: fakeDetails.priceId,
        status: 'active',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        metadata: { source: 'populate-script' }
    });

    console.log(`✅ Created Active Subscription: ${newSub._id}`);

    // Update User & Business
    await UserModel.updateOne({ _id: user._id }, {
        subscriptionStatus: 'active',
        subscriptionEndsAt: periodEnd
    });

    await BusinessModel.updateOne({ _id: business._id }, {
        stripeCustomerId: fakeDetails.stripeCustomerId,
        subscriptionId: fakeDetails.stripeSubscriptionId,
        subscriptionStatus: 'active',
        plan: 'pro'
    });

    // 5. Create Payments
    const payments = [];
    for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);

        payments.push({
            userId,
            businessId,
            stripeSessionId: `cs_fake_${Date.now()}_${i}`,
            stripeInvoiceId: `in_fake_${Date.now()}_${i}`,
            amount: 29900,
            currency: 'mxn',
            status: 'paid',
            description: `Suscripción Mensual BookPro (${date.toLocaleString('default', { month: 'long' })})`,
            createdAt: date,
            updatedAt: date
        });
    }

    await PaymentModel.insertMany(payments);
    console.log(`✅ Created ${payments.length} mock payments.`);

    console.log('\n🎉 Done!');
    await app.close();
    process.exit(0);
}

bootstrap();

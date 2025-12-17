// @ts-nocheck
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../users/schemas/user.schema';
import { Subscription } from '../stripe/schemas/subscription.schema';
import { StripeService } from '../stripe/stripe.service';

async function bootstrap() {
    // Default to a known user if not provided
    const targetEmail = process.argv[2] || 'chivaton60@gmail.com';

    // Create context
    const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });

    console.log(`\n🚀 Simulating Webhook Flow for: ${targetEmail}`);

    const stripeService = app.get(StripeService);
    const UserModel = app.get(getModelToken(User.name));
    const SubscriptionModel = app.get(getModelToken(Subscription.name));

    // 1. Get User
    const user = await UserModel.findOne({ email: targetEmail });
    if (!user) {
        console.error('❌ User not found');
        await app.close();
        process.exit(1);
    }

    // 2. Get Subscription (to matching Stripe IDs)
    const subscription = await SubscriptionModel.findOne({ userId: user._id });
    if (!subscription) {
        console.error('❌ No subscription found in DB. Run populate-billing.ts first.');
        await app.close();
        process.exit(1);
    }

    console.log(`✅ Found Local Subscription: ${subscription._id}`);
    console.log(`   - Stripe Sub ID: ${subscription.stripeSubscriptionId}`);
    console.log(`   - Stripe Cus ID: ${subscription.stripeCustomerId}`);

    // 3. Create Mock Invoice Event (Payment Succeeded)
    // ... (mockInvoice definition remains same, skipping for brevity but included in spirit) ...
    const mockInvoice = {
        id: `in_simulated_${Date.now()}`,
        object: 'invoice',
        amount_paid: 29900,
        currency: 'mxn',
        customer: subscription.stripeCustomerId,
        subscription: subscription.stripeSubscriptionId,
        status: 'paid',
        payment_intent: `pi_simulated_${Date.now()}`,
        period_start: Math.floor(Date.now() / 1000),
        period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        amount_due: 29900,
        paid: true,
    };

    console.log('\n🔄 Injecting "invoice.payment_succeeded" event into StripeService...');

    // --- MOCK STRIPE API CALL ---
    // Since we use fake IDs, the real Stripe API will return 404. We must intercept this call.
    if (stripeService.stripe && stripeService.stripe.subscriptions) {
        stripeService.stripe.subscriptions.retrieve = async (id) => {
            console.log(`📡 [MOCK] Intercepted Stripe API call for subscription: ${id}`);
            return {
                id: id,
                current_period_start: Math.floor(Date.now() / 1000),
                current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // +30 days
                status: 'active',
            } as any;
        };
    }
    // -----------------------------

    // 4. Invoke Private Handler via brute-force casting
    // We bypass the signature verification and call the logic directly
    try {
        // Access private method
        const handler = stripeService['handleInvoicePaymentSucceeded'];
        if (typeof handler === 'function') {
            // Bind context just in case
            await handler.call(stripeService, mockInvoice);

            console.log('\n✅ Webhook Logic Executed Successfully!');
            console.log('👉 Check your Dashboard > Billing. You should see a NEW mock payment for today.');
        } else {
            console.error('❌ Critical: Method handleInvoicePaymentSucceeded not found on StripeService instance.');
        }
    } catch (e) {
        console.error('❌ Error executing webhook logic:', e);
    }

    await app.close();
    process.exit(0);
}

bootstrap();

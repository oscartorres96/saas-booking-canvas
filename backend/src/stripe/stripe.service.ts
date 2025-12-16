import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import { Subscription, SubscriptionDocument } from './schemas/subscription.schema';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { Business, BusinessDocument } from '../businesses/schemas/business.schema';

@Injectable()
export class StripeService {
    private stripe: Stripe;
    private readonly logger = new Logger(StripeService.name);
    private readonly webhookSecret: string;
    private readonly frontendUrl: string;

    constructor(
        private configService: ConfigService,
        @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
        @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
        @InjectModel(Business.name) private businessModel: Model<BusinessDocument>,
    ) {
        const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (!secretKey) {
            throw new Error('STRIPE_SECRET_KEY is not defined');
        }

        this.stripe = new Stripe(secretKey, {
            apiVersion: '2025-11-17.clover',
        });

        this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
        this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    }

    /**
     * Create a Stripe Checkout Session for subscription
     */
    async createCheckoutSession(params: {
        userId: string;
        businessId: string;
        successUrl?: string;
        cancelUrl?: string;
        priceId?: string;
    }): Promise<{ sessionId: string; url: string }> {
        const { userId, businessId, successUrl, cancelUrl, priceId } = params;

        // Validate business exists
        const business = await this.businessModel.findById(businessId);
        if (!business) {
            throw new NotFoundException('Business not found');
        }

        // Use provided price ID or default from env
        const finalPriceId = priceId || this.configService.get<string>('STRIPE_PRICE_ID') || 'price_1Seq4UQ12BYwu1GtvHcSAF4U';

        const session = await this.stripe.checkout.sessions.create({
            mode: 'subscription',
            line_items: [
                {
                    price: finalPriceId,
                    quantity: 1,
                },
            ],
            success_url: successUrl || `${this.frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${this.frontendUrl}/payment/cancel`,
            metadata: {
                userId,
                businessId,
            },
            customer_email: business.email,
            subscription_data: {
                metadata: {
                    userId,
                    businessId,
                },
            },
        });

        if (!session.url) {
            throw new BadRequestException('Failed to create checkout session URL');
        }

        return {
            sessionId: session.id,
            url: session.url,
        };
    }

    /**
     * Handle Stripe webhook events
     */
    async handleWebhook(signature: string, payload: Buffer): Promise<{ received: boolean }> {
        let event: Stripe.Event;

        try {
            event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
        } catch (err) {
            this.logger.error(`Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
            throw new BadRequestException('Webhook signature verification failed');
        }

        this.logger.log(`Processing webhook event: ${event.type}`);

        try {
            switch (event.type) {
                case 'checkout.session.completed':
                    await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
                    break;

                case 'invoice.payment_succeeded':
                    await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
                    break;

                case 'invoice.payment_failed':
                    await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
                    break;

                case 'customer.subscription.deleted':
                    await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                    break;

                case 'customer.subscription.updated':
                    await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                    break;

                default:
                    this.logger.log(`Unhandled event type: ${event.type}`);
            }
        } catch (error) {
            this.logger.error(`Error processing webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }

        return { received: true };
    }

    /**
     * Handle checkout.session.completed event
     */
    private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
        const { userId, businessId } = session.metadata || {};

        if (!userId || !businessId) {
            this.logger.error('Missing userId or businessId in session metadata');
            return;
        }

        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        // Create or update subscription record
        const existingSub = await this.subscriptionModel.findOne({
            businessId,
            userId,
        });

        if (existingSub) {
            existingSub.stripeCustomerId = customerId;
            existingSub.stripeSubscriptionId = subscriptionId;
            existingSub.status = 'active';
            await existingSub.save();
        } else {
            await this.subscriptionModel.create({
                userId,
                businessId,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                priceId: this.configService.get<string>('STRIPE_PRICE_ID') || 'price_1Seq4UQ12BYwu1GtvHcSAF4U',
                status: 'active',
            });
        }

        // Update business subscription status
        await this.businessModel.findByIdAndUpdate(businessId, {
            subscriptionStatus: 'active',
        });

        // Create payment record
        await this.paymentModel.create({
            stripeSessionId: session.id,
            businessId,
            userId,
            amount: session.amount_total || 0,
            currency: session.currency || 'mxn',
            status: 'paid',
            description: 'Subscription checkout completed',
        });

        this.logger.log(`Subscription activated for business: ${businessId}`);
    }

    /**
     * Handle invoice.payment_succeeded event
     */
    private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
        const subscriptionId = typeof (invoice as any).subscription === 'string' ? (invoice as any).subscription : (invoice as any).subscription?.id;
        const customerId = invoice.customer as string;

        if (!subscriptionId) {
            return;
        }

        // Update subscription record
        const subscription = await this.subscriptionModel.findOne({
            stripeSubscriptionId: subscriptionId,
        });

        if (subscription) {
            subscription.status = 'active';

            // Get full subscription details from Stripe to update period
            const stripeSubscription = await this.stripe.subscriptions.retrieve(subscriptionId);
            const currentPeriodStart = (stripeSubscription as any).current_period_start;
            const currentPeriodEnd = (stripeSubscription as any).current_period_end;
            subscription.currentPeriodStart = new Date(currentPeriodStart * 1000);
            subscription.currentPeriodEnd = new Date(currentPeriodEnd * 1000);

            await subscription.save();

            // Update business status
            await this.businessModel.findByIdAndUpdate(subscription.businessId, {
                subscriptionStatus: 'active',
            });

            // Create payment record
            await this.paymentModel.create({
                stripeInvoiceId: invoice.id,
                stripePaymentIntentId: (invoice as any).payment_intent as string,
                businessId: subscription.businessId,
                userId: subscription.userId,
                amount: invoice.amount_paid || 0,
                currency: invoice.currency || 'mxn',
                status: 'paid',
                description: 'Subscription payment succeeded',
            });

            this.logger.log(`Payment succeeded for subscription: ${subscriptionId}`);
        }
    }

    /**
     * Handle invoice.payment_failed event
     */
    private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
        const subscriptionId = typeof (invoice as any).subscription === 'string' ? (invoice as any).subscription : (invoice as any).subscription?.id;

        if (!subscriptionId) {
            return;
        }

        // Update subscription record
        const subscription = await this.subscriptionModel.findOne({
            stripeSubscriptionId: subscriptionId,
        });

        if (subscription) {
            subscription.status = 'past_due';
            await subscription.save();

            // Update business status - mark as past_due but don't deactivate yet
            await this.businessModel.findByIdAndUpdate(subscription.businessId, {
                subscriptionStatus: 'trial', // Graceful degradation
            });

            // Create payment record
            await this.paymentModel.create({
                stripeInvoiceId: invoice.id,
                stripePaymentIntentId: (invoice as any).payment_intent as string,
                businessId: subscription.businessId,
                userId: subscription.userId,
                amount: invoice.amount_due || 0,
                currency: invoice.currency || 'mxn',
                status: 'failed',
                description: 'Subscription payment failed',
            });

            this.logger.warn(`Payment failed for subscription: ${subscriptionId}`);
        }
    }

    /**
     * Handle customer.subscription.deleted event
     */
    private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
        const subscriptionId = stripeSubscription.id;

        // Update subscription record
        const subscription = await this.subscriptionModel.findOne({
            stripeSubscriptionId: subscriptionId,
        });

        if (subscription) {
            subscription.status = 'canceled';
            subscription.canceledAt = new Date();
            await subscription.save();

            // Update business status to inactive
            await this.businessModel.findByIdAndUpdate(subscription.businessId, {
                subscriptionStatus: 'inactive',
            });

            this.logger.log(`Subscription canceled: ${subscriptionId}`);
        }
    }

    /**
     * Handle customer.subscription.updated event
     */
    private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
        const subscriptionId = stripeSubscription.id;

        // Update subscription record
        const subscription = await this.subscriptionModel.findOne({
            stripeSubscriptionId: subscriptionId,
        });

        if (subscription) {
            subscription.status = stripeSubscription.status;
            const currentPeriodStart = (stripeSubscription as any).current_period_start;
            const currentPeriodEnd = (stripeSubscription as any).current_period_end;
            subscription.currentPeriodStart = new Date(currentPeriodStart * 1000);
            subscription.currentPeriodEnd = new Date(currentPeriodEnd * 1000);

            if (stripeSubscription.cancel_at) {
                subscription.cancelAt = new Date(stripeSubscription.cancel_at * 1000);
            }

            await subscription.save();

            // Update business status based on subscription status
            let businessStatus: string;
            switch (stripeSubscription.status) {
                case 'active':
                case 'trialing':
                    businessStatus = 'active';
                    break;
                case 'past_due':
                case 'unpaid':
                    businessStatus = 'trial'; // Graceful degradation
                    break;
                default:
                    businessStatus = 'inactive';
            }

            await this.businessModel.findByIdAndUpdate(subscription.businessId, {
                subscriptionStatus: businessStatus,
            });

            this.logger.log(`Subscription updated: ${subscriptionId} - Status: ${stripeSubscription.status}`);
        }
    }

    /**
     * Get subscription for a business
     */
    async getSubscriptionByBusinessId(businessId: string): Promise<SubscriptionDocument | null> {
        return this.subscriptionModel.findOne({ businessId }).exec();
    }

    /**
     * Get all payments for a business
     */
    async getPaymentsByBusinessId(businessId: string): Promise<PaymentDocument[]> {
        return this.paymentModel.find({ businessId }).sort({ createdAt: -1 }).exec();
    }
}

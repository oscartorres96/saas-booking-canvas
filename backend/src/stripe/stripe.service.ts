import { Injectable, Logger, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import { Subscription, SubscriptionDocument } from './schemas/subscription.schema';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { Business, BusinessDocument } from '../businesses/schemas/business.schema';
import { Lead, LeadDocument } from '../leads/schemas/lead.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Booking, BookingDocument, PaymentStatus, BookingStatus } from '../bookings/schemas/booking.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { NotificationService } from '../services/notification.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { CustomerAssetsService } from '../customer-assets/customer-assets.service';
import { ProductsService } from '../products/products.service';
import { BookingsService } from '../bookings/bookings.service';
import { StripeEvent, StripeEventDocument } from './schemas/stripe-event.schema';
import { StripeSyncService } from './stripe-sync.service';
import { Product, ProductDocument } from '../products/schemas/product.schema';

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
        @InjectModel(Lead.name) private leadModel: Model<LeadDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
        @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
        private readonly notificationService: NotificationService,
        private readonly customerAssetsService: CustomerAssetsService,
        private readonly productsService: ProductsService,
        @Inject(forwardRef(() => BookingsService))
        private readonly bookingsService: BookingsService,
        @InjectModel(StripeEvent.name) private stripeEventModel: Model<StripeEventDocument>,
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        private readonly stripeSyncService: StripeSyncService,
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
        billingPeriod?: string;
    }): Promise<{ sessionId: string; url: string }> {
        const { userId, businessId, successUrl, cancelUrl, priceId, billingPeriod } = params;

        // Validate business exists
        const business = await this.businessModel.findById(businessId);
        if (!business) {
            throw new NotFoundException('Business not found');
        }

        // Determine Price ID
        let finalPriceId = priceId;

        if (!finalPriceId) {
            if (billingPeriod === 'annual') {
                finalPriceId = this.configService.get<string>('STRIPE_PRICE_ID_ANNUAL') || 'price_1Sf5dUQ12BYwu1Gtc44DvB2d';

            } else {
                finalPriceId = this.configService.get<string>('STRIPE_PRICE_ID_MONTHLY') || this.configService.get<string>('STRIPE_PRICE_ID') || 'price_1Seq4UQ12BYwu1GtvHcSAF4U';
            }
        }

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
     * Create a Stripe Checkout Session for direct purchase (no authentication)
     */
    async createDirectPurchaseCheckout(params: {
        name: string;
        email: string;
        phone: string;
        company?: string;
        language?: string;
        billingPeriod?: string;
    }): Promise<{ sessionId: string; url: string; leadId: string }> {
        const { name, email, phone, company, language, billingPeriod = 'monthly' } = params;

        // Check if email already has an account
        const existingUser = await this.userModel.findOne({ email });
        if (existingUser) {
            throw new BadRequestException('An account already exists for this email. Please login instead.');
        }

        // Create a lead record for tracking
        const lead = await this.leadModel.create({
            name,
            email,
            phone,
            company: company || '',
            type: 'direct_purchase',
            status: 'new',
            language: language || 'es',
        });

        // Select the correct Price ID based on billing period
        let finalPriceId: string;
        if (billingPeriod === 'annual') {
            finalPriceId = this.configService.get<string>('STRIPE_PRICE_ID_ANNUAL') || 'price_1Sf5dUQ12BYwu1Gtc44DvB2d';
            this.logger.log(`Using annual price ID: ${finalPriceId}`);

        } else {
            finalPriceId = this.configService.get<string>('STRIPE_PRICE_ID_MONTHLY') || this.configService.get<string>('STRIPE_PRICE_ID') || 'price_1Seq4UQ12BYwu1GtvHcSAF4U';
            this.logger.log(`Using monthly price ID: ${finalPriceId}`);
        }

        const session = await this.stripe.checkout.sessions.create({
            mode: 'subscription',
            line_items: [
                {
                    price: finalPriceId,
                    quantity: 1,
                },
            ],
            success_url: `${this.frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=direct_purchase`,
            cancel_url: `${this.frontendUrl}/payment/cancel?type=direct_purchase`,
            metadata: {
                purchaseType: 'SaaS_D_PURCHASE',
                leadId: String(lead._id),
                email,
                name,
                phone,
                billingPeriod,
                environment: this.configService.get('NODE_ENV') || 'development',
                // Backward compatibility
                type: 'direct_purchase',
            },
            customer_email: email,
            subscription_data: {
                metadata: {
                    purchaseType: 'SaaS_D_PURCHASE',
                    leadId: String(lead._id),
                    billingPeriod,
                    environment: this.configService.get('NODE_ENV') || 'development',
                    type: 'direct_purchase',
                },
            },
        });

        if (!session.url) {
            throw new BadRequestException('Failed to create checkout session URL');
        }

        // Update lead with Stripe session info
        lead.stripeSessionId = session.id;
        await lead.save();

        this.logger.log(`Direct purchase checkout created for lead: ${lead._id} with ${billingPeriod} billing`);

        return {
            sessionId: session.id,
            url: session.url,
            leadId: String(lead._id),
        };
    }

    /**
     * Manual completion for testing (when webhooks don't work locally)
     */
    async manualCompleteDirectPurchase(sessionId: string): Promise<void> {
        this.logger.log(`Manually completing direct purchase for session: ${sessionId}`);

        // Retrieve the session from Stripe
        const session = await this.stripe.checkout.sessions.retrieve(sessionId);

        if (!session) {
            throw new BadRequestException('Session not found');
        }

        // Check if it's a direct purchase
        if (session.metadata?.type !== 'direct_purchase') {
            throw new BadRequestException('This is not a direct purchase session');
        }

        // Simulate the webhook event
        await this.handleDirectPurchaseCompleted(session as any);

        this.logger.log(`Manual completion successful for session: ${sessionId}`);
    }

    /**
     * Manual completion for product purchases (Packages/Passes)
     */
    async manualCompleteProductPurchase(sessionId: string): Promise<void> {
        this.logger.log(`Manually completing product purchase for session: ${sessionId}`);

        const session = await this.stripe.checkout.sessions.retrieve(sessionId);

        if (!session) {
            throw new BadRequestException('Session not found');
        }

        if (session.metadata?.type !== 'product_purchase') {
            throw new BadRequestException('This is not a product purchase session');
        }

        await this.handleProductPaymentCompleted(session as any);

        this.logger.log(`Manual product completion successful for session: ${sessionId}`);
    }

    /**
     * Manual completion for booking payments (Services)
     */
    async manualCompleteBookingPurchase(sessionId: string): Promise<void> {
        this.logger.log(`Manually completing booking purchase for session: ${sessionId}`);

        const session = await this.stripe.checkout.sessions.retrieve(sessionId);

        if (!session) {
            throw new BadRequestException('Session not found');
        }

        if (session.metadata?.purchaseType !== 'SERVICE' && session.metadata?.type !== 'booking_payment') {
            throw new BadRequestException('This is not a booking payment session');
        }

        await this.handleBookingPaymentCompleted(session as any);

        this.logger.log(`Manual booking completion successful for session: ${sessionId}`);
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

        this.logger.log(`Processing webhook event: ${event.id} [${event.type}]`);

        // Idempotency: try to insert the event record
        try {
            const dataObject = event.data.object as any;
            const metadata = dataObject.metadata || {};

            await this.stripeEventModel.create({
                eventId: event.id,
                type: event.type,
                livemode: event.livemode,
                created: event.created,
                businessId: metadata.businessId,
                purchaseType: metadata.purchaseType,
                paymentIntentId: dataObject.payment_intent,
                checkoutSessionId: event.type === 'checkout.session.completed' ? dataObject.id : undefined,
            });
        } catch (err: any) {
            // If error is code 11000 (duplicate key), the event was already processed
            if (err.code === 11000) {
                this.logger.log(`Event ${event.id} already processed. Skipping.`);
                return { received: true };
            }
            this.logger.error(`Error recording stripe event: ${err.message}`);
            // We continue processing even if recording fails, unless it's a critical DB issue
        }

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
        const metadata = session.metadata || {};
        const purchaseType = metadata.purchaseType;
        const type = metadata.type; // Backward compatibility

        // Check if this is a direct purchase (SaaS subscription signup)
        if (purchaseType === 'SaaS_D_PURCHASE' || type === 'direct_purchase') {
            await this.handleDirectPurchaseCompleted(session);
            return;
        }

        // Check if this is a booking payment (SERVICE)
        if (purchaseType === 'SERVICE' || type === 'booking_payment') {
            await this.handleBookingPaymentCompleted(session);
            return;
        }

        // Check if this is a product purchase (PACKAGE)
        if (purchaseType === 'PACKAGE' || type === 'product_purchase') {
            await this.handleProductPaymentCompleted(session);
            return;
        }

        // Regular checkout flow (authenticated user subscription from dashboard)
        const { userId, businessId } = metadata;

        if (!userId || !businessId) {
            this.logger.error('Missing userId or businessId in session metadata');
            return;
        }

        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        let stripePriceId = '';
        let currentPeriodStart: Date | undefined;
        let currentPeriodEnd: Date | undefined;

        if (subscriptionId) {
            try {
                const stripeSubscription = await this.stripe.subscriptions.retrieve(subscriptionId) as any;
                stripePriceId = stripeSubscription.items.data[0].price.id;
                currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
                currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
            } catch (err: any) {
                this.logger.error(`Error fetching subscription from Stripe: ${err.message}`);
            }
        }

        // Create or update subscription record
        const existingSub = await this.subscriptionModel.findOne({
            businessId,
            userId,
        });

        if (existingSub) {
            existingSub.stripeCustomerId = customerId;
            existingSub.stripeSubscriptionId = subscriptionId;
            existingSub.status = 'active';
            if (stripePriceId) existingSub.priceId = stripePriceId;
            if (currentPeriodStart) existingSub.currentPeriodStart = currentPeriodStart;
            if (currentPeriodEnd) existingSub.currentPeriodEnd = currentPeriodEnd;
            await existingSub.save();
        } else {
            await this.subscriptionModel.create({
                userId,
                businessId,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                priceId: stripePriceId || this.configService.get<string>('STRIPE_PRICE_ID') || 'price_1Seq4UQ12BYwu1GtvHcSAF4U',
                status: 'active',
                currentPeriodStart,
                currentPeriodEnd,
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
            netAmount: session.amount_total || 0,
            platformFee: 0,
            currency: session.currency || 'mxn',
            status: 'PAID',
            description: 'Subscription checkout completed',
        });

        this.logger.log(`Subscription activated for business: ${businessId}`);
    }

    /**
     * Handle direct purchase completion - create user and business accounts
     */
    private async handleDirectPurchaseCompleted(session: Stripe.Checkout.Session): Promise<void> {
        const metadata = session.metadata || {};
        const leadId = metadata.leadId;
        const email = metadata.email;
        const name = metadata.name;
        const phone = metadata.phone;

        if (!leadId || !email || !name) {
            this.logger.error('Missing required metadata for direct purchase');
            return;
        }

        // Get the lead
        const lead = await this.leadModel.findById(leadId);
        if (!lead) {
            this.logger.error(`Lead not found: ${leadId}`);
            return;
        }

        // Check if account was already created (duplicate webhook)
        if (lead.accountCreated) {
            this.logger.warn(`Account already created for lead: ${leadId}`);
            return;
        }

        // Check if email already has an account
        const existingUser = await this.userModel.findOne({ email });
        if (existingUser) {
            this.logger.error(`Account already exists for email: ${email}`);
            return;
        }

        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        let stripePriceId = '';
        let currentPeriodStart: Date | undefined;
        let currentPeriodEnd: Date | undefined;

        if (subscriptionId) {
            try {
                const stripeSubscription = await this.stripe.subscriptions.retrieve(subscriptionId) as any;
                stripePriceId = stripeSubscription.items.data[0].price.id;
                currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
                currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
            } catch (err: any) {
                this.logger.error(`Error fetching subscription from Stripe for direct purchase: ${err.message}`);
            }
        }

        // Generate activation token and temporary password
        const activationToken = crypto.randomBytes(32).toString('hex');
        const temporaryPassword = this.generateTemporaryPassword();
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

        // Token expires in 48 hours
        const tokenExpires = new Date();
        tokenExpires.setHours(tokenExpires.getHours() + 48);

        // Create User
        const newUser = await this.userModel.create({
            email,
            password_hash: hashedPassword,
            name,
            role: 'owner',
            isActive: false,
            activationToken,
            activationTokenExpires: tokenExpires,
            createdFromLead: leadId,
        });

        this.logger.log(`User created with activation token: ${activationToken.substring(0, 10)}... expires: ${tokenExpires}`);

        // Create Business
        const businessName = lead.company || `${name}'s Business`;
        const newBusiness = await this.businessModel.create({
            name: businessName,
            businessName: businessName,
            ownerUserId: String(newUser._id),
            email,
            phone,
            subscriptionStatus: 'active', // Already paid!
            onboardingCompleted: false,
            onboardingStep: 1,
        });

        // Update user with businessId
        newUser.businessId = String(newBusiness._id);
        await newUser.save();

        // Create subscription record
        await this.subscriptionModel.create({
            userId: String(newUser._id),
            businessId: String(newBusiness._id),
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            priceId: stripePriceId || this.configService.get<string>('STRIPE_PRICE_ID') || 'price_1Seq4UQ12BYwu1GtvHcSAF4U',
            status: 'active',
            currentPeriodStart,
            currentPeriodEnd,
        });

        // Create payment record
        await this.paymentModel.create({
            stripeSessionId: session.id,
            businessId: String(newBusiness._id),
            userId: String(newUser._id),
            amount: session.amount_total || 0,
            netAmount: session.amount_total || 0,
            platformFee: 0,
            currency: session.currency || 'mxn',
            status: 'PAID',
            description: 'Direct purchase - subscription started',
        });

        // Update lead status
        lead.status = 'approved';
        lead.accountCreated = true;
        lead.createdUserId = String(newUser._id);
        lead.approvedAt = new Date();
        lead.stripeCustomerId = customerId;
        lead.stripeSubscriptionId = subscriptionId;
        lead.purchaseCompletedAt = new Date();
        await lead.save();

        // Send activation email
        await this.notificationService.sendAccountActivationEmail({
            email,
            name,
            activationToken,
            temporaryPassword,
            accessType: 'paid',
        });

        this.logger.log(`Direct purchase account created for lead: ${leadId}, user: ${newUser._id}, business: ${newBusiness._id}`);
    }

    /**
     * Handle booking payment completion
     */
    private async handleBookingPaymentCompleted(session: Stripe.Checkout.Session): Promise<void> {
        const metadata = session.metadata || {};
        const { bookingId, businessId, paymentMode } = metadata;

        if (!bookingId || !businessId) {
            this.logger.error('Missing bookingId or businessId in session metadata for booking payment');
            return;
        }

        const paymentIntentId = session.payment_intent as string;
        const sessionId = session.id;

        // State mapping logic:
        // BOOKPRO_COLLECTS -> PENDING_PAYOUT (The money is in Platform's main account)
        // DIRECT_TO_BUSINESS -> PAID (The money was automatically routed to Business via Destination Charge)
        const sessionStatus = paymentMode === 'BOOKPRO_COLLECTS' ? 'PENDING_PAYOUT' : 'PAID';

        // Update booking record
        const booking = await this.bookingModel.findById(bookingId);

        // Update payment record
        const payment = await this.paymentModel.findOne({ stripeSessionId: sessionId });
        if (payment) {
            payment.status = sessionStatus;
            payment.stripePaymentIntentId = paymentIntentId;
            await payment.save();
        } else {
            // Backup in case record wasn't created during session creation
            await this.paymentModel.create({
                stripeSessionId: sessionId,
                stripePaymentIntentId: paymentIntentId,
                bookingId,
                businessId,
                userId: booking?.userId || businessId, // Emergency fallback
                amount: session.amount_total || 0,
                netAmount: session.amount_total || 0,
                platformFee: 0,
                currency: session.currency || 'mxn',
                status: sessionStatus,
                paymentMode: paymentMode as any,
                description: 'Booking payment completed (webhook backup)',
            });
        }

        if (booking) {
            // Check if already processed to prevent duplicate work
            if (booking.paymentStatus === PaymentStatus.Paid && booking.stripeSessionId === sessionId) {
                this.logger.log(`Booking ${bookingId} already processed for session ${sessionId}`);
                return;
            }

            booking.paymentStatus = PaymentStatus.Paid;
            booking.status = BookingStatus.Confirmed;
            booking.paymentMethod = 'stripe';
            booking.stripeSessionId = sessionId;
            booking.stripePaymentIntentId = paymentIntentId;
            await booking.save();

            // Send confirmation notification
            try {
                await this.bookingsService.sendConfirmationEmail(booking as any);
            } catch (error) {
                this.logger.error(`Error sending booking confirmation email: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        this.logger.log(`Booking ${bookingId} marked as PAID and CONFIRMED (Session: ${sessionId})`);
    }

    /**
     * Create a Stripe Checkout Session for a product purchase (Package/Pass)
     */
    async createProductCheckout(params: {
        productId: string;
        businessId: string;
        clientEmail: string;
        clientPhone?: string;
        clientName?: string;
        successUrl?: string;
        cancelUrl?: string;
        bookingData?: any;
    }): Promise<{ sessionId: string; url: string }> {
        const { productId, businessId, clientEmail, clientPhone, clientName, successUrl, cancelUrl, bookingData } = params;

        const product = await this.productsService.findOne(productId);
        if (!product) throw new NotFoundException('Product not found');

        const business = await this.businessModel.findById(businessId);
        if (!business) throw new NotFoundException('Business not found');

        // Critical check: Ensure product is synced with Stripe
        let finalPriceId = product.stripe?.priceId || product.stripePriceId;

        if (!finalPriceId) {
            this.logger.warn(`Product ${product._id} missing Price ID. Attempting JIT sync...`);
            await this.stripeSyncService.syncProduct(product._id.toString());

            const reProduct = await this.productModel.findById(product._id);
            finalPriceId = reProduct?.stripe?.priceId || reProduct?.stripePriceId;
        }

        if (!finalPriceId) {
            this.logger.error(`Product ${product._id} is NOT ready for payments even after JIT sync.`);
            if (product.stripe?.syncStatus === 'ERROR') {
                throw new BadRequestException(`Stripe Sync Error: ${product.stripe.lastSyncError}`);
            }
            throw new BadRequestException('Este paquete no está configurado para pagos en Stripe todavía.');
        }

        this.logger.log(`Creating checkout session for product ${product._id} using price ${finalPriceId}`);

        const sessionData: Stripe.Checkout.SessionCreateParams = {
            mode: 'payment',
            customer_email: clientEmail,
            success_url: successUrl || `${this.frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=product&businessId=${businessId}`,
            cancel_url: cancelUrl || `${this.frontendUrl}/payment/cancel?type=product`,
            line_items: [{ price: finalPriceId, quantity: 1 }],
            metadata: {
                purchaseType: 'PACKAGE',
                productId,
                businessId,
                clientEmail,
                clientPhone: clientPhone || '',
                clientName: clientName || '',
                bookingData: bookingData ? JSON.stringify(bookingData) : '',
                environment: this.configService.get('NODE_ENV') || 'development',
                // Keep for backward compatibility during transition if needed
                type: 'product_purchase',
            },
        };

        let session: Stripe.Checkout.Session;
        try {
            session = await this.stripe.checkout.sessions.create(sessionData);
        } catch (err: any) {
            this.logger.error(`Stripe Product Session Creation failed: ${err.message}`, err.stack);
            throw new BadRequestException(`Stripe Error: ${err.message}`);
        }

        if (!session.url) throw new BadRequestException('Failed to create checkout session');

        return { sessionId: session.id, url: session.url };
    }

    private async handleProductPaymentCompleted(session: Stripe.Checkout.Session): Promise<void> {
        const { productId, businessId, clientEmail, clientPhone, bookingData } = session.metadata || {};

        if (!productId || !businessId || !clientEmail) {
            this.logger.error('Missing metadata for product purchase completion');
            return;
        }

        const paymentIntentId = session.payment_intent as string;
        const sessionId = session.id;

        // Create the CustomerAsset
        const asset = await this.customerAssetsService.createFromPurchase(
            businessId,
            clientEmail,
            productId,
            clientPhone,
            sessionId,
            paymentIntentId
        );

        // Check if payment already exists
        const existingPayment = await this.paymentModel.findOne({ stripeSessionId: sessionId });
        if (existingPayment) {
            this.logger.log(`Payment already recorded for session ${sessionId}`);
            if (!existingPayment.stripePaymentIntentId) {
                existingPayment.stripePaymentIntentId = paymentIntentId;
                await existingPayment.save();
            }
        } else {
            // Record the payment
            await this.paymentModel.create({
                stripeSessionId: sessionId,
                stripePaymentIntentId: paymentIntentId,
                businessId,
                userId: (asset as any).userId || businessId, // Fallback if no userId
                amount: session.amount_total || 0,
                netAmount: session.amount_total || 0,
                platformFee: 0,
                currency: session.currency || 'mxn',
                status: 'PAID',
                description: `Product purchase: ${productId}`,
            });
        }

        // ✅ AUTO-BOOKING logic
        if (bookingData && bookingData !== '') {
            try {
                const parsedBookingData = JSON.parse(bookingData);
                this.logger.log(`[AUTO-BOOKING] Attempting to create booking for asset ${asset._id}`);

                // Create booking using the new asset
                await this.bookingsService.create({
                    ...parsedBookingData,
                    assetId: (asset as any)._id.toString(),
                    scheduledAt: new Date(parsedBookingData.scheduledAt),
                    status: BookingStatus.Confirmed,
                    stripeSessionId: sessionId,
                    stripePaymentIntentId: paymentIntentId,
                }, { role: 'public' } as any);

                this.logger.log(`[AUTO-BOOKING] Success: Booking created for ${clientEmail}`);
            } catch (error: any) {
                this.logger.error(`[AUTO-BOOKING] Failed to create booking: ${error.message}`);
                // Asset is already created, so we don't throw error to avoid Stripe retries
            }
        }

        this.logger.log(`Product ${productId} purchased by ${clientEmail} (Session: ${sessionId})`);
    }

    /**
     * Generate a temporary password
     */
    private generateTemporaryPassword(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
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
                netAmount: invoice.amount_paid || 0,
                platformFee: 0,
                currency: invoice.currency || 'mxn',
                status: 'PAID',
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
                netAmount: invoice.amount_due || 0,
                platformFee: 0,
                currency: invoice.currency || 'mxn',
                status: 'FAILED',
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

    /**
     * Create a Stripe Checkout Session for a booking payment
     */
    async createBookingCheckout(params: {
        bookingId: string;
        businessId: string;
        amount?: number; // Ignored as per security audit
        currency?: string; // Ignored as per security audit
        serviceName?: string; // Ignored as per security audit
        successUrl?: string;
        cancelUrl?: string;
    }): Promise<{ sessionId: string; url: string }> {
        const { bookingId, businessId, successUrl, cancelUrl } = params;

        const business = await this.businessModel.findById(businessId);
        if (!business) {
            throw new NotFoundException('Business not found');
        }

        const booking = await this.bookingModel.findById(bookingId);
        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        const service = await this.serviceModel.findById(booking.serviceId);
        if (!service) {
            throw new NotFoundException('Service not found');
        }

        const amountInCents = Math.round(service.price * 100);
        const paymentMode = business.paymentMode || 'BOOKPRO_COLLECTS';

        // Critical check: Ensure service is synced with Stripe
        let finalPriceId = service.stripe?.priceId || service.stripePriceId;

        if (!finalPriceId) {
            this.logger.warn(`Service ${service._id} missing Price ID. Attempting JIT sync...`);
            await this.stripeSyncService.syncService(service._id.toString());

            const reService = await this.serviceModel.findById(service._id);
            finalPriceId = reService?.stripe?.priceId || reService?.stripePriceId;
        }

        if (!finalPriceId) {
            this.logger.error(`Service ${service._id} is NOT ready for payments even after JIT sync.`);
            // Fetch updated service to check sync status
            const updatedService = await this.serviceModel.findById(service._id);
            if (updatedService?.stripe?.syncStatus === 'ERROR') {
                throw new BadRequestException(`Stripe Sync Error: ${updatedService.stripe.lastSyncError}`);
            }
            throw new BadRequestException('Este servicio no está configurado para pagos en Stripe todavía.');
        }

        this.logger.log(`Creating checkout session for service ${service._id} using price ${finalPriceId}`);

        const sessionData: Stripe.Checkout.SessionCreateParams = {
            mode: 'payment',
            customer_email: booking.clientEmail,
            success_url: successUrl || `${this.frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=booking&businessId=${businessId}&bookingId=${bookingId}`,
            cancel_url: cancelUrl || `${this.frontendUrl}/payment/cancel?type=booking`,
            line_items: [{ price: finalPriceId, quantity: 1 }],
            metadata: {
                purchaseType: 'SERVICE',
                bookingId,
                businessId,
                serviceId: service._id.toString(),
                paymentMode,
                environment: this.configService.get('NODE_ENV') || 'development',
                // Keep for backward compatibility during transition if needed
                type: 'booking_payment',
            },
        };

        if (paymentMode === 'DIRECT_TO_BUSINESS' && business.stripeConnectAccountId) {
            sessionData.payment_intent_data = {
                transfer_data: {
                    destination: business.stripeConnectAccountId,
                },
            };
        }

        let session: Stripe.Checkout.Session;
        try {
            session = await this.stripe.checkout.sessions.create(sessionData);
        } catch (err: any) {
            this.logger.error(`Stripe Session Creation failed: ${err.message}`, err.stack);
            throw new BadRequestException(`Stripe Error: ${err.message}`);
        }

        if (!session.url) {
            throw new BadRequestException('Failed to create checkout session URL');
        }

        // Create a Payment record in CREATED status
        await this.paymentModel.create({
            bookingId,
            businessId,
            userId: booking.userId || business.ownerUserId || businessId,
            serviceId: service._id,
            stripeSessionId: session.id,
            status: 'CREATED',
            amount: amountInCents,
            netAmount: amountInCents,
            platformFee: 0,
            currency: 'mxn',
            paymentMode,
            description: `Payment for booking: ${service.name}`,
        });

        return {
            sessionId: session.id,
            url: session.url,
        };
    }

    /**
     * Create a Billing Portal Session
     */
    async createPortalSession(businessId: string): Promise<{ url: string }> {
        // Find subscription to get stripeCustomerId
        const subscription = await this.subscriptionModel.findOne({ businessId }).sort({ createdAt: -1 });

        if (!subscription || !subscription.stripeCustomerId) {
            throw new BadRequestException('No subscription customer found for this business');
        }

        const session = await this.stripe.billingPortal.sessions.create({
            customer: subscription.stripeCustomerId,
            return_url: `${this.frontendUrl}/dashboard`,
        });

        return { url: session.url };
    }
}

import {
    Controller,
    Post,
    Body,
    Headers,
    RawBodyRequest,
    Req,
    HttpCode,
    HttpStatus,
    UseGuards,
    Get,
    Param,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CreateDirectPurchaseDto } from './dto/create-direct-purchase.dto';
import { CreateBookingCheckoutDto } from './dto/create-booking-checkout.dto';
import { PayoutService } from './payout.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Request } from 'express';

@Controller('stripe')
export class StripeController {
    constructor(
        private readonly stripeService: StripeService,
        private readonly payoutService: PayoutService,
    ) { }

    /**
     * Create a Stripe Checkout Session
     * POST /api/stripe/checkout/subscription
     */
    @Post('checkout/subscription')
    @UseGuards(JwtAuthGuard)
    async createCheckoutSession(@Body() dto: CreateCheckoutSessionDto) {
        const result = await this.stripeService.createCheckoutSession(dto);
        return {
            success: true,
            data: result,
        };
    }

    /**
     * Create a Stripe Checkout Session for direct purchase (no auth required)
     * POST /api/stripe/direct-purchase/checkout
     */
    @Post('direct-purchase/checkout')
    async createDirectPurchaseCheckout(@Body() dto: CreateDirectPurchaseDto) {
        const result = await this.stripeService.createDirectPurchaseCheckout(dto);
        return {
            success: true,
            data: result,
        };
    }

    /**
     * Create a Stripe Checkout Session for a booking payment (public)
     * POST /api/stripe/checkout/booking
     */
    @Post('checkout/booking')
    async createBookingCheckout(@Body() dto: CreateBookingCheckoutDto) {
        const result = await this.stripeService.createBookingCheckout(dto);
        return {
            success: true,
            data: result,
        };
    }

    /**
     * Create a Stripe Checkout Session for a product purchase (Package/Pass)
     * POST /api/stripe/checkout/product
     */
    @Post('checkout/product')
    async createProductCheckout(@Body() body: { productId: string; businessId: string; clientEmail: string; clientName?: string; successUrl?: string; cancelUrl?: string; }) {
        const result = await this.stripeService.createProductCheckout(body);
        return {
            success: true,
            data: result,
        };
    }

    /**
     * Create a Stripe Billing Portal Session
     */
    @Post('portal-session')
    @UseGuards(JwtAuthGuard)
    async createPortalSession(@Body() body: { businessId: string }) {
        const result = await this.stripeService.createPortalSession(body.businessId);
        return {
            success: true,
            data: result,
        };
    }

    /**
     * Manual completion endpoint for testing (when webhooks don't work locally)
     * POST /api/stripe/direct-purchase/complete
     */
    @Post('direct-purchase/complete')
    async completeDirectPurchase(@Body() body: { sessionId: string }) {
        try {
            await this.stripeService.manualCompleteDirectPurchase(body.sessionId);
            return {
                success: true,
                message: 'Account created and email sent successfully',
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Stripe webhook endpoint
     * POST /api/stripe/webhook
     * IMPORTANT: This endpoint must be public (no auth guard)
     * and must receive raw body for signature verification
     */
    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    async handleWebhook(
        @Headers('stripe-signature') signature: string,
        @Req() request: RawBodyRequest<Request>,
    ) {
        const rawBody = request.rawBody;

        if (!rawBody) {
            throw new Error('Raw body is required for webhook signature verification');
        }

        const result = await this.stripeService.handleWebhook(signature, rawBody);
        return result;
    }

    /**
     * Get subscription details for a business
     * GET /api/stripe/subscription/:businessId
     */
    @Get('subscription/:businessId')
    @UseGuards(JwtAuthGuard)
    async getSubscription(@Param('businessId') businessId: string) {
        const subscription = await this.stripeService.getSubscriptionByBusinessId(businessId);
        return {
            success: true,
            data: subscription,
        };
    }

    /**
     * Get payment history for a business
     * GET /api/stripe/payments/:businessId
     */
    @Get('payments/:businessId')
    @UseGuards(JwtAuthGuard)
    async getPayments(@Param('businessId') businessId: string) {
        const payments = await this.stripeService.getPaymentsByBusinessId(businessId);
        return {
            success: true,
            data: payments,
        };
    }

    /**
     * Get pending payouts grouped by business (Admin only)
     * GET /api/stripe/admin/payouts/pending
     */
    @Get('admin/payouts/pending')
    @UseGuards(JwtAuthGuard) // Should be Admin guard if available
    async getPendingPayouts() {
        const result = await this.payoutService.getPendingPayoutsGroupedByBusiness();
        return {
            success: true,
            data: result,
        };
    }

    /**
     * Mark payments as paid out after manual dispersion (Admin only)
     * POST /api/stripe/admin/payouts/mark-paid-out
     */
    @Post('admin/payouts/mark-paid-out')
    @UseGuards(JwtAuthGuard) // Should be Admin guard if available
    async markPaymentsAsPaidOut(@Body() body: { paymentIds: string[] }) {
        const result = await this.payoutService.markPaymentsAsPaidOut(body.paymentIds);
        return {
            success: true,
            data: result,
        };
    }
}

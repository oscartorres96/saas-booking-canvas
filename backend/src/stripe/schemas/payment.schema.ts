import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document & { _id: Types.ObjectId };

@Schema({ timestamps: true })
export class Payment {
    @Prop()
    stripeSessionId?: string;

    @Prop()
    stripeInvoiceId?: string;

    @Prop()
    stripePaymentIntentId?: string;

    @Prop({ required: true })
    businessId!: string;

    @Prop({ required: true })
    userId!: string;

    @Prop({ required: true })
    amount!: number; // Amount in cents (Total paid by client)

    @Prop({ required: true })
    netAmount!: number; // Amount to be received by the business (amount - platformFee)

    @Prop({ required: true, default: 0 })
    platformFee!: number; // Platform commission (currently 0)

    @Prop({ required: true, default: 'mxn' })
    currency!: string;

    @Prop({
        required: true,
        enum: ['CREATED', 'PAID', 'PENDING_PAYOUT', 'PAID_OUT', 'FAILED', 'REFUNDED'],
        default: 'CREATED',
    })
    status!: string;

    @Prop({
        type: String,
        enum: ['BOOKPRO_COLLECTS', 'DIRECT_TO_BUSINESS'],
    })
    paymentMode?: 'BOOKPRO_COLLECTS' | 'DIRECT_TO_BUSINESS';

    @Prop()
    description?: string;

    @Prop({ type: Object })
    metadata?: Record<string, unknown>;

    @Prop()
    bookingId?: string;

    createdAt?: Date;
    updatedAt?: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Index for efficient queries
PaymentSchema.index({ businessId: 1 });
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ stripeSessionId: 1 });
PaymentSchema.index({ stripeInvoiceId: 1 });
PaymentSchema.index({ stripePaymentIntentId: 1 });
PaymentSchema.index({ bookingId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ businessId: 1, status: 1 });

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
    amount!: number; // Amount in cents

    @Prop({ required: true, default: 'mxn' })
    currency!: string;

    @Prop({
        required: true,
        enum: ['paid', 'failed', 'pending', 'refunded'],
        default: 'pending',
    })
    status!: string;

    @Prop()
    description?: string;

    @Prop({ type: Object })
    metadata?: Record<string, unknown>;

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

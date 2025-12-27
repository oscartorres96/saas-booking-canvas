import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: 'processedAt', updatedAt: false } })
export class StripeEvent {
    @Prop({ required: true, unique: true })
    eventId!: string;

    @Prop({ required: true })
    type!: string;

    @Prop()
    livemode!: boolean;

    @Prop()
    created!: number;

    @Prop()
    businessId?: string;

    @Prop()
    purchaseType?: string;

    @Prop()
    paymentIntentId?: string;

    @Prop()
    checkoutSessionId?: string;
}

export type StripeEventDocument = StripeEvent & Document;
export const StripeEventSchema = SchemaFactory.createForClass(StripeEvent);

// Ensure unique index for eventId
StripeEventSchema.index({ eventId: 1 }, { unique: true });

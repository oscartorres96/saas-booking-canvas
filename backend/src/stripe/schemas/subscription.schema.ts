import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document & { _id: Types.ObjectId };

@Schema({ timestamps: true })
export class Subscription {
    @Prop({ required: true })
    userId!: string;

    @Prop({ required: true })
    businessId!: string;

    @Prop({ required: true })
    stripeCustomerId!: string;

    @Prop({ required: true })
    stripeSubscriptionId!: string;

    @Prop({ required: true })
    priceId!: string;

    @Prop({
        required: true,
        enum: ['active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid'],
        default: 'incomplete',
    })
    status!: string;

    @Prop({ type: Date })
    currentPeriodEnd?: Date;

    @Prop({ type: Date })
    currentPeriodStart?: Date;

    @Prop({ type: Date })
    canceledAt?: Date;

    @Prop({ type: Date })
    cancelAt?: Date;

    @Prop({ type: Object })
    metadata?: Record<string, unknown>;

    createdAt?: Date;
    updatedAt?: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

// Index for efficient queries
SubscriptionSchema.index({ businessId: 1 });
SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ stripeCustomerId: 1 });
SubscriptionSchema.index({ stripeSubscriptionId: 1 });

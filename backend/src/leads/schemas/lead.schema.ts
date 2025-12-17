import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LeadDocument = Lead & Document;

@Schema({ timestamps: true })
export class Lead {
    @Prop({ required: true })
    name!: string;

    @Prop({ required: true })
    email!: string;

    @Prop()
    phone?: string;

    @Prop()
    company?: string;

    @Prop()
    message?: string;

    @Prop({ required: true, enum: ['demo', 'registration', 'direct_purchase'] })
    type!: string;

    @Prop({ default: 'pending', enum: ['pending', 'new', 'approved', 'rejected', 'contacted', 'converted'] })
    status!: string;

    @Prop()
    approvedBy?: string; // Admin user ID

    @Prop()
    approvedAt?: Date;

    @Prop()
    rejectedReason?: string;

    @Prop({ default: false })
    accountCreated!: boolean;

    @Prop()
    createdUserId?: string; // User ID created from this lead

    @Prop()
    language?: string;

    // Stripe tracking fields (for direct_purchase type)
    @Prop()
    stripeSessionId?: string; // Checkout session ID

    @Prop()
    stripeCustomerId?: string; // Stripe customer ID

    @Prop()
    stripeSubscriptionId?: string; // Subscription ID

    @Prop()
    purchaseCompletedAt?: Date; // When the purchase was completed
}

export const LeadSchema = SchemaFactory.createForClass(Lead);

// Add indexes for better query performance
LeadSchema.index({ type: 1, status: 1 });
LeadSchema.index({ email: 1 });
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ stripeSessionId: 1 });

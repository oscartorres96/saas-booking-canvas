import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum AssetStatus {
    Active = 'ACTIVE',
    Expired = 'EXPIRED',
    Consumed = 'CONSUMED',
}

@Schema({ timestamps: true })
export class CustomerAsset {
    @Prop({ required: true })
    businessId!: string;

    @Prop({ required: true })
    clientEmail!: string;

    @Prop()
    clientPhone?: string;

    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    productId!: Types.ObjectId;

    @Prop({ required: true })
    totalUses!: number;

    @Prop()
    remainingUses?: number;

    @Prop({ default: false })
    isUnlimited!: boolean;

    @Prop({ default: 0 })
    timesUsed!: number;

    @Prop()
    lastUsedAt?: Date;

    @Prop()
    expiresAt?: Date;

    @Prop({ required: true, enum: AssetStatus, default: AssetStatus.Active })
    status!: AssetStatus;

    @Prop({ type: Object })
    metadata?: any;

    @Prop({ type: String, unique: true, sparse: true })
    stripeSessionId?: string;

    @Prop()
    stripePaymentIntentId?: string;
}

export type CustomerAssetDocument = CustomerAsset & Document;
export const CustomerAssetSchema = SchemaFactory.createForClass(CustomerAsset);

// Index for quick lookup of active assets by client
CustomerAssetSchema.index({ businessId: 1, clientEmail: 1, status: 1 });
CustomerAssetSchema.index({ businessId: 1, clientPhone: 1, status: 1 });

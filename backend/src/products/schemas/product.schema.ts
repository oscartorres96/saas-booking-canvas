import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ProductType {
    Single = 'SINGLE', // Legacy or direct sale
    Pass = 'PASS',
    Package = 'PACKAGE',
}

@Schema({ timestamps: true })
export class Product {
    @Prop({ required: true })
    businessId!: string;

    @Prop({ required: true })
    name!: string;

    @Prop()
    description?: string;

    @Prop({ required: true, enum: ProductType })
    type!: ProductType;

    @Prop({ required: true })
    price!: number;

    @Prop()
    totalUses?: number; // Null or 0 if isUnlimited is true

    @Prop({ default: false })
    isUnlimited!: boolean;

    @Prop()
    validityDays?: number;

    @Prop({ type: [String], default: [] })
    allowedServiceIds!: string[];

    @Prop({ default: true })
    active!: boolean;

    @Prop({
        type: {
            productId: { type: String, default: null },
            priceId: { type: String, default: null },
            livemode: { type: Boolean, default: false },
            syncStatus: { type: String, enum: ['PENDING', 'SYNCING', 'SYNCED', 'ERROR'], default: 'PENDING' },
            lastSyncError: { type: String },
            lastSyncedAt: { type: Date },
            syncLockedAt: { type: Date },
            retryCount: { type: Number, default: 0 },
            nextRetryAt: { type: Date }
        },
        default: { syncStatus: 'PENDING', retryCount: 0 }
    })
    stripe!: {
        productId: string | null;
        priceId: string | null;
        livemode: boolean;
        syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'ERROR';
        lastSyncError?: string;
        lastSyncedAt?: Date;
        syncLockedAt?: Date;
        retryCount: number;
        nextRetryAt?: Date;
    };

    @Prop()
    stripePriceId?: string;
}

export type ProductDocument = Product & Document;
export const ProductSchema = SchemaFactory.createForClass(Product);

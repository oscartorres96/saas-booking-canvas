import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ResourceHoldDocument = ResourceHold & Document;

@Schema({ timestamps: true })
export class ResourceHold {
    @Prop({ required: true })
    businessId!: string;

    @Prop({ required: true })
    resourceId!: string;

    @Prop({ required: true })
    scheduledAt!: Date;

    @Prop({ required: true })
    expiresAt!: Date;

    @Prop()
    bookingId?: string;
}

export const ResourceHoldSchema = SchemaFactory.createForClass(ResourceHold);

// Add TTL index for automatic deletion
ResourceHoldSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class AvailabilityTemplate {
    @Prop({ required: true, type: Types.ObjectId, ref: 'Business' })
    businessId!: Types.ObjectId;

    @Prop({ required: true, enum: ['BUSINESS', 'RESOURCE', 'PROVIDER'], default: 'BUSINESS' })
    entityType!: string;

    @Prop({ type: String }) // Optional if business-level
    entityId?: string;

    @Prop({ required: true, default: 'UTC' })
    timezone!: string;

    @Prop({ required: true, default: 30 })
    slotDurationMinutes!: number;

    @Prop({ default: 0 })
    bufferMinutes!: number;

    @Prop({
        type: [{
            dayOfWeek: Number, // 0-6 (0=Sunday, 1=Monday...)
            enabled: Boolean,
            blocks: [{
                start: String, // 'HH:mm'
                end: String    // 'HH:mm'
            }]
        }]
    })
    weeklyRules!: {
        dayOfWeek: number;
        enabled: boolean;
        blocks: { start: string; end: string }[];
    }[];
}

export type AvailabilityTemplateDocument = AvailabilityTemplate & Document;
export const AvailabilityTemplateSchema = SchemaFactory.createForClass(AvailabilityTemplate);
AvailabilityTemplateSchema.index({ businessId: 1, entityType: 1, entityId: 1 });

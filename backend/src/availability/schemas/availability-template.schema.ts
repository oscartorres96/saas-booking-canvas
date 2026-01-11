import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AvailabilityTemplateDocument = AvailabilityTemplate & Document;

@Schema({ timestamps: true })
export class AvailabilityTemplate {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Business', required: true })
    businessId!: string;

    @Prop({ default: 'BUSINESS' })
    entityType?: string; // BUSINESS, SERVICE, etc.

    @Prop()
    entityId?: string;

    @Prop({ default: 'UTC' })
    timezone?: string;

    @Prop({ default: 30 })
    slotDuration?: number;

    @Prop({ default: 0 })
    bufferBetweenSlots?: number;

    @Prop({
        type: [{
            day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
            enabled: { type: Boolean, default: true },
            intervals: [{
                startTime: String,
                endTime: String,
            }]
        }]
    })
    weeklyRules?: {
        day: string;
        enabled: boolean;
        intervals: { startTime: string; endTime: string; }[];
    }[];
}

export const AvailabilityTemplateSchema = SchemaFactory.createForClass(AvailabilityTemplate);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AvailabilityWeekOverrideDocument = AvailabilityWeekOverride & Document;

@Schema({ timestamps: true })
export class AvailabilityWeekOverride {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Business', required: true })
    businessId!: string;

    @Prop({ default: 'BUSINESS' })
    entityType?: string; // BUSINESS, SERVICE, etc.

    @Prop()
    entityId?: string;

    @Prop({ required: true })
    weekStartDate!: Date; // Always a Monday

    @Prop({
        type: Map,
        of: {
            enabled: { type: Boolean, default: true },
            intervals: [{
                startTime: String,
                endTime: String,
            }]
        }
    })
    dailyOverrides?: Record<string, {
        enabled: boolean;
        intervals: { startTime: string; endTime: string; }[];
    }>;

    @Prop()
    notes?: string;

    @Prop({ default: 'manual' })
    source?: string; // manual, external_sync, etc.
}

export const AvailabilityWeekOverrideSchema = SchemaFactory.createForClass(AvailabilityWeekOverride);

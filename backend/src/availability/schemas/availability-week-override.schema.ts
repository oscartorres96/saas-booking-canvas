import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class AvailabilityWeekOverride {
    @Prop({ required: true, type: Types.ObjectId, ref: 'Business' })
    businessId!: Types.ObjectId;

    @Prop({ required: true, enum: ['BUSINESS', 'RESOURCE', 'PROVIDER'] })
    entityType!: string;

    @Prop({ type: String })
    entityId?: string;

    @Prop({ required: true })
    weekStartDate!: string; // YYYY-MM-DD (Monday)

    @Prop({
        type: [{
            date: String, // YYYY-MM-DD
            enabled: Boolean,
            blocks: [{
                start: String,
                end: String
            }],
            blockedRanges: [{
                start: String,
                end: String
            }]
        }]
    })
    days!: {
        date: string;
        enabled: boolean;
        blocks: { start: string; end: string }[];
        blockedRanges: { start: string; end: string }[];
    }[];

    @Prop()
    note?: string;

    @Prop({ enum: ['MANUAL', 'COPY_PREV', 'RESET_BASE'], default: 'MANUAL' })
    source!: string;
}

export type AvailabilityWeekOverrideDocument = AvailabilityWeekOverride & Document;
export const AvailabilityWeekOverrideSchema = SchemaFactory.createForClass(AvailabilityWeekOverride);
AvailabilityWeekOverrideSchema.index({ businessId: 1, entityType: 1, entityId: 1, weekStartDate: 1 }, { unique: true });

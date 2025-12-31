import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ResourceMapDocument = ResourceMap & Document & { _id: Types.ObjectId };

@Schema({ timestamps: true })
export class ResourceMap {
    @Prop({ required: true, index: true })
    businessId!: string;

    @Prop({ required: true, index: true })
    serviceId!: string;

    @Prop({ default: false })
    enabled!: boolean;

    @Prop()
    resourceType?: string; // icon type (e.g., 'bicycle', 'mat', 'generic')

    @Prop()
    resourceLabel?: string; // base label (e.g., 'Bici', 'Lugar')

    @Prop({ default: 'default' })
    layoutType?: string;

    @Prop({ default: 5 })
    rows!: number;

    @Prop({ default: 5 })
    cols!: number;

    @Prop({
        type: [{
            id: String,
            label: String,
            isActive: { type: Boolean, default: true },
            position: {
                row: Number,
                col: Number
            }
        }]
    })
    resources?: {
        id: string;
        label: string;
        isActive: boolean;
        position: {
            row: number;
            col: number;
        };
    }[];
}

export const ResourceMapSchema = SchemaFactory.createForClass(ResourceMap);
// Ensure uniqueness per service
ResourceMapSchema.index({ businessId: 1, serviceId: 1 }, { unique: true });

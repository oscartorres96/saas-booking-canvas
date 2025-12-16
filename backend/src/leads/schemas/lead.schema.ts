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

    @Prop({ required: true, enum: ['demo', 'registration'] })
    type!: string;

    @Prop({ default: 'new', enum: ['new', 'contacted', 'converted', 'closed'] })
    status!: string;

    @Prop()
    language?: string;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);

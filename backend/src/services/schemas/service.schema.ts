import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ServiceDocument = Service & Document;

@Schema({ timestamps: true })
export class Service {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({ required: true, min: 0 })
  durationMinutes!: number;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ default: true })
  active!: boolean;

  @Prop()
  businessId?: string;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);

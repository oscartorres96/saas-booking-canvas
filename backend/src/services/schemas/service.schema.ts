import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ServiceDocument = Service & Document & { _id: Types.ObjectId };

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

  // Marca si el servicio se ofrece en línea (remoto). Por defecto solo presencial.
  @Prop({ default: false })
  isOnline?: boolean;

  @Prop()
  businessId?: string;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);

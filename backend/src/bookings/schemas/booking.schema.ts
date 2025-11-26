import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BookingDocument = Booking & Document;

export enum BookingStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

@Schema({ timestamps: true })
export class Booking {
  @Prop({ required: true })
  clientName!: string;

  @Prop()
  clientEmail?: string;

  @Prop()
  clientPhone?: string;

  @Prop()
  businessId?: string;

  @Prop({ required: true })
  serviceId!: string;

  @Prop()
  serviceName?: string;

  @Prop({ required: true })
  scheduledAt!: Date;

  @Prop({ enum: BookingStatus, default: BookingStatus.Pending })
  status!: BookingStatus;

  @Prop()
  notes?: string;

  @Prop()
  userId?: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

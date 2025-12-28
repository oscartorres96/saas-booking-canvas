import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BookingDocument = Booking & Document;

export enum BookingStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Completed = 'completed',
  Cancelled = 'cancelled',
  PendingPayment = 'pending_payment',
}

export enum PaymentStatus {
  None = 'none',
  PendingVerification = 'pending_verification',
  Paid = 'paid',
  Rejected = 'rejected',
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

  @Prop()
  accessCode?: string;
  @Prop({ enum: PaymentStatus, default: PaymentStatus.None })
  paymentStatus!: PaymentStatus;

  @Prop()
  paymentMethod?: string;

  @Prop({ type: Object })
  paymentDetails?: {
    bank?: string;
    clabe?: string;
    holderName?: string;
    transferDate?: Date;
  };

  @Prop()
  resourceId?: string;

  @Prop()
  assetId?: string;

  @Prop()
  stripeSessionId?: string;

  @Prop()
  stripePaymentIntentId?: string;

  @Prop({ type: Object })
  resourceMapSnapshot?: any;
}


export const BookingSchema = SchemaFactory.createForClass(Booking);

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

  @Prop({ default: false })
  requirePayment?: boolean;

  @Prop({ default: false })
  requireResource?: boolean;

  @Prop({ default: false })
  requireProduct?: boolean;

  @Prop()
  businessId?: string;

  @Prop({
    type: {
      productId: { type: String, default: null },
      priceId: { type: String, default: null },
      livemode: { type: Boolean, default: false },
      syncStatus: { type: String, enum: ['PENDING', 'SYNCING', 'SYNCED', 'ERROR'], default: 'PENDING' },
      lastSyncError: { type: String },
      lastSyncedAt: { type: Date },
      syncLockedAt: { type: Date },
      retryCount: { type: Number, default: 0 },
      nextRetryAt: { type: Date }
    },
    default: { syncStatus: 'PENDING', retryCount: 0 }
  })
  stripe!: {
    productId: string | null;
    priceId: string | null;
    livemode: boolean;
    syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'ERROR';
    lastSyncError?: string;
    lastSyncedAt?: Date;
    syncLockedAt?: Date;
    retryCount: number;
    nextRetryAt?: Date;
  };

  @Prop()
  stripePriceId?: string;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BusinessDocument = Business & Document & { _id: Types.ObjectId };

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class Business {
  @Prop({ trim: true })
  businessName?: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  type?: string;

  @Prop({ trim: true })
  email?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop()
  address?: string;

  @Prop()
  logoUrl?: string;

  @Prop({ required: true })
  ownerUserId!: string;

  @Prop({ trim: true })
  ownerName?: string;

  @Prop({ default: 'trial', enum: ['trial', 'active', 'inactive'] })
  subscriptionStatus?: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  @Prop({
    type: {
      primaryColor: String,
      secondaryColor: String,
      description: String,
      businessHours: [{
        day: String,
        startTime: String,
        endTime: String,
        isOpen: Boolean,
        intervals: [{
          startTime: String,
          endTime: String,
        }],
      }]
    }
  })
  settings?: {
    primaryColor?: string;
    secondaryColor?: string;
    description?: string;
    businessHours?: {
      day: string;
      startTime?: string;
      endTime?: string;
      isOpen: boolean;
      intervals?: { startTime: string; endTime: string; }[];
    }[];
  };
}

export const BusinessSchema = SchemaFactory.createForClass(Business);

BusinessSchema.pre('save', function (next) {
  if (!this.businessName && this.name) {
    this.businessName = this.name;
  }
  if (!this.name && this.businessName) {
    this.name = this.businessName;
  }
  next();
});

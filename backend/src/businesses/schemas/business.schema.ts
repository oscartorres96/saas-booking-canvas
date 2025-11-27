import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BusinessDocument = Business & Document;

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

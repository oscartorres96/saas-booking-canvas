import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BusinessDocument = Business & Document & { _id: Types.ObjectId };

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class Business {
  @Prop({ trim: true })
  businessName?: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ unique: true, trim: true, lowercase: true })
  slug?: string;

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

  @Prop({ default: 1 })
  onboardingStep?: number;

  @Prop({ default: false })
  isOnboardingCompleted?: boolean;

  @Prop({
    type: {
      primaryColor: String,
      secondaryColor: String,
      description: String,
      defaultServiceDuration: { type: Number, default: 30 },
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

// Helper function to generate slug
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

BusinessSchema.pre('save', function (next) {
  if (!this.businessName && this.name) {
    this.businessName = this.name;
  }
  if (!this.name && this.businessName) {
    this.name = this.businessName;
  }
  // Auto-generate slug from business name if not provided
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
  next();
});

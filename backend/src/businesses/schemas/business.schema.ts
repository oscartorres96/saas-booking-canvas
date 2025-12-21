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

  @Prop({ default: 'es', enum: ['es', 'en'] })
  language?: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  @Prop({ default: 1 })
  onboardingStep?: number;

  @Prop({ default: false })
  isOnboardingCompleted?: boolean;

  @Prop({ type: Date })
  trialEndsAt?: Date;

  @Prop({
    type: {
      primaryColor: String,
      secondaryColor: String,
      description: String,
      language: { type: String, default: 'es_MX' },
      defaultServiceDuration: { type: Number, default: 30 },
      facebook: String,
      instagram: String,
      twitter: String,
      website: String,
      currency: { type: String, default: 'MXN' },
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
    language?: string;
    defaultServiceDuration?: number;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
    currency?: string;
    businessHours?: {
      day: string;
      startTime?: string;
      endTime?: string;
      isOpen: boolean;
      intervals?: { startTime: string; endTime: string; }[];
    }[];
  };

  @Prop({
    type: {
      allowMultipleBookingsPerDay: { type: Boolean, default: false },
      cancellationWindowHours: { type: Number, default: 0 },
      confirmationType: { type: String, default: 'automatic', enum: ['automatic', 'manual'] },
      services: {
        enabled: { type: Boolean, default: true },
        paymentTiming: { type: String, default: 'NONE', enum: ['NONE', 'BEFORE_BOOKING'] }
      },
      packages: {
        enabled: { type: Boolean, default: false },
        paymentTiming: { type: String, default: 'BEFORE_BOOKING' }
      }
    }
  })
  bookingConfig?: {
    allowMultipleBookingsPerDay: boolean;
    cancellationWindowHours: number;
    confirmationType: 'automatic' | 'manual';
    services: {
      enabled: boolean;
      paymentTiming: 'NONE' | 'BEFORE_BOOKING';
    };
    packages: {
      enabled: boolean;
      paymentTiming: 'BEFORE_BOOKING';
    };
  };

  @Prop({
    type: {
      enabled: { type: Boolean, default: false },
      taxName: { type: String, default: 'IVA' },
      taxRate: { type: Number, default: 0.16 },
      taxIdLabel: { type: String, default: 'RFC' },
      invoicingEnabled: { type: Boolean, default: false },
    }
  })
  taxConfig?: {
    enabled: boolean;
    taxName?: string;
    taxRate?: number;
    taxIdLabel?: string;
    invoicingEnabled?: boolean;
  };
  @Prop({
    type: {
      paymentPolicy: {
        type: String,
        enum: ['RESERVE_ONLY', 'PAY_BEFORE_BOOKING', 'PACKAGE_OR_PAY'],
        default: 'RESERVE_ONLY'
      },
      method: { type: String, default: 'none' },
      allowTransfer: { type: Boolean, default: false },
      allowCash: { type: Boolean, default: false },
      bank: String,
      clabe: String,
      holderName: String,
      instructions: String,
    },
  })
  paymentConfig?: {
    paymentPolicy: 'RESERVE_ONLY' | 'PAY_BEFORE_BOOKING' | 'PACKAGE_OR_PAY';
    method: 'none' | 'bank_transfer';
    allowTransfer: boolean;
    allowCash: boolean;
    bank?: string;
    clabe?: string;
    holderName?: string;
    instructions?: string;
  };

  @Prop({
    type: String,
    enum: ['BOOKPRO_COLLECTS', 'DIRECT_TO_BUSINESS'],
    default: 'BOOKPRO_COLLECTS',
  })
  paymentMode?: 'BOOKPRO_COLLECTS' | 'DIRECT_TO_BUSINESS';

  @Prop({ trim: true })
  stripeConnectAccountId?: string;

  @Prop({
    type: {
      enabled: { type: Boolean, default: false },
      resourceType: String,
      resourceLabel: String,
      layoutType: { type: String, default: 'default' },
      rows: { type: Number, default: 5 },
      cols: { type: Number, default: 5 },
      resources: [{
        id: String,
        label: String,
        isActive: { type: Boolean, default: true },
        position: {
          row: Number,
          col: Number
        }
      }]
    }
  })
  resourceConfig?: {
    enabled: boolean;
    resourceType?: string;
    resourceLabel?: string;
    layoutType?: string;
    rows?: number;
    cols?: number;
    resources?: {
      id: string;
      label: string;
      isActive: boolean;
      position: {
        row: number;
        col: number;
      };
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

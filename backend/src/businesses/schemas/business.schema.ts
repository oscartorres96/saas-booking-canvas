import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BusinessDocument = Business & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class Business {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop()
  address?: string;

  @Prop()
  logoUrl?: string;

  @Prop({ required: true })
  ownerUserId!: string;
}

export const BusinessSchema = SchemaFactory.createForClass(Business);

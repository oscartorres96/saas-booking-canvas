import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document & { _id: Types.ObjectId };

export enum UserRole {
  Owner = 'owner',
  Business = 'business',
  Client = 'client',
}

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email!: string;

  @Prop({ required: true })
  password_hash!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ enum: UserRole, default: UserRole.Client })
  role!: UserRole;

  @Prop()
  businessId?: string;

  @Prop()
  activationToken?: string;

  @Prop()
  activationTokenExpires?: Date;

  @Prop({ default: false })
  isActive!: boolean;

  @Prop()
  createdFromLead?: string; // Lead ID reference
}

export const UserSchema = SchemaFactory.createForClass(User);

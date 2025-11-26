import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

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
}

export const UserSchema = SchemaFactory.createForClass(User);

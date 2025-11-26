import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  Admin = 'admin',
  Staff = 'staff',
  User = 'user',
}

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({ required: true })
  password_hash: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ enum: UserRole, default: UserRole.User })
  role: UserRole;
}

export const UserSchema = SchemaFactory.createForClass(User);

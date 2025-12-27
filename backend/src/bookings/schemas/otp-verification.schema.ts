
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpVerificationDocument = OtpVerification & Document;

@Schema({ timestamps: true })
export class OtpVerification {
    @Prop({ required: true, index: true })
    email!: string;

    @Prop({ required: true })
    codeHash!: string;

    @Prop({ required: true })
    expiresAt!: Date;

    @Prop({ default: false })
    verified!: boolean;

    @Prop({
        required: true,
        enum: ['ASSET_USAGE', 'ONLINE_PAYMENT', 'CLIENT_ACCESS'],
        default: 'ASSET_USAGE'
    })
    purpose!: string;

    @Prop()
    verificationToken?: string;
}

export const OtpVerificationSchema = SchemaFactory.createForClass(OtpVerification);

// Auto-delete expired OTPs (TTL Index)
OtpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

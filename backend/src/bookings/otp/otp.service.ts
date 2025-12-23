import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { OtpVerification, OtpVerificationDocument } from '../schemas/otp-verification.schema';
import { NotificationService } from '../../services/notification.service';
import { CustomerAssetsService } from '../../customer-assets/customer-assets.service';

@Injectable()
export class OtpService {
    constructor(
        @InjectModel(OtpVerification.name) private readonly otpModel: Model<OtpVerificationDocument>,
        private readonly notificationService: NotificationService,
        private readonly customerAssetsService: CustomerAssetsService,
    ) { }

    async requestOtp(email: string, businessId: string, purpose: 'ASSET_USAGE' | 'ONLINE_PAYMENT' = 'ASSET_USAGE') {
        // 1. Check if OTP is actually needed
        let requiresOtp = false;
        let reason = '';

        if (purpose === 'ASSET_USAGE') {
            const assets = await this.customerAssetsService.findActiveAssets(businessId, email);
            if (assets.length > 0) {
                requiresOtp = true;
                reason = 'ASSET_USAGE';
            }
        } else if (purpose === 'ONLINE_PAYMENT') {
            requiresOtp = true;
            reason = 'ONLINE_PAYMENT';
        }

        if (!requiresOtp) {
            return { requiresOtp: false };
        }

        // 2. Generate OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const codeHash = await bcrypt.hash(code, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // 3. Save OTP (replace any existing pending OTP for this email/purpose)
        await this.otpModel.deleteMany({ email, purpose, verified: false });
        await this.otpModel.create({
            email,
            codeHash,
            expiresAt,
            purpose,
            verified: false,
        });

        // 4. Send Email
        await this.notificationService.sendOtpEmail(email, code, businessId);

        return {
            requiresOtp: true,
            reason,
            expiresIn: '10m'
        };
    }

    async verifyOtp(email: string, code: string, purpose: 'ASSET_USAGE' | 'ONLINE_PAYMENT' = 'ASSET_USAGE') {
        const otpRecord = await this.otpModel.findOne({
            email,
            purpose,
            verified: false,
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        if (!otpRecord) {
            throw new BadRequestException('El código ha expirado o no existe.');
        }

        const isValid = await bcrypt.compare(code, otpRecord.codeHash);
        if (!isValid) {
            throw new BadRequestException('Código inválido.');
        }

        // Mark as verified and generate a temporary token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        otpRecord.verified = true;
        otpRecord.verificationToken = verificationToken;
        await otpRecord.save();

        return {
            verified: true,
            verificationToken,
            expiresIn: '15m'
        };
    }

    async isTokenValid(email: string, token: string, purpose: string): Promise<boolean> {
        const otpRecord = await this.otpModel.findOne({
            email,
            verificationToken: token,
            purpose,
            verified: true,
            updatedAt: { $gt: new Date(Date.now() - 15 * 60 * 1000) } // Token valid for 15m
        });

        return !!otpRecord;
    }
}

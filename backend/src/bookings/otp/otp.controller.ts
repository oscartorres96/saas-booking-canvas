import { Body, Controller, Post } from '@nestjs/common';
import { IsEmail, IsEnum, IsString, Length } from 'class-validator';
import { OtpService } from './otp.service';

class RequestOtpDto {
    @IsEmail()
    email!: string;

    @IsString()
    businessId!: string;

    @IsEnum(['ASSET_USAGE', 'ONLINE_PAYMENT'])
    purpose!: 'ASSET_USAGE' | 'ONLINE_PAYMENT';
}

class VerifyOtpDto {
    @IsEmail()
    email!: string;

    @IsString()
    @Length(6, 6)
    code!: string;

    @IsEnum(['ASSET_USAGE', 'ONLINE_PAYMENT'])
    purpose!: 'ASSET_USAGE' | 'ONLINE_PAYMENT';
}

@Controller('bookings/otp')
export class OtpController {
    constructor(private readonly otpService: OtpService) { }

    @Post('request')
    async request(@Body() body: RequestOtpDto) {
        return this.otpService.requestOtp(body.email, body.businessId, body.purpose);
    }

    @Post('verify')
    async verify(@Body() body: VerifyOtpDto) {
        return this.otpService.verifyOtp(body.email, body.code, body.purpose);
    }
}

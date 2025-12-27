import { Body, Controller, Get, Post, Query, ForbiddenException } from '@nestjs/common';
import { IsEmail, IsEnum, IsString, Length } from 'class-validator';
import { OtpService } from './otp.service';
import { BookingsService } from '../bookings.service';

class RequestOtpDto {
    @IsEmail()
    email!: string;

    @IsString()
    businessId!: string;

    @IsEnum(['ASSET_USAGE', 'ONLINE_PAYMENT', 'CLIENT_ACCESS'])
    purpose!: 'ASSET_USAGE' | 'ONLINE_PAYMENT' | 'CLIENT_ACCESS';
}

class VerifyOtpDto {
    @IsEmail()
    email!: string;

    @IsString()
    @Length(6, 6)
    code!: string;

    @IsEnum(['ASSET_USAGE', 'ONLINE_PAYMENT', 'CLIENT_ACCESS'])
    purpose!: 'ASSET_USAGE' | 'ONLINE_PAYMENT' | 'CLIENT_ACCESS';
}

@Controller('bookings/otp')
export class OtpController {
    constructor(
        private readonly otpService: OtpService,
        private readonly bookingsService: BookingsService
    ) { }

    @Post('request')
    async request(@Body() body: RequestOtpDto) {
        return this.otpService.requestOtp(body.email, body.businessId, body.purpose);
    }

    @Post('verify')
    async verify(@Body() body: VerifyOtpDto) {
        return this.otpService.verifyOtp(body.email, body.code, body.purpose);
    }

    @Get('dashboard')
    async getDashboard(
        @Query('email') email: string,
        @Query('token') token: string,
        @Query('businessId') businessId: string
    ) {
        const isValid = await this.otpService.isTokenValid(email, token, 'CLIENT_ACCESS');
        if (!isValid) {
            throw new ForbiddenException('Código expirado o sesión inválida.');
        }

        return this.bookingsService.getClientDashboardData(email, businessId);
    }

    @Post('logout')
    async logout(
        @Body() body: { email: string; token: string }
    ) {
        await this.otpService.invalidateToken(body.email, body.token, 'CLIENT_ACCESS');
        return { success: true };
    }
}

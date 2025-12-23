import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBookingCheckoutDto {
    @IsOptional()
    @IsString()
    bookingId?: string;

    @IsOptional()
    @IsString()
    businessId?: string;

    @IsOptional()
    @IsNumber()
    amount?: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsString()
    serviceName?: string;

    @IsOptional()
    @IsString()
    successUrl?: string;

    @IsOptional()
    @IsString()
    cancelUrl?: string;
}

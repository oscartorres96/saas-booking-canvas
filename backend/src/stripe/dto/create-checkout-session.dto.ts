import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateCheckoutSessionDto {
    @IsString()
    @IsNotEmpty()
    userId!: string;

    @IsString()
    @IsNotEmpty()
    businessId!: string;

    @IsString()
    @IsOptional()
    successUrl?: string;

    @IsString()
    @IsOptional()
    cancelUrl?: string;

    @IsString()
    @IsOptional()
    priceId?: string; // Optional, defaults to env var
}

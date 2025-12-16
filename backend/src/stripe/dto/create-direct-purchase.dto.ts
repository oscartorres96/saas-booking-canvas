import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsIn } from 'class-validator';

export class CreateDirectPurchaseDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(2)
    name!: string;

    @IsNotEmpty()
    @IsEmail()
    email!: string;

    @IsNotEmpty()
    @IsString()
    phone!: string;

    @IsOptional()
    @IsString()
    company?: string;

    @IsOptional()
    @IsString()
    language?: string;

    @IsOptional()
    @IsString()
    @IsIn(['monthly', 'annual'])
    billingPeriod?: string; // 'monthly' or 'annual'
}

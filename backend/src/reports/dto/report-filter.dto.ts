import { IsOptional, IsString, IsDateString } from 'class-validator';

export class ReportFilterDto {
    @IsOptional()
    @IsDateString()
    from?: string;

    @IsOptional()
    @IsDateString()
    to?: string;

    @IsOptional()
    @IsString()
    branchId?: string;

    @IsOptional()
    @IsString()
    paymentMethod?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    businessId?: string;
}

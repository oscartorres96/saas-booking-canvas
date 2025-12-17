import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ApproveLeadDto {
    @IsNotEmpty()
    @IsEnum(['trial', 'paid'])
    accessType!: 'trial' | 'paid';
}

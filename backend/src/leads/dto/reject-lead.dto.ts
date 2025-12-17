import { IsNotEmpty, IsString } from 'class-validator';

export class RejectLeadDto {
    @IsNotEmpty()
    @IsString()
    reason!: string;
}

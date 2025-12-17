import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CompleteDirectPurchaseDto {
    @IsNotEmpty()
    @IsString()
    sessionId!: string;
}

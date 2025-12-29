import { IsNotEmpty, IsString } from 'class-validator';

export class CreateConnectAccountDto {
    @IsString()
    @IsNotEmpty()
    businessId!: string;
}

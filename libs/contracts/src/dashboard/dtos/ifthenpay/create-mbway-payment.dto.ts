import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class IfthenpayCreateMbwayPaymentDto {
    @IsString()
    @IsNotEmpty()
    orderId: string;

    @IsNotEmpty()
    amount: string | number;

    @IsString()
    @IsNotEmpty()
    mobileNumber: string;

    @IsString()
    @IsOptional()
    email?: string;
}

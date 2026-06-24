import { IsNotEmpty, IsString } from 'class-validator';

export class IfthenpayCreatePixPaymentDto {
    @IsString()
    @IsNotEmpty()
    orderId: string;

    @IsNotEmpty()
    amount: string | number;

    @IsString()
    @IsNotEmpty()
    cpf: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    mobileNumber: string;

    @IsString()
    @IsNotEmpty()
    redirectUrl: string;
}

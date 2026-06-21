import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class IfthenpayCreateCreditCardPaymentDto {
    @IsString()
    @IsNotEmpty()
    orderId: string;

    @IsNotEmpty()
    amount: string | number;

    @IsString()
    @IsOptional()
    successUrl?: string;

    @IsString()
    @IsOptional()
    errorUrl?: string;

    @IsString()
    @IsOptional()
    cancelUrl?: string;

    @IsString()
    @IsOptional()
    language?: 'pt' | 'en' | 'es' | 'fr';
}

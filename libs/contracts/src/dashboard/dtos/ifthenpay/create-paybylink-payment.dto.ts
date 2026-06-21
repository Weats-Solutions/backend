import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class IfthenpayCreatePayByLinkPaymentDto {
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
    closeButtonUrl?: string;

    @IsString()
    @IsOptional()
    closeButtonLabel?: string;

    @IsBoolean()
    @IsOptional()
    otp?: boolean;

    @IsString()
    @IsOptional()
    language?: 'pt' | 'en' | 'es' | 'fr';
}

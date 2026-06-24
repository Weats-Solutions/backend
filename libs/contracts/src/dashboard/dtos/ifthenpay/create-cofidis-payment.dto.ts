import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';

export class IfthenpayCreateCofidisPaymentDto {
    @IsString()
    @IsNotEmpty()
    orderId: string;

    @IsNotEmpty()
    amount: string | number;

    @IsString()
    @IsOptional()
    returnUrl?: string;

    @IsObject()
    @IsOptional()
    customerData?: {
        name?: string;
        vat?: string;
        email?: string;
        phone?: string;
        billingAddress?: string;
        billingZipCode?: string;
        billingCity?: string;
        deliveryAddress?: string;
        deliveryZipCode?: string;
        deliveryCity?: string;
    };
}

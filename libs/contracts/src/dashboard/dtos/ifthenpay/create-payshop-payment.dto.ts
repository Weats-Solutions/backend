import { IsNotEmpty, IsString } from 'class-validator';

export class IfthenpayCreatePayshopPaymentDto {
    @IsString()
    @IsNotEmpty()
    orderId: string;

    @IsNotEmpty()
    amount: string | number;
}

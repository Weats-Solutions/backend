import { IsNotEmpty, IsString } from 'class-validator';

export class IfthenpayCreateMultibancoPaymentDto {
    @IsString()
    @IsNotEmpty()
    orderId: string;

    @IsNotEmpty()
    amount: string | number;
}

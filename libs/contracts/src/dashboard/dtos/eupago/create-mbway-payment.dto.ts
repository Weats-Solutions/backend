import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { IsValidPhoneNumber, IsValidCountryCode } from '@weats/common/validators/phone-number.validator';

/**
 * DTO para enviar um pedido de pagamento MB WAY via EuPago.
 *
 * Endpoint: POST /api/v1.02/mbway/create
 * Ref: https://eupago.readme.io/reference/mbway
 *
 * Não usa URLs de redirect — o cliente aceita na app MB WAY em 5 minutos.
 */
export class EupagoCreateMbwayPaymentDto {
    /** Valor a cobrar em EUR (mín. 1, máx. 99 999) */
    @IsNumber()
    @Min(1)
    @Max(99999)
    value: number;

    /** Número de telefone do cliente (sem indicativo, ex: "911111111") */
    @IsString()
    @IsNotEmpty()
    @IsValidPhoneNumber('countryCode')
    customerPhone: string;

    /** Indicativo do país (ex: "351" para Portugal) */
    @IsString()
    @IsNotEmpty()
    @IsValidCountryCode()
    countryCode: string;
}
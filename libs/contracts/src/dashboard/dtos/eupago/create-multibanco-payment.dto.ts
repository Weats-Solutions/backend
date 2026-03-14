import { IsNotEmpty, IsString, Min, Max, IsNumber } from 'class-validator';

/**
 * DTO para enviar um pedido de pagamento MB WAY via EuPago.
 *
 * Endpoint: POST /api/v1.02/mbway/create
 * Ref: https://eupago.readme.io/reference/mbway
 *
 * Não usa URLs de redirect — o cliente aceita na app MB WAY em 5 minutos.
 */
export class CreateMultibancoPaymentDto {
    /** Chave de pagamento */
    @IsString()
    @IsNotEmpty()
    chave: string;

    @IsNumber()
    @Min(1)
    @Max(99999)
    valor: number;
}
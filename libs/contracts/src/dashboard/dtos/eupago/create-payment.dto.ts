import { IsNotEmpty, Matches, IsNumber, IsUrl, IsOptional, Min, Max, IsEnum } from 'class-validator';
import { WALLET_URL_BLOCKED, WALLET_URL_BLOCKED_MSG, WALLET_URL_OPTIONS, EupagoFormLangEnum } from '@weats/common/constants';

/**
 * DTO para gerar um link de pagamento Google Pay via EuPago.
 * Esta versão foi simplificada (flat) para facilitar o consumo pelo frontend.
 *
 * Endpoint: POST /api/v1.02/googlepay/create
 * Ref: https://eupago.readme.io/reference/google-pay
 */
export class EupagoCreatePaymentDto {
    /** Valor a cobrar (mín. 0.01, máx. 99999) */
    @IsNumber()
    @Min(0.01)
    @Max(99999)
    value: number;

    /** URL de redireccionamento após pagamento bem-sucedido */
    @IsUrl(WALLET_URL_OPTIONS)
    @IsNotEmpty()
    @Matches(WALLET_URL_BLOCKED, { message: `successUrl: ${WALLET_URL_BLOCKED_MSG}` })
    successUrl: string;

    /** URL de redireccionamento após pagamento falhado/cancelado */
    @IsUrl(WALLET_URL_OPTIONS)
    @IsNotEmpty()
    @Matches(WALLET_URL_BLOCKED, { message: `failUrl: ${WALLET_URL_BLOCKED_MSG}` })
    failUrl: string;

    /** URL do botão "voltar" na página de checkout */
    @IsUrl(WALLET_URL_OPTIONS)
    @IsNotEmpty()
    @Matches(WALLET_URL_BLOCKED, { message: `backUrl: ${WALLET_URL_BLOCKED_MSG}` })
    backUrl: string;

    /** Idioma da página de pagamento (opcional, padrão PT) */
    @IsEnum(EupagoFormLangEnum)
    @IsOptional()
    lang?: EupagoFormLangEnum = EupagoFormLangEnum.PT;

    /** Validade do formulário em minutos (opcional, mín. 1, máx. 1440) */
    @IsNumber()
    @Min(1)
    @Max(1440)
    @IsOptional()
    minutesFormUp?: number;
}

import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    Min,
    Max,
    IsEnum,
} from 'class-validator';

import { EupagoFormLangEnum } from '@weats/common/constants';
import { IsSecureHttpsUrl } from '@weats/common/decorators/IsSecureHttpsUrl.decorator';

/**
 * DTO para gerar um link de pagamento via EuPago.
 */
export class EupagoCreatePaymentDto {
    /** Valor a cobrar (mín. 0.01, máx. 99999) */
    @IsNumber()
    @Min(0.01)
    @Max(99999)
    value: number;

    /** URL de sucesso */
    @IsNotEmpty()
    @IsSecureHttpsUrl()
    successUrl: string;

    /** URL de falha */
    @IsNotEmpty()
    @IsSecureHttpsUrl()
    failUrl: string;

    /** URL de voltar */
    @IsNotEmpty()
    @IsSecureHttpsUrl()
    backUrl: string;

    /** Idioma */
    @IsEnum(EupagoFormLangEnum)
    @IsOptional()
    lang?: EupagoFormLangEnum = EupagoFormLangEnum.PT;

    /** Expiração */
    @IsNumber()
    @Min(1)
    @Max(1440)
    @IsOptional()
    minutesFormUp?: number;
}

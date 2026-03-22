import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    Min,
    Max,
    IsEnum,
    IsString,
} from 'class-validator';

import { EupagoFormLangEnum } from '@weats/common/constants';
import { IsSecureHttpsUrl } from '@weats/common/decorators/IsSecureHttpsUrl.decorator';

/**
 * DTO para gerar um link de pagamento via EuPago (Cartão, Google Pay ou Apple Pay).
 */
export class EupagoCreateHostedPaymentDto {
    /** Tipo de pagamento: CreditCard | GooglePay | ApplePay */
    @IsEnum(['CreditCard', 'GooglePay', 'ApplePay'])
    @IsNotEmpty()
    type: 'CreditCard' | 'GooglePay' | 'ApplePay';

    /** Valor a cobrar (mín. 0.01, máx. 3999) */
    @IsNumber()
    @Min(0.01)
    @Max(3999)
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

    /** Expiração (em minutos, máx 24h) */
    @IsNumber()
    @Min(1)
    @Max(1440)
    @IsOptional()
    minutesFormUp?: number = 1440;
}

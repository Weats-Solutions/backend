import { IsIn, IsNotEmpty, IsString, Length } from "class-validator";
import { Type } from "class-transformer";
import { IsValidTaxId } from "@weats/common/validators";

class EstablishmentBillingDataDto {
    @Length(2, 100)
    @IsString()
    @IsNotEmpty()
    billingName: string;

    @IsString()
    @IsNotEmpty()
    countryCode: string;

    @IsString()
    @IsNotEmpty()
    @IsValidTaxId('countryCode')
    billingTaxId: string;
}

export class UpdateEstablishmentBillingSettingsDto {

    @IsString()
    @IsNotEmpty()
    @IsIn(['billingData'])
    section: string;

    @Type(() => EstablishmentBillingDataDto)
    @IsNotEmpty()
    billingData: EstablishmentBillingDataDto;
}

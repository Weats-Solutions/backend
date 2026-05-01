import { IsIn, IsNotEmpty, IsOptional, IsString, Length, MaxLength, MinLength, ValidateIf, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { IsValidTaxId } from "@weats/common/validators";

export class EstablishmentBillingDataDto {
    @Length(2, 100)
    @IsString()
    @IsNotEmpty()
    billingName: string;

    @IsString()
    @IsNotEmpty()
    //@IsValidTaxId('billingCountry')
    billingTaxId: string;


    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(100)
    billingAddress: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(50)
    billingCity: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(50)
    billingState: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(10)
    billingZipCode: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(5)
    billingCountry: string;

}

export class UpdateEstablishmentBillingSettingsDto {
    @IsString()
    @IsNotEmpty()
    @IsIn(['billingInfo'])
    section: string;

    @ValidateIf(o => o.section === 'billingInfo')
    @Type(() => EstablishmentBillingDataDto)
    @ValidateNested()
    @IsNotEmpty()
    billingInfo: EstablishmentBillingDataDto;

}

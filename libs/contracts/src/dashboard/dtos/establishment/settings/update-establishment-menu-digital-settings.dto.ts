import { IsIn, IsNotEmpty, IsString, IsEnum, Length, IsUrl } from "class-validator";
import { Type } from "class-transformer";
import { EstablishmentLanguage } from "@weats/common/types";

class EstablishmentLanguagesDto {
    @IsEnum(EstablishmentLanguage)
    @IsNotEmpty()
    primaryLanguage: EstablishmentLanguage;

    @IsEnum(EstablishmentLanguage, { each: true })
    @IsNotEmpty()
    availableLanguages: EstablishmentLanguage[];
}

class EstablishmentDomainDto {
    @Length(3, 50)
    @IsString()
    @IsNotEmpty()
    subdomain: string;
}

export class UpdateEstablishmentMenuDigitalSettingsDto {

    @IsString()
    @IsNotEmpty()
    @IsIn(['languages', 'domain'])
    section: string;

    @Type(() => EstablishmentLanguagesDto)
    @IsNotEmpty()
    languages?: EstablishmentLanguagesDto;

    @Type(() => EstablishmentDomainDto)
    @IsNotEmpty()
    domain?: EstablishmentDomainDto;
}

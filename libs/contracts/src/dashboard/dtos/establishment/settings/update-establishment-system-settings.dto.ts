import { IsIn, IsNotEmpty, IsString, IsEnum, IsArray, ValidateIf, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { Currency, EstablishmentLanguage } from "@weats/database";

export class EstablishmentLanguageDto {
    @IsArray()
    @IsEnum(EstablishmentLanguage, { each: true })
    @IsNotEmpty()
    availableLanguages: EstablishmentLanguage[];
}

export class EstablishmentPreferencesDto {
    @IsEnum(Currency)
    @IsNotEmpty()
    currency: Currency;

    @IsString()
    @IsNotEmpty()
    timezone: string;
}

export class UpdateEstablishmentSystemSettingsDto {
    @IsString()
    @IsNotEmpty()
    @IsIn(['preferences', 'languages'])
    section: string;

    @ValidateIf(o => o.section === 'preferences')
    @ValidateNested()
    @Type(() => EstablishmentPreferencesDto)
    @IsNotEmpty()
    preferences: EstablishmentPreferencesDto;

    @ValidateIf(o => o.section === 'languages')
    @ValidateNested()
    @Type(() => EstablishmentLanguageDto)
    @IsNotEmpty()
    languages: EstablishmentLanguageDto;
}

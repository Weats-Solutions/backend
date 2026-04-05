import { IsIn, IsNotEmpty, IsString, IsEnum } from "class-validator";
import { Type } from "class-transformer";
import { Currency } from "@weats/database";

class EstablishmentPreferencesDto {
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
    @IsIn(['preferences'])
    section: string;

    @Type(() => EstablishmentPreferencesDto)
    @IsNotEmpty()
    preferences: EstablishmentPreferencesDto;
}

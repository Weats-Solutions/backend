import { EstablishmentLanguage } from "@weats/database";
import { IsEnum, IsNotEmpty, IsArray } from "class-validator";

export class UpdateEstablishmentLanguagesDto {
    @IsArray()
    @IsEnum(EstablishmentLanguage, { each: true })
    @IsNotEmpty()
    availableLanguages: EstablishmentLanguage[];
}

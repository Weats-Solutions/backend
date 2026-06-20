import { CallStaffOption, ReservationsPlataform } from "@weats/database";
import { IsBoolean, IsNotEmpty, IsArray, IsEnum, IsOptional, IsString, ValidateIf, IsUrl, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class ExternalLinkTranslationDto {
    @IsString()
    @IsNotEmpty()
    locale: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;
}

export class ExternalLinkDto {
    @IsString()
    @IsOptional()
    id?: string;

    @IsString()
    @IsNotEmpty()
    icon: string;

    @IsString()
    @IsNotEmpty()
    @IsUrl({}, { message: 'External link URL must be a valid URL' })
    url: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ExternalLinkTranslationDto)
    translations: ExternalLinkTranslationDto[];
}

export class UpdateEstablishmentModuleSettingsDto {
    @IsBoolean()
    @IsNotEmpty()
    myPageModule: boolean;

    @IsBoolean()
    @IsNotEmpty()
    menusModule: boolean;

    @IsBoolean()
    @IsNotEmpty()
    callStaffModule: boolean;

    @IsArray()
    @IsEnum(CallStaffOption, { each: true })
    @IsOptional()
    callStaffOptions?: CallStaffOption[];

    @IsBoolean()
    @IsNotEmpty()
    reservationsModule: boolean;

    @ValidateIf(o => o.reservationsModule === true)
    @IsEnum(ReservationsPlataform)
    @IsNotEmpty({ message: 'Reservations platform is required when reservations module is active' })
    reservationsPlatform?: ReservationsPlataform;

    @ValidateIf(o => o.reservationsModule === true)
    @IsString()
    @IsNotEmpty({ message: 'Reservations link is required when reservations module is active' })
    @IsUrl({}, { message: 'Reservations link must be a valid URL' })
    reservationsLink?: string;

    @IsBoolean()
    @IsNotEmpty()
    externalLinksModule: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ExternalLinkDto)
    @IsOptional()
    externalLinks?: ExternalLinkDto[];
}

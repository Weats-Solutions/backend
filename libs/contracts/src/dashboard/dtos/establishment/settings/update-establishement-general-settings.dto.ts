import { IsEmail, IsIn, IsNotEmpty, IsString, Length, ValidateIf, ValidateNested, IsEnum } from "class-validator";
import { IsValidCountryCode, IsValidPhoneNumber } from "@weats/common/validators";
import { Type } from "class-transformer";
import { CreateScheduleDto } from "@weats/contracts";
import { EstablishmentType } from "@weats/database";

export class EstablishmentInformationsDto {
    @Length(2, 50)
    @IsString()
    @IsNotEmpty()
    name: string;

    @Length(7, 100)
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @IsValidPhoneNumber('countryCode')
    phoneNumber: string;

    @IsString()
    @IsNotEmpty()
    @IsValidCountryCode()
    countryCode: string;

    @IsEnum(EstablishmentType)
    type?: EstablishmentType;
}

export class EstablishmentLocationDto {
    @Length(3, 100)
    @IsString()
    @IsNotEmpty()
    address: string;

    @Length(3, 50)
    @IsString()
    @IsNotEmpty()
    city: string;

    @Length(3, 50)
    @IsString()
    @IsNotEmpty()
    state: string;

    @Length(5, 10)
    @IsString()
    @IsNotEmpty()
    zipCode: string;

    @Length(3, 25)
    @IsString()
    @IsNotEmpty()
    country: string;
}

export class UpdateEstablishmentGeneralSettingsDto {

    @IsString()
    @IsNotEmpty()
    @IsIn(['informations', 'location', 'schedule'])
    section: string;

    @ValidateIf(o => o.section === 'informations')
    @Type(() => EstablishmentInformationsDto)
    @ValidateNested()
    @IsNotEmpty()
    informations: EstablishmentInformationsDto;

    @ValidateIf(o => o.section === 'location')
    @Type(() => EstablishmentLocationDto)
    @ValidateNested()
    @IsNotEmpty()
    location: EstablishmentLocationDto;

    @ValidateIf(o => o.section === 'schedule')
    @Type(() => CreateScheduleDto)
    @ValidateNested()
    @IsNotEmpty()
    schedule: CreateScheduleDto;
}

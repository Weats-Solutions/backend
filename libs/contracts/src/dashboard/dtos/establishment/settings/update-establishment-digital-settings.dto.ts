import { IsIn, IsNotEmpty, IsOptional, IsString, Length, Matches, ValidateIf } from "class-validator";
import { Type } from "class-transformer";

export class EstablishmentDomainDto {
    @Length(2, 50)
    @Matches(/^[a-z0-9]+$/)
    @IsString()
    @IsNotEmpty()
    slug: string;
}

export class EstablishmentWifiDto {
    @Length(2, 50)
    @IsString()
    @IsNotEmpty()
    wifiSsid: string;

    @Length(5, 63)
    @IsString()
    @IsOptional()
    wifiPassword?: string;
}

export class UpdateEstablishmentDigitalSettingsDto {
    @IsString()
    @IsNotEmpty()
    @IsIn(['domain', 'wifi'])
    section: string;

    @ValidateIf(o => o.section === 'domain')
    @Type(() => EstablishmentDomainDto)
    @IsNotEmpty()
    domain: EstablishmentDomainDto;

    @ValidateIf(o => o.section === 'wifi')
    @Type(() => EstablishmentWifiDto)
    @IsNotEmpty()
    wifi: EstablishmentWifiDto;
}

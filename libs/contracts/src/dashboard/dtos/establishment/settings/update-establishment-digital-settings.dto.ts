import { IsIn, IsNotEmpty, IsString, Length, Matches, ValidateIf } from "class-validator";
import { Type } from "class-transformer";

export class EstablishmentDomainDto {
    @Length(2, 50)
    @Matches(/^[a-z0-9]+$/)
    @IsString()
    @IsNotEmpty()
    slug: string;
}

export class UpdateEstablishmentDigitalSettingsDto {
    @IsString()
    @IsNotEmpty()
    @IsIn(['domain'])
    section: string;

    @ValidateIf(o => o.section === 'domain')
    @Type(() => EstablishmentDomainDto)
    @IsNotEmpty()
    domain: EstablishmentDomainDto;
}

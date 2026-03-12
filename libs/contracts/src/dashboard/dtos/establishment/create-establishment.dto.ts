import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import {
  EstablishmentLanguage,
  EstablishmentType,
} from '@weats/database/core-prisma.service';
import { Type } from 'class-transformer';

export class EstablishmentDetailsDto {
  @Length(3, 100)
  @IsString()
  address: string;

  @Length(3, 50)
  @IsString()
  city: string;

  @Length(3, 50)
  @IsString()
  state: string;

  @Length(5, 10)
  @IsString()
  zipCode: string;

  @Length(3, 25)
  @IsString()
  country: string;

  @Length(2, 5)
  @IsString()
  countryCode: string;

  @Length(3, 15)
  @IsString()
  phoneNumber: string;

  @Length(3, 50)
  @IsString()
  billingName: string;

  @IsString()
  @IsOptional()
  cuisine?: string;

  @Length(9, 20)
  @IsString()
  billingTaxId: string;


}

export class EstablishmentSettingsDto {
  @IsEnum(EstablishmentLanguage)
  primaryLanguage: EstablishmentLanguage;
}

export class CreateEstablishmentDto {
  @Length(3, 50)
  @IsString()
  name: string;

  @IsString()
  type: EstablishmentType;

  @Length(7, 100)
  @IsEmail()
  email: string;

  @ValidateNested()
  @Type(() => EstablishmentDetailsDto)
  establishmentDetails: EstablishmentDetailsDto;

  @ValidateNested()
  @Type(() => EstablishmentSettingsDto)
  establishmentSettings: EstablishmentSettingsDto;
}

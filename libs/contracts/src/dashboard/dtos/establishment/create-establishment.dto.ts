import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import {
  Currency,
  EstablishmentLanguage,
  EstablishmentType,
} from '@weats/database/core-prisma.service';
import { IsValidCountryCode, IsValidPhoneNumber } from '@weats/common';

export class CreateEstablishmentDto {
  @Length(2, 50)
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: EstablishmentType;

  @Length(7, 100)
  @IsEmail()
  @IsNotEmpty()
  email: string;

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

  /** Número de telefone do cliente (sem indicativo, ex: "911111111") */
  @IsString()
  @IsNotEmpty()
  @IsValidPhoneNumber('countryCode')
  phoneNumber: string;

  /** Indicativo do país (ex: "351" para Portugal) */
  @IsString()
  @IsNotEmpty()
  @IsValidCountryCode()
  countryCode: string;

  @Length(3, 50)
  @IsString()
  @IsNotEmpty()
  billingName: string;

  @Length(9, 20)
  @IsString()
  @IsNotEmpty()
  billingTaxId: string;

  @IsEnum(EstablishmentLanguage)
  primaryLanguage: EstablishmentLanguage;

  @IsEnum(Currency)
  @IsNotEmpty()
  currency: Currency;

  @IsString()
  @IsNotEmpty()
  timezone: string;
}

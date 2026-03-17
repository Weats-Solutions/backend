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

export class CreateEstablishmentDto {
  @Length(2, 50)
  @IsString()
  name: string;

  @IsString()
  type: EstablishmentType;

  @Length(7, 100)
  @IsEmail()
  email: string;

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

  @Length(9, 20)
  @IsString()
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

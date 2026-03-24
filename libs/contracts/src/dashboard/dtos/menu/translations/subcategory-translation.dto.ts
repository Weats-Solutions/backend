import { EstablishmentLanguage } from '@weats/database';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SubcategoryTranslationDto {
  @IsString()
  @IsNotEmpty()
  locale: EstablishmentLanguage;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

import { EstablishmentLanguage } from '@weats/database';
import { IsString, IsNotEmpty } from 'class-validator';

export class CategoryTranslationDto {
  @IsString()
  @IsNotEmpty()
  locale: EstablishmentLanguage;

  @IsString()
  @IsNotEmpty()
  name: string;
}

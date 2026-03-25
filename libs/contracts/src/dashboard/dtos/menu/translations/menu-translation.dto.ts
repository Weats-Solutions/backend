import { EstablishmentLanguage } from '@weats/database';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class MenuTranslationDto {
  @IsString()
  @IsNotEmpty()
  locale: EstablishmentLanguage;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  observations?: string;
}

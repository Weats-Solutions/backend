import { IsString, IsEnum, IsBoolean, IsOptional, IsInt, Min, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { EstablishmentLanguage } from '@weats/database';


export class VariantGroupTranslationDto {
  @IsEnum(EstablishmentLanguage)
  name: EstablishmentLanguage;

  @IsString()
  locale: string;
}

export class CreateVariantGroupDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantGroupTranslationDto)
  translations: VariantGroupTranslationDto[];
}
import { IsString, IsEnum, IsBoolean, IsOptional, IsInt, Min, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { VariantType } from '@prisma/client';
import { VariantGroupTranslationDto } from './create-variant-group.dto';

export class UpdateVariantGroupDto {
  @IsString()
  name: string;

  @IsEnum(VariantType)
  type: VariantType;

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
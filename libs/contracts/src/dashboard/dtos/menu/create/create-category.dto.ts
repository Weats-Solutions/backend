import { ValidateNested, IsArray, IsOptional, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { CategoryTranslationDto } from '../translations/category-translation.dto';

export class CreateCategoryDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryTranslationDto)
  translations: CategoryTranslationDto[];

  @IsOptional()
  @IsString()
  imageId?: string | null;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}


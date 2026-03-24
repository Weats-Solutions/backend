import { ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { SubcategoryTranslationDto } from '../translations/subcategory-translation.dto';

export class CreateSubcategoryDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubcategoryTranslationDto)
  translations: SubcategoryTranslationDto[];
}

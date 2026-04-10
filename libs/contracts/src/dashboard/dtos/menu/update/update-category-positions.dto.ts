import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CategoryPosition {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsInt()
  @IsNotEmpty()
  position: number;
}

export class UpdateCategoryPositionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryPosition)
  positions: CategoryPosition[];
}

import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SubcategoryPosition {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsInt()
  @IsNotEmpty()
  position: number;
}

export class UpdateSubcategoryPositionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubcategoryPosition)
  positions: SubcategoryPosition[];
}

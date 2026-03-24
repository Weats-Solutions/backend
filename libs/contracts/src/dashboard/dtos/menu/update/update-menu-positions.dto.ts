import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class MenuPosition {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsInt()
  @IsNotEmpty()
  position: number;
}

export class UpdateMenuPositionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuPosition)
  positions: MenuPosition[];
}

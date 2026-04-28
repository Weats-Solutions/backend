import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

export class ItemMenuPlacementsDto {
  @IsString()
  menuId: string;

  @IsArray()
  @IsString({ each: true })
  subcategoryIds: string[];
}

export class UpdateItemPlacementsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subcategoryIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemMenuPlacementsDto)
  menus?: ItemMenuPlacementsDto[];
}

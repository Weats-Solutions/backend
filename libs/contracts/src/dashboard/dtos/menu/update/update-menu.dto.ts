import { MENU_COLOR_PALETTE } from '@weats/common';
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class UpdateMenuDto {
  @IsBoolean()
  @IsNotEmpty()
  isVisible: boolean;


  @IsString()
  @IsNotEmpty()
  @IsIn(MENU_COLOR_PALETTE, { message: 'Color must be one of the predefined palette colors' })
  color: string;

  @IsBoolean()
  @IsNotEmpty()
  isHighlighted: boolean;

  @IsBoolean()
  @IsNotEmpty()
  isVisibleOnMenuPage: boolean;
}

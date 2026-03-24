import { IsBoolean, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class UpdateMenuDto {
  @IsBoolean()
  @IsNotEmpty()
  isVisible: boolean;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsBoolean()
  @IsNotEmpty()
  isHighlighted: boolean;
}

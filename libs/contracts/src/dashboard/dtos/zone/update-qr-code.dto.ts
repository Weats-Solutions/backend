import { IsBoolean, IsArray, IsString, IsOptional } from 'class-validator';

export class UpdateQrCodeDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  requireOpenMenus?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  menuIds?: string[];
}

import { IsString, IsBoolean, IsInt, Min, IsOptional } from 'class-validator';

export class UpdateServiceZoneDto {
  @IsString()
  name: string;

  @IsBoolean()
  isActive: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number;
}

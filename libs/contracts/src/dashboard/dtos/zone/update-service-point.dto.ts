import { ServicePointType } from '@weats/database';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsBoolean,
  Max,
  IsNumber,
} from 'class-validator';

export class UpdateServicePointDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(ServicePointType)
  @IsOptional()
  type?: ServicePointType;

  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  maxCapacity?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  minCapacity?: number;

  @IsBoolean()
  @IsOptional()
  isReservable?: boolean;

  @IsBoolean()
  @IsOptional()
  isPriority?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  x?: number;

  @IsOptional()
  @IsNumber()
  y?: number;

  @IsOptional()
  @IsNumber()
  z?: number;

  @IsOptional()
  @IsNumber()
  rotation?: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsString()
  shape?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

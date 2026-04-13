import { ServicePointType } from '@prisma/client';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  IsBoolean,
  IsOptional,
  Max,
  IsNumber,
} from 'class-validator';

export class CreateServicePointDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(ServicePointType)
  type: ServicePointType;

  @IsInt()
  @Min(1)
  @Max(50)
  maxCapacity: number;

  @IsInt()
  @Min(1)
  minCapacity: number;

  @IsBoolean()
  isReservable: boolean;

  @IsBoolean()
  isPriority: boolean;

  @IsBoolean()
  isActive: boolean;

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

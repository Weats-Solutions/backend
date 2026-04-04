import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import type { Prisma } from '@weats/database';

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  issuerTaxId: string;

  @IsOptional()
  @IsString()
  customerTaxId?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsString()
  @IsNotEmpty()
  documentType: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsDateString()
  documentDate: string;

  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @IsNumber()
  totalAmount: number;

  @IsNumber()
  taxableBase: number;

  @IsNumber()
  taxAmount: number;

  @IsOptional()
  @IsString()
  atcud?: string;

  @IsOptional()
  @IsString()
  controlCode?: string;

  @IsOptional()
  @IsString()
  documentHash?: string;

  @IsOptional()
  @IsString()
  certificate?: string;

  @IsOptional()
  @IsObject()
  rawData?: Prisma.InputJsonValue;
}

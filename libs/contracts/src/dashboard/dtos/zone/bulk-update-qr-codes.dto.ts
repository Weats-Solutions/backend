import { IsArray, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateQrCodeDto } from './update-qr-code.dto';

export class BulkUpdateQrCodesDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @ValidateNested()
  @Type(() => UpdateQrCodeDto)
  data: UpdateQrCodeDto;
}

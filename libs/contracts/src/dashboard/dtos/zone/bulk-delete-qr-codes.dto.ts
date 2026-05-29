import { IsArray, IsString } from 'class-validator';

export class BulkDeleteQrCodesDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

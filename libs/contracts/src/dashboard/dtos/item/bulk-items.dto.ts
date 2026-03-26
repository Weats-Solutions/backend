import { IsArray, IsEnum, IsString } from 'class-validator';
import { ItemStatus } from '@weats/database';

export class BulkStatusDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @IsEnum(ItemStatus)
  status: ItemStatus;
}

export class BulkDeleteDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

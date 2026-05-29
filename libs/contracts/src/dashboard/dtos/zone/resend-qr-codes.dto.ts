import { IsArray, IsString, IsEmail, IsOptional } from 'class-validator';

export class ResendQrCodesDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @IsEmail()
  @IsOptional()
  recipientEmail?: string;
}

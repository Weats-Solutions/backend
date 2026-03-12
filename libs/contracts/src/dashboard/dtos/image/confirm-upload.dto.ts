import { IsArray, IsInt, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadedImageDataDto {
    @IsString()
    id: string;

    @IsString()
    fileName: string;

    @IsInt()
    fileSize: number;
}

export class ConfirmUploadsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UploadedImageDataDto)
    images: UploadedImageDataDto[];
}

import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateImageDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    fileName: string;
}

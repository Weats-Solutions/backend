import { IsInt, Max, Min } from 'class-validator';

export class GenerateUploadUrlsDto {
    @IsInt()
    @Min(1)
    @Max(10)
    count: number;
}

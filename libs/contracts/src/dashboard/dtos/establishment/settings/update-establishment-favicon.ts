import { IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class ImageObjectSchema {
    @IsString()
    id: string;

    @IsString()
    url: string;
}

export class UpdateEstablishmentFaviconDto {
    @Type(() => ImageObjectSchema)
    @ValidateNested()
    favicon: ImageObjectSchema;
}

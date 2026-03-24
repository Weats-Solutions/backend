import { Type } from "class-transformer";
import { IsOptional, IsString, ValidateNested } from "class-validator";

class ImageObjectSchema {
    @IsString()
    id: string;

    @IsString()
    url: string;
}

export class UpdateEstablishmentBrandingDto {
    @Type(() => ImageObjectSchema)
    @ValidateNested()
    @IsOptional()
    logoImage?: ImageObjectSchema;


    @Type(() => ImageObjectSchema)
    @ValidateNested()
    @IsOptional()
    bannerImage?: ImageObjectSchema;
}
import { IsString, IsNotEmpty, IsBoolean, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class AddonTranslationDto {
    @IsString()
    @IsNotEmpty()
    locale: string;

    @IsString()
    @IsNotEmpty()
    name: string;
}

export class CreateAddonDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AddonTranslationDto)
    translations: AddonTranslationDto[];
}

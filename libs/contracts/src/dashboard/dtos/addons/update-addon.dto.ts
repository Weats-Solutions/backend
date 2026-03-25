import { IsString, IsNotEmpty, IsBoolean, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { AddonTranslationDto } from './create-addon.dto';

export class UpdateAddonDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AddonTranslationDto)
    translations: AddonTranslationDto[];
}

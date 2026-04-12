import { IsString, IsNotEmpty, IsBoolean, IsOptional, ValidateNested, IsArray, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { UnitType, VariantType } from '@weats/database';
import { VariantOptionTranslationDto } from './create-variant-option.dto';


export class UpdateVariantOptionDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VariantOptionTranslationDto)
    translations: VariantOptionTranslationDto[];

    @IsEnum(VariantType)
    type: VariantType;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsNumber()
    quantity?: number;

    @IsOptional()
    @IsEnum(UnitType)
    unit?: UnitType;
}

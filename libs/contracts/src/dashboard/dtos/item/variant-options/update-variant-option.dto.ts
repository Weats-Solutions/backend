import { IsString, IsNotEmpty, IsBoolean, IsOptional, ValidateNested, IsArray, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { UnitType } from '@weats/database';
import { VariantOptionTranslationDto } from './create-variant-option.dto';


export class UpdateVariantOptionDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VariantOptionTranslationDto)
    translations: VariantOptionTranslationDto[];

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsNumber()
    quantity: number;

    @IsEnum(UnitType)
    unit: UnitType;
}

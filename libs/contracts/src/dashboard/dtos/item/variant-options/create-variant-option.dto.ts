import { IsString, IsNotEmpty, IsBoolean, IsOptional, ValidateNested, IsArray, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { EstablishmentLanguage, VariantType } from '@weats/database';

export class VariantOptionTranslationDto {
    @IsEnum(EstablishmentLanguage)
    locale: EstablishmentLanguage;

    @IsString()
    @IsNotEmpty()
    name: string;
}

export class CreateVariantOptionDto {
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
    @IsString()
    unit?: string;
}

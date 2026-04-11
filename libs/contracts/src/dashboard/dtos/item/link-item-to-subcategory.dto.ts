import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";

export class ItemToSubcategoryDto {
    @IsString()
    @IsNotEmpty()
    itemId: string;

    @IsBoolean()
    @IsOptional()
    isVisible?: boolean;

    @IsBoolean()
    @IsOptional()
    isIncluded?: boolean;
}

export class LinkItemToSubcategoryDto {
    @IsString()
    @IsNotEmpty()
    subcategoryId: string;


    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ItemToSubcategoryDto)
    items: ItemToSubcategoryDto[];
}
// src/items/dtos/item/create-item.dto.ts
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsNotEmpty,
  Min,
  Max
} from 'class-validator';
import { Type } from 'class-transformer';
import { EstablishmentLanguage, ItemStatus, MarketingTag, ModifierDisplayMode, SpiceLevel, UnitType } from '@weats/database';

// =======================================================
// DTO: A Variante Final (SKU) que vai ser gerada
// =======================================================

class AllergenDto {
  @IsString()
  id: string;

  @IsString()
  code: string;
}


export class NutrionalInfoDto {
  @IsNumber()
  energyKcal: number;

  @IsNumber()
  fat: number;

  @IsNumber()
  saturatedFat: number;

  @IsNumber()
  carbohydrates: number;

  @IsNumber()
  sugars: number;

  @IsNumber()
  fiber: number;

  @IsNumber()
  protein: number;

  @IsNumber()
  salt: number;
}

class CreateItemVariantDto {
  @IsString()
  variantOptionId: string; // Aponta para o Dicionário (Ex: ID de "Média")

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty({ message: 'Price is required' })
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  price: number;

  @IsOptional()
  @IsString()
  sku?: string; // O código de barras/inventário desta variante

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean; // Se for true, é o preço "Desde X€" que aparece na listagem

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @Type(() => NutrionalInfoDto)
  nutritionalInfo?: NutrionalInfoDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllergenDto)
  allergens?: AllergenDto[];

  @IsOptional()
  @IsString()
  imageId?: string; // Imagem específica para esta Variante (Ex: Lata de 33cl)
}

// =======================================================
// DTO: O Grupo de Variantes Local (O "Chassis")
// =======================================================

class ItemVariantGroupTranslationsDto {
  @IsString()
  name: string;

  @IsEnum(EstablishmentLanguage)
  locale: EstablishmentLanguage;
}

export class CreateItemVariantGroupDto {

  @IsOptional()
  @IsNumber()
  position?: number;

  // A propriedade 'required' foi APAGADA (são sempre obrigatórios)

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemVariantDto)
  options: CreateItemVariantDto[]; // As opções reais (Variantes) que vão ser ativadas

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemVariantGroupTranslationsDto)
  translations: ItemVariantGroupTranslationsDto[];
}

// =======================================================
// DTO: O Produto Principal
// =======================================================

class ItemTranslationsDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(EstablishmentLanguage)
  locale: EstablishmentLanguage;
}

export class CreateItemDto {
  @IsOptional()
  @IsString()
  imageId?: string;

  @IsOptional()
  @IsString()
  posCategoryId?: string;

  @IsOptional()
  @IsString()
  sku?: string; // SKU do item base (caso não tenha variantes)

  @IsEnum(UnitType)
  unit: UnitType;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Base price must be greater than or equal to 0' })
  @Max(999999, { message: 'Base price must be less than or equal to 999999' })
  basePrice?: number; // Só é preenchido se variantGroups for vazio!

  @IsEnum(ItemStatus)
  status: ItemStatus;

  @IsString()
  @IsNotEmpty({ message: 'Tax Table is required' })
  taxTableId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemTranslationsDto)
  translations: ItemTranslationsDto[];

  @IsOptional()
  @IsEnum(MarketingTag)
  marketingTag?: MarketingTag;

  @IsOptional()
  @IsEnum(SpiceLevel)
  spiceLevel?: SpiceLevel;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  hasAlcohol?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemVariantGroupDto)
  variantGroups?: CreateItemVariantGroupDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateModifierGroupDto)
  modifierGroups?: CreateModifierGroupDto[]; // IDs dos grupos de extras/cozinha

  @IsOptional()
  @Type(() => NutrionalInfoDto)
  nutritionalInfo?: NutrionalInfoDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllergenDto)
  allergens?: AllergenDto[];

}

class ModifierGroupTranslationsDto {
  @IsString()
  name: string;

  @IsEnum(EstablishmentLanguage)
  locale: EstablishmentLanguage;
}

export class CreateModifierGroupDto {

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsEnum(ModifierDisplayMode)
  displayMode?: ModifierDisplayMode;

  @IsOptional()
  @IsNumber()
  minSelection?: number;

  @IsOptional()
  @IsNumber()
  maxSelection?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemModifierOptionDto)
  options: ItemModifierOptionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModifierGroupTranslationsDto)
  translations: ModifierGroupTranslationsDto[];
}

class ItemModifierOptionDto {
  @IsString()
  @IsOptional()
  addonId?: string;

  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsOptional()
  itemVariantId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty({ message: 'Price is required' })
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  price: number;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsNumber()
  defaultQuantity?: number;

  @IsOptional()
  @IsNumber()
  minQuantity?: number;

  @IsOptional()
  @IsNumber()
  maxQuantity?: number;
}
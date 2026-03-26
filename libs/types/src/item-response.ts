// src/modules/item/types/item-response.types.ts
import { ItemStatus, MarketingTag, SpiceLevel, ModifierDisplayMode } from '@weats/database';

// ─── Shared Sub-types ──────────────────────────────────────────

export interface TranslationResponse {
    locale: string;
    name: string;
    description?: string;
}

export interface AllergenResponse {
    id: string;
    code: string;
}

export interface NutritionalInfoResponse {
    energyKcal?: number | null;
    fat?: number | null;
    saturatedFat?: number | null;
    carbohydrates?: number | null;
    sugars?: number | null;
    fiber?: number | null;
    protein?: number | null;
    salt?: number | null;
}

// ─── GET /items/:id ────────────────────────────────────────────

export interface ItemVariantDetailResponse {
    id: string;
    variantOptionId: string;
    price: number;
    sku: string | null;
    isDefault: boolean;
    isActive: boolean;
    position: number;
    imageId: string | null;
    image: { url: string } | null;
    allergens: AllergenResponse[];
    nutritionalInfo?: NutritionalInfoResponse;
    variantOption: {
        type: string;
        translations: TranslationResponse[];
    };
}

export interface ItemVariantGroupDetailResponse {
    id: string;
    position: number;
    translations: TranslationResponse[];
    variants: ItemVariantDetailResponse[];
}

export interface ModifierOptionDetailResponse {
    id: string;
    addonId: string | null;
    productId: string | null;
    itemVariantId: string | null;
    price: number | null;
    position: number;
    defaultQuantity: number;
    minQuantity: number;
    maxQuantity: number;
    addon: { translations: TranslationResponse[] } | null;
    product: { translations: TranslationResponse[] } | null;
    itemVariant: {
        variantOption: { translations: TranslationResponse[] };
        item: { translations: TranslationResponse[] };
    } | null;
}

export interface ModifierGroupDetailResponse {
    id: string;
    displayMode: ModifierDisplayMode;
    minSelection: number;
    maxSelection: number | null;
    position: number;
    translations: TranslationResponse[];
    options: ModifierOptionDetailResponse[];
}

export interface ItemDetailResponse {
    id: string;
    imageId: string | null;
    posCategoryId: string | null;
    basePrice: number | null;
    sku: string | null;
    status: ItemStatus;
    taxTableId: string;
    marketingTag: MarketingTag | null;
    spiceLevel: SpiceLevel | null;
    isFeatured: boolean;
    translations: TranslationResponse[];
    image: { url: string } | null;
    allergens: AllergenResponse[];
    nutritionalInfo?: NutritionalInfoResponse;
    itemVariantGroups: ItemVariantGroupDetailResponse[];
    modifierGroups: ModifierGroupDetailResponse[];
}

// ─── GET /items/establishment (lean listing) ───────────────────

export interface ItemListVariantOption {
    variantId: string;
    name: string;
    price: number;
    sku: string | null;
    isDefault: boolean;
    isActive: boolean;
    imageUrl?: string;
}

export interface ItemListVariantGroup {
    id: string;
    name: string;
    position: number;
    options: ItemListVariantOption[];
}

export interface ItemListModifierGroup {
    id: string;
    name: string;
    displayMode: ModifierDisplayMode;
    optionCount: number;
}

export interface ItemListResponse {
    id: string;
    name: string;
    description?: string;
    basePrice: number | null;
    sku: string | null;
    status: ItemStatus;
    taxTableId: string;
    marketingTag: MarketingTag | null;
    spiceLevel: SpiceLevel | null;
    isFeatured: boolean;
    imageId: string | null;
    imageUrl?: string;
    vendusProductId: number | null;
    variantGroups: ItemListVariantGroup[];
    modifierGroups: ItemListModifierGroup[];
}

export interface PaginatedItemsResponse {
    items: ItemListResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

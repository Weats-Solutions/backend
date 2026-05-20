// src/modules/item/types/item-response.types.ts
import { ItemStatus, MarketingTag, SpiceLevel, ModifierDisplayMode, Prisma, UnitType } from '@weats/database';

// ─── Shared Sub-types ──────────────────────────────────────────

/** Full include for single-item detail view (edit page). */
export const ITEM_DETAIL_INCLUDE = {
    translations: true,
    image: true,
    allergens: { include: { allergen: true } },
    nutritionInfo: true,
    itemVariantGroups: {
        include: {
            translations: true,
            variants: {
                include: {
                    variantOption: { include: { translations: true } },
                    image: true,
                    allergens: { include: { allergen: true } },
                    nutritionInfo: true,
                },
                orderBy: { position: 'asc' as const },
            },
        },
        orderBy: { position: 'asc' as const },
    },
    modifierGroups: {
        include: {
            translations: true,
            options: {
                include: {
                    addon: { include: { translations: true } },
                    product: { include: { translations: true } },
                    itemVariant: {
                        include: {
                            variantOption: { include: { translations: true } },
                            item: { include: { translations: true } },
                        },
                    },
                },
                orderBy: { position: 'asc' as const },
            },
        },
        orderBy: { position: 'asc' as const },
    },
} satisfies Prisma.ItemInclude;

/** Lean include for dashboard listing — no nutritionInfo/allergens on variants. */
export const ITEM_LIST_INCLUDE = {
    translations: true,
    image: true,
    itemVariantGroups: {
        include: {
            translations: true,
            variants: {
                include: {
                    variantOption: { include: { translations: true } },
                    image: true,
                },
                orderBy: { position: 'asc' as const },
            },
        },
        orderBy: { position: 'asc' as const },
    },
    modifierGroups: {
        include: {
            translations: true,
            options: true,
        },
        orderBy: { position: 'asc' as const },
    },
} satisfies Prisma.ItemInclude;


export type ItemWithDetailIncludes = Prisma.ItemGetPayload<{ include: typeof ITEM_DETAIL_INCLUDE }>;
export type ItemWithListIncludes = Prisma.ItemGetPayload<{ include: typeof ITEM_LIST_INCLUDE }>;


export interface TranslationResponse {
    locale: string;
    name: string;
    shortDescription?: string;
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

// ─── GET /items/:id — Complete response with translations ──────

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
    unit: UnitType;
    quantity: number;
    sku: string | null;
    status: ItemStatus;
    taxTableId: string;
    marketingTag: MarketingTag | null;
    spiceLevel: SpiceLevel | null;
    isFeatured: boolean;
    hasAlcohol: boolean;
    translations: TranslationResponse[];
    image: { url: string } | null;
    allergens: AllergenResponse[];
    nutritionalInfo?: NutritionalInfoResponse;
    itemVariantGroups: ItemVariantGroupDetailResponse[];
    modifierGroups: ModifierGroupDetailResponse[];
}

// ─── Translated Versions — Simplified root fields ───────────────

export interface TranslatedItemVariantDetailResponse {
    id: string;
    name: string;
    price: number;
    sku: string | null;
    isDefault: boolean;
    isActive: boolean;
    position: number;
    image: { url: string } | null;
}

export interface TranslatedItemVariantGroupDetailResponse {
    id: string;
    name: string;
    position: number;
    variants: TranslatedItemVariantDetailResponse[];
}

export interface TranslatedModifierOptionDetailResponse {
    id: string;
    name: string;
    price: number | null;
    position: number;
}

export interface TranslatedModifierGroupDetailResponse {
    id: string;
    name: string;
    displayMode: ModifierDisplayMode;
    minSelection: number;
    maxSelection: number | null;
    position: number;
    options: TranslatedModifierOptionDetailResponse[];
}

export interface TranslatedItemDetailResponse {
    id: string;
    name: string;
    shortDescription?: string;
    description?: string;
    image: { url: string } | null;
    basePrice: number | null;
    unit: UnitType;
    quantity: number;
    status: ItemStatus;
    marketingTag: MarketingTag | null;
    spiceLevel: SpiceLevel | null;
    isFeatured: boolean;
    hasAlcohol: boolean;
    itemVariantGroups: TranslatedItemVariantGroupDetailResponse[];
    modifierGroups: TranslatedModifierGroupDetailResponse[];
}

// ─── GET /items/establishment (listing) ────────────────────────

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
    shortDescription?: string;
    description?: string;
    basePrice: number | null;
    unit: UnitType;
    quantity: number;
    sku: string | null;
    status: ItemStatus;
    taxTableId: string;
    marketingTag: MarketingTag | null;
    spiceLevel: SpiceLevel | null;
    isFeatured: boolean;
    hasAlcohol: boolean;
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

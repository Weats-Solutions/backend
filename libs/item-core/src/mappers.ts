import {
    ItemDetailResponse,
    ItemListResponse,
    ItemWithDetailIncludes,
    ItemWithListIncludes,
    TranslatedItemDetailResponse
} from "@weats/types";

/** Internal helper to find primary or first translation */
function getTranslation(translations: any[], locale: string) {
    return translations.find(t => t.locale === locale) || translations[0];
}

/** 
 * Maps the full Prisma item to a detailed response WITH ALL TRANSLATIONS.
 * Used primarily for the Edit Item form where multi-language input is needed.
 */
export function mapItemDetailResponse(item: ItemWithDetailIncludes): ItemDetailResponse {
    return {
        id: item.id,
        imageId: item.imageId,
        posCategoryId: item.posCategoryId,
        basePrice: item.basePrice ? Number(item.basePrice) : null,
        sku: item.sku,
        unit: item.unit,
        quantity: item.quantity,
        status: item.status,
        taxTableId: item.taxTableId,
        marketingTag: item.marketingTag,
        spiceLevel: item.spiceLevel,
        isFeatured: item.isFeatured,
        hasAlcohol: item.hasAlcohol,
        translations: item.translations.map(t => ({
            locale: t.locale,
            name: t.name,
            shortDescription: t.shortDescription ?? undefined,
            description: t.description ?? undefined,
        })),
        image: item.image ? { url: item.image.url } : null,
        allergens: item.allergens.map(a => ({
            id: a.allergen.id,
            code: a.allergen.code,
        })),
        nutritionalInfo: item.nutritionInfo ?? undefined,
        itemVariantGroups: item.itemVariantGroups.map(vg => ({
            id: vg.id,
            position: vg.position,
            translations: vg.translations.map(t => ({
                locale: t.locale,
                name: t.name,
            })),
            variants: vg.variants.map(v => ({
                id: v.id,
                variantOptionId: v.variantOptionId,
                price: Number(v.price),
                sku: v.sku,
                isDefault: v.isDefault,
                isActive: v.isActive,
                position: v.position,
                imageId: v.imageId,
                image: v.image ? { url: v.image.url } : null,
                allergens: v.allergens.map(a => ({
                    id: a.allergen.id,
                    code: a.allergen.code,
                })),
                nutritionalInfo: v.nutritionInfo ?? undefined,
                variantOption: {
                    type: v.variantOption.type,
                    translations: v.variantOption.translations.map(t => ({
                        locale: t.locale,
                        name: t.name,
                    })),
                },
            })),
        })),
        modifierGroups: item.modifierGroups.map(mg => ({
            id: mg.id,
            displayMode: mg.displayMode,
            minSelection: mg.minSelection,
            maxSelection: mg.maxSelection,
            position: mg.position,
            translations: mg.translations.map(t => ({
                locale: t.locale,
                name: t.name,
            })),
            options: mg.options.map(opt => ({
                id: opt.id,
                addonId: opt.addonId,
                productId: opt.productId,
                itemVariantId: opt.itemVariantId,
                price: opt.price ? Number(opt.price) : null,
                position: opt.position,
                defaultQuantity: opt.defaultQuantity,
                minQuantity: opt.minQuantity,
                maxQuantity: opt.maxQuantity,
                addon: opt.addon
                    ? { translations: opt.addon.translations.map(t => ({ locale: t.locale, name: t.name })) }
                    : null,
                product: opt.product
                    ? { translations: opt.product.translations.map(t => ({ locale: t.locale, name: t.name })) }
                    : null,
                itemVariant: opt.itemVariant
                    ? {
                        variantOption: {
                            translations: opt.itemVariant.variantOption.translations.map(t => ({
                                locale: t.locale,
                                name: t.name,
                            })),
                        },
                        item: {
                            translations: opt.itemVariant.item.translations.map(t => ({
                                locale: t.locale,
                                name: t.name,
                            })),
                        },
                    }
                    : null,
            })),
        })),

    };
}

/**
 * Maps the full Prisma item to a SIMPLIFIED response for a SPECIFIC LOCALE.
 * Used for management lists where one primary language is enough.
 */
export function mapTranslatedItemDetailResponse(
    item: ItemWithDetailIncludes,
    primaryLanguage: string
): TranslatedItemDetailResponse {
    const itemTr = getTranslation(item.translations, primaryLanguage);

    return {
        id: item.id,
        name: itemTr?.name || 'Sem nome',
        shortDescription: itemTr?.shortDescription ?? undefined,
        description: itemTr?.description ?? undefined,
        image: item.image ? { url: item.image.url } : null,
        basePrice: item.basePrice ? Number(item.basePrice) : null,
        unit: item.unit,
        quantity: item.quantity,
        status: item.status,
        marketingTag: item.marketingTag,
        spiceLevel: item.spiceLevel,
        isFeatured: item.isFeatured,
        hasAlcohol: item.hasAlcohol,
        itemVariantGroups: item.itemVariantGroups.map(vg => {
            const vgTr = getTranslation(vg.translations, primaryLanguage);
            return {
                id: vg.id,
                name: vgTr?.name || 'Sem nome',
                position: vg.position,
                variants: vg.variants.map(v => {
                    const optTr = getTranslation(v.variantOption.translations, primaryLanguage);
                    return {
                        id: v.id,
                        name: optTr?.name || 'Sem nome',
                        price: Number(v.price),
                        sku: v.sku,
                        isDefault: v.isDefault,
                        isActive: v.isActive,
                        position: v.position,
                        image: v.image ? { url: v.image.url } : null,
                    };
                }),
            };
        }),
        modifierGroups: item.modifierGroups.map(mg => {
            const mgTr = getTranslation(mg.translations, primaryLanguage);
            return {
                id: mg.id,
                name: mgTr?.name || 'Sem nome',
                displayMode: mg.displayMode,
                minSelection: mg.minSelection,
                maxSelection: mg.maxSelection,
                position: mg.position,
                options: mg.options.map(opt => {
                    let optName = '';
                    if (opt.addon) optName = getTranslation(opt.addon.translations, primaryLanguage)?.name;
                    else if (opt.product) optName = getTranslation(opt.product.translations, primaryLanguage)?.name;
                    else if (opt.itemVariant) {
                        const vName = getTranslation(opt.itemVariant.variantOption.translations, primaryLanguage)?.name;
                        const iName = getTranslation(opt.itemVariant.item.translations, primaryLanguage)?.name;
                        optName = `${iName} - ${vName}`;
                    }

                    return {
                        id: opt.id,
                        name: optName || 'Sem nome',
                        price: opt.price ? Number(opt.price) : null,
                        position: opt.position,
                    };
                }),
            };
        }),

    };
}

/** Maps a Prisma item to a lean listing response for the general catalog. */
export function mapItemListResponse(
    item: ItemWithListIncludes & { vendusProductId?: number | null },
    primaryLanguage: string,
): ItemListResponse {
    const primaryTr = getTranslation(item.translations, primaryLanguage);

    return {
        id: item.id,
        name: primaryTr?.name || 'Sem nome',
        shortDescription: primaryTr?.shortDescription ?? undefined,
        description: primaryTr?.description ?? undefined,
        basePrice: item.basePrice ? Number(item.basePrice) : null,
        sku: item.sku,
        unit: item.unit,
        quantity: item.quantity,
        status: item.status,
        taxTableId: item.taxTableId,
        marketingTag: item.marketingTag,
        spiceLevel: item.spiceLevel,
        isFeatured: item.isFeatured,
        hasAlcohol: item.hasAlcohol,
        imageId: item.imageId,
        imageUrl: item.image?.url,
        vendusProductId: item.vendusProductId ?? null,
        variantGroups: item.itemVariantGroups.map(group => {
            const groupTr = getTranslation(group.translations, primaryLanguage);

            return {
                id: group.id,
                name: groupTr?.name || 'Sem nome',
                position: group.position,
                options: group.variants.map(variant => {
                    const optionTr = getTranslation(variant.variantOption.translations, primaryLanguage);

                    return {
                        variantId: variant.id,
                        name: optionTr?.name || 'Sem nome',
                        price: Number(variant.price),
                        sku: variant.sku,
                        isDefault: variant.isDefault,
                        isActive: variant.isActive,
                        imageUrl: variant.image?.url,
                    };
                }),
            };
        }),
        modifierGroups: item.modifierGroups.map(mg => {
            const mgTr = getTranslation(mg.translations, primaryLanguage);

            return {
                id: mg.id,
                name: mgTr?.name || 'Sem nome',
                displayMode: mg.displayMode,
                optionCount: mg.options.length,
            };
        }),

    };
}
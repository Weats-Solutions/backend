// ═══════════════════════════════════════════
// PRIVATE BUILDERS (DTO → Prisma data)
// ═══════════════════════════════════════════

import { CreateItemVariantGroupDto, CreateModifierGroupDto } from "@weats/contracts";

/**
 * Builds the Prisma `create` data for a single variant group and its variants.
 * Shared by createItem and updateItem.
 */
export function buildVariantGroupData(
    itemId: string,
    groupDto: CreateItemVariantGroupDto,
) {
    return {
        itemId,
        position: groupDto.position ?? 0,
        translations: {
            create: groupDto.translations.map(t => ({
                locale: t.locale,
                name: t.name,
            })),
        },
        variants: {
            create: groupDto.options.map(opt => ({
                itemId,
                variantOptionId: opt.variantOptionId,
                price: opt.price,
                sku: opt.sku || null,
                isDefault: opt.isDefault ?? false,
                isActive: opt.isActive ?? true,
                position: opt.position ?? 0,
                imageId: opt.imageId || null,
                nutritionInfo: opt.nutritionalInfo
                    ? { create: opt.nutritionalInfo }
                    : undefined,
                allergens: opt.allergens?.length
                    ? { create: opt.allergens.map(a => ({ allergenId: a.id })) }
                    : undefined,
            })),
        },
    };
}

/**
 * Builds the Prisma `create` data for a modifier group and its options.
 * Shared by createItem and updateItem.
 */
export function buildModifierGroupData(
    itemId: string,
    mgDto: CreateModifierGroupDto,
) {
    return {
        itemId,
        position: mgDto.position ?? 0,
        displayMode: mgDto.displayMode,
        minSelection: mgDto.minSelection ?? (mgDto.required ? 1 : 0),
        maxSelection: mgDto.maxSelection,
        translations: {
            create: mgDto.translations.map(t => ({
                locale: t.locale,
                name: t.name,
            })),
        },
        options: {
            create: mgDto.options.map(opt => ({
                addonId: opt.addonId || null,
                productId: opt.productId || null,
                itemVariantId: opt.itemVariantId || null,
                price: opt.price,
                position: opt.position ?? 0,
                defaultQuantity: opt.defaultQuantity ?? 0,
                minQuantity: opt.minQuantity ?? 0,
                maxQuantity: opt.maxQuantity ?? 1,
            })),
        },
    };
}
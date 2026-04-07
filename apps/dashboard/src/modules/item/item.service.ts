// src/modules/item/item.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { CorePrismaService } from '@weats/database';
import { CreateItemDto, CreateItemVariantGroupDto, CreateModifierGroupDto, UpdateItemDto, GetItemsQueryDto, ItemSortBy, SortOrder } from '@weats/contracts';
import { Establishment } from '@weats/types';
import type { Prisma } from '@weats/database';
import { ItemStatus } from '@weats/database';
import type {
    ItemDetailResponse,
    ItemListResponse,
    PaginatedItemsResponse,
} from '@weats/types';
import { BulkDeleteDto, BulkStatusDto } from '@weats/contracts';
import { clearMenuCacheAsync } from '@weats/common';

// ─── Prisma Include Configs ─────────────────────────────────────

/** Full include for single-item detail view (edit page). */
const ITEM_DETAIL_INCLUDE = {
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
const ITEM_LIST_INCLUDE = {
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

// ─── Helper types for Prisma results ────────────────────────────

type ItemWithDetailIncludes = Prisma.ItemGetPayload<{ include: typeof ITEM_DETAIL_INCLUDE }>;
type ItemWithListIncludes = Prisma.ItemGetPayload<{ include: typeof ITEM_LIST_INCLUDE }>;

@Injectable()
export class ItemService {
    constructor(private readonly prisma: CorePrismaService) { }

    private async getEstablishmentSlug(establishmentId: string) {
        const establishment = await this.prisma.establishment.findUnique({
            where: { id: establishmentId },
            select: { slug: true },
        });
        return establishment?.slug;
    }

    // ═══════════════════════════════════════════
    // PRIVATE BUILDERS (DTO → Prisma data)
    // ═══════════════════════════════════════════

    /**
     * Builds the Prisma `create` data for a single variant group and its variants.
     * Shared by createItem and updateItem.
     */
    private buildVariantGroupData(
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
    private buildModifierGroupData(
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

    // ═══════════════════════════════════════════
    // PRIVATE RESPONSE MAPPERS (Prisma → API)
    // ═══════════════════════════════════════════

    /** Maps the full Prisma item (with all includes) to a typed detail response. */
    private mapItemDetailResponse(item: ItemWithDetailIncludes): ItemDetailResponse {
        return {
            id: item.id,
            imageId: item.imageId,
            posCategoryId: item.posCategoryId,
            basePrice: item.basePrice ? Number(item.basePrice) : null,
            sku: item.sku,
            status: item.status,
            taxTableId: item.taxTableId,
            marketingTag: item.marketingTag,
            spiceLevel: item.spiceLevel,
            isFeatured: item.isFeatured,
            translations: item.translations.map(t => ({
                locale: t.locale,
                name: t.name,
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

    /** Maps a Prisma item to a lean listing response. */
    private mapItemListResponse(
        item: ItemWithListIncludes & { vendusProductId?: number | null },
        primaryLanguage: string,
    ): ItemListResponse {
        const primaryTr =
            item.translations.find(t => t.locale === primaryLanguage) ||
            item.translations[0];

        return {
            id: item.id,
            name: primaryTr?.name || 'Sem nome',
            description: primaryTr?.description ?? undefined,
            basePrice: item.basePrice ? Number(item.basePrice) : null,
            sku: item.sku,
            status: item.status,
            taxTableId: item.taxTableId,
            marketingTag: item.marketingTag,
            spiceLevel: item.spiceLevel,
            isFeatured: item.isFeatured,
            imageId: item.imageId,
            imageUrl: item.image?.url,
            vendusProductId: item.vendusProductId ?? null,
            variantGroups: item.itemVariantGroups.map(group => {
                const groupTr =
                    group.translations.find(t => t.locale === primaryLanguage) ||
                    group.translations[0];

                return {
                    id: group.id,
                    name: groupTr?.name || 'Sem nome',
                    position: group.position,
                    options: group.variants.map(variant => {
                        const optionTr =
                            variant.variantOption.translations.find(
                                t => t.locale === primaryLanguage,
                            ) || variant.variantOption.translations[0];

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
                const mgTr =
                    mg.translations.find(t => t.locale === primaryLanguage) ||
                    mg.translations[0];

                return {
                    id: mg.id,
                    name: mgTr?.name || 'Sem nome',
                    displayMode: mg.displayMode,
                    optionCount: mg.options.length,
                };
            }),
        };
    }

    // ═══════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════

    async createItem(establishmentId: string, dto: CreateItemDto) {
        const slug = await this.getEstablishmentSlug(establishmentId);
        const item = await this.prisma.$transaction(async tx => {
            const hasVariants = (dto.variantGroups?.length ?? 0) > 0;

            // 1. Create base item
            const item = await tx.item.create({
                data: {
                    establishmentId,
                    imageId: dto.imageId || null,
                    posCategoryId: dto.posCategoryId || null,
                    basePrice: hasVariants ? null : dto.basePrice,
                    sku: hasVariants ? null : (dto.sku || null),
                    taxTableId: dto.taxTableId,
                    status: dto.status,
                    marketingTag: dto.marketingTag || null,
                    spiceLevel: dto.spiceLevel || null,
                    isFeatured: dto.isFeatured ?? false,
                    translations: {
                        create: dto.translations.map(t => ({
                            locale: t.locale,
                            name: t.name,
                            shortDescription: t.shortDescription,
                            description: t.description,
                        })),
                    },
                    nutritionInfo:
                        dto.nutritionalInfo && !hasVariants
                            ? { create: dto.nutritionalInfo }
                            : undefined,
                    allergens:
                        dto.allergens?.length && !hasVariants
                            ? { create: dto.allergens.map(a => ({ allergenId: a.id })) }
                            : undefined,
                },
            });

            // 2. Create variant group (max 1 per item)
            if (dto.variantGroups?.length) {
                await tx.itemVariantGroup.create({
                    data: this.buildVariantGroupData(item.id, dto.variantGroups[0]),
                });
            }

            // 3. Create modifier groups
            if (dto.modifierGroups?.length) {
                for (const mgDto of dto.modifierGroups) {
                    await tx.itemModifierGroup.create({
                        data: this.buildModifierGroupData(item.id, mgDto),
                    });
                }
            }

            return item;
        });
        clearMenuCacheAsync(slug);
        return item;
    }

    async updateItem(id: string, establishmentId: string, dto: UpdateItemDto) {
        const slug = await this.getEstablishmentSlug(establishmentId);
        const existing = await this.prisma.item.findUnique({
            where: { id, establishmentId },
        });
        if (!existing) {
            throw new NotFoundException(
                'Item not found or does not belong to this establishment',
            );
        }

        const item = await this.prisma.$transaction(async tx => {
            // 1. Delete existing related data (cascade-safe order)
            await tx.itemTranslation.deleteMany({ where: { itemId: id } });
            await tx.itemAllergen.deleteMany({ where: { itemId: id } });
            await tx.itemNutritionInfo.deleteMany({ where: { itemId: id } });

            const existingVariants = await tx.itemVariant.findMany({
                where: { itemId: id },
                select: { id: true },
            });
            if (existingVariants.length > 0) {
                await tx.variantNutrionalInfo.deleteMany({
                    where: {
                        itemVariantId: { in: existingVariants.map(v => v.id) },
                    },
                });
            }

            await tx.itemVariantGroup.deleteMany({ where: { itemId: id } });
            await tx.itemModifierGroup.deleteMany({ where: { itemId: id } });

            const hasVariants = (dto.variantGroups?.length ?? 0) > 0;

            // 2. Update base item
            const item = await tx.item.update({
                where: { id },
                data: {
                    imageId: dto.imageId !== undefined ? dto.imageId : existing.imageId,
                    posCategoryId:
                        dto.posCategoryId !== undefined
                            ? dto.posCategoryId
                            : existing.posCategoryId,
                    basePrice: hasVariants
                        ? null
                        : dto.basePrice !== undefined
                            ? dto.basePrice
                            : existing.basePrice,
                    sku: hasVariants
                        ? null
                        : dto.sku !== undefined
                            ? dto.sku
                            : existing.sku,
                    taxTableId:
                        dto.taxTableId !== undefined
                            ? dto.taxTableId
                            : existing.taxTableId,
                    status:
                        dto.status !== undefined ? dto.status : existing.status,
                    marketingTag:
                        dto.marketingTag !== undefined
                            ? dto.marketingTag
                            : existing.marketingTag,
                    spiceLevel:
                        dto.spiceLevel !== undefined
                            ? dto.spiceLevel
                            : existing.spiceLevel,
                    isFeatured:
                        dto.isFeatured !== undefined
                            ? dto.isFeatured
                            : existing.isFeatured,
                    translations: dto.translations
                        ? {
                            create: dto.translations.map(t => ({
                                locale: t.locale,
                                name: t.name,
                                shortDescription: t.shortDescription,
                                description: t.description,
                            })),
                        }
                        : undefined,
                    nutritionInfo:
                        dto.nutritionalInfo && !hasVariants
                            ? { create: dto.nutritionalInfo }
                            : undefined,
                    allergens:
                        dto.allergens?.length && !hasVariants
                            ? { create: dto.allergens.map(a => ({ allergenId: a.id })) }
                            : undefined,
                },
            });

            // 3. Recreate variant group
            if (dto.variantGroups?.length) {
                await tx.itemVariantGroup.create({
                    data: this.buildVariantGroupData(item.id, dto.variantGroups[0]),
                });
            }

            // 4. Recreate modifier groups
            if (dto.modifierGroups?.length) {
                for (const mgDto of dto.modifierGroups) {
                    await tx.itemModifierGroup.create({
                        data: this.buildModifierGroupData(item.id, mgDto),
                    });
                }
            }

            return item;
        });
        clearMenuCacheAsync(slug);
        return item;
    }

    async getItemById(id: string): Promise<ItemDetailResponse> {
        const item = await this.prisma.item.findUnique({
            where: { id },
            include: ITEM_DETAIL_INCLUDE,
        });

        if (!item) throw new NotFoundException('Item not found');
        return this.mapItemDetailResponse(item);
    }

    async getItemsForDashboard(
        establishment: Establishment,
        query: GetItemsQueryDto,
    ): Promise<PaginatedItemsResponse> {
        const {
            page = 1,
            limit = 20,
            search,
            status,
            isFeatured,
            marketingTag,
            spiceLevel,
            hasVariants,
            sortBy = ItemSortBy.CREATED_AT,
            sortOrder = SortOrder.DESC,
        } = query;

        const skip = (page - 1) * limit;

        // ── Build where clause ────────────────────────────────────
        const where: Prisma.ItemWhereInput = {
            establishmentId: establishment.id,
            deletedAt: null,
            ...(status && { status }),
            ...(isFeatured !== undefined && { isFeatured }),
            ...(marketingTag && { marketingTag }),
            ...(spiceLevel && { spiceLevel }),
            ...(search && {
                OR: [
                    { translations: { some: { name: { contains: search, mode: 'insensitive' } } } },
                    { sku: { contains: search, mode: 'insensitive' } },
                ],
            }),
            ...(hasVariants !== undefined && {
                itemVariantGroups: hasVariants ? { some: {} } : { none: {} },
            }),
        };

        // ── Build orderBy ─────────────────────────────────────────
        const orderByMap: Record<ItemSortBy, Prisma.ItemOrderByWithRelationInput> = {
            [ItemSortBy.CREATED_AT]: { createdAt: sortOrder },
            [ItemSortBy.UPDATED_AT]: { updatedAt: sortOrder },
            [ItemSortBy.STATUS]: { status: sortOrder },
            [ItemSortBy.PRICE]: { basePrice: sortOrder },
            [ItemSortBy.NAME]: {
                translations: { _count: sortOrder },
            },
        };

        // ── Parallel count + fetch ────────────────────────────────
        const [total, items] = await this.prisma.$transaction([
            this.prisma.item.count({ where }),
            this.prisma.item.findMany({
                where,
                include: ITEM_LIST_INCLUDE,
                orderBy: orderByMap[sortBy] ?? { createdAt: sortOrder },
                skip,
                take: limit,
            }),
        ]);

        return {
            items: items.map(item =>
                this.mapItemListResponse(item, establishment.primaryLanguage),
            ),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getAllergens() {
        return this.prisma.allergen.findMany({
            select: { id: true, code: true },
        });
    }

    async getTaxTables() {
        return this.prisma.taxTable.findMany({
            select: {
                id: true,
                countryCode: true,
                region: true,
                name: true,
                rate: true,
                fiscalCode: true,
            },
        });
    }

    // ═══════════════════════════════════════════
    // DELETE / DUPLICATE / BULK
    // ═══════════════════════════════════════════

    async deleteItem(itemId: string, establishmentId: string): Promise<void> {
        const slug = await this.getEstablishmentSlug(establishmentId);
        const item = await this.prisma.item.findFirst({
            where: { id: itemId, establishmentId, deletedAt: null },
        });
        if (!item) throw new NotFoundException('Item not found or does not belong to this establishment');
        await this.prisma.item.update({
            where: { id: itemId },
            data: { deletedAt: new Date() },
        });
        clearMenuCacheAsync(slug);
    }

    async duplicateItem(itemId: string, establishment: Establishment): Promise<ItemListResponse> {
        const source = await this.prisma.item.findFirst({
            where: { id: itemId, establishmentId: establishment.id, deletedAt: null },
            include: ITEM_DETAIL_INCLUDE,
        });
        if (!source) throw new NotFoundException('Item not found or does not belong to this establishment');

        const hasVariants = source.itemVariantGroups.length > 0;

        const newItem = await this.prisma.$transaction(async tx => {
            // 1. Create base item (DRAFT by default)
            const created = await tx.item.create({
                data: {
                    establishmentId: establishment.id,
                    imageId: source.imageId,
                    posCategoryId: source.posCategoryId,
                    basePrice: source.basePrice,
                    sku: source.sku ? `${source.sku}-copy` : null,
                    taxTableId: source.taxTableId,
                    status: ItemStatus.DRAFT,
                    marketingTag: source.marketingTag,
                    spiceLevel: source.spiceLevel,
                    isFeatured: false,
                    translations: {
                        create: source.translations.map(t => ({
                            locale: t.locale,
                            name: `${t.name} (Cópia)`,
                            description: t.description,
                        })),
                    },
                    nutritionInfo:
                        source.nutritionInfo && !hasVariants
                            ? {
                                create: {
                                    energyKcal: source.nutritionInfo.energyKcal,
                                    fat: source.nutritionInfo.fat,
                                    saturatedFat: source.nutritionInfo.saturatedFat,
                                    carbohydrates: source.nutritionInfo.carbohydrates,
                                    sugars: source.nutritionInfo.sugars,
                                    fiber: source.nutritionInfo.fiber,
                                    protein: source.nutritionInfo.protein,
                                    salt: source.nutritionInfo.salt,
                                },
                            }
                            : undefined,
                    allergens:
                        source.allergens?.length && !hasVariants
                            ? { create: source.allergens.map(a => ({ allergenId: a.allergenId })) }
                            : undefined,
                },
            });

            // 2. Variant groups — batch all creates in parallel
            await Promise.all(source.itemVariantGroups.map(vg =>
                tx.itemVariantGroup.create({
                    data: {
                        itemId: created.id,
                        position: vg.position,
                        translations: {
                            create: vg.translations.map(t => ({ locale: t.locale, name: t.name })),
                        },
                        variants: {
                            create: vg.variants.map(v => ({
                                itemId: created.id,
                                variantOptionId: v.variantOptionId,
                                price: v.price,
                                sku: v.sku ? `${v.sku}-copy` : null,
                                isDefault: v.isDefault,
                                position: v.position,
                                imageId: v.imageId,
                                nutritionInfo: v.nutritionInfo
                                    ? { create: { ...v.nutritionInfo, id: undefined, itemVariantId: undefined } }
                                    : undefined,
                                allergens: v.allergens?.length
                                    ? { create: v.allergens.map(a => ({ allergenId: a.allergenId })) }
                                    : undefined,
                            })),
                        },
                    },
                }),
            ));

            // 3. Modifier groups — batch all creates in parallel
            await Promise.all(source.modifierGroups.map(mg =>
                tx.itemModifierGroup.create({
                    data: {
                        itemId: created.id,
                        position: mg.position,
                        displayMode: mg.displayMode,
                        minSelection: mg.minSelection,
                        maxSelection: mg.maxSelection,
                        translations: {
                            create: mg.translations.map(t => ({ locale: t.locale, name: t.name })),
                        },
                        options: {
                            create: mg.options.map(opt => ({
                                addonId: opt.addonId,
                                productId: opt.productId,
                                itemVariantId: opt.itemVariantId,
                                price: opt.price,
                                position: opt.position,
                                defaultQuantity: opt.defaultQuantity,
                                minQuantity: opt.minQuantity,
                                maxQuantity: opt.maxQuantity,
                            })),
                        },
                    },
                }),
            ));

            return created;
        });

        // Build the list response directly from in-memory source data — no extra DB query
        const primaryTr =
            source.translations.find(t => t.locale === establishment.primaryLanguage) || source.translations[0];

        clearMenuCacheAsync(establishment.slug);
        return {
            id: newItem.id,
            name: primaryTr ? `${primaryTr.name} (Cópia)` : 'Sem nome',
            description: primaryTr?.description ?? undefined,
            basePrice: source.basePrice ? Number(source.basePrice) : null,
            sku: source.sku ? `${source.sku}-copy` : null,
            status: ItemStatus.DRAFT,
            taxTableId: source.taxTableId,
            marketingTag: source.marketingTag,
            spiceLevel: source.spiceLevel,
            isFeatured: false,
            imageId: source.imageId,
            imageUrl: source.image?.url,
            vendusProductId: null,
            variantGroups: source.itemVariantGroups.map(vg => {
                const groupTr =
                    vg.translations.find(t => t.locale === establishment.primaryLanguage) || vg.translations[0];
                return {
                    id: vg.id, // note: this is the source group id, but the list only needs display data
                    name: groupTr?.name || 'Sem nome',
                    position: vg.position,
                    options: vg.variants.map(v => {
                        const optTr =
                            v.variantOption.translations.find(t => t.locale === establishment.primaryLanguage) ||
                            v.variantOption.translations[0];
                        return {
                            variantId: v.id,
                            name: optTr?.name || 'Sem nome',
                            price: Number(v.price),
                            sku: v.sku ? `${v.sku}-copy` : null,
                            isDefault: v.isDefault,
                            isActive: v.isActive,
                            imageUrl: v.image?.url,
                        };
                    }),
                };
            }),
            modifierGroups: source.modifierGroups.map(mg => {
                const mgTr =
                    mg.translations.find(t => t.locale === establishment.primaryLanguage) || mg.translations[0];
                return {
                    id: mg.id,
                    name: mgTr?.name || 'Sem nome',
                    displayMode: mg.displayMode,
                    optionCount: mg.options.length,
                };
            }),
        };
    }

    async bulkUpdateStatus(bulkStatusDto: BulkStatusDto, establishmentId: string) {
        const slug = await this.getEstablishmentSlug(establishmentId);
        const result = await this.prisma.item.updateMany({
            where: { id: { in: bulkStatusDto.ids }, establishmentId, deletedAt: null },
            data: { status: bulkStatusDto.status },
        });
        clearMenuCacheAsync(slug);
        return { updated: result.count };
    }

    async bulkDelete(bulkDeleteDto: BulkDeleteDto, establishmentId: string) {
        const slug = await this.getEstablishmentSlug(establishmentId);
        const result = await this.prisma.item.updateMany({
            where: { id: { in: bulkDeleteDto.ids }, establishmentId, deletedAt: null },
            data: { deletedAt: new Date() },
        });
        clearMenuCacheAsync(slug);
        return { deleted: result.count };
    }
}

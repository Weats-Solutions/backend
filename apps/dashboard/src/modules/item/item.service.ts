// src/modules/item/item.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { CorePrismaService } from '@weats/database';
import {
    CreateItemDto,
    UpdateItemDto,
    GetItemsQueryDto,
    ItemSortBy,
    SortOrder,
    BulkDeleteDto,
    BulkStatusDto
} from '@weats/contracts';
import {
    Establishment,
    ITEM_DETAIL_INCLUDE,
    ITEM_LIST_INCLUDE,
    ItemDetailResponse,
    ItemListResponse,
    ItemWithDetailIncludes,
    PaginatedItemsResponse
} from '@weats/types';
import type { Prisma } from '@weats/database';
import { ItemStatus } from '@weats/database';
import { clearMenuCacheAsync, ERRORS } from '@weats/common';
import { MenuUtilsService } from '@weats/common/utils/modules/menu/menu-utils.service';
import { RpcException } from '@nestjs/microservices';
import {
    buildModifierGroupData,
    buildVariantGroupData,
    mapItemDetailResponse,
    mapItemListResponse
} from '@weats/item-core';

@Injectable()
export class ItemService {
    constructor(
        private readonly prisma: CorePrismaService,
        private readonly menuUtilsService: MenuUtilsService
    ) { }

    private async getEstablishmentSlug(establishmentId: string) {
        const establishment = await this.prisma.establishment.findUnique({
            where: { id: establishmentId },
            select: { slug: true },
        });
        return establishment?.slug;
    }

    // ═══════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════

    async createItem(establishmentId: string, dto: CreateItemDto) {
        const slug = await this.getEstablishmentSlug(establishmentId);
        const item = await this.prisma.$transaction(async tx => {
            const hasVariants = (dto.variantGroups?.length ?? 0) > 0;

            const created = await tx.item.create({
                data: {
                    establishmentId,
                    imageId: dto.imageId || null,
                    posCategoryId: dto.posCategoryId || null,
                    basePrice: hasVariants ? null : dto.basePrice,
                    unit: dto.unit,
                    quantity: dto.quantity,
                    sku: hasVariants ? null : (dto.sku || null),
                    taxTableId: dto.taxTableId,
                    status: dto.status,
                    marketingTag: dto.marketingTag || null,
                    spiceLevel: dto.spiceLevel || null,
                    isFeatured: dto.isFeatured ?? false,
                    hasAlcohol: dto.hasAlcohol ?? false,
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

            if (dto.variantGroups?.length) {
                await tx.itemVariantGroup.create({
                    data: buildVariantGroupData(created.id, dto.variantGroups[0]),
                });
            }

            if (dto.modifierGroups?.length) {
                for (const mgDto of dto.modifierGroups) {
                    await tx.itemModifierGroup.create({
                        data: buildModifierGroupData(created.id, mgDto),
                    });
                }
            }

            return created;
        });
        clearMenuCacheAsync(slug);
        return item;
    }

    async updateItem(id: string, establishment: Establishment, dto: UpdateItemDto) {
        const existing = await this.prisma.item.findUnique({
            where: { id, establishmentId: establishment.id },
            include: {
                menuItemPositions: {
                    select: {
                        subcategory: {
                            select: {
                                category: { select: { menuId: true } }
                            }
                        }
                    }
                },
                itemModifierOptions: {
                    select: {
                        group: {
                            select: {
                                item: {
                                    select: {
                                        menuItemPositions: {
                                            select: {
                                                subcategory: {
                                                    select: {
                                                        category: { select: { menuId: true } }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!existing) throw new RpcException({ message: ERRORS.ITEM_NOT_FOUND, code: 404 });

        let menuId;
        if (existing.menuItemPositions && existing.menuItemPositions.length > 0) {
            menuId = existing.menuItemPositions[0]?.subcategory?.category?.menuId;
        } else if (existing.itemModifierOptions && existing.itemModifierOptions.length > 0) {
            menuId = existing.itemModifierOptions[0]?.group?.item?.menuItemPositions?.[0]?.subcategory?.category?.menuId;
        }

        const item = await this.prisma.$transaction(async tx => {
            await tx.itemTranslation.deleteMany({ where: { itemId: id } });
            await tx.itemAllergen.deleteMany({ where: { itemId: id } });
            await tx.itemNutritionInfo.deleteMany({ where: { itemId: id } });

            const variants = await tx.itemVariant.findMany({ where: { itemId: id }, select: { id: true } });
            if (variants.length > 0) {
                await tx.variantNutrionalInfo.deleteMany({ where: { itemVariantId: { in: variants.map(v => v.id) } } });
            }

            await tx.itemVariantGroup.deleteMany({ where: { itemId: id } });
            await tx.itemModifierGroup.deleteMany({ where: { itemId: id } });

            const hasVariants = (dto.variantGroups?.length ?? 0) > 0;

            const updated = await tx.item.update({
                where: { id },
                data: {
                    imageId: dto.imageId ?? null,
                    posCategoryId: dto.posCategoryId !== undefined ? dto.posCategoryId : existing.posCategoryId,
                    basePrice: hasVariants ? null : (dto.basePrice !== undefined ? dto.basePrice : existing.basePrice),
                    unit: dto.unit,
                    quantity: dto.quantity,
                    sku: hasVariants ? null : (dto.sku !== undefined ? dto.sku : existing.sku),
                    taxTableId: dto.taxTableId !== undefined ? dto.taxTableId : existing.taxTableId,
                    status: dto.status !== undefined ? dto.status : existing.status,
                    marketingTag: dto.marketingTag !== undefined ? dto.marketingTag : null,
                    spiceLevel: dto.spiceLevel !== undefined ? dto.spiceLevel : null,
                    isFeatured: dto.isFeatured !== undefined ? dto.isFeatured : false,
                    hasAlcohol: dto.hasAlcohol !== undefined ? dto.hasAlcohol : false,
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
                    nutritionInfo: dto.nutritionalInfo && !hasVariants ? { create: dto.nutritionalInfo } : undefined,
                    allergens: dto.allergens?.length && !hasVariants ? { create: dto.allergens.map(a => ({ allergenId: a.id })) } : undefined,
                },
            });

            if (dto.variantGroups?.length) {
                await tx.itemVariantGroup.create({
                    data: buildVariantGroupData(updated.id, dto.variantGroups[0]),
                });
            }

            if (dto.modifierGroups?.length) {
                for (const mgDto of dto.modifierGroups) {
                    await tx.itemModifierGroup.create({
                        data: buildModifierGroupData(updated.id, mgDto),
                    });
                }
            }

            return updated;
        });

        this.menuUtilsService.clearMenuCacheAsync('menus', establishment.slug, menuId);
        return item;
    }

    async getItemById(id: string): Promise<ItemDetailResponse> {
        const item = await this.prisma.item.findUnique({
            where: { id },
            include: ITEM_DETAIL_INCLUDE,
        }) as ItemWithDetailIncludes | null;

        if (!item) throw new RpcException({ status: 404, message: ERRORS.ITEM_NOT_FOUND });
        return mapItemDetailResponse(item);
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
                    { translations: { some: { shortDescription: { contains: search, mode: 'insensitive' } } } },
                    { translations: { some: { description: { contains: search, mode: 'insensitive' } } } },
                    { sku: { contains: search, mode: 'insensitive' } },
                ],
            }),
            ...(hasVariants !== undefined && {
                itemVariantGroups: hasVariants ? { some: {} } : { none: {} },
            }),
        };

        const orderByMap: Record<ItemSortBy, Prisma.ItemOrderByWithRelationInput> = {
            [ItemSortBy.CREATED_AT]: { createdAt: sortOrder },
            [ItemSortBy.UPDATED_AT]: { updatedAt: sortOrder },
            [ItemSortBy.STATUS]: { status: sortOrder },
            [ItemSortBy.PRICE]: { basePrice: sortOrder },
            [ItemSortBy.NAME]: { translations: { _count: sortOrder } },
        };

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
            items: items.map(item => mapItemListResponse(item, establishment.primaryLanguage)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async deleteItem(itemId: string, establishmentId: string) {
        const slug = await this.getEstablishmentSlug(establishmentId);
        const item = await this.prisma.item.findFirst({
            where: { id: itemId, establishmentId, deletedAt: null },
        });
        if (!item) throw new RpcException({ message: ERRORS.ITEM_NOT_FOUND, code: 404 });
        await this.prisma.item.update({
            where: { id: itemId },
            data: { deletedAt: new Date() },
        });
        clearMenuCacheAsync(slug);
        return { success: true };
    }

    async duplicateItem(itemId: string, establishment: Establishment): Promise<ItemListResponse> {
        const source = await this.prisma.item.findFirst({
            where: { id: itemId, establishmentId: establishment.id, deletedAt: null },
            include: ITEM_DETAIL_INCLUDE,
        });
        if (!source) throw new RpcException({ message: ERRORS.ITEM_NOT_FOUND, code: 404 });

        const hasVariants = source.itemVariantGroups.length > 0;

        const newItem = await this.prisma.$transaction(async tx => {
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
                    nutritionInfo: source.nutritionInfo && !hasVariants ? { create: { ...source.nutritionInfo, id: undefined } } : undefined,
                    allergens: source.allergens?.length && !hasVariants ? { create: source.allergens.map(a => ({ allergenId: a.allergenId })) } : undefined,
                },
            });

            for (const vg of source.itemVariantGroups) {
                await tx.itemVariantGroup.create({
                    data: {
                        itemId: created.id,
                        position: vg.position,
                        translations: { create: vg.translations.map(t => ({ locale: t.locale, name: t.name })) },
                        variants: {
                            create: vg.variants.map(v => ({
                                itemId: created.id,
                                variantOptionId: v.variantOptionId,
                                price: v.price,
                                sku: v.sku ? `${v.sku}-copy` : null,
                                isDefault: v.isDefault,
                                position: v.position,
                                imageId: v.imageId,
                                nutritionInfo: v.nutritionInfo ? { create: { ...v.nutritionInfo, id: undefined, itemVariantId: undefined } } : undefined,
                                allergens: v.allergens?.length ? { create: v.allergens.map(a => ({ allergenId: a.allergenId })) } : undefined,
                            })),
                        },
                    },
                });
            }

            for (const mg of source.modifierGroups) {
                await tx.itemModifierGroup.create({
                    data: {
                        itemId: created.id,
                        position: mg.position,
                        displayMode: mg.displayMode,
                        minSelection: mg.minSelection,
                        maxSelection: mg.maxSelection,
                        translations: { create: mg.translations.map(t => ({ locale: t.locale, name: t.name })) },
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
                });
            }

            return created;
        });

        clearMenuCacheAsync(establishment.slug);

        // Return lean response
        const refreshed = await this.prisma.item.findUnique({
            where: { id: newItem.id },
            include: ITEM_LIST_INCLUDE
        });
        return mapItemListResponse(refreshed as any, establishment.primaryLanguage);
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

    async getAllergens() {
        return this.prisma.allergen.findMany({ select: { id: true, code: true } });
    }

    async getTaxTables() {
        return this.prisma.taxTable.findMany({
            select: { id: true, countryCode: true, region: true, name: true, rate: true, fiscalCode: true },
        });
    }
}

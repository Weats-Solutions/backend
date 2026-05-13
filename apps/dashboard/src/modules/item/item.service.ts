// src/modules/item/item.service.ts
import { Injectable } from '@nestjs/common';
import { CorePrismaService } from '@weats/database';
import {
  CreateItemDto,
  UpdateItemDto,
  GetItemsQueryDto,
  ItemSortBy,
  SortOrder,
  BulkDeleteDto,
  BulkStatusDto,
} from '@weats/contracts';
import {
  Establishment,
  ITEM_DETAIL_INCLUDE,
  ITEM_LIST_INCLUDE,
  ItemDetailResponse,
  ItemListResponse,
  ItemWithDetailIncludes,
  PaginatedItemsResponse,
} from '@weats/types';
import type { Prisma } from '@weats/database';
import { ItemStatus } from '@weats/database';
import { ERRORS } from '@weats/common';
import { CacheService } from '@weats/cache';
import { RpcException } from '@nestjs/microservices';
import {
  buildModifierGroupData,
  buildVariantGroupData,
  mapItemDetailResponse,
  mapItemListResponse,
} from '@weats/item-core';

@Injectable()
export class ItemService {
  constructor(
    private readonly prisma: CorePrismaService,
    private readonly cacheService: CacheService,
  ) {}

  private async getEstablishmentSlug(establishmentId: string) {
    const establishment = await this.prisma.establishment.findUnique({
      where: { id: establishmentId },
      select: { slug: true },
    });
    return establishment?.slug;
  }

  private async assertItemBelongsToEstablishment(
    itemId: string,
    establishmentId: string,
  ) {
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, establishmentId, deletedAt: null },
      select: { id: true },
    });
    if (!item)
      throw new RpcException({ message: ERRORS.ITEM_NOT_FOUND, code: 404 });
  }

  /**
   * Finds all menu IDs that contain this item, either directly or as a modifier.
   */
  private async getAffectedMenuIds(itemId: string): Promise<string[]> {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      select: {
        menuItemPositions: {
          select: {
            subcategory: { select: { category: { select: { menuId: true } } } },
          },
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
                          select: { category: { select: { menuId: true } } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!item) return [];

    const directMenuIds = item.menuItemPositions.map(
      (p) => p.subcategory?.category?.menuId,
    );
    const indirectMenuIds = item.itemModifierOptions.flatMap(
      (opt) =>
        opt.group.item?.menuItemPositions.map(
          (p) => p.subcategory?.category?.menuId,
        ) || [],
    );

    return [...new Set([...directMenuIds, ...indirectMenuIds])].filter(
      (id) => !!id,
    ) as string[];
  }

  /**
   * Invalidates cache only if the item is part of active menus.
   */
  private async invalidateItemCache(slug: string | undefined, itemId: string) {
    if (!slug) return;

    const menuIds = await this.getAffectedMenuIds(itemId);
    if (menuIds.length === 0) return;

    for (const menuId of menuIds) {
      this.cacheService.clearMenuContentCache(slug, menuId);
    }
    this.cacheService.clearMenuListCache(slug);
  }

  // ═══════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════

  async createItem(establishmentId: string, dto: CreateItemDto) {
    const slug = await this.getEstablishmentSlug(establishmentId);
    const item = await this.prisma.$transaction(async (tx) => {
      const hasVariants = (dto.variantGroups?.length ?? 0) > 0;

      const created = await tx.item.create({
        data: {
          establishmentId,
          imageId: dto.imageId || null,
          posCategoryId: dto.posCategoryId || null,
          basePrice: hasVariants ? null : dto.basePrice,
          unit: dto.unit,
          quantity: dto.quantity,
          sku: hasVariants ? null : dto.sku || null,
          taxTableId: dto.taxTableId,
          status: dto.status,
          marketingTag: dto.marketingTag || null,
          spiceLevel: dto.spiceLevel || null,
          isFeatured: dto.isFeatured ?? false,
          hasAlcohol: dto.hasAlcohol ?? false,
          translations: {
            create: dto.translations.map((t) => ({
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
              ? { create: dto.allergens.map((a) => ({ allergenId: a.id })) }
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
    return item;
  }

  async updateItem(
    id: string,
    establishment: Establishment,
    dto: UpdateItemDto,
  ) {
    const item = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.item.findUnique({
        where: { id, establishmentId: establishment.id },
      });
      if (!existing)
        throw new RpcException({ message: ERRORS.ITEM_NOT_FOUND, code: 404 });

      await tx.itemTranslation.deleteMany({ where: { itemId: id } });
      await tx.itemAllergen.deleteMany({ where: { itemId: id } });
      await tx.itemNutritionInfo.deleteMany({ where: { itemId: id } });

      const variants = await tx.itemVariant.findMany({
        where: { itemId: id },
        select: { id: true },
      });
      if (variants.length > 0) {
        await tx.variantNutrionalInfo.deleteMany({
          where: { itemVariantId: { in: variants.map((v) => v.id) } },
        });
      }

      await tx.itemVariantGroup.deleteMany({ where: { itemId: id } });
      await tx.itemModifierGroup.deleteMany({ where: { itemId: id } });

      const hasVariants = (dto.variantGroups?.length ?? 0) > 0;

      const updated = await tx.item.update({
        where: { id },
        data: {
          imageId: dto.imageId ?? null,
          posCategoryId:
            dto.posCategoryId !== undefined
              ? dto.posCategoryId
              : existing.posCategoryId,
          basePrice: hasVariants
            ? null
            : dto.basePrice !== undefined
              ? dto.basePrice
              : existing.basePrice,
          unit: dto.unit,
          quantity: dto.quantity,
          sku: hasVariants
            ? null
            : dto.sku !== undefined
              ? dto.sku
              : existing.sku,
          taxTableId:
            dto.taxTableId !== undefined ? dto.taxTableId : existing.taxTableId,
          status: dto.status !== undefined ? dto.status : existing.status,
          marketingTag:
            dto.marketingTag !== undefined ? dto.marketingTag : null,
          spiceLevel: dto.spiceLevel !== undefined ? dto.spiceLevel : null,
          isFeatured: dto.isFeatured !== undefined ? dto.isFeatured : false,
          hasAlcohol: dto.hasAlcohol !== undefined ? dto.hasAlcohol : false,
          translations: dto.translations
            ? {
                create: dto.translations.map((t) => ({
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
              ? { create: dto.allergens.map((a) => ({ allergenId: a.id })) }
              : undefined,
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

    await this.invalidateItemCache(establishment.slug, id);
    return item;
  }

  async getItemById(id: string): Promise<ItemDetailResponse> {
    const item = (await this.prisma.item.findUnique({
      where: { id },
      include: ITEM_DETAIL_INCLUDE,
    })) as ItemWithDetailIncludes | null;

    if (!item)
      throw new RpcException({ status: 404, message: ERRORS.ITEM_NOT_FOUND });
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
          {
            translations: {
              some: { name: { contains: search, mode: 'insensitive' } },
            },
          },
          {
            translations: {
              some: {
                shortDescription: { contains: search, mode: 'insensitive' },
              },
            },
          },
          {
            translations: {
              some: { description: { contains: search, mode: 'insensitive' } },
            },
          },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(hasVariants !== undefined && {
        itemVariantGroups: hasVariants ? { some: {} } : { none: {} },
      }),
    };

    const orderByMap: Record<ItemSortBy, Prisma.ItemOrderByWithRelationInput> =
      {
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
      items: items.map((item) =>
        mapItemListResponse(item, establishment.primaryLanguage),
      ),
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
    if (!item)
      throw new RpcException({ message: ERRORS.ITEM_NOT_FOUND, code: 404 });
    await this.prisma.item.update({
      where: { id: itemId },
      data: { deletedAt: new Date() },
    });
    await this.invalidateItemCache(slug, itemId);
    return { success: true };
  }

  async duplicateItem(
    itemId: string,
    establishment: Establishment,
  ): Promise<ItemListResponse> {
    const source = await this.prisma.item.findFirst({
      where: { id: itemId, establishmentId: establishment.id, deletedAt: null },
      include: ITEM_DETAIL_INCLUDE,
    });
    if (!source)
      throw new RpcException({ message: ERRORS.ITEM_NOT_FOUND, code: 404 });

    const hasVariants = source.itemVariantGroups.length > 0;

    const newItem = await this.prisma.$transaction(async (tx) => {
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
            create: source.translations.map((t) => ({
              locale: t.locale,
              name: `${t.name} (Copy)`,
              description: t.description,
            })),
          },
          nutritionInfo:
            source.nutritionInfo && !hasVariants
              ? { create: { ...source.nutritionInfo, id: undefined } }
              : undefined,
          allergens:
            source.allergens?.length && !hasVariants
              ? {
                  create: source.allergens.map((a) => ({
                    allergenId: a.allergenId,
                  })),
                }
              : undefined,
        },
      });

      for (const vg of source.itemVariantGroups) {
        await tx.itemVariantGroup.create({
          data: {
            itemId: created.id,
            position: vg.position,
            translations: {
              create: vg.translations.map((t) => ({
                locale: t.locale,
                name: t.name,
              })),
            },
            variants: {
              create: vg.variants.map((v) => ({
                itemId: created.id,
                variantOptionId: v.variantOptionId,
                price: v.price,
                sku: v.sku ? `${v.sku}-copy` : null,
                isDefault: v.isDefault,
                position: v.position,
                imageId: v.imageId,
                nutritionInfo: v.nutritionInfo
                  ? {
                      create: {
                        ...v.nutritionInfo,
                        id: undefined,
                        itemVariantId: undefined,
                      },
                    }
                  : undefined,
                allergens: v.allergens?.length
                  ? {
                      create: v.allergens.map((a) => ({
                        allergenId: a.allergenId,
                      })),
                    }
                  : undefined,
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
            translations: {
              create: mg.translations.map((t) => ({
                locale: t.locale,
                name: t.name,
              })),
            },
            options: {
              create: mg.options.map((opt) => ({
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

    // Return lean response
    const refreshed = await this.prisma.item.findUnique({
      where: { id: newItem.id },
      include: ITEM_LIST_INCLUDE,
    });
    return mapItemListResponse(refreshed as any, establishment.primaryLanguage);
  }
  async bulkUpdateStatus(
    bulkStatusDto: BulkStatusDto,
    establishmentId: string,
  ) {
    const slug = await this.getEstablishmentSlug(establishmentId);
    const result = await this.prisma.item.updateMany({
      where: {
        id: { in: bulkStatusDto.ids },
        establishmentId,
        deletedAt: null,
      },
      data: { status: bulkStatusDto.status },
    });
    for (const id of bulkStatusDto.ids) {
      await this.invalidateItemCache(slug, id);
    }
    return { updated: result.count };
  }

  async bulkDelete(bulkDeleteDto: BulkDeleteDto, establishmentId: string) {
    const slug = await this.getEstablishmentSlug(establishmentId);
    const result = await this.prisma.item.updateMany({
      where: {
        id: { in: bulkDeleteDto.ids },
        establishmentId,
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });
    for (const id of bulkDeleteDto.ids) {
      await this.invalidateItemCache(slug, id);
    }
    return { deleted: result.count };
  }

  /**
   * Returns the full menu tree (menus → categories → subcategories) for the establishment,
   * plus which subcategories this item is currently placed in.
   */
  async getItemPlacements(itemId: string, establishment: Establishment) {
    await this.assertItemBelongsToEstablishment(itemId, establishment.id);

    const [placements, menus] = await Promise.all([
      this.prisma.menuItemPosition.findMany({
        where: {
          itemId,
          subcategory: {
            category: {
              menu: { establishmentId: establishment.id },
            },
          },
        },
        select: { subcategoryId: true },
      }),
      this.prisma.menu.findMany({
        where: { establishmentId: establishment.id },
        orderBy: { position: 'asc' },
        select: {
          id: true,
          translations: {
            where: { locale: establishment.primaryLanguage },
            select: { name: true },
          },
          categories: {
            orderBy: { position: 'asc' },
            select: {
              id: true,
              translations: {
                where: { locale: establishment.primaryLanguage },
                select: { name: true },
              },
              subcategories: {
                orderBy: { position: 'asc' },
                select: {
                  id: true,
                  translations: {
                    where: { locale: establishment.primaryLanguage },
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const placedSubcategoryIds = new Set(
      placements.map((p) => p.subcategoryId),
    );

    return {
      placedSubcategoryIds: Array.from(placedSubcategoryIds),
      menus: menus.map((menu) => ({
        id: menu.id,
        name: menu.translations[0]?.name ?? '',
        categories: menu.categories.map((cat) => ({
          id: cat.id,
          name: cat.translations[0]?.name ?? '',
          subcategories: cat.subcategories.map((sub) => ({
            id: sub.id,
            name: sub.translations[0]?.name ?? '',
          })),
        })),
      })),
    };
  }

  /**
   * Syncs item placements: adds missing MenuItemPositions and removes unchecked ones.
   */
  async updateItemPlacements(
    itemId: string,
    establishment: Establishment,
    subcategoryIds: string[],
    menuIds?: string[],
  ) {
    await this.assertItemBelongsToEstablishment(itemId, establishment.id);
    const slug = await this.getEstablishmentSlug(establishment.id);

    await this.prisma.$transaction(async (tx) => {
      const uniqueTargetSubcategoryIds = Array.from(new Set(subcategoryIds));
      const uniqueMenuIds = Array.from(new Set(menuIds ?? []));

      if (uniqueMenuIds.length > 0) {
        const validMenusCount = await tx.menu.count({
          where: {
            id: { in: uniqueMenuIds },
            establishmentId: establishment.id,
          },
        });
        if (validMenusCount !== uniqueMenuIds.length) {
          throw new RpcException({
            message: 'Invalid menuIds for this establishment',
            code: 400,
          });
        }
      }

      if (uniqueTargetSubcategoryIds.length > 0) {
        const validSubcategories = await tx.menuSubcategory.findMany({
          where: {
            id: { in: uniqueTargetSubcategoryIds },
            category: {
              menu: {
                establishmentId: establishment.id,
                ...(uniqueMenuIds.length ? { id: { in: uniqueMenuIds } } : {}),
              },
            },
          },
          select: { id: true },
        });

        if (validSubcategories.length !== uniqueTargetSubcategoryIds.length) {
          throw new RpcException({
            message: 'Invalid placement subcategoryIds for this establishment',
            code: 400,
          });
        }
      }

      // 1. Get current placements
      const existing = await tx.menuItemPosition.findMany({
        where: {
          itemId,
          subcategory: {
            category: {
              menu: { establishmentId: establishment.id },
            },
          },
        },
        select: { id: true, subcategoryId: true },
      });

      const existingSubIds = new Set(existing.map((e) => e.subcategoryId));
      const targetSubIds = new Set(uniqueTargetSubcategoryIds);

      // 2. Remove placements not in the new list
      const toRemove = existing.filter(
        (e) => !targetSubIds.has(e.subcategoryId),
      );
      if (toRemove.length > 0) {
        await tx.menuItemPosition.deleteMany({
          where: { id: { in: toRemove.map((r) => r.id) } },
        });
      }

      // 3. Add new placements
      const toAdd = uniqueTargetSubcategoryIds.filter(
        (id) => !existingSubIds.has(id),
      );
      if (toAdd.length > 0) {
        // Get the max position for each subcategory we're adding to
        for (const subId of toAdd) {
          const maxPos = await tx.menuItemPosition.aggregate({
            where: { subcategoryId: subId },
            _max: { position: true },
          });
          await tx.menuItemPosition.create({
            data: {
              itemId,
              subcategoryId: subId,
              position: (maxPos._max.position ?? -1) + 1,
              isVisible: true,
            },
          });
        }
      }
    });

    await this.invalidateItemCache(slug, itemId);
    return { success: true };
  }

  async getAllergens() {
    return this.prisma.allergen.findMany({ select: { id: true, code: true } });
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
}

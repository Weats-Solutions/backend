import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateMenuDto, UpdateMenuPositionsDto, UpdateMenuDto } from '@weats/contracts';
import { Establishment, User, feature } from '@weats/types';
import { FeatureUsageService } from '@weats/common/feature/feature-usage.service';
import { ERRORS, MENU_COLOR_PALETTE, normalizeSchedule } from '@weats/common';
import { CorePrismaService, EstablishmentLanguage, MenuType, ScheduleType } from '@weats/database';
import { RpcException } from '@nestjs/microservices';
import { CacheService } from '@weats/cache';

@Injectable()
export class MenuService {
    constructor(
        private readonly prisma: CorePrismaService,
        private usageService: FeatureUsageService,
        private readonly cacheService: CacheService,
    ) { }

    async listMenus(establishment: Establishment) {
        try {
            const menus = await this.prisma.menu.findMany({
                where: { establishmentId: establishment.id },
                orderBy: { position: 'asc' },
                select: {
                    id: true,
                    isVisible: true,
                    isVisibleOnMenuPage: true,
                    position: true,
                    type: true,
                    color: true,
                    isHighlighted: true,
                    translations: {
                        where: { locale: establishment.primaryLanguage },
                        select: {
                            name: true,
                            description: true,
                            observations: true,
                        },
                    },
                    schedule: {
                        include: { days: { include: { intervals: true } } }
                    },
                },
            });

            const { usage, limit } = await this.usageService.getUsageAndLimit(
                'menu',
                establishment.id,
            );

            // Transform data
            const menuList = menus.map((menu) => {
                const normalizedSchedule = menu.schedule ? normalizeSchedule(menu.schedule) : null;

                return {
                    id: menu.id,
                    isVisible: menu.isVisible,
                    isVisibleOnMenuPage: menu.isVisibleOnMenuPage,
                    position: menu.position,
                    type: menu.type,
                    color: menu.color,
                    isHighlighted: menu.isHighlighted,
                    translations: menu.translations,
                    schedule: normalizedSchedule,
                };
            });

            return {
                usage: {
                    current: usage,
                    limit: limit,
                },
                menus: menuList,
            };
        } catch (error) {
            console.error('Error listing menus:', error);
            throw error;
        }
    }

    async getMenuDetails(menuId: string, establishment: Establishment) {
        try {
            const menu = await this.prisma.menu.findFirst({
                where: { id: menuId, establishmentId: establishment.id },
                include: {
                    translations: true,
                    schedule: {
                        include: {
                            days: {
                                include: {
                                    intervals: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!menu) {
                throw new NotFoundException('Menu not found');
            }

            return {
                id: menu.id,
                isVisible: menu.isVisible,
                isVisibleOnMenuPage: menu.isVisibleOnMenuPage,
                position: menu.position,
                type: menu.type,
                color: menu.color,
                isHighlighted: menu.isHighlighted,
                price: menu.price,
                showImages: menu.showImages,
                translations: menu.translations,
                schedule: menu.schedule ? normalizeSchedule(menu.schedule) : null,
            };
        } catch (error) {
            console.error('Error getting menu details:', error);
            throw error;
        }
    }

    async createMenu(createMenuDto: CreateMenuDto, establishment: Establishment) {
        try {
            const { translations, schedule } = createMenuDto;
            const menu = await this.prisma.$transaction(async (prisma) => {
                let scheduleId: string | undefined;
                if (schedule) {
                    const createdSchedule = await prisma.schedule.create({
                        data: {
                            type: ScheduleType.MENU,
                            days: {
                                create: schedule.days.map((day) => ({
                                    dayOfWeek: day.dayOfWeek,
                                    isOpen: day.isOpen ?? true,
                                    intervals: {
                                        create: day.intervals,
                                    },
                                })),
                            },
                        },
                    });
                    scheduleId = createdSchedule.id;
                }

                const menuCount = await prisma.menu.count({ where: { establishmentId: establishment.id } });
                const selectedColor = MENU_COLOR_PALETTE[Math.floor(Math.random() * MENU_COLOR_PALETTE.length)];

                const finalPrice = createMenuDto.type === MenuType.RODIZIO ? createMenuDto.price : null;

                const menu = await prisma.menu.create({
                    data: {
                        establishmentId: establishment.id,
                        position: menuCount + 1,
                        color: MENU_COLOR_PALETTE[Math.floor(Math.random() * MENU_COLOR_PALETTE.length)],
                        type: createMenuDto.type,
                        price: finalPrice,
                        showImages: createMenuDto.showImages,
                        translations: { create: translations },
                        ...(scheduleId && { scheduleId }),
                    },
                    select: {
                        id: true,
                        isVisible: true,
                        isVisibleOnMenuPage: true,
                        position: true,
                        color: true,
                        isHighlighted: true,
                        type: true,
                        translations: {
                            select: {
                                locale: true,
                                name: true,
                                description: true,
                                observations: true,
                            },
                        }, schedule: { include: { days: { include: { intervals: true } } } }
                    },
                });

                return { ...menu, schedule: menu.schedule ? normalizeSchedule(menu.schedule) : null };
            });
            await this.cacheService.clearMenuListCache(establishment.slug);
            return menu;
        } catch (error) {
            console.error('Error creating menu:', error);
            throw error;
        }
    }

    async updateMenu(
        menuId: string,
        updateMenuDto: CreateMenuDto,
        establishment: Establishment,
    ) {
        try {
            const { translations, schedule } = updateMenuDto;
            const finalPrice = updateMenuDto.type === MenuType.RODIZIO ? updateMenuDto.price : null;

            await this.prisma.menu.update({
                where: { id: menuId },
                data: {
                    type: updateMenuDto.type,
                    price: finalPrice,
                    showImages: updateMenuDto.showImages,
                    translations: {
                        upsert: translations.map((translation) => ({
                            where: {
                                menuId_locale: {
                                    menuId,
                                    locale: translation.locale,
                                },
                            },
                            update: {
                                name: translation.name,
                                description: translation.description,
                                observations: translation.observations,
                            },
                            create: {
                                locale: translation.locale,
                                name: translation.name,
                                description: translation.description,
                                observations: translation.observations,
                            },
                        })),
                    },
                    schedule: {
                        update: {
                            type: ScheduleType.MENU,
                            days: {
                                deleteMany: {},
                                create: schedule.days.map((day) => ({
                                    dayOfWeek: day.dayOfWeek,
                                    isOpen: day.isOpen ?? true,
                                    intervals: {
                                        create: day.intervals,
                                    },
                                })),
                            },
                        },
                    },
                },
                include: {
                    schedule: { include: { days: { include: { intervals: true } } } },
                },
            });

            await this.cacheService.clearMenuListCache(establishment.slug);
            await this.cacheService.clearMenuContentCache(establishment.slug, menuId);
            return this.getMenuDetails(menuId, establishment);
        } catch (error) {
            console.error('Error updating menu details:', error);
            throw error;
        }
    }

    async updateMenuSettings(
        menuId: string,
        updateMenuDto: UpdateMenuDto,
        establishment: Establishment,
    ) {
        try {
            const { isVisible, color, isHighlighted, isVisibleOnMenuPage } = updateMenuDto;
            const menu = await this.prisma.menu.update({
                where: { id: menuId },
                data: {
                    isVisible,
                    color,
                    isHighlighted,
                    isVisibleOnMenuPage,
                },
                select: {
                    id: true,
                    isVisible: true,
                    isVisibleOnMenuPage: true,
                    position: true,
                    color: true,
                    isHighlighted: true,
                    translations: {
                        where: { locale: establishment.primaryLanguage },
                        select: {
                            name: true,
                            description: true,
                            observations: true,
                        },
                    },
                    schedule: {
                        include: { days: { include: { intervals: true } } },
                    },
                },
            });

            await this.cacheService.clearMenuListCache(establishment.slug);
            return {
                id: menu.id,
                isVisible: menu.isVisible,
                isVisibleOnMenuPage: menu.isVisibleOnMenuPage,
                position: menu.position,
                color: menu.color,
                isHighlighted: menu.isHighlighted,
                translations: menu.translations,
                schedule: menu.schedule ? normalizeSchedule(menu.schedule) : null,
            };
        } catch (error) {
            console.error('Error updating menu:', error);
            throw error;
        }
    }





    async updateMenuPositions(
        updateMenuPositionsDto: UpdateMenuPositionsDto,
        establishment: Establishment,
    ) {
        try {
            const updates = updateMenuPositionsDto.positions.map((pos) =>
                this.prisma.menu.update({
                    where: { id: pos.id, establishmentId: establishment.id },
                    data: { position: pos.position },
                }),
            );

            await this.prisma.$transaction(updates);

            // Clean Next.JS cache to reflect changes immediately on the frontend
            await this.cacheService.clearMenuListCache(establishment.slug);

            return { success: true };
        } catch (error) {
            console.error('Error updating menu positions:', error);
            throw error;
        }
    }

    async deleteMenu(menuId: string, establishment: Establishment) {
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                // 1. Get menu info to know position and establishment
                const menu = await tx.menu.findUnique({
                    where: { id: menuId },
                    select: { position: true, establishmentId: true },
                });

                if (!menu) {
                    throw new NotFoundException('Menu not found');
                }
                // 3. Delete the menu
                await tx.menu.delete({ where: { id: menuId } });

                // 5. Reorder remaining menus (Normalize all positions to ensure no gaps)
                const allRemainingMenus = await tx.menu.findMany({
                    where: { establishmentId: menu.establishmentId },
                    orderBy: { position: 'asc' },
                    select: { id: true },
                });

                // Update each menu to have a sequential position starting from 0
                for (let i = 0; i < allRemainingMenus.length; i++) {
                    await tx.menu.update({
                        where: { id: allRemainingMenus[i].id },
                        data: { position: i },
                    });
                }

                // 6. Return updated positions for frontend sync
                const remainingMenus = await tx.menu.findMany({
                    where: { establishmentId: menu.establishmentId },
                    select: { id: true, position: true },
                    orderBy: { position: 'asc' },
                });

                return { success: true, remainingMenus, establishmentId: menu.establishmentId };
            });
            await this.cacheService.clearMenuListCache(establishment.slug);
            return { success: result.success, remainingMenus: result.remainingMenus };
        } catch (error) {
            console.error('Error deleting menu:', error);
            if (error instanceof NotFoundException) throw error;
            throw new BadRequestException('Error deleting menu');
        }
    }

    async duplicateMenu(menuId: string, establishment: Establishment) {
        try {
            const sourceMenu = await this.prisma.menu.findFirst({
                where: { id: menuId, establishmentId: establishment.id },
                include: {
                    translations: true,
                    schedule: {
                        include: {
                            days: {
                                include: { intervals: true },
                            },
                        },
                    },
                    categories: {
                        include: {
                            translations: true,
                            subcategories: {
                                include: {
                                    translations: true,
                                    items: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!sourceMenu) {
                throw new NotFoundException('Menu not found');
            }

            const newMenu = await this.prisma.$transaction(async (prisma) => {
                // 1. Create schedule if source has one
                let scheduleId: string | undefined;
                if (sourceMenu.schedule) {
                    const createdSchedule = await prisma.schedule.create({
                        data: {
                            type: ScheduleType.MENU,
                            days: {
                                create: sourceMenu.schedule.days.map((day) => ({
                                    dayOfWeek: day.dayOfWeek,
                                    isOpen: day.isOpen,
                                    intervals: {
                                        create: day.intervals.map((interval) => ({
                                            startTime: interval.startTime,
                                            endTime: interval.endTime,
                                        })),
                                    },
                                })),
                            },
                        },
                    });
                    scheduleId = createdSchedule.id;
                }

                // 2. Count existing menus for position
                const menuCount = await prisma.menu.count({
                    where: { establishmentId: establishment.id },
                });

                // 3. Create the new menu
                const duplicatedMenu = await prisma.menu.create({
                    data: {
                        establishmentId: establishment.id,
                        position: menuCount,
                        color: sourceMenu.color,
                        isVisible: false,
                        isVisibleOnMenuPage: sourceMenu.isVisibleOnMenuPage,
                        isHighlighted: sourceMenu.isHighlighted,
                        type: sourceMenu.type,
                        price: sourceMenu.price,
                        showImages: sourceMenu.showImages,
                        maxItemsPerOrder: sourceMenu.maxItemsPerOrder,
                        translations: {
                            create: sourceMenu.translations.map((t) => ({
                                locale: t.locale,
                                name: `${t.name} (Cópia)`,
                                description: t.description,
                                observations: t.observations,
                            })),
                        },
                        ...(scheduleId && { scheduleId }),
                    },
                });

                // 4. Duplicate categories, subcategories, and item positions
                for (const category of sourceMenu.categories) {
                    const newCategory = await prisma.menuCategory.create({
                        data: {
                            menuId: duplicatedMenu.id,
                            position: category.position,
                            isVisible: category.isVisible,
                            imageId: category.imageId,
                            translations: {
                                create: category.translations.map((t) => ({
                                    locale: t.locale,
                                    name: t.name,
                                })),
                            },
                        },
                    });

                    for (const subcategory of category.subcategories) {
                        const newSubcategory = await prisma.menuSubcategory.create({
                            data: {
                                categoryId: newCategory.id,
                                position: subcategory.position,
                                isVisible: subcategory.isVisible,
                                translations: {
                                    create: subcategory.translations.map((t) => ({
                                        locale: t.locale,
                                        name: t.name,
                                        description: t.description,
                                    })),
                                },
                            },
                        });

                        // Link same items (MenuItemPosition)
                        if (subcategory.items.length > 0) {
                            await prisma.menuItemPosition.createMany({
                                data: subcategory.items.map((item) => ({
                                    itemId: item.itemId,
                                    subcategoryId: newSubcategory.id,
                                    position: item.position,
                                    isVisible: item.isVisible,
                                    isIncluded: item.isIncluded,
                                })),
                            });
                        }
                    }
                }

                // 5. Return the new menu with data for frontend
                return prisma.menu.findUnique({
                    where: { id: duplicatedMenu.id },
                    select: {
                        id: true,
                        isVisible: true,
                        isVisibleOnMenuPage: true,
                        position: true,
                        color: true,
                        isHighlighted: true,
                        type: true,
                        translations: {
                            where: { locale: establishment.primaryLanguage },
                            select: {
                                name: true,
                                description: true,
                                observations: true,
                            },
                        },
                        schedule: {
                            include: { days: { include: { intervals: true } } },
                        },
                    },
                });
            });

            await this.cacheService.clearMenuListCache(establishment.slug);

            return {
                ...newMenu,
                schedule: newMenu?.schedule ? normalizeSchedule(newMenu.schedule) : null,
            };
        } catch (error) {
            console.error('Error duplicating menu:', error);
            if (error instanceof NotFoundException) throw error;
            throw new BadRequestException('Error duplicating menu');
        }
    }


    /**
     * Returns the complete menu tree in a single query:
     * categories → subcategories → items (with variants, modifiers, allergens, attributes).
     *
     * Loading everything upfront avoids per-section round trips, keeping the
     * catalog fluid even when the user swipes through sections rapidly.
     */
    async getMenuContent(menuId: string, establishmentId: string, lang: EstablishmentLanguage) {
        try {
            const menu = await this.prisma.menu.findFirst({
                where: { id: menuId, establishmentId: establishmentId },
                select: {
                    id: true,
                    type: true,
                    showImages: true,
                    color: true,
                    isHighlighted: true,
                    translations: {
                        where: { locale: lang },
                        select: {
                            name: true,
                            description: true,
                            observations: true,
                        },
                    },
                    categories: {
                        orderBy: { position: 'asc' },
                        where: { isVisible: true },
                        select: {
                            id: true,
                            image: {
                                select: { url: true },
                            },
                            translations: {
                                where: { locale: lang },
                                select: { name: true },
                            },
                            subcategories: {
                                orderBy: { position: 'asc' },
                                where: { isVisible: true },
                                select: {
                                    id: true,
                                    translations: {
                                        where: { locale: lang },
                                        select: {
                                            name: true,
                                            description: true,
                                        },
                                    },
                                    // ─── Items ───────────────────────────────────
                                    items: {
                                        orderBy: { position: 'asc' },
                                        where: {
                                            isVisible: true,
                                            item: { status: 'ACTIVE' },
                                        },
                                        select: {
                                            id: true,
                                            position: true,
                                            isIncluded: true,
                                            item: {
                                                select: {
                                                    id: true,
                                                    basePrice: true,
                                                    spiceLevel: true,
                                                    marketingTag: true,
                                                    isFeatured: true,
                                                    hasAlcohol: true,
                                                    unit: true,
                                                    quantity: true,
                                                    // Image
                                                    image: {
                                                        select: { url: true },
                                                    },
                                                    // Translation
                                                    translations: {
                                                        where: { locale: lang },
                                                        select: {
                                                            name: true,
                                                            shortDescription: true,
                                                            description: true,
                                                        },
                                                    },
                                                    // Dietary attributes (vegan, gluten-free...)
                                                    attributes: {
                                                        select: { type: true },
                                                    },
                                                    // Allergens - item level
                                                    allergens: {
                                                        select: {
                                                            allergen: {
                                                                select: { code: true },
                                                            },
                                                        },
                                                    },
                                                    nutritionInfo: true,
                                                    // --- Variant groups ("Choose size") ---
                                                    itemVariantGroups: {
                                                        orderBy: { position: 'asc' },
                                                        select: {
                                                            id: true,
                                                            translations: {
                                                                where: { locale: lang },
                                                                select: { name: true },
                                                            },
                                                            variants: {
                                                                orderBy: { position: 'asc' },
                                                                where: { isActive: true, deletedAt: null },
                                                                select: {
                                                                    id: true,
                                                                    price: true,
                                                                    isDefault: true,
                                                                    image: {
                                                                        select: { url: true },
                                                                    },
                                                                    nutritionInfo: true,
                                                                    variantOption: {
                                                                        select: {
                                                                            id: true,
                                                                            translations: {
                                                                                where: { locale: lang },
                                                                                select: { name: true },
                                                                            },
                                                                        },
                                                                    },
                                                                    // Allergens - variant level
                                                                    allergens: {
                                                                        select: {
                                                                            allergen: {
                                                                                select: { code: true },
                                                                            },
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                    // --- Modifier groups (addons/customizations) ---
                                                    modifierGroups: {
                                                        orderBy: { position: 'asc' },
                                                        where: { isActive: true, deletedAt: null },
                                                        select: {
                                                            id: true,
                                                            minSelection: true,
                                                            maxSelection: true,
                                                            displayMode: true,
                                                            translations: {
                                                                where: { locale: lang },
                                                                select: { name: true },
                                                            },
                                                            options: {
                                                                orderBy: { position: 'asc' },
                                                                select: {
                                                                    id: true,
                                                                    price: true,
                                                                    defaultQuantity: true,
                                                                    minQuantity: true,
                                                                    maxQuantity: true,
                                                                    // Target A: simple addon ("No ice", "Extra spicy")
                                                                    addon: {
                                                                        select: {
                                                                            id: true,
                                                                            translations: {
                                                                                where: { locale: lang },
                                                                                select: { name: true },
                                                                            },
                                                                        },
                                                                    },
                                                                    // Target B: variant upsell
                                                                    itemVariant: {
                                                                        select: {
                                                                            id: true,
                                                                            price: true,
                                                                            variantOption: {
                                                                                select: {
                                                                                    translations: {
                                                                                        where: { locale: lang },
                                                                                        select: { name: true },
                                                                                    },
                                                                                },
                                                                            },
                                                                        },
                                                                    },
                                                                    // Target C: another item as modifier
                                                                    product: {
                                                                        select: {
                                                                            id: true,
                                                                            basePrice: true,
                                                                            image: {
                                                                                select: { url: true },
                                                                            },
                                                                            translations: {
                                                                                where: { locale: lang },
                                                                                select: { name: true },
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
                                    },
                                },
                            },
                        },
                    },
                },
            });

            if (!menu) {
                throw new RpcException({
                    status: 404,
                    message: ERRORS.MENU_NOT_FOUND,
                    code: ERRORS.MENU_NOT_FOUND,
                });
            }

            return menu;
        } catch (error) {
            console.error('Error getting menu content:', error);
            throw error;
        }
    }

    async duplicateMenuPrecheck(
        menuId: string,
        targetEstablishmentId: string,
        reuseExistingItemsBySku: boolean,
        user: User,
    ) {
        try {
            const sourceMenu = await this.prisma.menu.findUnique({
                where: { id: menuId },
                include: {
                    establishment: true,
                    translations: true,
                    schedule: {
                        include: {
                            days: {
                                include: {
                                    intervals: true,
                                },
                            },
                        },
                    },
                    categories: {
                        include: {
                            translations: true,
                            subcategories: {
                                include: {
                                    translations: true,
                                    items: {
                                        include: {
                                            item: {
                                                include: {
                                                    translations: true,
                                                    image: true,
                                                    attributes: true,
                                                    allergens: {
                                                        include: { allergen: true }
                                                    },
                                                    nutritionInfo: true,
                                                    itemVariantGroups: {
                                                        include: {
                                                            translations: true,
                                                            variants: {
                                                                include: {
                                                                    image: true,
                                                                    allergens: {
                                                                        include: { allergen: true }
                                                                    },
                                                                    nutritionInfo: true,
                                                                    variantOption: {
                                                                        include: {
                                                                            translations: true,
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                    modifierGroups: {
                                                        include: {
                                                            translations: true,
                                                            options: {
                                                                include: {
                                                                    addon: {
                                                                        include: {
                                                                            translations: true,
                                                                        },
                                                                    },
                                                                    itemVariant: {
                                                                        include: {
                                                                            variantOption: {
                                                                                include: {
                                                                                    translations: true,
                                                                                },
                                                                            },
                                                                        },
                                                                    },
                                                                    product: {
                                                                        include: {
                                                                            translations: true,
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
                                },
                            },
                        },
                    },
                },
            });

            if (!sourceMenu) {
                throw new RpcException({
                    status: 404,
                    message: ERRORS.MENU_NOT_FOUND,
                    code: ERRORS.MENU_NOT_FOUND,
                });
            }

            if (sourceMenu.establishment.ownerId !== user.id) {
                throw new RpcException({
                    status: 403,
                    message: ERRORS.ACCESS_DENIED,
                    code: ERRORS.ACCESS_DENIED,
                });
            }

            const targetEstablishment = await this.prisma.establishment.findUnique({
                where: { id: targetEstablishmentId },
            });

            if (!targetEstablishment) {
                throw new RpcException({
                    status: 404,
                    message: ERRORS.ESTABLISHMENT_NOT_FOUND,
                    code: ERRORS.ESTABLISHMENT_NOT_FOUND,
                });
            }

            if (targetEstablishment.ownerId !== user.id) {
                throw new RpcException({
                    status: 403,
                    message: ERRORS.ACCESS_DENIED,
                    code: ERRORS.ACCESS_DENIED,
                });
            }

            return await this.calculateDuplicationCost(
                sourceMenu,
                targetEstablishment,
                reuseExistingItemsBySku,
            );
        } catch (error) {
            console.error('Error in duplicateMenuPrecheck:', error);
            throw error;
        }
    }

    async duplicateMenuToEstablishment(
        menuId: string,
        targetEstablishmentId: string,
        idempotencyKey: string,
        reuseExistingItemsBySku: boolean,
        user: User,
    ) {
        const cacheKey = `idempotency:menu-dup:${idempotencyKey}`;
        try {
            const cachedValue = await this.cacheService.get<{
                status: 'processing' | 'completed';
                startedAt: number;
                result: any;
            }>(cacheKey);

            if (cachedValue) {
                if (cachedValue.status === 'processing') {
                    const elapsed = Date.now() - cachedValue.startedAt;
                    if (elapsed < 120000) {
                        throw new RpcException({
                            status: 202,
                            message: 'Duplicate request is still processing. Please try again shortly.',
                            code: 'PROCESSING',
                        });
                    }
                } else if (cachedValue.status === 'completed') {
                    return cachedValue.result;
                }
            }

            await this.cacheService.set(cacheKey, {
                status: 'processing',
                startedAt: Date.now(),
                result: null,
            }, 86400);

            const sourceMenu = await this.prisma.menu.findUnique({
                where: { id: menuId },
                include: {
                    establishment: true,
                    translations: true,
                    schedule: {
                        include: {
                            days: {
                                include: {
                                    intervals: true,
                                },
                            },
                        },
                    },
                    categories: {
                        include: {
                            translations: true,
                            subcategories: {
                                include: {
                                    translations: true,
                                    items: {
                                        include: {
                                            item: {
                                                include: {
                                                    translations: true,
                                                    image: true,
                                                    attributes: true,
                                                    allergens: {
                                                        include: { allergen: true }
                                                    },
                                                    nutritionInfo: true,
                                                    itemVariantGroups: {
                                                        include: {
                                                            translations: true,
                                                            variants: {
                                                                include: {
                                                                    image: true,
                                                                    allergens: {
                                                                        include: { allergen: true }
                                                                    },
                                                                    nutritionInfo: true,
                                                                    variantOption: {
                                                                        include: {
                                                                            translations: true,
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                    modifierGroups: {
                                                        include: {
                                                            translations: true,
                                                            options: {
                                                                include: {
                                                                    addon: {
                                                                        include: {
                                                                            translations: true,
                                                                        },
                                                                    },
                                                                    itemVariant: {
                                                                        include: {
                                                                            variantOption: {
                                                                                include: {
                                                                                    translations: true,
                                                                                },
                                                                            },
                                                                        },
                                                                    },
                                                                    product: {
                                                                        include: {
                                                                            translations: true,
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
                                },
                            },
                        },
                    },
                },
            });

            if (!sourceMenu) {
                await this.cacheService.invalidate(cacheKey);
                throw new RpcException({
                    status: 404,
                    message: ERRORS.MENU_NOT_FOUND,
                    code: ERRORS.MENU_NOT_FOUND,
                });
            }

            if (sourceMenu.establishment.ownerId !== user.id) {
                await this.cacheService.invalidate(cacheKey);
                throw new RpcException({
                    status: 403,
                    message: ERRORS.ACCESS_DENIED,
                    code: ERRORS.ACCESS_DENIED,
                });
            }

            const targetEstablishment = await this.prisma.establishment.findUnique({
                where: { id: targetEstablishmentId },
            });

            if (!targetEstablishment) {
                await this.cacheService.invalidate(cacheKey);
                throw new RpcException({
                    status: 404,
                    message: ERRORS.ESTABLISHMENT_NOT_FOUND,
                    code: ERRORS.ESTABLISHMENT_NOT_FOUND,
                });
            }

            if (targetEstablishment.ownerId !== user.id) {
                await this.cacheService.invalidate(cacheKey);
                throw new RpcException({
                    status: 403,
                    message: ERRORS.ACCESS_DENIED,
                    code: ERRORS.ACCESS_DENIED,
                });
            }

            const duplicationResult = await this.prisma.$transaction(
                async (tx) => {
                    const costReport = await this.calculateDuplicationCost(
                        sourceMenu,
                        targetEstablishment,
                        reuseExistingItemsBySku,
                        tx,
                    );

                    if (!costReport.isPossible) {
                        const failedCheck = costReport.checks.find((c) => !c.passed);
                        throw new BadRequestException(
                            failedCheck?.error || 'Target establishment plan limits exceeded.',
                        );
                    }

                    return this.executeCloning(
                        tx,
                        sourceMenu,
                        targetEstablishment,
                        reuseExistingItemsBySku,
                        costReport.missingLocales,
                    );
                },
                { timeout: 30000 },
            );

            const successResponse = {
                success: true,
                newMenuId: duplicationResult.id,
                message: `Menu successfully duplicated.`,
            };

            await this.cacheService.set(cacheKey, {
                status: 'completed',
                startedAt: Date.now(),
                result: successResponse,
            }, 86400);

            await this.cacheService.clearMenuListCache(targetEstablishment.slug);

            return successResponse;
        } catch (error) {
            console.error('Error duplicating menu to establishment:', error);
            await this.cacheService.invalidate(cacheKey);
            throw error;
        }
    }

    private async calculateDuplicationCost(
        sourceMenu: any,
        targetEstablishment: any,
        reuseExistingItemsBySku: boolean,
        tx?: any,
    ) {
        const targetId = targetEstablishment.id;

        const menuCost = 1;
        const categoriesCost = sourceMenu.categories.length;
        const subcategoriesCost = sourceMenu.categories.reduce(
            (acc: number, cat: any) => acc + (cat.subcategories || []).length,
            0,
        );

        const uniqueItemsMap = new Map<string, any>();
        const uniqueImages = new Set<string>();
        const uniqueLocales = new Set<string>();

        for (const t of sourceMenu.translations || []) {
            uniqueLocales.add(t.locale);
        }

        for (const cat of sourceMenu.categories || []) {
            if (cat.imageId) uniqueImages.add(cat.imageId);
            for (const t of cat.translations || []) {
                uniqueLocales.add(t.locale);
            }

            for (const sub of cat.subcategories || []) {
                for (const t of sub.translations || []) {
                    uniqueLocales.add(t.locale);
                }

                for (const pos of sub.items || []) {
                    if (pos.item && !uniqueItemsMap.has(pos.item.id)) {
                        uniqueItemsMap.set(pos.item.id, pos.item);
                    }
                }
            }
        }

        const uniqueItems = Array.from(uniqueItemsMap.values());

        const client = tx || this.prisma;
        const targetItems = await client.item.findMany({
            where: { establishmentId: targetId, deletedAt: null },
            select: { sku: true },
        });
        const targetSkus = new Set(
            targetItems
                .map((ti) => ti.sku?.trim().toLowerCase())
                .filter(Boolean),
        );

        const newItemsToCopy: any[] = [];
        for (const item of uniqueItems) {
            const hasMatchingSku =
                item.sku && targetSkus.has(item.sku.trim().toLowerCase());
            if (reuseExistingItemsBySku && hasMatchingSku) {
                continue;
            }
            newItemsToCopy.push(item);
        }

        const productsCost = newItemsToCopy.length;

        const uniqueVariantOptionIds = new Set<string>();
        const uniqueAddonIds = new Set<string>();

        for (const item of newItemsToCopy) {
            if (item.imageId) uniqueImages.add(item.imageId);
            for (const t of item.translations || []) {
                uniqueLocales.add(t.locale);
            }

            for (const vg of item.itemVariantGroups || []) {
                for (const t of vg.translations || []) {
                    uniqueLocales.add(t.locale);
                }

                for (const v of vg.variants || []) {
                    if (v.imageId) uniqueImages.add(v.imageId);

                    const vo = v.variantOption;
                    if (vo) {
                        for (const t of vo.translations || []) {
                            uniqueLocales.add(t.locale);
                        }
                        if (!vo.isGlobal) {
                            uniqueVariantOptionIds.add(vo.id);
                        }
                    }
                }
            }

            for (const mg of item.modifierGroups || []) {
                for (const t of mg.translations || []) {
                    uniqueLocales.add(t.locale);
                }

                for (const opt of mg.options || []) {
                    if (opt.addon) {
                        for (const t of opt.addon.translations || []) {
                            uniqueLocales.add(t.locale);
                        }
                        if (!opt.addon.isGlobal) {
                            uniqueAddonIds.add(opt.addon.id);
                        }
                    }
                }
            }
        }

        const customVariantsCost = uniqueVariantOptionIds.size;
        const customAddonsCost = uniqueAddonIds.size;
        const imagesCost = uniqueImages.size;

        const targetLanguages = targetEstablishment.availableLanguages || [];
        const missingLocales = Array.from(uniqueLocales).filter(
            (locale) => !targetLanguages.includes(locale),
        );
        const languagesCost = missingLocales.length;

        const checks = await Promise.all([
            this.checkLimit(feature.menu, targetId, menuCost, 'Menus', tx),
            this.checkLimit(feature.menu_categories, targetId, categoriesCost, 'Categories', tx),
            this.checkLimit(feature.menu_subcategories, targetId, subcategoriesCost, 'Subcategories', tx),
            this.checkLimit(feature.products, targetId, productsCost, 'Items', tx),
            this.checkLimit(feature.custom_variants, targetId, customVariantsCost, 'Variant Options', tx),
            this.checkLimit(feature.custom_addons, targetId, customAddonsCost, 'Addons', tx),
            this.checkLimit(feature.images, targetId, imagesCost, 'Images', tx),
            this.checkLimit(feature.languages, targetId, languagesCost, 'Languages', tx),
        ]);

        const isPossible = checks.every((c) => c.passed);

        return {
            isPossible,
            checks,
            missingLocales,
        };
    }

    private async checkLimit(
        featureName: feature,
        establishmentId: string,
        cost: number,
        label: string,
        tx?: any,
    ) {
        const { usage, limit } = await this.usageService.getUsageAndLimit(
            featureName,
            establishmentId,
            tx,
        );

        const passed = limit === null || usage + cost <= limit;
        let error: string | null = null;
        if (!passed) {
            error = `Target establishment plan only allows ${limit} ${label.toLowerCase()} (currently used: ${usage}, requested new: +${cost}).`;
        }

        return {
            feature: featureName,
            label,
            currentUsage: usage,
            cost,
            limit,
            passed,
            error,
        };
    }

    private async executeCloning(
        tx: any,
        sourceMenu: any,
        targetEstablishment: any,
        reuseExistingItemsBySku: boolean,
        missingLocales: string[],
    ) {
        const targetId = targetEstablishment.id;

        if (missingLocales.length > 0) {
            const updatedLanguages = [
                ...new Set([...(targetEstablishment.availableLanguages || []), ...missingLocales]),
            ];
            await tx.establishment.update({
                where: { id: targetId },
                data: { availableLanguages: updatedLanguages },
            });
        }

        const imageIdMap = new Map<string, string>();
        const uniqueImageIds = new Set<string>();

        for (const cat of sourceMenu.categories || []) {
            if (cat.imageId) uniqueImageIds.add(cat.imageId);
            for (const sub of cat.subcategories || []) {
                for (const pos of sub.items || []) {
                    if (pos.item) {
                        if (pos.item.imageId) uniqueImageIds.add(pos.item.imageId);
                        for (const vg of pos.item.itemVariantGroups || []) {
                            for (const v of vg.variants || []) {
                                if (v.imageId) uniqueImageIds.add(v.imageId);
                            }
                        }
                    }
                }
            }
        }

        const sourceImages = await tx.image.findMany({
            where: { id: { in: Array.from(uniqueImageIds) } },
        });

        for (const sourceImg of sourceImages) {
            const targetImg = await tx.image.create({
                data: {
                    cloudflareImageId: sourceImg.cloudflareImageId,
                    fileName: sourceImg.fileName,
                    url: sourceImg.url,
                    fileSize: sourceImg.fileSize,
                    metadata: sourceImg.metadata || undefined,
                    establishmentId: targetId,
                },
            });
            imageIdMap.set(sourceImg.id, targetImg.id);
        }


        const mapImageId = (id: string | null) => {
            if (!id) return null;
            return imageIdMap.get(id) || null;
        };

        const targetItems = await tx.item.findMany({
            where: { establishmentId: targetId, deletedAt: null },
        });
        const targetItemsBySku = new Map<string, any>();
        for (const ti of targetItems) {
            if (ti.sku) {
                targetItemsBySku.set(ti.sku.trim().toLowerCase(), ti);
            }
        }

        const uniqueSourceItemsMap = new Map<string, any>();
        for (const cat of sourceMenu.categories || []) {
            for (const sub of cat.subcategories || []) {
                for (const pos of sub.items || []) {
                    if (pos.item && !uniqueSourceItemsMap.has(pos.item.id)) {
                        uniqueSourceItemsMap.set(pos.item.id, pos.item);
                    }
                }
            }
        }
        const uniqueSourceItems = Array.from(uniqueSourceItemsMap.values());

        const itemIdMap = new Map<string, string>();
        const variantOptionIdMap = new Map<string, string>();
        const addonIdMap = new Map<string, string>();
        const itemVariantIdMap = new Map<string, string>();

        const itemsToCopy: any[] = [];
        for (const item of uniqueSourceItems) {
            const matchingSkuItem = item.sku ? targetItemsBySku.get(item.sku.trim().toLowerCase()) : null;
            if (reuseExistingItemsBySku && matchingSkuItem) {
                itemIdMap.set(item.id, matchingSkuItem.id);

                const targetVariants = await tx.itemVariant.findMany({
                    where: { itemVariantGroup: { itemId: matchingSkuItem.id } },
                    include: { variantOption: true },
                });

                for (const sourceVg of item.itemVariantGroups || []) {
                    for (const sourceV of sourceVg.variants || []) {
                        const sourceVoName = sourceV.variantOption?.translations?.[0]?.name;
                        const matchingTargetV = targetVariants.find((tv: any) => {
                            return tv.variantOption?.translations?.some(
                                (t: any) => t.name === sourceVoName,
                            ) || tv.variantOption?.id === sourceV.variantOption?.id;
                        });
                        if (matchingTargetV) {
                            itemVariantIdMap.set(sourceV.id, matchingTargetV.id);
                        }
                    }
                }
            } else {
                itemsToCopy.push(item);
            }
        }

        const uniqueVariantOptions = new Map<string, any>();
        const uniqueAddons = new Map<string, any>();

        for (const item of itemsToCopy) {
            for (const vg of item.itemVariantGroups || []) {
                for (const v of vg.variants || []) {
                    if (v.variantOption) {
                        uniqueVariantOptions.set(v.variantOption.id, v.variantOption);
                    }
                }
            }
            for (const mg of item.modifierGroups || []) {
                for (const opt of mg.options || []) {
                    if (opt.addon) {
                        uniqueAddons.set(opt.addon.id, opt.addon);
                    }
                }
            }
        }

        for (const vo of uniqueVariantOptions.values()) {
            if (vo.isGlobal) {
                variantOptionIdMap.set(vo.id, vo.id);
            } else {
                const newVo = await tx.variantOption.create({
                    data: {
                        establishmentId: targetId,
                        isGlobal: false,
                        isActive: vo.isActive,
                        quantity: vo.quantity,
                        unit: vo.unit,
                        translations: {
                            create: (vo.translations || []).map((t: any) => ({
                                locale: t.locale,
                                name: t.name,
                            })),
                        },
                    },
                });
                variantOptionIdMap.set(vo.id, newVo.id);
            }
        }

        for (const addon of uniqueAddons.values()) {
            if (addon.isGlobal) {
                addonIdMap.set(addon.id, addon.id);
            } else {
                const newAddon = await tx.addon.create({
                    data: {
                        establishmentId: targetId,
                        isGlobal: false,
                        isActive: addon.isActive,
                        translations: {
                            create: (addon.translations || []).map((t: any) => ({
                                locale: t.locale,
                                name: t.name,
                            })),
                        },
                    },
                });
                addonIdMap.set(addon.id, newAddon.id);
            }
        }

        for (const item of itemsToCopy) {
            const newItem = await tx.item.create({
                data: {
                    establishmentId: targetId,
                    basePrice: item.basePrice,
                    spiceLevel: item.spiceLevel,
                    marketingTag: item.marketingTag,
                    isFeatured: item.isFeatured,
                    hasAlcohol: item.hasAlcohol,
                    unit: item.unit,
                    quantity: item.quantity,
                    sku: item.sku,
                    status: item.status,
                    imageId: mapImageId(item.imageId),
                    taxTableId: item.taxTableId,
                    translations: {
                        create: (item.translations || []).map((t: any) => ({
                            locale: t.locale,
                            name: t.name,
                            shortDescription: t.shortDescription,
                            description: t.description,
                        })),
                    },
                    attributes: {
                        create: (item.attributes || []).map((attr: any) => ({
                            type: attr.type,
                        })),
                    },
                    allergens: {
                        create: (item.allergens || []).map((all: any) => ({
                            allergenId: all.allergenId,
                        })),
                    },
                    ...(item.nutritionInfo && {
                        nutritionInfo: {
                            create: {
                                calories: item.nutritionInfo.calories,
                                protein: item.nutritionInfo.protein,
                                fat: item.nutritionInfo.fat,
                                carbs: item.nutritionInfo.carbs,
                            },
                        },
                    }),
                },
            });
            itemIdMap.set(item.id, newItem.id);

            for (const vg of item.itemVariantGroups || []) {
                const newVg = await tx.itemVariantGroup.create({
                    data: {
                        itemId: newItem.id,
                        position: vg.position,
                        translations: {
                            create: (vg.translations || []).map((t: any) => ({
                                locale: t.locale,
                                name: t.name,
                            })),
                        },
                    },
                });

                for (const v of vg.variants || []) {
                    const mappedVoId = variantOptionIdMap.get(v.variantOption.id);
                    if (!mappedVoId) {
                        throw new Error(`VariantOption ${v.variantOption.id} not mapped`);
                    }

                    const newV = await tx.itemVariant.create({
                        data: {
                            itemId: newItem.id,
                            itemVariantGroupId: newVg.id,
                            price: v.price,
                            position: v.position,
                            isActive: v.isActive,
                            isDefault: v.isDefault,
                            imageId: mapImageId(v.imageId),
                            variantOptionId: mappedVoId,
                            allergens: {
                                create: (v.allergens || []).map((all: any) => ({
                                    allergenId: all.allergenId,
                                })),
                            },
                            ...(v.nutritionInfo && {
                                nutritionInfo: {
                                    create: {
                                        calories: v.nutritionInfo.calories,
                                        protein: v.nutritionInfo.protein,
                                        fat: v.nutritionInfo.fat,
                                        carbs: v.nutritionInfo.carbs,
                                    },
                                },
                            }),
                        },
                    });
                    itemVariantIdMap.set(v.id, newV.id);
                }
            }
        }

        for (const item of itemsToCopy) {
            const newItemId = itemIdMap.get(item.id)!;
            for (const mg of item.modifierGroups || []) {
                const newMg = await tx.itemModifierGroup.create({
                    data: {
                        itemId: newItemId,
                        position: mg.position,
                        minSelection: mg.minSelection,
                        maxSelection: mg.maxSelection,
                        displayMode: mg.displayMode,
                        isActive: mg.isActive,
                        translations: {
                            create: (mg.translations || []).map((t: any) => ({
                                locale: t.locale,
                                name: t.name,
                            })),
                        },
                    },
                });

                for (const opt of mg.options || []) {
                    let targetAddonId: string | null = null;
                    let targetItemVariantId: string | null = null;
                    let targetProductId: string | null = null;

                    if (opt.addon) {
                        targetAddonId = addonIdMap.get(opt.addon.id) || null;
                    }
                    if (opt.itemVariant) {
                        targetItemVariantId = itemVariantIdMap.get(opt.itemVariant.id) || null;
                    }
                    if (opt.product) {
                        targetProductId = itemIdMap.get(opt.product.id) || null;
                    }

                    await tx.itemModifierOption.create({
                        data: {
                            modifierGroupId: newMg.id,
                            price: opt.price,
                            position: opt.position,
                            defaultQuantity: opt.defaultQuantity,
                            minQuantity: opt.minQuantity,
                            maxQuantity: opt.maxQuantity,
                            addonId: targetAddonId,
                            itemVariantId: targetItemVariantId,
                            productId: targetProductId,
                        },
                    });
                }
            }
        }

        let newScheduleId: string | undefined;
        if (sourceMenu.schedule) {
            const createdSchedule = await tx.schedule.create({
                data: {
                    type: ScheduleType.MENU,
                    days: {
                        create: sourceMenu.schedule.days.map((day: any) => ({
                            dayOfWeek: day.dayOfWeek,
                            isOpen: day.isOpen,
                            intervals: {
                                create: day.intervals.map((interval: any) => ({
                                    startTime: interval.startTime,
                                    endTime: interval.endTime,
                                })),
                            },
                        })),
                    },
                },
            });
            newScheduleId = createdSchedule.id;
        }

        const targetMenuCount = await tx.menu.count({
            where: { establishmentId: targetId },
        });

        const duplicatedMenu = await tx.menu.create({
            data: {
                establishmentId: targetId,
                position: targetMenuCount,
                color: sourceMenu.color,
                isVisible: false,
                isVisibleOnMenuPage: sourceMenu.isVisibleOnMenuPage,
                isHighlighted: sourceMenu.isHighlighted,
                type: sourceMenu.type,
                price: sourceMenu.price,
                showImages: sourceMenu.showImages,
                maxItemsPerOrder: sourceMenu.maxItemsPerOrder,
                translations: {
                    create: sourceMenu.translations.map((t: any) => ({
                        locale: t.locale,
                        name: `${t.name} (Cópia)`,
                        description: t.description,
                        observations: t.observations,
                    })),
                },
                ...(newScheduleId && { scheduleId: newScheduleId }),
            },
        });

        for (const category of sourceMenu.categories || []) {
            const newCategory = await tx.menuCategory.create({
                data: {
                    menuId: duplicatedMenu.id,
                    position: category.position,
                    isVisible: category.isVisible,
                    imageId: mapImageId(category.imageId),
                    translations: {
                        create: (category.translations || []).map((t: any) => ({
                            locale: t.locale,
                            name: t.name,
                        })),
                    },
                },
            });

            for (const subcategory of category.subcategories || []) {
                const newSubcategory = await tx.menuSubcategory.create({
                    data: {
                        categoryId: newCategory.id,
                        position: subcategory.position,
                        isVisible: subcategory.isVisible,
                        translations: {
                            create: (subcategory.translations || []).map((t: any) => ({
                                locale: t.locale,
                                name: t.name,
                                description: t.description,
                            })),
                        },
                    },
                });

                const menuItemPositions = (subcategory.items || []).map((item: any) => {
                    const resolvedItemId = itemIdMap.get(item.itemId);
                    return resolvedItemId
                        ? {
                              itemId: resolvedItemId,
                              subcategoryId: newSubcategory.id,
                              position: item.position,
                              isVisible: item.isVisible,
                              isIncluded: item.isIncluded,
                          }
                        : null;
                }).filter(Boolean);

                if (menuItemPositions.length > 0) {
                    await tx.menuItemPosition.createMany({
                        data: menuItemPositions as any[],
                    });
                }
            }
        }

        return duplicatedMenu;
    }
}

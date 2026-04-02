import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateMenuDto, UpdateMenuPositionsDto, UpdateMenuDto } from '@weats/contracts';
import { Establishment } from '@weats/types';
import { FeatureUsageService } from '@weats/common/feature/feature-usage.service';
import { MENU_COLOR_PALETTE, normalizeSchedule } from '@weats/common';
import { CorePrismaService, EstablishmentLanguage, ScheduleType } from '@weats/database';

@Injectable()
export class MenuService {
    constructor(
        private readonly prisma: CorePrismaService,
        private usageService: FeatureUsageService,
    ) { }

    async listMenus(establishment: Establishment) {
        try {
            const menus = await this.prisma.menu.findMany({
                where: { establishmentId: establishment.id },
                orderBy: { position: 'asc' },
                select: {
                    id: true,
                    isVisible: true,
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
                    position: menu.position,
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
                position: menu.position,
                color: menu.color,
                isHighlighted: menu.isHighlighted,
                translations: menu.translations,
                schedule: menu.schedule ? normalizeSchedule(menu.schedule) : null,
            };
        } catch (error) {
            console.error('Error getting menu details:', error);
            throw error;
        }
    }

    async createMenu(createMenuDto: CreateMenuDto, establishmentId: string) {
        try {
            const { translations, schedule } = createMenuDto;
            console.log(createMenuDto)
            const menuCount = await this.prisma.menu.count({
                where: { establishmentId },
            });

            // Pick a random color if not provided
            const selectedColor =
                MENU_COLOR_PALETTE[
                Math.floor(Math.random() * MENU_COLOR_PALETTE.length)
                ];

            return await this.prisma.$transaction(async (prisma) => {
                let scheduleId: string | undefined;
                if (schedule) {
                    const createdSchedule = await prisma.schedule.create({
                        data: {
                            name: schedule.name || '',
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

                const menuCount = await prisma.menu.count({ where: { establishmentId } });
                const selectedColor = MENU_COLOR_PALETTE[Math.floor(Math.random() * MENU_COLOR_PALETTE.length)];

                const menu = await prisma.menu.create({
                    data: {
                        establishmentId,
                        position: menuCount + 1,
                        color: selectedColor,
                        translations: { create: translations },
                        ...(scheduleId && { scheduleId }),
                    },
                    select: {
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
        } catch (error) {
            console.error('Error creating menu:', error);
            throw error;
        }
    }

    async updateMenuSettings(
        menuId: string,
        updateMenuDto: UpdateMenuDto,
        establishment: Establishment,
    ) {
        try {
            const { isVisible, color, isHighlighted } = updateMenuDto;
            const menu = await this.prisma.menu.update({
                where: { id: menuId },
                data: {
                    isVisible,
                    color,
                    isHighlighted,
                },
                select: {
                    id: true,
                    isVisible: true,
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

            return {
                id: menu.id,
                isVisible: menu.isVisible,
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

    async updateMenuContent(
        menuId: string,
        createMenuDto: CreateMenuDto,
        establishment: Establishment,
    ) {
        try {
            const { translations, schedule } = createMenuDto;
            await this.prisma.menu.update({
                where: { id: menuId },
                data: {
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
                            name: schedule.name,
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

            return this.getMenuDetails(menuId, establishment);
        } catch (error) {
            console.error('Error updating menu details:', error);
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

            return { success: true };
        } catch (error) {
            console.error('Error updating menu positions:', error);
            throw error;
        }
    }

    async deleteMenu(menuId: string) {
        try {
            return await this.prisma.$transaction(async (tx) => {
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

                return { success: true, remainingMenus };
            });
        } catch (error) {
            console.error('Error deleting menu:', error);
            if (error instanceof NotFoundException) throw error;
            throw new BadRequestException('Error deleting menu');
        }
    }


    /**
     * Returns the complete menu tree in a single query:
     * categories → subcategories → items (with variants, modifiers, allergens, attributes).
     *
     * Loading everything upfront avoids per-section round trips, keeping the
     * catalog fluid even when the user swipes through sections rapidly.
     */
    async getMenuContent(menuId: string, lang: EstablishmentLanguage) {
        try {
            const menu = await this.prisma.menu.findFirst({
                where: { id: menuId },
                select: {
                    id: true,
                    type: true,
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
                                                    // Image
                                                    image: {
                                                        select: { url: true },
                                                    },
                                                    // Translation
                                                    translations: {
                                                        where: { locale: lang },
                                                        select: {
                                                            name: true,
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
                                                                            type: true,
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
                throw new NotFoundException('Menu not found');
            }

            return menu;
        } catch (error) {
            console.error('Error getting menu content:', error);
            throw error;
        }
    }

}

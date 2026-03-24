import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateMenuDto, UpdateMenuPositionsDto, UpdateMenuDto } from '@weats/contracts';
import { Establishment } from '@weats/types';
import { FeatureUsageService } from '@weats/common/feature/feature-usage.service';
import { MENU_COLOR_PALETTE } from '@weats/common';
import { CorePrismaService, ScheduleType } from '@weats/database';

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
                    menuSchedule: {
                        select: {
                            schedule: {
                                select: {
                                    dayOfWeek: true,
                                    openTime: true,
                                    closeTime: true,
                                },
                            },
                        },
                    },
                },
            });

            const { usage, limit } = await this.usageService.getUsageAndLimit(
                'menu',
                establishment.id,
            );

            // Transform data
            const menuList = menus.map((menu) => {
                const schedules = menu.menuSchedule.map((ms) => ({
                    dayOfWeek: ms.schedule.dayOfWeek,
                    openTime: ms.schedule.openTime,
                    closeTime: ms.schedule.closeTime,
                }));

                return {
                    id: menu.id,
                    isVisible: menu.isVisible,
                    position: menu.position,
                    color: menu.color,
                    isHighlighted: menu.isHighlighted,
                    translations: menu.translations,
                    menuSchedule: schedules, // Return as array to match frontend schema
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
                select: {
                    id: true,
                    isVisible: true,
                    position: true,
                    color: true,
                    isHighlighted: true,
                    translations: {
                        select: {
                            locale: true,
                            name: true,
                            description: true,
                            observations: true,
                        },
                    },
                    menuSchedule: {
                        select: {
                            schedule: {
                                select: {
                                    dayOfWeek: true,
                                    openTime: true,
                                    closeTime: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { position: 'asc' },
            });
            if (!menu) {
                throw new NotFoundException('Menu not found');
            }
            const schedules = menu.menuSchedule.map((ms) => ({
                dayOfWeek: ms.schedule.dayOfWeek,
                openTime: ms.schedule.openTime,
                closeTime: ms.schedule.closeTime,
            }));
            return {
                id: menu.id,
                isVisible: menu.isVisible,
                position: menu.position,
                color: menu.color,
                isHighlighted: menu.isHighlighted,
                translations: menu.translations,
                menuSchedule: schedules, // Return as array to match frontend schema
            };
        } catch (error) {
            console.error('Error getting menu details:', error);
            throw error;
        }
    }

    async createMenu(createMenuDto: CreateMenuDto, establishmentId: string) {
        try {
            const { translations, menuSchedule } = createMenuDto;

            const menuCount = await this.prisma.menu.count({
                where: { establishmentId },
            });

            // Pick a random color if not provided
            const selectedColor =
                MENU_COLOR_PALETTE[
                Math.floor(Math.random() * MENU_COLOR_PALETTE.length)
                ];

            const menu = await this.prisma.menu.create({
                data: {
                    establishmentId,
                    position: menuCount + 1,
                    color: selectedColor,
                    translations: {
                        create: translations,
                    },
                    menuSchedule: {
                        create: menuSchedule.map((schedule) => ({
                            schedule: {
                                create: {
                                    openTime: schedule.openTime,
                                    closeTime: schedule.closeTime,
                                    dayOfWeek: schedule.dayOfWeek,
                                    type: ScheduleType.MENU,
                                },
                            },
                        })),
                    },
                },
            });
            return menu;
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
                    menuSchedule: {
                        select: {
                            schedule: {
                                select: {
                                    dayOfWeek: true,
                                    openTime: true,
                                    closeTime: true,
                                },
                            },
                        },
                    },
                },
            });

            const schedules = menu.menuSchedule.map((ms) => ({
                dayOfWeek: ms.schedule.dayOfWeek,
                openTime: ms.schedule.openTime,
                closeTime: ms.schedule.closeTime,
            }));

            return {
                id: menu.id,
                isVisible: menu.isVisible,
                position: menu.position,
                color: menu.color,
                isHighlighted: menu.isHighlighted,
                translations: menu.translations,
                menuSchedule: schedules, // Return as array to match frontend schema
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
            const { translations, menuSchedule } = createMenuDto;
            const menu = await this.prisma.menu.update({
                where: { id: menuId },
                data: {
                    // Update translations
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
                        // Update menu schedule
                    },
                },
            });

            // Find existing schedules for this menu
            const existingMenuSchedules = await this.prisma.menuSchedule.findMany({
                where: { menuId },
                select: { scheduleId: true },
            });

            const scheduleIdsToDelete = existingMenuSchedules.map(
                (ms) => ms.scheduleId,
            );

            // Create new schedule entries
            // Delete existing MenuSchedule entries
            await this.prisma.menuSchedule.deleteMany({
                where: { menuId },
            });

            // Cleanup orphan schedules
            if (scheduleIdsToDelete.length > 0) {
                await this.prisma.schedule.deleteMany({
                    where: { id: { in: scheduleIdsToDelete } },
                });
            }

            for (const schedule of menuSchedule) {
                await this.prisma.menuSchedule.create({
                    data: {
                        menu: { connect: { id: menuId } },
                        schedule: {
                            create: {
                                openTime: schedule.openTime,
                                closeTime: schedule.closeTime,
                                dayOfWeek: schedule.dayOfWeek,
                                type: ScheduleType.MENU,
                            },
                        },
                    },
                });
            }
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

                // 2. Find schedules to delete
                const menuSchedules = await tx.menuSchedule.findMany({
                    where: { menuId },
                    select: { scheduleId: true },
                });
                const scheduleIds = menuSchedules.map((ms) => ms.scheduleId);

                // 3. Delete the menu
                await tx.menu.delete({ where: { id: menuId } });

                // 4. Cleanup orphan schedules
                if (scheduleIds.length > 0) {
                    await tx.schedule.deleteMany({
                        where: { id: { in: scheduleIds } },
                    });
                }

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


}

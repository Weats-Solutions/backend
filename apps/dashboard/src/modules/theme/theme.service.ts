import { Injectable } from '@nestjs/common';
import { CorePrismaService } from '@weats/database';
import { RpcException } from '@nestjs/microservices';
import { ERRORS } from '@weats/common';
import { CreateThemeDto } from '@weats/contracts';
import { Establishment } from '@weats/types';
import { CacheService } from '@weats/cache';


@Injectable()
export class ThemeService {
    constructor(
        private readonly prisma: CorePrismaService,
        private readonly cacheService: CacheService,
    ) { }

    async createTheme(createThemeDto: CreateThemeDto, establishment: Establishment) {
        try {
            const { name, config } = createThemeDto;
            const theme = await this.prisma.theme.create({
                data: {
                    name,
                    config: config as any,
                    establishment: {
                        connect: { id: establishment.id },
                    },
                },
            });
            return {
                ...theme,
                isActive: false
            };
        } catch (error) {
            if (error instanceof RpcException) throw error;
            console.log(error);
            throw new RpcException({
                status: 400,
                message: ERRORS.BAD_REQUEST,
                code: ERRORS.BAD_REQUEST,
            });
        }
    }

    async getAllThemes(establishmentId: string) {
        try {
            const themes = await this.prisma.theme.findMany({
                where: {
                    OR: [
                        { isDefault: true },
                        { establishmentId: establishmentId }
                    ]
                },
                select: {
                    id: true,
                    name: true,
                    config: true,
                    isDefault: true,
                    establishmentId: true,
                    activeEstablishments: {
                        where: { id: establishmentId },
                        select: { id: true }
                    }
                }
            });

            return themes.map(({ activeEstablishments, ...theme }) => ({
                ...theme,
                isActive: activeEstablishments.length > 0
            }));
        } catch (error) {
            if (error instanceof RpcException) throw error;
            console.log(error);
            throw new RpcException({
                status: 400,
                message: ERRORS.BAD_REQUEST,
                code: ERRORS.BAD_REQUEST,
            });
        }
    }

    async getThemeById(themeId: string, establishmentId: string) {
        try {
            const theme = await this.prisma.theme.findFirst({
                where: {
                    id: themeId,
                    OR: [
                        { establishmentId: establishmentId },
                        { isDefault: true }
                    ]
                },
                select: {
                    id: true,
                    name: true,
                    config: true,
                    isDefault: true,
                }
            });

            return theme;
        } catch (error) {
            if (error instanceof RpcException) throw error;
            console.log(error);
            throw new RpcException({
                status: 400,
                message: ERRORS.BAD_REQUEST,
                code: ERRORS.BAD_REQUEST,
            });
        }
    }

    async getActiveTheme(establishmentId: string) {
        try {
            const establishment = await this.prisma.establishment.findUnique({
                where: { id: establishmentId },
                select: {
                    activeTheme: {
                        select: {
                            name: true,
                            config: true,
                            isDefault: true,
                        }
                    },
                },
            });

            if (!establishment?.activeTheme) {
                throw new RpcException({
                    status: 404,
                    code: 404,
                    message: ERRORS.NOT_FOUND,
                });
            }

            return establishment.activeTheme;
        } catch (error) {
            if (error instanceof RpcException) throw error;
            console.log(error);
            throw new RpcException({
                status: 400,
                message: ERRORS.BAD_REQUEST,
                code: ERRORS.BAD_REQUEST,
            });
        }
    }

    async updateTheme(themeId: string, updateThemeSettingsDto: CreateThemeDto, establishment: Establishment) {
        try {
            const { name, config } = updateThemeSettingsDto;

            const updatedTheme = await this.prisma.theme.update({
                where: {
                    id: themeId,
                    establishmentId: establishment.id,
                    isDefault: false,
                },
                data: { name, config: config as any },
                include: {
                    activeEstablishments: {
                        where: { id: establishment.id },
                        select: { slug: true }
                    }
                }
            });

            if (updatedTheme.activeEstablishments.length > 0) {
                const slug = updatedTheme.activeEstablishments[0].slug;
                await this.cacheService.clearCatalogEstablishmentCache(slug);
                await this.cacheService.clearDashboardEstablishmentCache(establishment.id);
            }

            return {
                ...updatedTheme,
                isActive: updatedTheme.activeEstablishments.length > 0
            };
        } catch (error) {
            if (error.code === 'P2025') {
                throw new RpcException({
                    status: 404,
                    message: ERRORS.NOT_FOUND,
                    code: 404,
                });
            }
            if (error instanceof RpcException) throw error;
            console.error(error);
            throw new RpcException({
                status: 400,
                message: 'Erro ao atualizar o tema.',
            });
        }
    }


    async setActiveTheme(establishmentId: string, themeId: string) {
        try {

            // Verify theme exists
            const theme = await this.prisma.theme.findFirst({
                where: {
                    id: themeId,
                    OR: [
                        { establishmentId: establishmentId },
                        { isDefault: true }
                    ]
                },
                select: { id: true, name: true, config: true }
            });

            if (!theme) {
                throw new RpcException({
                    status: 404,
                    message: ERRORS.NOT_FOUND,
                    code: 404,
                });
            }

            // Update establishment's active theme
            const establishment = await this.prisma.establishment.update({
                where: { id: establishmentId },
                data: {
                    activeThemeId: themeId,
                },
                select: { slug: true }
            });

            await this.cacheService.clearCatalogEstablishmentCache(establishment.slug);
            await this.cacheService.clearDashboardEstablishmentCache(establishmentId);
            return theme;
        } catch (error) {
            if (error instanceof RpcException) throw error;
            console.log(error);
            throw new RpcException({
                status: 400,
                message: ERRORS.BAD_REQUEST,
                code: ERRORS.BAD_REQUEST,
            });
        }
    }

}

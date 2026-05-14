import { Injectable } from '@nestjs/common';
import { CorePrismaService, Schedule } from '@weats/database';
import { EstablishmentLanguage } from '@weats/database';
import { RpcException } from '@nestjs/microservices';
import { ERRORS, normalizeSchedule } from '@weats/common';
import { UpdateThemeSettingsDto } from '@weats/contracts/dashboard/dtos/theme/update-theme-settings.dto';
import { Establishment, EupagoMultibancoResponse } from '@weats/types';
import { AppConfigService } from '@weats/configs/app-config.service';
import { MenuService } from '../menu/menu.service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { isScheduleOpenNow } from '@weats/common/utils/schedule.utils';
import { CacheService } from '@weats/cache';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class LandingpageService {
    constructor(
        private readonly prisma: CorePrismaService,
        private readonly appConfigService: AppConfigService,
        private readonly menuService: MenuService,
        private readonly cacheService: CacheService,
    ) { }

    async getActiveTheme(payload: { establishmentId: string }) {
        try {
            const establishment = await this.prisma.establishment.findUnique({
                where: { id: payload.establishmentId },
                select: {
                    activeTheme: {
                        select: {
                            name: true,
                            config: true,
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

    async updateTheme(payload: { updateThemeSettingsDto: UpdateThemeSettingsDto, establishment: Establishment }) {
        try {
            const { updateThemeSettingsDto, establishment } = payload;
            const { name, config, themeId } = updateThemeSettingsDto;

            let theme;
            let shouldClearCache = false;

            if (themeId) {
                // Criar novo tema
                theme = await this.prisma.theme.create({
                    data: {
                        name,
                        config,
                        establishment: {
                            connect: { id: establishment.id },
                        },
                    },
                });

                // Ao criar e definir como ativo, a cache deve ser limpa
                await this.prisma.establishment.update({
                    where: { id: establishment.id },
                    data: { activeThemeId: theme.id },
                });

                shouldClearCache = true;
            } else {
                // Atualizar tema existente
                const existingEstablishment = await this.prisma.establishment.findUnique({
                    where: { id: establishment.id },
                    select: { activeThemeId: true }, // Buscar o ID ativo diretamente
                });

                if (existingEstablishment?.activeThemeId) {
                    theme = await this.prisma.theme.update({
                        where: { id: existingEstablishment.activeThemeId },
                        data: { name, config },
                    });

                    // Se atualizámos o tema que está ativo, marcamos para limpar cache
                    shouldClearCache = true;
                } else {
                    // Fallback: criar novo se não existir ativo
                    theme = await this.prisma.theme.create({
                        data: {
                            name,
                            config,
                            establishment: { connect: { id: establishment.id } },
                        },
                    });

                    await this.prisma.establishment.update({
                        where: { id: establishment.id },
                        data: { activeThemeId: theme.id },
                    });

                    shouldClearCache = true;
                }
            }

            // Só limpa a cache se o tema afetado for o tema ativo do estabelecimento
            if (shouldClearCache) {
                this.cacheService.clearCoreCache(establishment.slug);
            }

            return theme;
        } catch (error) {
            if (error instanceof RpcException) throw error;
            console.error(error);
            throw new RpcException({
                status: 400,
                message: 'Erro ao atualizar o tema.',
            });
        }
    }

    async getAvailableThemes(payload: { establishmentId: string }) {
        try {
            const themes = await this.prisma.theme.findMany({
                where: {
                    OR: [
                        { isDefault: true },
                        { establishmentId: payload.establishmentId }
                    ]
                },
                select: {
                    id: true,
                    name: true,
                    config: true,
                    isDefault: true,
                    establishmentId: true,
                }
            });

            return themes;
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

    async setActiveTheme(payload: { establishmentId: string; themeId: string }) {
        try {
            const { establishmentId, themeId } = payload;

            // Verify theme exists
            const theme = await this.prisma.theme.findUnique({
                where: { id: themeId },
                select: { id: true, name: true, config: true }
            });

            if (!theme) {
                throw new RpcException({
                    status: 404,
                    message: ERRORS.NOT_FOUND,
                    code: ERRORS.NOT_FOUND,
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

            // Clear menu cache
            this.cacheService.clearCoreCache(establishment.slug);
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

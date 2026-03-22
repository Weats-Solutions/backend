import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CorePrismaService } from '@weats/database';
import { EstablishmentLanguage } from '@weats/database';
import { RpcException } from '@nestjs/microservices';
import { ERRORS } from '@weats/common';
import { UpdateThemeSettingsDto } from '@weats/contracts/dashboard/dtos/theme/update-theme-settings.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Establishment, EupagoMultibancoResponse } from '@weats/types';
import { AppConfigService } from '@weats/configs/app-config.service';

@Injectable()
export class LandingpageService {
    constructor(
        private readonly prisma: CorePrismaService,
        private readonly http: HttpService,
        private readonly appConfigService: AppConfigService,

        //@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) { }

    async getLandingpage(establishmentSlug: string, lang: string) {
        try {
            const establishment = await this.prisma.establishment.findUnique({
                where: { slug: establishmentSlug },
                include: {
                    activeTheme: {
                        select: {
                            id: true,
                            name: true,
                            config: true,
                        }
                    },
                    logoImage: true,
                    bannerImage: true,
                },

            });

            if (!establishment) {
                throw new RpcException({
                    status: 404,
                    message: ERRORS.ESTABLISHMENT_NOT_FOUND,
                    code: ERRORS.ESTABLISHMENT_NOT_FOUND,
                });
            }


            if (
                !Object.values(
                    establishment.availableLanguages,
                ).includes(lang as EstablishmentLanguage)
            ) {
                lang = establishment.primaryLanguage;
            }

            //const cacheKey = cacheKeys.landingPage(establishmentSlug, lang);

            // Try to get from cache
            //const cached = await this.cacheManager.get(cacheKey);
            //if (cached) {
            //  return cached;
            //}
            const menus = await this.prisma.menu.findMany({
                where: { establishmentId: establishment.id },
                select: {
                    id: true,
                    isHighlighted: true,
                    translations: {
                        where: { locale: lang },
                    },
                },
            });


            const result = {
                name: establishment.name,
                themeName: establishment.activeTheme?.name,
                themeConfig: establishment.activeTheme?.config,
                logo: establishment.logoImage?.url || null,
                banner: establishment.bannerImage?.url || null,
                primaryLanguage: establishment.primaryLanguage,
                availableLocales:
                    establishment.availableLanguages,
                menus: menus || [],
            };

            //await this.cacheManager.set(cacheKey, result, cacheTTL.FIVE_MINUTES);

            return result;
        } catch (error) {
            throw new RpcException({
                status: 400,
                message: ERRORS.BAD_REQUEST,
                code: ERRORS.BAD_REQUEST,
            });
        }
    }

    async getTheme(payload: { establishmentId: string }) {
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

            return establishment?.activeTheme ?? null;
        } catch (error) {
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
            const { name, config } = updateThemeSettingsDto;

            const existingEstablishment = await this.prisma.establishment.findUnique({
                where: { id: establishment.id },
                select: {
                    activeTheme: {
                        select: {
                            id: true,
                        }
                    },
                },
            });

            let theme;

            if (existingEstablishment?.activeTheme) {
                // Update existing theme
                theme = await this.prisma.theme.update({
                    where: { id: existingEstablishment.activeTheme.id },
                    data: { name, config },
                });
            } else {
                // Create new theme and set it as the active theme
                theme = await this.prisma.theme.create({
                    data: {
                        name,
                        config,
                        establishment: {
                            connect: { id: establishment.id },
                        },
                    },
                });

                await this.prisma.establishment.update({
                    where: { id: establishment.id },
                    data: { activeThemeId: theme.id },
                });
            }

            const { data } = await firstValueFrom(
                this.http.post(
                    "https://menu.weats.pro/api/clear-cache",
                    {
                        slug: establishment.slug,
                    }
                ),
            );

            return theme;
        } catch (error) {
            console.log(error);
            throw new RpcException({
                status: 400,
                message: ERRORS.BAD_REQUEST,
                code: ERRORS.BAD_REQUEST,
            });
        }
    }

}

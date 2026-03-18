import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CorePrismaService } from '@weats/database';
import { EstablishmentLanguage } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { ERRORS } from '@weats/common';

@Injectable()
export class LandingpageService {
    constructor(
        private readonly prisma: CorePrismaService,
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

}

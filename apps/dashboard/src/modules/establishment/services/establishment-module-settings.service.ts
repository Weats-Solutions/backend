import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CacheService } from '@weats/cache';
import { ERRORS } from '@weats/common';
import { FeatureUsageService } from '@weats/common/feature/feature-usage.service';
import { UpdateEstablishmentModuleSettingsDto } from '@weats/contracts/dashboard/dtos/establishment/settings/update-establishment-module-settings.dto';
import { CorePrismaService } from '@weats/database';
import { feature } from '@weats/types';

@Injectable()
export class EstablishmentModuleSettingsService {
    private readonly logger = new Logger(EstablishmentModuleSettingsService.name);

    constructor(
        private readonly prisma: CorePrismaService,
        private readonly cacheService: CacheService,
        private readonly featureUsageService: FeatureUsageService,
    ) { }

    async getEstablishmentModuleSettings(id: string) {
        return await this.prisma.establishment.findUnique({
            where: { id },
            select: {
                myPageModule: true,
                menusModule: true,
                callStaffModule: true,
                callStaffOptions: true,
            }
        })
    }

    async updateEstablishmentModuleSettings(id: string, updateEstablishmentModuleSettingsDto: UpdateEstablishmentModuleSettingsDto) {
        if (updateEstablishmentModuleSettingsDto.callStaffModule) {
            const { enabled } = await this.featureUsageService.getUsageAndLimit(
                feature.call_staff,
                id,
            );
            if (!enabled) {
                throw new BadRequestException({
                    message: 'Feature call staff not enabled for your plan',
                    code: ERRORS.FEATURE_NOT_ENABLED,
                });
            }
        }

        try {
            const establishment = await this.prisma.establishment.update({
                where: { id },
                data: {
                    myPageModule: updateEstablishmentModuleSettingsDto.myPageModule,
                    menusModule: updateEstablishmentModuleSettingsDto.menusModule,
                    callStaffModule: updateEstablishmentModuleSettingsDto.callStaffModule,
                    ...(updateEstablishmentModuleSettingsDto.callStaffOptions !== undefined && {
                        callStaffOptions: updateEstablishmentModuleSettingsDto.callStaffOptions,
                    }),
                },
                select: {
                    slug: true,
                    myPageModule: true,
                    menusModule: true,
                    callStaffModule: true,
                    callStaffOptions: true,
                }
            })

            await this.cacheService.clearCatalogEstablishmentCache(establishment.slug);
            await this.cacheService.clearDashboardEstablishmentCache(id);

            return {
                myPageModule: establishment.myPageModule,
                menusModule: establishment.menusModule,
                callStaffModule: establishment.callStaffModule,
                callStaffOptions: establishment.callStaffOptions,
            }
        } catch (error) {
            this.logger.error(`Failed to update establishment module settings: ${error}`);
            throw new BadRequestException(ERRORS.BAD_REQUEST);
        }
    }
}





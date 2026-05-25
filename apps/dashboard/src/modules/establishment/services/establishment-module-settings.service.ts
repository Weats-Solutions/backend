import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CacheService } from '@weats/cache';
import { ERRORS } from '@weats/common';
import { UpdateEstablishmentModuleSettingsDto } from '@weats/contracts/dashboard/dtos/establishment/settings/update-establishment-module-settings.dto';
import { CorePrismaService } from '@weats/database';

@Injectable()
export class EstablishmentModuleSettingsService {
    private readonly logger = new Logger(EstablishmentModuleSettingsService.name);

    constructor(
        private readonly prisma: CorePrismaService,
        private readonly cacheService: CacheService
    ) { }

    async getEstablishmentModuleSettings(id: string) {
        return await this.prisma.establishment.findUnique({
            where: { id },
            select: {
                myPageModule: true,
                menusModule: true,
                callStaffModule: true,
            }
        })
    }

    async updateEstablishmentModuleSettings(id: string, updateEstablishmentModuleSettingsDto: UpdateEstablishmentModuleSettingsDto) {
        try {
            const establishment = await this.prisma.establishment.update({
                where: { id },
                data: {
                    myPageModule: updateEstablishmentModuleSettingsDto.myPageModule,
                    menusModule: updateEstablishmentModuleSettingsDto.menusModule,
                    callStaffModule: updateEstablishmentModuleSettingsDto.callStaffModule,
                },
                select: {
                    slug: true,
                    myPageModule: true,
                    menusModule: true,
                    callStaffModule: true,
                }
            })

            await this.cacheService.clearEstablishmentCache(establishment.slug)

            return {
                myPageModule: establishment.myPageModule,
                menusModule: establishment.menusModule,
                callStaffModule: establishment.callStaffModule,
            }
        } catch (error) {
            this.logger.error(`Failed to update establishment module settings: ${error}`);
            throw new BadRequestException(ERRORS.BAD_REQUEST);
        }
    }
}





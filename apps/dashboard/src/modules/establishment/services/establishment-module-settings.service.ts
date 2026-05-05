import { Injectable, Logger } from '@nestjs/common';
import { UpdateEstablishmentModuleSettingsDto } from '@weats/contracts/dashboard/dtos/establishment/settings/update-establishment-module-settings.dto';
import { CorePrismaService } from '@weats/database';

@Injectable()
export class EstablishmentModuleSettingsService {
    private readonly logger = new Logger(EstablishmentModuleSettingsService.name);

    constructor(
        private readonly prisma: CorePrismaService,
    ) { }

    async getEstablishmentModuleSettings(id: string) {
        return await this.prisma.establishment.findUnique({
            where: { id },
            select: {
                myPageModule: true,
                callStaffModule: true,
            }
        })
    }

    async updateEstablishmentModuleSettings(id: string, updateEstablishmentModuleSettingsDto: UpdateEstablishmentModuleSettingsDto) {
        return await this.prisma.establishment.update({
            where: { id },
            data: {
                myPageModule: updateEstablishmentModuleSettingsDto.myPageModule,
                callStaffModule: updateEstablishmentModuleSettingsDto.callStaffModule,
            }
        })
    }
}





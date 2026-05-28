import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Inject,
} from '@nestjs/common';
import { ClerkGuard, EstablishmentStaffGuard, CurrentEstablishment, CurrentUser, Roles, DASHBOARD_SERVICE, DASHBOARD_PATTERNS, RateLimit } from '@weats/common';
import { Establishment, User } from '@weats/types';
import { GenerateQrCodesDto, UpdateQrCodeDto } from '@weats/contracts';
import { EmployeeRoles } from '@weats/database';
import { ClientProxy } from '@nestjs/microservices';

@Controller('zones/qr-codes')

export class QrCodesController {
    constructor(@Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy) { }

    @Get()
    async getQrCodes(
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.QR_GET_ALL, {
            establishmentId: establishment.id,
        });
    }

    @Roles(EmployeeRoles.MANAGER)
    @Post('generate')
    @RateLimit('STRICT') // 5 req/min — job pesado: gera ZIPs, envia email, consome Redis
    async generateQrCodes(
        @CurrentEstablishment() establishment: Establishment,
        @CurrentUser() user: User,
        @Body() dto: GenerateQrCodesDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.QR_GENERATE, {
            dto,
            establishment,
            userEmail: user.email,
        });
    }

    @Roles(EmployeeRoles.MANAGER)
    @Patch(':id')
    async updateQrCode(
        @Param('id') id: string,
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: UpdateQrCodeDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.QR_UPDATE, {
            id,
            dto,
            establishment,
        });
    }

    @Roles(EmployeeRoles.MANAGER)
    @Delete(':id')
    async deleteQrCode(
        @Param('id') id: string,
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.QR_DELETE, {
            id,
            establishment,
        });
    }
}

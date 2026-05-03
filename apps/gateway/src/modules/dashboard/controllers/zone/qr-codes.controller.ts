import {
    Controller,
    Post,
    Body,
    UseGuards,
    Inject,
} from '@nestjs/common';
import { ClerkGuard, EstablishmentStaffGuard, CurrentEstablishment, CurrentUser, Roles, DASHBOARD_SERVICE, DASHBOARD_PATTERNS } from '@weats/common';
import { Establishment, User } from '@weats/types';
import { GenerateQrCodesDto } from '@weats/contracts';
import { EmployeeRoles } from '@weats/database';
import { ClientProxy } from '@nestjs/microservices';

@Controller('zones/qr-codes')
@UseGuards(ClerkGuard, EstablishmentStaffGuard)
export class QrCodesController {
    constructor(@Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy) { }

    @Roles(EmployeeRoles.MANAGER)
    @UseGuards(ClerkGuard, EstablishmentStaffGuard)
    @Post('generate')
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
}

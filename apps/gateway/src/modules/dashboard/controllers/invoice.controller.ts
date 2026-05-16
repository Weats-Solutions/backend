import {
    Controller,
    Get,
    Inject,
    Param,
    UseGuards,
    ForbiddenException,
} from '@nestjs/common';
import {
    ClerkGuard,
    CurrentEstablishment,
    EstablishmentStaffGuard,
    DASHBOARD_SERVICE,
    ERRORS,
} from '@weats/common';
import type { Establishment } from '@weats/types';
import { ClientProxy } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';

@Controller('invoices')
export class InvoiceController {
    constructor(
        @Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy,
    ) { }


    @Get(':establishmentId')
    getInvoices(
        @Param('establishmentId') establishmentId: string,
        @CurrentEstablishment() establishment: Establishment,
    ) {
        // Verify that the user has access to this establishment
        if (establishment.id !== establishmentId) {
            throw new ForbiddenException({
                message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
                code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
            });
        }

        return this.dashboardClient.send(
            DASHBOARD_PATTERNS.ESTABLISHMENT_GET_INVOICES,
            { establishmentId },
        );
    }
}

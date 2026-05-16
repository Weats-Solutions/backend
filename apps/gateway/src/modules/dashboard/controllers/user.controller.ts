import {
    Controller,
    Get,
    Inject,
    UseGuards,
} from '@nestjs/common';
import {
    ClerkGuard,
    CurrentUser,
    CurrentEstablishment,
    EstablishmentStaffGuard,
    DASHBOARD_SERVICE,
    SkipActiveSubscription,
    SkipEstablishmentStaff,
} from '@weats/common';
import type { Establishment, User } from '@weats/types';
import { ClientProxy } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';

@Controller('users')
export class UserController {
    constructor(
        @Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy,
    ) { }

    @SkipActiveSubscription()
    @SkipEstablishmentStaff()
    @Get('establishments')
    getEstablishments(@CurrentUser() user: User) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.USER_GET_ESTABLISHMENTS, { user });
    }

    @SkipActiveSubscription()
    @Get('manage-subscription')
    manageSubscription(@CurrentEstablishment() establishment: Establishment) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.USER_MANAGE_SUBSCRIPTION, { establishment });
    }
}

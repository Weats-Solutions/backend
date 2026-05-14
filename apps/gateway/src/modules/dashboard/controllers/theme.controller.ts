import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ClerkGuard } from "@weats/common/guards/clerk.guard";
import { EstablishmentStaffGuard } from "@weats/common/guards/establishment-staff.guard";
import { CurrentEstablishment } from "@weats/common/decorators/current-establishment.decorator";
import { Establishment } from "@weats/types";
import { ClientProxy } from "@nestjs/microservices";
import { Inject } from "@nestjs/common";
import { DASHBOARD_SERVICE } from "@weats/common";
import { DASHBOARD_PATTERNS } from "@weats/common/patterns/dashboard.patterns";
import { UpdateThemeSettingsDto } from "@weats/contracts";

@Controller('themes')
export class ThemeController {
    constructor(
        @Inject(DASHBOARD_SERVICE)
        private readonly dashboardClient: ClientProxy,
    ) { }
    @UseGuards(ClerkGuard, EstablishmentStaffGuard)

    @Get()
    async getThemes(
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.THEME_GET_AVAILABLE, { establishmentId: establishment.id });
    }
    @UseGuards(ClerkGuard, EstablishmentStaffGuard)
    @Get('active')
    async getActiveTheme(
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.THEME_GET_ACTIVE, { establishmentId: establishment.id });
    }

    @Get(':themeId')
    async getThemeById(
        @Param('themeId') themeId: string,
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.THEME_GET_BY_ID, { themeId, establishmentId: establishment.id });
    }

    @UseGuards(ClerkGuard, EstablishmentStaffGuard)
    @Post()
    async updateThemeSettings(
        @Body() updateThemeSettingsDto: UpdateThemeSettingsDto,
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.THEME_UPDATE, { updateThemeSettingsDto, establishment });
    }

    @UseGuards(ClerkGuard, EstablishmentStaffGuard)
    @Post('set-active')
    async setActiveTheme(
        @Body() body: { themeId: string },
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.THEME_SET_ACTIVE, { establishmentId: establishment.id, themeId: body.themeId });
    }
}
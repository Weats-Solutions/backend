import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ClerkGuard } from "@weats/common/guards/clerk.guard";
import { EstablishmentStaffGuard } from "@weats/common/guards/establishment-staff.guard";
import { CurrentEstablishment } from "@weats/common/decorators/current-establishment.decorator";
import { Establishment, feature } from "@weats/types";
import { ClientProxy } from "@nestjs/microservices";
import { Inject } from "@nestjs/common";
import { DASHBOARD_SERVICE, FeatureLimitGuard, RequiresFeature } from "@weats/common";
import { DASHBOARD_PATTERNS } from "@weats/common/patterns/dashboard.patterns";
import { CreateThemeDto } from "@weats/contracts";

@Controller('themes')

export class ThemeController {
    constructor(
        @Inject(DASHBOARD_SERVICE)
        private readonly dashboardClient: ClientProxy,
    ) { }

    @Get()
    async getThemes(
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.THEME_GET_ALL, { establishmentId: establishment.id });
    }

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

    @RequiresFeature(feature.theme_builder)
    @UseGuards(FeatureLimitGuard)
    @Post()
    async createTheme(
        @Body() createThemeDto: CreateThemeDto,
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.THEME_CREATE, { createThemeDto, establishment });
    }

    @RequiresFeature(feature.theme_builder)
    @UseGuards(FeatureLimitGuard)
    @Patch(':themeId')
    async updateTheme(
        @Param('themeId') themeId: string,
        @Body() updateThemeDto: CreateThemeDto,
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.THEME_UPDATE, { themeId, updateThemeDto, establishment });
    }

    @Post('set-active')
    async setActiveTheme(
        @Body() body: { themeId: string },
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.THEME_SET_ACTIVE, { establishmentId: establishment.id, themeId: body.themeId });
    }
}
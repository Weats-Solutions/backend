import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';
import { CreateThemeDto } from '@weats/contracts/dashboard/dtos/theme/create-theme.dto';
import { Establishment } from '@weats/types';
import { ThemeService } from './theme.service';

@Controller()
export class ThemeController {
    constructor(
        private readonly themeService: ThemeService,
    ) { }

    @MessagePattern(DASHBOARD_PATTERNS.THEME_GET_ALL)
    getThemes(@Payload() payload: { establishmentId: string }) {
        return this.themeService.getAllThemes(payload.establishmentId);
    }


    @MessagePattern(DASHBOARD_PATTERNS.THEME_GET_ACTIVE)
    getActiveTheme(@Payload() payload: { establishmentId: string }) {
        return this.themeService.getActiveTheme(payload.establishmentId);
    }

    @MessagePattern(DASHBOARD_PATTERNS.THEME_CREATE)
    createTheme(@Payload() payload: { createThemeDto: CreateThemeDto, establishment: Establishment }) {
        return this.themeService.createTheme(payload.createThemeDto, payload.establishment);
    }

    @MessagePattern(DASHBOARD_PATTERNS.THEME_UPDATE)
    updateTheme(@Payload() payload: { themeId: string, updateThemeDto: CreateThemeDto, establishment: Establishment }) {
        return this.themeService.updateTheme(payload.themeId, payload.updateThemeDto, payload.establishment);
    }

    @MessagePattern(DASHBOARD_PATTERNS.THEME_GET_BY_ID)
    getThemeById(@Payload() payload: { themeId: string, establishmentId: string }) {
        return this.themeService.getThemeById(payload.themeId, payload.establishmentId);
    }


    @MessagePattern(DASHBOARD_PATTERNS.THEME_SET_ACTIVE)
    setActiveTheme(@Payload() payload: { establishmentId: string; themeId: string }) {
        return this.themeService.setActiveTheme(payload.establishmentId, payload.themeId);
    }
} 
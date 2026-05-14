/* import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';
import { EstablishmentLanguage } from '@weats/database';
//import { LandingpageService } from './landingpage.service';
import { UpdateThemeSettingsDto } from '@weats/contracts/dashboard/dtos/theme/update-theme-settings.dto';
import { Establishment } from '@weats/types';

@Controller()
export class ThemeController {
    constructor(
       // private readonly landingpageService: LandingpageService,
    ) { }

    @MessagePattern(DASHBOARD_PATTERNS.THEME_GET_ACTIVE)
    getActiveTheme(@Payload() payload: { establishmentId: string }) {
        return this.landingpageService.getActiveTheme(payload.establishmentId);
    }

    @MessagePattern(DASHBOARD_PATTERNS.THEME_UPDATE)
    updateTheme(@Payload() payload: { themeId: string, updateThemeSettingsDto: UpdateThemeSettingsDto, establishment: Establishment }) {
        return this.landingpageService.updateTheme(payload.themeId, payload.updateThemeSettingsDto, payload.establishment);
    }

    @MessagePattern(DASHBOARD_PATTERNS.THEME_GET_BY_ID)
    getThemeById(@Payload() payload: { themeId: string }) {
        return this.landingpageService.getThemeById(payload.themeId);
    }

    @MessagePattern(DASHBOARD_PATTERNS.THEME_GET_AVAILABLE)
    getThemes(@Payload() payload: { establishmentId: string }) {
        return this.landingpageService.getAvailableThemes(payload.establishmentId);
    }

    @MessagePattern(DASHBOARD_PATTERNS.THEME_SET_ACTIVE)
    setActiveTheme(@Payload() payload: { establishmentId: string; themeId: string }) {
        return this.landingpageService.setActiveTheme(payload.establishmentId, payload.themeId);
    }
} */
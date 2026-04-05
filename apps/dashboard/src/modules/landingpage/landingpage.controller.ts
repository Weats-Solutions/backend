import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';
import { EstablishmentLanguage } from '@weats/database';
import { LandingpageService } from './landingpage.service';
import { UpdateThemeSettingsDto } from '@weats/contracts/dashboard/dtos/theme/update-theme-settings.dto';
import { Establishment } from '@weats/types';

@Controller()
export class LandingpageController {
    constructor(
        private readonly landingpageService: LandingpageService,
    ) { }

    @MessagePattern(DASHBOARD_PATTERNS.LANDINGPAGE_GET_BY_SLUG)
    getLandingpage(@Payload() payload: { establishmentSlug: string; lang: EstablishmentLanguage; targetId?: string }) {
        return this.landingpageService.getLandingpage(payload.establishmentSlug, payload.lang, payload.targetId);
    }

    @MessagePattern(DASHBOARD_PATTERNS.LANDINGPAGE_GET_CATALOG_THEME)
    getLandingpageTheme(@Payload() payload: { establishmentSlug: string }) {
        return this.landingpageService.getLandingpageTheme(payload.establishmentSlug);
    }

    @MessagePattern(DASHBOARD_PATTERNS.LANDINGPAGE_GET_CATALOG_ESTABLISHMENT_SETTINGS)
    getEstablishmentSettings(@Payload() payload: { establishmentSlug: string }) {
        return this.landingpageService.getEstablishmentSettings(payload.establishmentSlug);
    }

    @MessagePattern(DASHBOARD_PATTERNS.LANDINGPAGE_GET_CATALOG_MENU_LIST)
    getMenuList(@Payload() payload: { establishmentSlug: string; lang: EstablishmentLanguage; targetId?: string }) {
        return this.landingpageService.getMenuList(payload.establishmentSlug, payload.lang, payload.targetId);
    }

    @MessagePattern(DASHBOARD_PATTERNS.LANDINGPAGE_GET_CATALOG_MENU_CONTENT)
    getMenuContent(@Payload() payload: { establishmentSlug: string; menuId: string; lang: EstablishmentLanguage; targetId?: string }) {
        return this.landingpageService.getMenuContent(payload.establishmentSlug, payload.menuId, payload.lang, payload.targetId);
    }

    @MessagePattern(DASHBOARD_PATTERNS.LANDINGPAGE_GET_THEME)
    getTheme(@Payload() payload: { establishmentId: string }) {
        return this.landingpageService.getTheme(payload);
    }

    @MessagePattern(DASHBOARD_PATTERNS.THEME_UPDATE)
    updateTheme(@Payload() payload: { updateThemeSettingsDto: UpdateThemeSettingsDto, establishment: Establishment }) {
        return this.landingpageService.updateTheme(payload);
    }
}
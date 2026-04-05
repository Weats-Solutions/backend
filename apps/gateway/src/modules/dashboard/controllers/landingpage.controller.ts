import { Controller, Get, Param, Query, Inject, Post, Body, UseGuards } from '@nestjs/common';
import { ThrottlePublic } from '@weats/common/decorators/throttle.decorator';
import { EstablishmentLanguage } from '@weats/database';
import { ToUpperCasePipe } from '@weats/common/pipes/upper-case.pipe';
import { ClientProxy } from '@nestjs/microservices';
import { DASHBOARD_SERVICE } from '@weats/common/constants/services';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';
import { ClerkGuard, CurrentEstablishment, EstablishmentStaffGuard, EstablishmentOpenGuard, MenuOpenGuard } from '@weats/common';
import { Establishment } from '@weats/types';
import { UpdateThemeSettingsDto } from '@weats/contracts/dashboard/dtos/theme/update-theme-settings.dto';

@Controller('landingpage')
@ThrottlePublic()
export class LandingpageController {
  constructor(
    @Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy,
    //@Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  /*
    @Post('/clear-cache')
    async clearCache() {
      await clearCacheByPattern(this.cacheManager, 'landingpage:*');
      return { success: true };
    }
  
    @Post('/clear-cache/:establishmentSlug')
    async clearCacheByEstablishmentSlug(
      @Param('establishmentSlug') establishmentSlug: string,
    ) {
      await clearCacheByPattern(this.cacheManager, `landingpage:${establishmentSlug}:*`);
      return { success: true };
    }
      */

  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
  @Get('theme')
  async getThemeSettings(
    @CurrentEstablishment() establishment: Establishment,
  ) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.LANDINGPAGE_GET_THEME, { establishmentId: establishment.id });
  }

  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
  @Get('themes/available')
  async getAvailableThemes(
    @CurrentEstablishment() establishment: Establishment,
  ) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.THEME_GET_AVAILABLE, { establishmentId: establishment.id });
  }

  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
  @Post('theme')
  async updateThemeSettings(
    @Body() updateThemeSettingsDto: UpdateThemeSettingsDto,
    @CurrentEstablishment() establishment: Establishment,
  ) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.THEME_UPDATE, { updateThemeSettingsDto, establishment });
  }

  @UseGuards(ClerkGuard, EstablishmentStaffGuard)
  @Post('theme/set-active')
  async setActiveTheme(
    @Body() body: { themeId: string },
    @CurrentEstablishment() establishment: Establishment,
  ) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.THEME_SET_ACTIVE, { establishmentId: establishment.id, themeId: body.themeId });
  }

  @Get('/:establishmentSlug')
  async getLandingpage(
    @Param('establishmentSlug') establishmentSlug: string,
    @Query('lang', ToUpperCasePipe) lang: EstablishmentLanguage,
    @Query('targetId') targetId?: string,
  ) {
    console.log(targetId);
    return this.dashboardClient.send(DASHBOARD_PATTERNS.LANDINGPAGE_GET_BY_SLUG, { establishmentSlug, lang, targetId });
  }

  //@UseGuards(EstablishmentOpenGuard, MenuOpenGuard)
  @Get('/:establishmentSlug/menu/:menuId')
  async getMenuContent(
    @Param('establishmentSlug') establishmentSlug: string,
    @Param('menuId') menuId: string,
    @Query('lang', ToUpperCasePipe) lang: EstablishmentLanguage,
    @Query('targetId') targetId?: string,
  ) {
    return this.dashboardClient.send(DASHBOARD_PATTERNS.LANDINGPAGE_GET_MENU_CONTENT, { establishmentSlug, menuId, lang, targetId });
  }
}

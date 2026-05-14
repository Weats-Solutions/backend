import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ToUpperCasePipe } from '@weats/common';
import { EstablishmentLanguage } from '@weats/database';
import { RateLimit } from '@weats/common';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) { }

  @Get()
  getHello(): string {
    return "ola";
  }

  @Get(":slug/theme")
  getLandingpageTheme(@Param('slug') slug: string,
  ) {
    return this.catalogService.getTheme(slug);
  }

  @Get(":slug/settings")
  getEstablishmentSettings(@Param('slug') slug: string) {
    return this.catalogService.getEstablishmentSettings(slug);
  }

  @Get(":slug/menus")
  getMenuList(
    @Param('slug') slug: string,
    @Query('lang', ToUpperCasePipe) lang: EstablishmentLanguage,
    @Query('targetId') targetId?: string,
  ) {
    return this.catalogService.getMenuList(slug, lang, targetId);
  }

  @Get(":slug/menus/:menuId")
  getMenuContent(
    @Param('slug') slug: string,
    @Param('menuId') menuId: string,
    @Query('lang', ToUpperCasePipe) lang: EstablishmentLanguage,
    @Query('targetId') targetId?: string,
  ) {
    return this.catalogService.getMenuContent(slug, menuId, lang, targetId);
  }

}

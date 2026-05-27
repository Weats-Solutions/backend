import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ToUpperCasePipe } from '@weats/common';
import { EstablishmentLanguage } from '@weats/database';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { DiscordService } from '@weats/integrations';

export interface QrSessionTokenPayload {
  sub: string;      // service point ID
  eid: string;      // establishment ID
  spid: string;     // service point ID
  type: string;     // QR code type
}

@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly jwtService: JwtService,
    private readonly discordService: DiscordService,
  ) { }

  @Get()
  getHello(): string {
    return "ola";
  }

  @Get('test-discord')
  async testDiscord() {
    await this.discordService.sendEmbed('clerk', {
      title: '🔔 Teste de Notificação Discord',
      message: 'Esta é uma notificação de teste enviada a partir da rota /catalog/test-discord!',
      color: 0x00ff00,
      fields: [
        { name: 'Ambiente', value: 'Desenvolvimento', inline: true },
        { name: 'Status', value: 'Sucesso ✅', inline: true },
      ],
    });
    return { success: true, message: 'Notificação enviada com sucesso!' };
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
    @Req() req: Request,
  ) {
    const qrSession = this.getQrSession(req);
    return this.catalogService.getMenuList(slug, lang, qrSession);
  }

  @Get(":slug/menus/:menuId")
  getMenuContent(
    @Param('slug') slug: string,
    @Param('menuId') menuId: string,
    @Query('lang', ToUpperCasePipe) lang: EstablishmentLanguage,
    @Req() req: Request,
  ) {
    const qrSession = this.getQrSession(req);
    return this.catalogService.getMenuContent(slug, menuId, lang, qrSession);
  }

  private getQrSession(req: Request): QrSessionTokenPayload | null {
    const cookie = req.cookies?.['qr_session'];
    if (!cookie) return null;
    try {
      return this.jwtService.verify<QrSessionTokenPayload>(cookie);
    } catch (error) {
      return null;
    }
  }
}

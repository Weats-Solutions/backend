import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ToUpperCasePipe } from '@weats/common';
import { EstablishmentLanguage } from '@weats/database';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';

export interface QrSessionTokenPayload {
  sub: string;      // service point ID
  eid: string;      // establishment ID
  spid?: string;    // service point ID
  type: string;     // QR code type
  qrid?: string;    // QR code ID
}

@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly jwtService: JwtService,
  ) { }

  @Get()
  getHello(): string {
    return "ola";
  }

  @Get(":slug/theme")
  getLandingpageTheme(
    @Param('slug') slug: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    return this.catalogService.getTheme(slug);
  }

  @Get(":slug/settings")
  getEstablishmentSettings(
    @Param('slug') slug: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    return this.catalogService.getEstablishmentSettings(slug);
  }

  @Get(":slug/menus")
  getMenuList(
    @Param('slug') slug: string,
    @Query('lang', ToUpperCasePipe) lang: EstablishmentLanguage,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const qrSession = this.getQrSession(req);
    if (!qrSession) {
      res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    } else {
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    }
    return this.catalogService.getMenuList(slug, lang, qrSession);
  }

  @Get(":slug/menus/:menuId")
  getMenuContent(
    @Param('slug') slug: string,
    @Param('menuId') menuId: string,
    @Query('lang', ToUpperCasePipe) lang: EstablishmentLanguage,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const qrSession = this.getQrSession(req);
    if (!qrSession) {
      res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    } else {
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    }
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

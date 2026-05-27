import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Param,
  Res,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { QrCodeService } from './qr-code.service';
import { QrCodeType } from '@weats/database';
import type { Response } from 'express';

@Controller('qr')
export class QrCodeController {
  constructor(
    private readonly qrCodeService: QrCodeService,
    private readonly jwtService: JwtService,
    @Inject('WEATS_ENV') private readonly weatsEnv: string,

  ) { }

  @Get(':token')
  async handleRedirect(@Param('token') token: string, @Res() res: Response) {
    console.log(`[Catalog] Recebido pedido de redirecionamento para token: ${token}`);
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const { url, session } = await this.qrCodeService.resolveQrCode(token);

    // Only issue a session cookie for TABLE-type QR codes.
    // This binds the table session to the physical device that scanned the QR,
    // preventing URL sharing from granting table access to other users.
    if (session && session.type === QrCodeType.TABLE && session.servicePointId) {
      const sessionToken = this.jwtService.sign({
        sub: session.servicePointId,
        eid: session.establishmentId,
        spid: session.servicePointId,
        type: session.type,
      });

      const isDev = this.weatsEnv === 'dev';

      res.cookie('qr_session', sessionToken, {
        httpOnly: true, 
        secure: true,    // Sempre true já que ambos os ambientes usam HTTPS
        sameSite: 'lax', // Lax funciona perfeitamente para redirects cross-subdomain
        domain: isDev ? '.weats.app' : '.weats.pt', // Domínio correto para cada ambiente
        maxAge: 4 * 60 * 60 * 1000,
        path: '/',
      });

    }

    return res.redirect(302, url);
  }
}

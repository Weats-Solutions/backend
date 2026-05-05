import {
  BadRequestException,
  Controller,
  Get,
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
  ) { }

  @Get(':token')
  async handleRedirect(@Param('token') token: string, @Res() res: Response) {
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

      res.cookie('qr_session', sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 4 * 60 * 60 * 1000, // 4 hours in ms
        path: '/',
      });
    }

    return res.redirect(302, url);
  }
}

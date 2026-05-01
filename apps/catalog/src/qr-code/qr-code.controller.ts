import {
  Controller,
  Get,
  Param,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { QrCodeService } from './qr-code.service';
import type { Response } from 'express';

@Controller('qr')
export class QrCodeController {
  constructor(private readonly qrCodeService: QrCodeService) { }

  @Get(':token')
  async handleRedirect(@Param('token') token: string, @Res() res: Response) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const url = await this.qrCodeService.getRedirectUrl(token);
    return res.redirect(302, url);
  }
}

import {
  Controller,
  Get,
  Param,
  Redirect,
  BadRequestException,
} from '@nestjs/common';
import { QrCodeService } from './qr-code.service';

@Controller('qr')
export class QrCodeController {
  constructor(private readonly qrCodeService: QrCodeService) { }

  @Get(':token')
  @Redirect()
  async handleRedirect(@Param('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const url = await this.qrCodeService.getRedirectUrl(token);

    return {
      url,
      statusCode: 302,
    };
  }
}

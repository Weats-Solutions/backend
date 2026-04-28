import { Inject, Injectable, Logger } from '@nestjs/common';
import { CorePrismaService, QrCodeType } from '@weats/database';

@Injectable()
export class QrCodeService {
  private readonly logger = new Logger(QrCodeService.name);

  constructor(
    private readonly prisma: CorePrismaService,
    @Inject('CATALOG_URL') private readonly catalogUrl: string,
  ) { }

  /**
   * Resolves a QR token and returns the final destination URL.
   */
  async getRedirectUrl(token: string): Promise<string> {
    const qrCode = await this.prisma.qrCode.findUnique({
      where: { token },
      include: {
        servicePoint: {
          include: {
            zone: true,
          }
        },
        establishment: {
          include: {
            subscription: true,
          }
        },
      },
    });

    if (!qrCode) {
      this.logger.error(`QR code token not found: ${token}`);
      return `${this.catalogUrl}/404`;
    }

    const menuBaseUrl = this.catalogUrl.replace(/\/+$/, '');

    // Case 1: TABLE (Menu with pre-selected table)
    if (qrCode.type === QrCodeType.TABLE) {
      if (!qrCode.servicePoint) {
        this.logger.warn(`QR Token ${token} is TABLE type but has no servicePoint`);
        return `${this.catalogUrl}/404`;
      }

      if (!qrCode.servicePoint.isActive || !qrCode.servicePoint.zone?.isActive) {
        this.logger.log(`Service point or zone is inactive for token ${token}`);
        return `${this.catalogUrl}/404`;
      }

      const subscriptionStatus = qrCode.establishment?.subscription?.status;
      if (subscriptionStatus !== 'ACTIVE') {
        this.logger.log(`Establishment ${qrCode.establishmentId} has no active subscription (Status: ${subscriptionStatus})`);
        return `${this.catalogUrl}/no-subscription`;
      }

      return `${menuBaseUrl}/menu/${qrCode.establishmentId}?table=${qrCode.servicePointId}`;
    }

    // Case 2: MENU (Direct to general menu)
    if (qrCode.type === QrCodeType.MENU) {
      if (!qrCode.establishment) {
        this.logger.warn(`QR Token ${token} is MENU type but has no establishment`);
        return `${this.catalogUrl}/404`;
      }

      const subscriptionStatus = qrCode.establishment?.subscription?.status;
      if (subscriptionStatus !== 'ACTIVE') {
        this.logger.log(`Establishment ${qrCode.establishmentId} subscription not active`);
        return `${this.catalogUrl}/no-subscription`;
      }

      return `${menuBaseUrl}/menu/${qrCode.establishmentId}`;
    }

    this.logger.error(`Invalid QR code type for token ${token}: ${qrCode.type}`);
    return `${this.catalogUrl}/404`;
  }
}

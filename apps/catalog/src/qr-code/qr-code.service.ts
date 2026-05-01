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

    // Função auxiliar para construir a URL com subdomínio
    const buildSubdomainUrl = (slug: string, path = '') => {
      const normalizedCatalogUrl = this.catalogUrl.startsWith('http')
        ? this.catalogUrl
        : `https://${this.catalogUrl}`;
      const parsedCatalogUrl = new URL(normalizedCatalogUrl);
      const hostParts = parsedCatalogUrl.hostname.split('.');
      if (hostParts[0] === 'catalog') {
        hostParts.shift();
      }
      const baseHost = hostParts.join('.');
      const subdomainHost = `${slug}.${baseHost}`;
      const portPart = parsedCatalogUrl.port ? `:${parsedCatalogUrl.port}` : '';

      return `${parsedCatalogUrl.protocol}//${subdomainHost}${portPart}${path}`;
    };

    // Case 1: TABLE (Menu com mesa pré-selecionada)
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

      if (!qrCode.establishment?.slug) {
        this.logger.warn(`Establishment slug not found for token ${token}`);
        return `${this.catalogUrl}/404`;
      }

      // Redireciona para slug.weats.pro?table=ID
      return buildSubdomainUrl(qrCode.establishment.slug, `?table=${qrCode.servicePointId}`);
    }

    // Case 2: MENU (Direto para o menu geral)
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

      if (!qrCode.establishment?.slug) {
        this.logger.warn(`Establishment slug not found for token ${token}`);
        return `${this.catalogUrl}/404`;
      }

      // Redireciona para slug.weats.pro
      return buildSubdomainUrl(qrCode.establishment.slug);
    }

    this.logger.error(`Invalid QR code type for token ${token}: ${qrCode.type}`);
    return `${this.catalogUrl}/404`;
  }
}

import { Inject, Injectable, Logger } from '@nestjs/common';
import { CorePrismaService, QrCodeType } from '@weats/database';
import { CacheService } from '@weats/cache';

@Injectable()
export class QrCodeService {
  private readonly logger = new Logger(QrCodeService.name);

  constructor(
    private readonly prisma: CorePrismaService,
    private readonly cache: CacheService,
    @Inject('CATALOG_URL') private readonly catalogUrl: string,
  ) { }

  /**
   * Resolves a QR token and returns the final destination URL.
   * Uses CacheService.wrap for sub-millisecond response times.
   */
  async getRedirectUrl(token: string): Promise<string> {
    const cacheKey = `qr:redirect:${token}`;

    return this.cache.wrap(cacheKey, 86400, async () => {
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
        if (!qrCode.servicePoint || !qrCode.servicePoint.isActive || !qrCode.servicePoint.zone?.isActive) {
          return `${this.catalogUrl}/404`;
        }

        if (qrCode.establishment?.subscription?.status !== 'ACTIVE') {
          return `${this.catalogUrl}/no-subscription`;
        }

        if (!qrCode.establishment?.slug) {
          return `${this.catalogUrl}/404`;
        }

        return buildSubdomainUrl(qrCode.establishment.slug, `?table=${qrCode.servicePointId}`);
      }

      // Case 2: MENU (Direto para o menu geral)
      if (qrCode.type === QrCodeType.MENU) {
        if (!qrCode.establishment || qrCode.establishment?.subscription?.status !== 'ACTIVE' || !qrCode.establishment?.slug) {
          return qrCode.establishment?.subscription?.status !== 'ACTIVE' ? `${this.catalogUrl}/no-subscription` : `${this.catalogUrl}/404`;
        }

        return buildSubdomainUrl(qrCode.establishment.slug);
      }

      return `${this.catalogUrl}/404`;
    });
  }
}

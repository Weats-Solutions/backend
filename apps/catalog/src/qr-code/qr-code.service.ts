import { Inject, Injectable, Logger } from '@nestjs/common';
import { CorePrismaService, QrCodeType } from '@weats/database';
import { CacheService } from '@weats/cache';

export interface QrSessionPayload {
  id: string;
  servicePointId: string | null;
  establishmentId: string;
  type: QrCodeType;
}

export interface ResolvedQrCode {
  url: string;
  session: QrSessionPayload | null;
}

@Injectable()
export class QrCodeService {
  private readonly logger = new Logger(QrCodeService.name);

  constructor(
    private readonly prisma: CorePrismaService,
    private readonly cache: CacheService,
    @Inject('CATALOG_MENU_URL') private readonly catalogMenuUrL: string,
    @Inject('WEATS_ENV') private readonly weatsEnv: string,
  ) { }

  /**
   * Resolves a QR token and returns the final destination URL.
   * Leverages resolveQrCode to avoid duplicate database hits.
   */
  async getRedirectUrl(token: string): Promise<string> {
    const { url } = await this.resolveQrCode(token);
    return url;
  }

  /**
   * Resolves a QR token and returns both the redirect URL and session metadata.
   * Fetches the QR code only once (using CacheService.wrap) and builds the redirect URL.
   */
  async resolveQrCode(token: string): Promise<ResolvedQrCode> {
    const cacheKey = `qr:data:${token}`;

    const qrCode = await this.cache.wrap(cacheKey, 3600, async () => {
      return this.prisma.qrCode.findUnique({
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
    });

    this.logger.error(`QR code: ${JSON.stringify(qrCode)}`);

    if (!qrCode || !qrCode.active) {
      this.logger.error(`QR code token not found or inactive: ${token}`);
      return { url: `${this.catalogMenuUrL}/404`, session: null };
    }

    // Função auxiliar para construir a URL com subdomínio
    const buildSubdomainUrl = (slug: string) => {
      if (this.weatsEnv === 'dev') {
        return `https://dev-menu.weats.app/s/${slug}`;
      }

      if (this.weatsEnv === 'local') {
        return `http://localhost/s/${slug}`;
      }

      // PROD
      return `https://${slug}.weats.pt`;
    };

    // Helper para verificar se o estabelecimento tem uma subscrição válida ou é Demo
    const hasValidSubscription =
      qrCode.establishment?.isDemo ||
      qrCode.establishment?.subscription?.status === 'ACTIVE' ||
      qrCode.establishment?.subscription?.status === 'TRIALING';

    let url = `${this.catalogMenuUrL}/404`;

    // Case 1: TABLE (Menu com mesa pré-selecionada)
    if (qrCode.type === QrCodeType.TABLE) {
      if (!qrCode.servicePoint || !qrCode.servicePoint.isActive || !qrCode.servicePoint.zone?.isActive) {
        url = `${this.catalogMenuUrL}/404`;
      } else if (!hasValidSubscription) {
        url = `${this.catalogMenuUrL}/no-subscription`;
      } else if (!qrCode.establishment?.slug) {
        url = `${this.catalogMenuUrL}/404`;
      } else {
        url = buildSubdomainUrl(qrCode.establishment.slug);
      }
    }

    // Case 2: MENU (Direto para o menu geral)
    else if (qrCode.type === QrCodeType.MENU) {
      if (!qrCode.establishment || !qrCode.establishment?.slug) {
        url = `${this.catalogMenuUrL}/404`;
      } else if (!hasValidSubscription) {
        url = `${this.catalogMenuUrL}/no-subscription`;
      } else {
        url = buildSubdomainUrl(qrCode.establishment.slug);
      }
    }

    return {
      url,
      session: {
        id: qrCode.id,
        type: qrCode.type,
        servicePointId: qrCode.servicePointId,
        establishmentId: qrCode.establishmentId,
      },
    };
  }
}

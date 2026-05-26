import { Inject, Injectable, Logger } from '@nestjs/common';
import { CorePrismaService, QrCodeType } from '@weats/database';
import { CacheService } from '@weats/cache';

export interface QrSessionPayload {
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
   * Uses CacheService.wrap for sub-millisecond response times.
   */
  async getRedirectUrl(token: string): Promise<string> {
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

    if (!qrCode) {
      this.logger.error(`QR code token not found: ${token}`);
      return `${this.catalogMenuUrL}/404`;
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

    // Case 1: TABLE (Menu com mesa pré-selecionada)
    if (qrCode.type === QrCodeType.TABLE) {
      if (!qrCode.servicePoint || !qrCode.servicePoint.isActive || !qrCode.servicePoint.zone?.isActive) {
        return `${this.catalogMenuUrL}/404`;
      }

      if (!hasValidSubscription) {
        return `${this.catalogMenuUrL}/no-subscription`;
      }

      if (!qrCode.establishment?.slug) {
        return `${this.catalogMenuUrL}/404`;
      }

      return buildSubdomainUrl(qrCode.establishment.slug);
    }

    // Case 2: MENU (Direto para o menu geral)
    if (qrCode.type === QrCodeType.MENU) {
      if (!qrCode.establishment || !qrCode.establishment?.slug) {
        return `${this.catalogMenuUrL}/404`;
      }

      if (!hasValidSubscription) {
        return `${this.catalogMenuUrL}/no-subscription`;
      }

      return buildSubdomainUrl(qrCode.establishment.slug);
    }

    return `${this.catalogMenuUrL}/404`;
  }

  /**
   * Resolves a QR token and returns both the redirect URL and session metadata.
   * Does NOT use cache for the session payload — always reads fresh from DB.
   */
  async resolveQrCode(token: string): Promise<ResolvedQrCode> {
    const url = await this.getRedirectUrl(token);

    const qrCode = await this.prisma.qrCode.findUnique({
      where: { token },
      select: {
        type: true,
        servicePointId: true,
        establishmentId: true,
      },
    });

    if (!qrCode) {
      return { url, session: null };
    }

    return {
      url,
      session: {
        type: qrCode.type,
        servicePointId: qrCode.servicePointId,
        establishmentId: qrCode.establishmentId,
      },
    };
  }
}

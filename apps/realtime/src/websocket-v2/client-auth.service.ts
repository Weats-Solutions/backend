import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CorePrismaService, QrCodeType } from '@weats/database';
import { CacheService } from '@weats/cache';
import { ClientValidationContext } from './realtime-v2.types';

@Injectable()
export class RealtimeV2ClientAuthService {
  private readonly logger = new Logger(RealtimeV2ClientAuthService.name);
  private static readonly CACHE_TTL_SECONDS = 120;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: CorePrismaService,
    private readonly cache: CacheService,
  ) { }

  async validateServicePoint(servicePointId: string): Promise<ClientValidationContext | null> {
    const cacheKey = this.getServicePointCacheKey(servicePointId);

    const result = await this.cache.wrap<ClientValidationContext | { missing: true }>(
      cacheKey,
      RealtimeV2ClientAuthService.CACHE_TTL_SECONDS,
      async () => {
        const servicePoint = await this.prisma.servicePoint.findUnique({
          where: { id: servicePointId },
          include: { zone: true },
        });

        if (!servicePoint || !servicePoint.isActive || !servicePoint.zone?.isActive) {
          return { missing: true };
        }

        return {
          establishmentId: servicePoint.zone.establishmentId,
          servicePointId: servicePoint.id,
          servicePointName: servicePoint.name,
          zoneId: servicePoint.zone.id,
          zoneName: servicePoint.zone.name,
          maxCapacity: servicePoint.maxCapacity,
        };
      }
    );

    if (!result || 'missing' in result) return null;
    return result;
  }

  getServicePointCacheKey(servicePointId: string) {
    return `service-point:${servicePointId}`;
  }

  async validateQrSession(sessionToken: string): Promise<ClientValidationContext | null> {
    try {
      const payload = await this.jwtService.verifyAsync<{
        eid?: string;
        spid?: string;
        type?: QrCodeType;
      }>(sessionToken, {
        issuer: 'weats-catalog',
        audience: 'weats-menu',
      });

      if (!payload?.eid || !payload?.spid || payload.type !== QrCodeType.TABLE) {
        return null;
      }

      const context = await this.validateServicePoint(payload.spid);
      if (!context || context.establishmentId !== payload.eid) {
        return null;
      }

      return context;
    } catch (error: any) {
      this.logger.warn('Client auth by qr_session failed: ' + error.message);
      return null;
    }
  }

  extractQrSessionToken(
    auth: Record<string, unknown> | undefined,
    cookieHeader: string | string[] | undefined,
  ): string | undefined {
    const fromAuth = auth?.qrSession;
    if (typeof fromAuth === 'string' && fromAuth.trim()) {
      return fromAuth.trim();
    }

    const rawCookie = Array.isArray(cookieHeader) ? cookieHeader.join('; ') : cookieHeader;
    
    this.logger.debug(`Extracting token. Auth: ${!!fromAuth}, CookieHeader present: ${!!rawCookie}`);
    if (rawCookie) {
      this.logger.debug(`Raw Cookie Header: ${rawCookie}`);
    }

    if (!rawCookie) {
      return undefined;
    }

    const entries = rawCookie.split(';');
    for (const entry of entries) {
      const [rawKey, ...rawValue] = entry.trim().split('=');
      if (rawKey === 'qr_session') {
        const token = decodeURIComponent(rawValue.join('='));
        this.logger.debug(`Found qr_session cookie! Length: ${token.length}`);
        return token;
      }
    }

    return undefined;
  }
}

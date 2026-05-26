import { Injectable, Logger } from '@nestjs/common';
import { ClerkService } from '@weats/integrations';
import { CorePrismaService } from '@weats/database';
import { CacheService, dashboardEstKey } from '@weats/cache';
import { StaffValidationContext } from './realtime-v2.types';

@Injectable()
export class RealtimeV2StaffAuthService {
  private readonly logger = new Logger(RealtimeV2StaffAuthService.name);
  private static readonly CACHE_TTL_SECONDS = 300; // 5 minutos de cache para acesso

  constructor(
    private readonly clerkService: ClerkService,
    private readonly prisma: CorePrismaService,
    private readonly cache: CacheService,
  ) { }

  async validate(token: string, establishmentId: string): Promise<StaffValidationContext | null> {
    try {
      // 1. Identificar o utilizador via Clerk
      const user = await this.clerkService.verifyJwtToken(token);
      if (!user) return null;

      // 2. Verificar se o estabelecimento tem acesso ao módulo e subscrição ativa (com cache)
      const access = await this.validateEstablishmentAccess(establishmentId);
      
      if (!access || !access.hasCallStaffModule || !access.hasActiveSubscription) {
        this.logger.warn(`Access denied for establishment ${establishmentId}: Module enabled: ${access?.hasCallStaffModule}, Active sub: ${access?.hasActiveSubscription}`);
        return null;
      }

      // TODO: No futuro, se quiseres verificar se este user específico pertence ao staff 
      // deste estabelecimento via DB, seria aqui. Por agora, deixamos passar se o módulo estiver ativo.
      
      return {
        user,
        role: 'STAFF', // Default para staff que se liga via KDS
        establishmentId,
      };
    } catch (error: any) {
      this.logger.error('Staff auth failed: ' + error.message);
      return null;
    }
  }

  private async validateEstablishmentAccess(id: string) {
    const cacheKey = dashboardEstKey(id);

    const establishment = await this.cache.wrap<any>(
      cacheKey,
      RealtimeV2StaffAuthService.CACHE_TTL_SECONDS,
      async () => {
        return this.prisma.establishment.findUnique({
          where: { id },
          include: {
            logoImage: { select: { id: true, url: true } },
            bannerImage: { select: { id: true, url: true } },
            subscription: true,
            schedule: {
              include: { days: { include: { intervals: true } } },
            },
          },
        });
      }
    );

    if (!establishment) return null;

    const hasActiveSubscription =
      establishment.subscription?.status === 'ACTIVE' ||
      establishment.subscription?.status === 'TRIALING' ||
      establishment.isDemo;

    return {
      hasAccess: true,
      hasActiveSubscription,
      hasCallStaffModule: establishment.callStaffModule,
    };
  }
}

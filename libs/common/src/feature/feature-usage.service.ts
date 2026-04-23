import { Injectable, Logger } from '@nestjs/common';
import { CorePrismaService } from '@weats/database';
import { feature } from '@weats/types';

export type FeatureUsageHandler = (
  establishmentId: string,
  request?: any,
) => Promise<number>;

@Injectable()
export class FeatureUsageService {
  private readonly handlers = new Map<string, FeatureUsageHandler>();
  private readonly logger = new Logger(FeatureUsageService.name);

  constructor(private corePirismaService: CorePrismaService) {
    // register built-in handlers
    this.register(feature.menu, async (establishmentId: string) => {
      return this.corePirismaService.menu.count({ where: { establishmentId } });
    });

    this.register(feature.languages, async (establishmentId: string) => {
      const est =
        await this.corePirismaService.establishment.findUnique({
          where: { id: establishmentId },
        });
      return (est?.availableLanguages || []).length;
    });

    this.register(feature.points, async (establishmentId: string) => {
      return this.corePirismaService.servicePoint.count({
        where: { zone: { establishmentId } },
      });
    });

    this.register(feature.images, async (establishmentId: string) => {
      return this.corePirismaService.image.count({
        where: { establishmentId },
      });
    });

    this.register(feature.products, async (establishmentId: string) => {
      return this.corePirismaService.item.count({
        where: { establishmentId, deletedAt: null },
      });
    });


    this.register(feature.zones, async (establishmentId: string) => {
      return this.corePirismaService.serviceZone.count({
        where: { establishmentId },
      });
    });

  }

  register(featureName: feature, handler: FeatureUsageHandler) {
    if (this.handlers.has(featureName)) {
      this.logger.warn(`Overwriting feature usage handler for ${featureName}`);
    }
    this.handlers.set(featureName, handler);
  }

  async getUsage(featureName: feature, establishmentId: string, request?: any) {
    const handler = this.handlers.get(featureName);
    if (!handler) {
      throw new Error(
        `No usage handler registered for feature: ${featureName}`,
      );
    }
    return handler(establishmentId, request);
  }

  /**
   * Returns both usage and plan-derived limit/enabled flag for a feature.
   * { usage, limit, enabled }
   * - limit: number | null (null means no quantity limit)
   * - enabled: boolean | null (null means not a boolean-controlled feature)
   */
  async getUsageAndLimit(featureName: feature, establishmentId: string) {
    // compute usage first (may be fast)
    const usage = await this.getUsage(featureName, establishmentId);

    // find planFeature for this establishment
    const est = await this.corePirismaService.establishment.findUnique({
      where: { id: establishmentId },
      include: {
        subscription: {
          select: {
            planCycle: {
              select: {
                planId: true,
              },
            },
          },
        },
      },
    });

    let limit: number | null = null;
    let enabled: boolean | null = null;

    if (est?.subscription?.planCycle?.planId) {
      const plan = await this.corePirismaService.plan.findFirst({
        where: { id: est.subscription.planCycle.planId },
        include: { features: { include: { feature: true } } },
      });

      if (plan) {
        const pf = plan.features.find((p) => p.feature.name === featureName);
        if (pf) {
          if (pf.valueQuantity !== null && pf.valueQuantity !== undefined) {
            limit = pf.valueQuantity;
          }
          if (pf.valueBoolean !== null && pf.valueBoolean !== undefined) {
            if (pf.feature.type === 'BOOLEAN') {
              enabled = pf.valueBoolean;
            } else if (pf.feature.type === 'QUANTITY') {
              // If explicit false, disable it. If true, ignore (let limit control)
              if (pf.valueBoolean === false) {
                enabled = false;
              }
            }
          }
        }
      }
    }

    return { usage, limit, enabled } as {
      usage: number;
      limit: number | null;
      enabled: boolean | null;
    };
  }
}

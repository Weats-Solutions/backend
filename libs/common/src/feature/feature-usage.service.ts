import { Injectable, Logger } from '@nestjs/common';
import { CorePrismaService } from '@weats/database';
import { CacheService } from '@weats/cache';
import { feature } from '@weats/types';

export type FeatureUsageHandler = (
  establishmentId: string,
  request?: any,
  tx?: any,
) => Promise<number>;

@Injectable()
export class FeatureUsageService {
  private readonly handlers = new Map<string, FeatureUsageHandler>();
  private readonly logger = new Logger(FeatureUsageService.name);

  constructor(
    private corePrismaService: CorePrismaService,
    private cache: CacheService,
  ) {
    // register built-in handlers
    this.register(feature.menu, async (establishmentId: string, req, tx) => {
      const client = tx || this.corePrismaService;
      return client.menu.count({ where: { establishmentId } });
    });

    this.register(feature.languages, async (establishmentId: string, req, tx) => {
      const client = tx || this.corePrismaService;
      const est =
        await client.establishment.findUnique({
          where: { id: establishmentId },
        });
      return (est?.availableLanguages || []).length;
    });

    this.register(feature.points, async (establishmentId: string, req, tx) => {
      const client = tx || this.corePrismaService;
      return client.servicePoint.count({
        where: { zone: { establishmentId } },
      });
    });

    this.register(feature.images, async (establishmentId: string, req, tx) => {
      const client = tx || this.corePrismaService;
      return client.image.count({
        where: {
          establishmentId,
          faviconAssets: {
            none: {}
          },
        },
      });
    });

    this.register(feature.products, async (establishmentId: string, req, tx) => {
      const client = tx || this.corePrismaService;
      return client.item.count({
        where: { establishmentId, deletedAt: null },
      });
    });

    this.register(feature.zones, async (establishmentId: string, req, tx) => {
      const client = tx || this.corePrismaService;
      return client.serviceZone.count({
        where: { establishmentId },
      });
    });

    this.register(feature.menu_categories, async (establishmentId: string, req, tx) => {
      const client = tx || this.corePrismaService;
      return client.menuCategory.count({
        where: { menu: { establishmentId } },
      });
    });

    this.register(feature.menu_subcategories, async (establishmentId: string, req, tx) => {
      const client = tx || this.corePrismaService;
      return client.menuSubcategory.count({
        where: { category: { menu: { establishmentId } } },
      });
    });

    this.register(feature.custom_addons, async (establishmentId: string, req, tx) => {
      const client = tx || this.corePrismaService;
      return client.addon.count({
        where: { establishmentId },
      });
    });

    this.register(feature.custom_variants, async (establishmentId: string, req, tx) => {
      const client = tx || this.corePrismaService;
      return client.variantOption.count({
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

  async getUsage(featureName: feature, establishmentId: string, request?: any, tx?: any) {
    const handler = this.handlers.get(featureName);
    if (!handler) {
      // Default usage for unregistered features (such as pure boolean features) is 0
      return 0;
    }
    return handler(establishmentId, request, tx);
  }

  /**
   * Returns both usage and plan-derived limit/enabled flag for a feature.
   * Uses Redis caching to avoid repeatedly querying the database for establishment/plan limits.
   */
  async getUsageAndLimit(featureName: feature, establishmentId: string, tx?: any) {
    // compute usage first (dynamic data, keep real-time)
    const usage = await this.getUsage(featureName, establishmentId, undefined, tx);

    // Cache key for this establishment's plan limits
    const cacheKey = `est:plan-limits:${establishmentId}`;

    const planLimits = await this.cache.wrap(cacheKey, 3600, async () => {
      const client = tx || this.corePrismaService;
      const est = await client.establishment.findUnique({
        where: { id: establishmentId },
        select: {
          isDemo: true,
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

      if (est?.isDemo) {
        return {
          isDemo: true,
          hasPlan: true,
          features: {} as Record<string, { limit: number | null; enabled: boolean | null }>,
        };
      }

      if (!est?.subscription?.planCycle?.planId) {
        return {
          isDemo: false,
          hasPlan: false,
          features: {} as Record<string, { limit: number | null; enabled: boolean | null }>,
        };
      }

      const featuresMap: Record<string, { limit: number | null; enabled: boolean | null }> = {};

      const plan = await client.plan.findFirst({
        where: { id: est.subscription.planCycle.planId },
        include: { features: { include: { feature: true } } },
      });

      if (plan) {
        for (const pf of plan.features) {
          let limit: number | null = null;
          let enabled: boolean | null = null;

          if (pf.valueQuantity !== null && pf.valueQuantity !== undefined) {
            limit = pf.valueQuantity;
          }
          if (pf.valueBoolean !== null && pf.valueBoolean !== undefined) {
            if (pf.feature.type === 'BOOLEAN') {
              enabled = pf.valueBoolean;
            } else if (pf.feature.type === 'QUANTITY') {
              if (pf.valueBoolean === false) {
                enabled = false;
              }
            }
          }
          featuresMap[pf.feature.name] = { limit, enabled };
        }
      }

      return {
        isDemo: false,
        hasPlan: true,
        features: featuresMap,
      };
    });

    if (planLimits.isDemo) {
      return {
        usage,
        limit: null,
        enabled: true,
        hasPlan: true,
      };
    }

    if (!planLimits.hasPlan) {
      return {
        usage,
        limit: 0,
        enabled: false,
        hasPlan: false,
      };
    }

    const featureRules = planLimits.features[featureName];

    return {
      usage,
      limit: featureRules?.limit ?? null,
      enabled: featureRules?.enabled ?? null,
      hasPlan: true,
    };
  }
}

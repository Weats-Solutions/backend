import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_KEY } from '@weats/common/constants';
import { FeatureUsageService } from '@weats/common/feature/feature-usage.service';
import type { feature } from '@weats/types';
import { ERRORS } from '@weats/common';

@Injectable()
export class FeatureLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usageService: FeatureUsageService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.get<feature>(
      FEATURE_KEY,
      context.getHandler(),
    );

    if (!feature) return true; // no feature required

    const request = context.switchToHttp().getRequest();

    const establishment = request.establishment;
    if (!establishment || !establishment.id) {
      throw new ForbiddenException('Establishment context is required');
    }

    // Use unified method to fetch usage and plan limits/enabled
    const { usage, limit, enabled } = await this.usageService.getUsageAndLimit(
      feature,
      establishment.id,
    );

    // If feature is boolean-controlled
    if (enabled !== null) {
      if (!enabled) {
        throw new ForbiddenException({
          message: 'Feature not enabled for your plan',
          code: ERRORS.FEATURE_NOT_ENABLED,
        });
      }

      // If no limit is defined, we can allow access based on enabled=true
      if (limit === null) return true;
    }

    // If quantity-controlled
    if (limit !== null) {
      if (usage >= limit) {
        throw new ForbiddenException({
          message: 'Feature limit reached for your plan',
          code: ERRORS.FEATURE_LIMIT_REACHED,
        });
      }
      return true;
    }

    // If neither, deny by default
    throw new ForbiddenException({
      message: 'Feature not allowed',
      code: ERRORS.FEATURE_NOT_ENABLED,
    });
  }
}

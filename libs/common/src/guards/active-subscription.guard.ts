import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Establishment } from '@weats/types';
import { ERRORS } from '@weats/common/errors';
import { CustomRequest } from '@weats/types';
import { SubscriptionStatus } from '@weats/database';
import { SKIP_ACTIVE_SUBSCRIPTION_KEY } from '../decorators/skip-active-subscription.decorator';

@Injectable()
export class ActiveSubscriptionGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const skipActiveSubscription = this.reflector.getAllAndOverride<boolean>(
            SKIP_ACTIVE_SUBSCRIPTION_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (skipActiveSubscription) {
            return true;
        }

        const request = context.switchToHttp().getRequest<CustomRequest>();

        const establishment = request.establishment as Establishment;

        if (!establishment) {
            throw new ForbiddenException({
                message: 'Establishment context is required',
                code: ERRORS.ESTABLISHMENT_STRIPE_ID_REQUIRED,
            });
        }

        const status = establishment.subscription?.status;
        const hasActiveSubscription =
            status === SubscriptionStatus.ACTIVE ||
            status === SubscriptionStatus.TRIALING;

        if (!hasActiveSubscription) {
            throw new ForbiddenException({
                message: 'No active subscription',
                code: ERRORS.NO_ACTIVE_SUBSCRIPTION,
            });
        }

        return true;
    }
}

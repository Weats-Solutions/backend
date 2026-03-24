import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Establishment } from '@weats/types';
import { StripeService } from '@weats/integrations';
import { ERRORS } from '@weats/common/errors';
import { CustomRequest } from '@weats/types';

@Injectable()
export class ActiveSubscriptionGuard implements CanActivate {
    constructor(
        private readonly stripeService: StripeService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<CustomRequest>();

        const establishment = request.establishment as Establishment;

        // Supondo que establishment.stripeCustomerId existe
        if (!establishment || !establishment.stripeCustomerId) {
            throw new ForbiddenException({
                message: 'Establishment context with Stripe customer ID is required',
                code: ERRORS.ESTABLISHMENT_STRIPE_ID_REQUIRED,
            });
        }

        const hasActiveSubscription =
            await this.stripeService.hasActiveSubscription(
                establishment.stripeCustomerId,
            );

        if (!hasActiveSubscription) {
            throw new ForbiddenException({
                message: 'No active subscription',
                code: ERRORS.NO_ACTIVE_SUBSCRIPTION,
            });
        }

        return true;
    }
}

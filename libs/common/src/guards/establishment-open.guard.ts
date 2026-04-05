import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { CorePrismaService } from '@weats/database';
import { CustomRequest } from '@weats/types';
import { isScheduleOpenNow } from '@weats/common/utils/schedule.utils';
import { ERRORS } from '../errors';

/**
 * HTTP Guard — for use in the Gateway on public catalog & order routes.
 *
 * 1. Loads the establishment by :establishmentSlug param.
 * 2. Verifies the establishment is currently open.
 * 3. Injects the establishment into request.establishment so downstream
 *    guards (MenuOpenGuard) and controllers can reuse it without a second DB query.
 *
 * Chain with MenuOpenGuard:
 *   @UseGuards(EstablishmentOpenGuard, MenuOpenGuard)
 */
@Injectable()
export class EstablishmentOpenGuard implements CanActivate {
    private readonly logger = new Logger(EstablishmentOpenGuard.name);

    constructor(private readonly prisma: CorePrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<CustomRequest>();
        const { establishmentSlug } = request.params as Record<string, string>;

        if (!establishmentSlug) {
            throw new ForbiddenException('establishmentSlug param is required');
        }

        const establishment = await this.prisma.establishment.findUnique({
            where: { slug: establishmentSlug },
            select: {
                id: true,
                ownerId: true,
                slug: true,
                stripeCustomerId: true,
                primaryLanguage: true,
                availableLanguages: true,
                currency: true,
                timezone: true,
                schedule: {
                    include: { days: { include: { intervals: true } } }
                },
            },
        });

        if (!establishment) {
            throw new NotFoundException('Establishment not found');
        }


        if (!establishment.schedule) {
            throw new ForbiddenException({
                message: "teste",
                code: "teste",
            });
        }

        if (!isScheduleOpenNow(establishment.schedule, establishment.timezone)) {
            this.logger.log(`Establishment ${establishmentSlug} is currently closed`);
            throw new ForbiddenException({
                message: ERRORS.ESTABLISHMENT_CLOSED,
                code: ERRORS.ESTABLISHMENT_CLOSED,
            });
        }

        // Inject into request — reused by MenuOpenGuard and controllers
        request.establishment = {
            id: establishment.id,
            ownerId: establishment.ownerId,
            slug: establishment.slug,
            stripeCustomerId: establishment.stripeCustomerId,
            primaryLanguage: establishment.primaryLanguage,
            availableLanguages: establishment.availableLanguages as string[],
            currency: establishment.currency,
            timezone: establishment.timezone,
        };

        return true;
    }
}

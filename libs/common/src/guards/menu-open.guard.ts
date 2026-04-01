import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    NotFoundException,
    Logger,
    InternalServerErrorException,
} from '@nestjs/common';
import { CorePrismaService } from '@weats/database';
import { CustomRequest } from '@weats/types';
import { isScheduleOpenNow } from '@weats/common/utils/schedule.utils';
import { ERRORS } from '../errors';

/**
 * HTTP Guard — must run AFTER EstablishmentOpenGuard in the chain.
 *
 * Reads request.establishment (injected by EstablishmentOpenGuard) to avoid
 * a redundant DB query. Only makes ONE query: to fetch the menu's schedules
 * and verify it belongs to the establishment.
 *
 * Usage:
 *   @UseGuards(EstablishmentOpenGuard, MenuOpenGuard)
 *   @Get('/:establishmentSlug/menu/:menuId')
 *
 * If :menuId is not present in the route params the guard is a no-op
 * (useful if you want to reuse EstablishmentOpenGuard alone on other routes).
 */
@Injectable()
export class MenuOpenGuard implements CanActivate {
    private readonly logger = new Logger(MenuOpenGuard.name);

    constructor(private readonly prisma: CorePrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<CustomRequest>();
        const { menuId } = request.params as Record<string, string>;

        // Guard is a no-op when there's no menuId in the route
        if (!menuId) return true;

        const establishment = request.establishment;
        if (!establishment) {
            // Developer error: EstablishmentOpenGuard must run first
            this.logger.error('MenuOpenGuard requires EstablishmentOpenGuard to run first');
            throw new InternalServerErrorException('Guard chain misconfigured');
        }

        const menu = await this.prisma.menu.findFirst({
            where: {
                id: menuId,
                establishmentId: establishment.id, // ownership check in same query
            },
            select: {
                schedule: {
                    include: { days: { include: { intervals: true } } }
                },
            },
        });

        if (!menu) {
            throw new NotFoundException('Menu not found');
        }

        if (!menu.schedule) {
            throw new ForbiddenException({
                message: ERRORS.MENU_CLOSED,
                code: ERRORS.MENU_CLOSED,
            });
        }
        if (!isScheduleOpenNow(menu.schedule, establishment.timezone)) {
            this.logger.debug(`Menu ${menuId} is currently closed`);
            throw new ForbiddenException({
                message: ERRORS.MENU_CLOSED,
                code: ERRORS.MENU_CLOSED,
            });
        }

        return true;
    }
}

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/contracts/dashboard/dashboard.patterns';
import { UserService } from './user.service';
import { Establishment } from '@weats/types/establishment';
import { User } from '@weats/types/user';
import { ERRORS } from '@weats/common';

@Controller()
export class UserController {
    constructor(private readonly userService: UserService) { }

    @MessagePattern(DASHBOARD_PATTERNS.USER_GET_ESTABLISHMENTS)
    getEstablishments(@Payload() payload: { user: User }) {
        return this.userService.getEstablishments(payload.user.id);
    }

    @MessagePattern(DASHBOARD_PATTERNS.USER_MANAGE_SUBSCRIPTION)
    manageSubscription(@Payload() payload: { establishment: Establishment }) {
        if (!payload.establishment?.stripeCustomerId) {
            throw new RpcException({
                status: 400,
                message: ERRORS.STRIPE_CUSTOMER_ID_MISSING,
                code: ERRORS.STRIPE_CUSTOMER_ID_MISSING,
            });
        }
        return this.userService.manageEstablishmentSubscription(payload.establishment);
    }
}

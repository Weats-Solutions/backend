import { Controller, Get } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UserService } from './user.service';
import { Establishment } from '@weats/types/establishment';
import { User } from '@weats/types/user';
import { ApiAuthenticated, CurrentEstablishment, CurrentUser, ERRORS, SkipActiveSubscription, SkipEstablishmentStaff } from '@weats/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';


@ApiTags('Users')
@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }


    @SkipActiveSubscription()
    @SkipEstablishmentStaff()
    @Get('establishments')
    @ApiAuthenticated({ requireEstablishment: false })
    @ApiOperation({ summary: 'Obter a lista de estabelecimentos associados ao utilizador' })
    @ApiOkResponse({ description: 'Lista de estabelecimentos do utilizador' })
    getEstablishments(@CurrentUser() user: User) {
        return this.userService.getEstablishments(user.id);
    }


    @SkipActiveSubscription()
    @Get('manage-subscription')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Gerir subscrição do estabelecimento (obter URL do Stripe Portal)' })
    @ApiOkResponse({ description: 'URL para o Stripe Billing Portal' })
    manageSubscription(@CurrentEstablishment() establishment: Establishment) {
        if (!establishment?.stripeCustomerId) {
            throw new RpcException({
                status: 400,
                message: ERRORS.STRIPE_CUSTOMER_ID_MISSING,
                code: ERRORS.STRIPE_CUSTOMER_ID_MISSING,
            });
        }
        return this.userService.manageEstablishmentSubscription(establishment);
    }
}

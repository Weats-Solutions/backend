import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ERRORS } from '@weats/common';
import {
    EstablishmentBillingDataDto, UpdateEstablishmentBillingSettingsDto
} from '@weats/contracts';
import { CorePrismaService } from '@weats/database';
import { Establishment } from '@weats/types';
import { EstablishmentSubscriptionService } from './establishment-subscription.service';

@Injectable()
export class EstablishmentBillingSettingsService {
    private readonly logger = new Logger(EstablishmentBillingSettingsService.name);

    constructor(
        private readonly prisma: CorePrismaService,
        private readonly establishmentSubscriptionService: EstablishmentSubscriptionService,
    ) { }

    async getEstablishmentBillingSettings(id: string) {
        const establishment = await this.prisma.establishment.findUnique({
            where: { id },
            select: {
                billingName: true,
                billingTaxId: true,
                billingAddress: true,
                billingCity: true,
                billingState: true,
                billingZipCode: true,
                billingCountry: true,
            },
        });

        if (!establishment) {
            throw new RpcException({
                status: 404,
                message: ERRORS.ESTABLISHMENT_NOT_FOUND,
                code: ERRORS.ESTABLISHMENT_NOT_FOUND,
            });
        }

        const plan = await this.establishmentSubscriptionService.getPlan(id);
        const subscription = await this.establishmentSubscriptionService.getSubscription(id);

        return {
            billingInfo: {
                name: establishment.billingName,
                taxId: establishment.billingTaxId,
                address: establishment.billingAddress,
                city: establishment.billingCity,
                state: establishment.billingState,
                zipCode: establishment.billingZipCode,
                country: establishment.billingCountry,
            },
            plan,
            subscription
        };
    }

    async updateEstablishmentBillingSettings(establishment: Establishment, dto: UpdateEstablishmentBillingSettingsDto) {
        try {
            let result;

            switch (dto.section) {
                case 'billingInfo':
                    result = await this.updateBillingInfo(establishment.id, dto.billingInfo);
                    break;

                default:
                    throw new RpcException({
                        status: 400,
                        message: 'Invalid billing settings section',
                        code: ERRORS.BAD_REQUEST,
                    });
            }

            return result;
        } catch (error) {
            if (error instanceof RpcException) throw error;

            this.logger.error(`[BillingSettings] Update failed:`, error);

            throw new RpcException({
                status: 400,
                message: ERRORS.BAD_REQUEST,
                code: ERRORS.BAD_REQUEST,
            });
        }
    }

    private async updateBillingInfo(id: string, data: EstablishmentBillingDataDto) {
        const establishment = await this.prisma.establishment.update({
            where: { id },
            data: {
                billingName: data.billingName,
                billingTaxId: data.billingTaxId,
                billingAddress: data.billingAddress,
                billingCity: data.billingCity,
                billingState: data.billingState,
                billingZipCode: data.billingZipCode,
                billingCountry: data.billingCountry,
            },
            select: {
                billingName: true,
                billingTaxId: true,
                billingAddress: true,
                billingCity: true,
                billingState: true,
                billingZipCode: true,
                billingCountry: true,
            }
        });

        return establishment;
    }

}



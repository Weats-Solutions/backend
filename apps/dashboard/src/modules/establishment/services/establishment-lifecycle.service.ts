
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ERRORS, RESERVED_DOMAINS, RESPONSE_CODES } from '@weats/common';
import {
    CreateEstablishmentDto
} from '@weats/contracts';
import { CorePrismaService } from '@weats/database';
import { StripeService } from '@weats/integrations';
import { CacheService } from '@weats/cache';
import { User } from '@weats/types';
import { ulid } from 'ulid';

@Injectable()
export class EstablishmentLifeCycleService {
    private readonly logger = new Logger(EstablishmentLifeCycleService.name);

    constructor(
        private readonly prisma: CorePrismaService,
        private readonly stripeService: StripeService,
        private readonly cacheService: CacheService,
    ) { }


    private normalizeCountry(country: string): string {
        if (!country) return 'PT';
        const c = country.toUpperCase().trim();
        const map: Record<string, string> = {
            PORTUGAL: 'PT',
            ESPANHA: 'ES',
            SPAIN: 'ES',
            FRANCE: 'FR',
            UNITEDSTATES: 'US',
        };

        return map[c.replace(/\s/g, '')] ?? c.slice(0, 2);
    }

    private normalizeVat(vat: string, countryIso: string): string {
        const clean = vat.replace(/[^A-Za-z0-9]/g, '');
        if (clean.toUpperCase().startsWith(countryIso)) {
            return clean;
        }
        return `${countryIso}${clean}`;
    }

    async createEstablishment(
        createEstablishmentDto: CreateEstablishmentDto,
        user: User,
    ) {
        const cleanPhone = createEstablishmentDto.phoneNumber.replace(/\D/g, '');
        const countryIso = this.normalizeCountry(createEstablishmentDto.billingCountry);
        const finalBillingTaxId = this.normalizeVat(createEstablishmentDto.billingTaxId, countryIso);

        let customer;
        try {
            customer = await this.stripeService.createB2BCustomer({
                name: createEstablishmentDto.name,
                email: createEstablishmentDto.email,
                phone: createEstablishmentDto.countryCode + cleanPhone,
                business_name: createEstablishmentDto.billingName,
                address: {
                    line1: createEstablishmentDto.billingAddress,
                    city: createEstablishmentDto.billingCity,
                    state: createEstablishmentDto.billingState,
                    postal_code: createEstablishmentDto.billingZipCode,
                    country: countryIso,
                },
                tax_id_data: [
                    {
                        type: 'eu_vat',
                        value: finalBillingTaxId,
                    },
                ],
                metadata: {
                    ownerId: user.id,
                },
            });


            const slug = await this.generateUniqueSlug(createEstablishmentDto.name);

            const targetThemeId = 'cmnm20i4y00001sw1pk626ovy';

            const themes = await this.prisma.theme.findFirst({
                where: {
                    OR: [
                        { id: targetThemeId },
                        { isDefault: true },
                    ],
                },
            });

            const activeThemeId = themes?.id || null;

            const createdEstablishment = await this.prisma.establishment.create({
                data: {
                    name: createEstablishmentDto.name,
                    type: createEstablishmentDto.type,
                    slug,
                    ownerId: user.id,
                    stripeCustomerId: customer.id,
                    email: createEstablishmentDto.email,
                    countryCode: createEstablishmentDto.countryCode,
                    phoneNumber: createEstablishmentDto.phoneNumber,
                    billingName: createEstablishmentDto.billingName,
                    billingTaxId: finalBillingTaxId,
                    billingAddress: createEstablishmentDto.billingAddress,
                    billingCity: createEstablishmentDto.billingCity,
                    billingState: createEstablishmentDto.billingState,
                    billingZipCode: createEstablishmentDto.billingZipCode,
                    billingCountry: countryIso,
                    primaryLanguage: createEstablishmentDto.primaryLanguage,
                    availableLanguages: [createEstablishmentDto.primaryLanguage],
                    currency: createEstablishmentDto.currency,
                    timezone: createEstablishmentDto.timezone,
                    activeThemeId,
                    myPageModule: true,
                },
            });

            await this.stripeService.updateCustomer(customer.id, {
                metadata: {
                    establishmentId: createdEstablishment.id,
                    ownerId: user.id,
                }
            });

            return {
                message: RESPONSE_CODES.ESTABLISHMENT.CREATED,
                establishmentId: createdEstablishment.id,
            };
        } catch (error) {
            if (customer?.id) {
                try {
                    await this.stripeService.deleteCustomer(customer.id);
                } catch (cleanupError) {
                    this.logger.error(`Failed to cleanup Stripe customer ${customer.id}`, cleanupError);
                }
            }
            throw error;
        }
    }



    async deleteEstablishmentMenuCache(id: string) {
        const establishment = await this.prisma.establishment.findUnique({
            where: { id },
        });

        if (!establishment) {
            throw new RpcException({
                status: 404,
                message: ERRORS.ESTABLISHMENT_NOT_FOUND,
                code: ERRORS.ESTABLISHMENT_NOT_FOUND,
            });
        }

        return this.cacheService.clearEstablishmentCache(establishment.slug);
    }


    async deleteEstablishmentTest(id: string) {
        if (process.env.NODE_ENV !== 'development') {
            throw new RpcException({
                code: 403,
                message: 'This route is only available in development mode.',
            });
        }

        const establishment = await this.prisma.establishment.findUnique({
            where: { id },
            select: { stripeCustomerId: true },
        });

        if (!establishment) {
            throw new RpcException({
                code: 404,
                message: ERRORS.ESTABLISHMENT_NOT_FOUND,
            });
        }

        if (establishment.stripeCustomerId) {
            try {
                await this.stripeService.deleteCustomer(establishment.stripeCustomerId);
            } catch (error) {
                this.logger.error('Failed to delete Stripe customer', error);
            }
        }

        await this.prisma.establishment.delete({
            where: { id },
        });

        return { message: 'Establishment deleted successfully.' };
    }


    private generateSlug(name: string): string {
        return name
            .normalize('NFD') // Decompõe caracteres acentuados (ex: á -> a + ´)
            .replace(/[\u0300-\u036f]/g, '') // Remove os acentos
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais que sobraram
            .replace(/\s+/g, '-') // Espaços para hífens
            .replace(/-+/g, '-') // Remove hífens duplicados
            .replace(/^-+|-+$/g, ''); // Remove hífens no início e fim
    }

    private async generateUniqueSlug(name: string): Promise<string> {
        let baseSlug = this.generateSlug(name);

        // Tratamento de domínios reservados logo no início
        if (RESERVED_DOMAINS.includes(baseSlug)) {
            baseSlug = `${baseSlug}-${ulid().slice(-4)}`;
        }

        let currentSlug = baseSlug;
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 5) {
            const exists = await this.prisma.establishment.findUnique({
                where: { slug: currentSlug },
                select: { id: true }, // Seleciona apenas o ID para ser mais rápido
            });

            if (!exists) {
                isUnique = true;
            } else {
                // Gera um novo sufixo a cada tentativa falhada
                currentSlug = `${baseSlug}-${ulid().slice(-4)}`;
                attempts++;
            }
        }

        return currentSlug;
    }
}


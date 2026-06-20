import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CorePrismaService } from '@weats/database';
import { IntegrationCategory } from '@weats/types';

const CATEGORY_MAP: Record<IntegrationCategory, string[]> = {
    [IntegrationCategory.POS]: ['xdRestEnabled', 'vendusEnabled'],
    [IntegrationCategory.PAYMENT]: ['eupagoEnabled', 'vivaEnabled', 'sumupEnabled'],
    [IntegrationCategory.INVOICING]: ['biziqEnabled'],
    [IntegrationCategory.OTHER]: [],
};

const INTEGRATION_NAMES: Record<string, string> = {
    xdRestEnabled: 'XD Rest',
    vendusEnabled: 'Vendus',
    eupagoEnabled: 'EuPago',
    vivaEnabled: 'Viva Wallet',
    sumupEnabled: 'SumUp',
    biziqEnabled: 'Biziq',
};

@Injectable()
export class IntegrationsValidationService {
    constructor(private readonly prisma: CorePrismaService) {}

    /**
     * Checks if the establishment has another integration enabled within the same category.
     * Throws an exception if exclusivity is violated.
     */
    async validateExclusivity(establishmentId: string, category: IntegrationCategory, currentField: string) {
        const categoryFields = CATEGORY_MAP[category];
        
        // If the category has no fields or only the current field, no conflict is possible.
        if (!categoryFields || categoryFields.length <= 1) {
            return;
        }

        const integrations = await this.prisma.establishmentIntegrations.findUnique({
            where: { establishmentId },
        });

        if (!integrations) {
            return; // No integrations exist yet
        }

        // Find if any other integration in the same category is already enabled
        for (const field of categoryFields) {
            if (field !== currentField && integrations[field] === true) {
                const activeName = INTEGRATION_NAMES[field] || field;
                throw new RpcException({
                    message: `Não podes ativar esta integração porque já tens uma integração da mesma categoria ativa (${activeName}). Por favor, desativa a integração anterior antes de procederes.`,
                    code: 'INTEGRATION_CATEGORY_EXCLUSIVITY_VIOLATION',
                });
            }
        }
    }
}

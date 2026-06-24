import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CorePrismaService } from '@weats/database';
import { EncryptionService } from '@weats/encryption';
import { IntegrationsValidationService } from '../validation/integrations-validation.service';
import { IntegrationCategory, IfthenpayKeyStatus } from '@weats/types';
import { RpcException } from '@nestjs/microservices';
import { ERRORS } from '@weats/common';
import { createClient } from '@ifthenpay/js-sdk';

@Injectable()
export class IfthenpayService {
    private readonly logger = new Logger(IfthenpayService.name);

    constructor(
        private readonly corePrismaService: CorePrismaService,
        private readonly encryption: EncryptionService,
        private readonly validationService: IntegrationsValidationService,
    ) {}

    private async getClient(establishmentId: string) {
        const decryptedToken = await this.getDecryptedKey(establishmentId);
        return createClient({
            authToken: decryptedToken
        });
    }

    async saveKey(establishmentId: string, authToken: string): Promise<IfthenpayKeyStatus> {
        const encrypted = this.encryption.encrypt(authToken);

        // First validate exclusivity before activating
        await this.validationService.validateExclusivity(
            establishmentId,
            IntegrationCategory.PAYMENT,
            'ifthenpayEnabled',
        );

        const record = await this.corePrismaService.establishmentIntegrations.upsert({
            where: { establishmentId },
            create: { establishmentId, ifthenpayEnabled: true, ifthenpayAuthToken: encrypted },
            update: { ifthenpayEnabled: true, ifthenpayAuthToken: encrypted },
        });

        this.logger.log(`Ifthenpay token saved for establishment ${establishmentId}`);

        return {
            connected: true,
            isEnabled: record.ifthenpayEnabled,
            maskedKey: this.maskKey(authToken),
            updatedAt: record.updatedAt,
        };
    }

    async getStatus(establishmentId: string): Promise<IfthenpayKeyStatus> {
        const record = await this.corePrismaService.establishmentIntegrations.findUnique({
            where: { establishmentId },
            select: { ifthenpayEnabled: true, ifthenpayAuthToken: true, updatedAt: true },
        });

        if (!record?.ifthenpayAuthToken) {
            return {
                connected: false,
                isEnabled: false,
                maskedKey: null,
                updatedAt: null,
            };
        }

        const decrypted = this.encryption.decrypt(record.ifthenpayAuthToken);

        return {
            connected: true,
            isEnabled: record.ifthenpayEnabled,
            maskedKey: this.maskKey(decrypted),
            updatedAt: record.updatedAt,
        };
    }

    async toggle(establishmentId: string, enabled: boolean) {
        const record = await this.corePrismaService.establishmentIntegrations.findUnique({
            where: { establishmentId },
            select: { ifthenpayAuthToken: true },
        });

        if (enabled && !record?.ifthenpayAuthToken) {
            throw new NotFoundException({
                message: 'Ifthenpay integration not configured.',
                code: ERRORS.INTEGRATION_NOT_CONFIGURED,
            });
        }

        if (enabled) {
            await this.validationService.validateExclusivity(
                establishmentId,
                IntegrationCategory.PAYMENT,
                'ifthenpayEnabled',
            );
        }

        await this.corePrismaService.establishmentIntegrations.update({
            where: { establishmentId },
            data: { ifthenpayEnabled: enabled },
        });

        this.logger.log(`Ifthenpay integration ${enabled ? 'enabled' : 'disabled'} for establishment ${establishmentId}`);

        return { isEnabled: enabled };
    }

    async deleteKey(establishmentId: string) {
        const record = await this.corePrismaService.establishmentIntegrations.findUnique({
            where: { establishmentId },
        });

        if (!record) {
            throw new NotFoundException(
                `Nenhuma integração Ifthenpay encontrada para o estabelecimento ${establishmentId}.`,
            );
        }

        await this.corePrismaService.establishmentIntegrations.update({
            where: { establishmentId },
            data: { ifthenpayEnabled: false, ifthenpayAuthToken: null },
        });

        this.logger.log(`Ifthenpay token removed for establishment ${establishmentId}`);

        return { connected: false };
    }

    async getDecryptedKey(establishmentId: string): Promise<string> {
        const record = await this.corePrismaService.establishmentIntegrations.findUnique({
            where: { establishmentId },
            select: { ifthenpayAuthToken: true },
        });

        if (!record?.ifthenpayAuthToken) {
            throw new NotFoundException(
                'Integração Ifthenpay não configurada para este estabelecimento.',
            );
        }

        return this.encryption.decrypt(record.ifthenpayAuthToken);
    }

    // ─── Payment operations using the js-sdk ─────────────────────────

    async createMbwayPayment(establishmentId: string, dto: any) {
        try {
            const client = await this.getClient(establishmentId);
            return await client.mbway.createPayment(dto);
        } catch (error) {
            this.handleError(error, 'MBWAY');
        }
    }

    async getMbwayStatus(establishmentId: string, transactionId: string) {
        try {
            const client = await this.getClient(establishmentId);
            return await client.mbway.getStatus({ transactionId });
        } catch (error) {
            this.handleError(error, 'MBWAY_STATUS');
        }
    }

    async createMultibancoPayment(establishmentId: string, dto: any) {
        try {
            const client = await this.getClient(establishmentId);
            return await client.multibanco.createPayment(dto);
        } catch (error) {
            this.handleError(error, 'Multibanco');
        }
    }

    async createPayshopPayment(establishmentId: string, dto: any) {
        try {
            const client = await this.getClient(establishmentId);
            return await client.payshop.createPayment(dto);
        } catch (error) {
            this.handleError(error, 'Payshop');
        }
    }

    async createCreditCardPayment(establishmentId: string, dto: any) {
        try {
            const client = await this.getClient(establishmentId);
            return await client.creditCard.createPayment(dto);
        } catch (error) {
            this.handleError(error, 'CreditCard');
        }
    }

    async createCofidisPayment(establishmentId: string, dto: any) {
        try {
            const client = await this.getClient(establishmentId);
            return await client.cofidis.createPayment(dto);
        } catch (error) {
            this.handleError(error, 'Cofidis');
        }
    }

    async createPixPayment(establishmentId: string, dto: any) {
        try {
            const client = await this.getClient(establishmentId);
            return await client.pix.createPayment(dto);
        } catch (error) {
            this.handleError(error, 'PIX');
        }
    }

    async createPayByLinkPayment(establishmentId: string, dto: any) {
        try {
            const client = await this.getClient(establishmentId);
            return await client.payByLink.createPayment(dto);
        } catch (error) {
            this.handleError(error, 'PayByLink');
        }
    }

    private handleError(error: any, operation: string) {
        this.logger.error(`[Ifthenpay][${operation}] Error:`, error);
        
        const message = error.message || 'Error executing Ifthenpay operation';
        const code = error.details?.code || 'IFTHENPAY_ERROR';

        throw new RpcException({
            message,
            code,
            details: error.details,
        });
    }

    private maskKey(key: string): string {
        if (key.length <= 6) return '*'.repeat(key.length);
        return `${key.slice(0, 3)}${'*'.repeat(key.length - 6)}${key.slice(-3)}`;
    }
}

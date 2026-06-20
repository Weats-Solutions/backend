import {
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CorePrismaService } from '@weats/database';
import { EncryptionService } from '@weats/encryption';
import { RpcException } from '@nestjs/microservices';
import { IntegrationCategory } from '@weats/types';
import { IntegrationsValidationService } from '../validation/integrations-validation.service';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface XdRestStatus {
    connected: boolean;
    isEnabled: boolean;
    maskedUsername: string | null;
    baseUrl: string | null;
    updatedAt: Date | null;
}

export interface XdRestToggleResult {
    isEnabled: boolean;
}

export interface XdRestDeleteResult {
    connected: boolean;
}

export interface XdRestTestResult {
    success: boolean;
    message: string;
}

// ─── Service ────────────────────────────────────────────────────────────────

@Injectable()
export class XdRestService {
    private readonly logger = new Logger(XdRestService.name);

    constructor(
        private readonly http: HttpService,
        private readonly corePrismaService: CorePrismaService,
        private readonly encryption: EncryptionService,
        private readonly validationService: IntegrationsValidationService,
    ) { }

    // ─── Credential Management ──────────────────────────────────────────────

    /**
     * Saves XD Rest credentials and validates them via the login endpoint.
     * Stores base URL in plain text; username and password are AES-256 encrypted.
     */
    async saveCredentials(
        establishmentId: string,
        baseUrl: string,
        username: string,
        password: string,
    ): Promise<XdRestStatus> {
        // 1. Validate by calling the login endpoint
        const loginResult = await this.login(baseUrl, username, password);

        // 1.5. Validate category exclusivity
        await this.validationService.validateExclusivity(establishmentId, IntegrationCategory.POS, 'xdRestEnabled');

        // 2. Encrypt credentials
        const encryptedUsername = this.encryption.encrypt(username);
        const encryptedPassword = this.encryption.encrypt(password);

        // 3. Store encrypted token if login succeeded
        const encryptedToken = loginResult.token
            ? this.encryption.encrypt(loginResult.token)
            : null;

        const record = await this.corePrismaService.establishmentIntegrations.upsert({
            where: { establishmentId },
            create: {
                establishmentId,
                xdRestEnabled: true,
                xdRestBaseUrl: baseUrl,
                xdRestUsername: encryptedUsername,
                xdRestPassword: encryptedPassword,
                xdRestToken: encryptedToken,
                xdRestTokenExp: loginResult.expiration ?? null,
            },
            update: {
                xdRestEnabled: true,
                xdRestBaseUrl: baseUrl,
                xdRestUsername: encryptedUsername,
                xdRestPassword: encryptedPassword,
                xdRestToken: encryptedToken,
                xdRestTokenExp: loginResult.expiration ?? null,
            },
        });

        this.logger.log(`XD Rest credentials saved for establishment ${establishmentId}`);

        return {
            connected: true,
            isEnabled: record.xdRestEnabled,
            maskedUsername: this.maskValue(username),
            baseUrl: record.xdRestBaseUrl,
            updatedAt: record.updatedAt,
        };
    }

    /**
     * Returns the connection status for the XD Rest integration.
     */
    async getStatus(establishmentId: string): Promise<XdRestStatus> {
        const record = await this.corePrismaService.establishmentIntegrations.findUnique({
            where: { establishmentId },
            select: {
                xdRestEnabled: true,
                xdRestBaseUrl: true,
                xdRestUsername: true,
                updatedAt: true,
            },
        });

        if (!record?.xdRestUsername) {
            return {
                connected: false,
                isEnabled: false,
                maskedUsername: null,
                baseUrl: null,
                updatedAt: null,
            };
        }

        const decryptedUsername = this.encryption.decrypt(record.xdRestUsername);

        return {
            connected: true,
            isEnabled: record.xdRestEnabled,
            maskedUsername: this.maskValue(decryptedUsername),
            baseUrl: record.xdRestBaseUrl,
            updatedAt: record.updatedAt,
        };
    }

    /**
     * Toggle the XD Rest integration on or off without touching credentials.
     * Requires credentials to be present before enabling.
     */
    async toggle(establishmentId: string, enabled: boolean): Promise<XdRestToggleResult> {
        const record = await this.corePrismaService.establishmentIntegrations.findUnique({
            where: { establishmentId },
            select: { xdRestUsername: true },
        });

        if (enabled && !record?.xdRestUsername) {
            throw new RpcException({
                message: 'XD Rest integration not configured. Please save credentials first.',
                code: 'XD_REST_INTEGRATION_NOT_CONFIGURED',
            });
        }

        if (enabled) {
            await this.validationService.validateExclusivity(establishmentId, IntegrationCategory.POS, 'xdRestEnabled');
        }

        await this.corePrismaService.establishmentIntegrations.update({
            where: { establishmentId },
            data: { xdRestEnabled: enabled },
        });

        this.logger.log(`XD Rest integration ${enabled ? 'enabled' : 'disabled'} for establishment ${establishmentId}`);

        return { isEnabled: enabled };
    }

    /**
     * Removes all XD Rest credentials and disables the integration.
     */
    async deleteCredentials(establishmentId: string): Promise<XdRestDeleteResult> {
        const record = await this.corePrismaService.establishmentIntegrations.findUnique({
            where: { establishmentId },
        });

        if (!record) {
            throw new NotFoundException(
                `No XD Rest integration found for establishment ${establishmentId}.`,
            );
        }

        await this.corePrismaService.establishmentIntegrations.update({
            where: { establishmentId },
            data: {
                xdRestEnabled: false,
                xdRestBaseUrl: null,
                xdRestUsername: null,
                xdRestPassword: null,
                xdRestToken: null,
                xdRestTokenExp: null,
            },
        });

        this.logger.log(`XD Rest credentials removed for establishment ${establishmentId}`);

        return { connected: false };
    }

    /**
     * Tests the connection by decrypting stored credentials and calling the login endpoint.
     */
    async testConnection(establishmentId: string): Promise<XdRestTestResult> {
        const record = await this.corePrismaService.establishmentIntegrations.findUnique({
            where: { establishmentId },
            select: {
                xdRestBaseUrl: true,
                xdRestUsername: true,
                xdRestPassword: true,
            },
        });

        if (!record?.xdRestBaseUrl || !record.xdRestUsername || !record.xdRestPassword) {
            throw new RpcException({
                message: 'XD Rest integration not configured.',
                code: 'XD_REST_INTEGRATION_NOT_CONFIGURED',
            });
        }

        const username = this.encryption.decrypt(record.xdRestUsername);
        const password = this.encryption.decrypt(record.xdRestPassword);

        try {
            const loginResult = await this.login(record.xdRestBaseUrl, username, password);

            // Update cached token
            if (loginResult.token) {
                await this.corePrismaService.establishmentIntegrations.update({
                    where: { establishmentId },
                    data: {
                        xdRestToken: this.encryption.encrypt(loginResult.token),
                        xdRestTokenExp: loginResult.expiration ?? null,
                    },
                });
            }

            return {
                success: true,
                message: 'Connection successful. Credentials are valid.',
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof RpcException
                    ? (error.getError() as any).message
                    : 'Connection failed. Please verify your credentials and base URL.',
            };
        }
    }

    // ─── Private helpers ────────────────────────────────────────────────────

    /**
     * Calls the XD Rest login endpoint to authenticate.
     * POST {baseUrl}/gateway/AccountLogin
     * Body: { user, password }
     */
    private async login(
        baseUrl: string,
        username: string,
        password: string,
    ): Promise<{ token: string | null; expiration: Date | null }> {
        const url = `${baseUrl.replace(/\/+$/, '')}/gateway/AccountLogin`;

        try {
            this.logger.debug(`[XD Rest] POST ${url}`);

            const { data } = await firstValueFrom(
                this.http.post(url, { user: username, password }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    timeout: 10000,
                }),
            );

            this.logger.log('[XD Rest] ✅ Login succeeded');

            return {
                token: data?.token ?? data?.accessToken ?? null,
                expiration: data?.expiration ? new Date(data.expiration) : null,
            };
        } catch (error) {
            const status = error?.response?.status;
            const message = error?.response?.data?.message
                || error?.response?.data?.title
                || error?.message
                || 'Unknown error';

            this.logger.warn(`[XD Rest] ❌ Login failed (${status}): ${message}`);

            throw new RpcException({
                message: `XD Rest login failed: ${message}`,
                code: 'XD_REST_LOGIN_FAILED',
            });
        }
    }

    /**
     * Masks a value for display (e.g. "admin123" → "adm***23")
     */
    private maskValue(value: string): string {
        if (value.length <= 4) return '*'.repeat(value.length);
        return `${value.slice(0, 3)}${'*'.repeat(Math.max(value.length - 5, 1))}${value.slice(-2)}`;
    }
}

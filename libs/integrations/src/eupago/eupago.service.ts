import {
    Injectable,
    Logger,
    BadRequestException,
    Inject,
    NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
    EupagoMultibancoRequest,
    EupagoMultibancoResponse, EupagoCreditCardSuccessResponse, EupagoGooglePayResponse, EupagoApplePayResponse,
    EupagoMbwayRequest,
    EupagoMbwayResponse,
    EupagoKeyStatus,
    EupagoToggleResult,
    EupagoDeleteResult,
    EupagoCryptoKeyResult,
    Establishment,
    PaymentRequest
} from '@weats/types';
import { CorePrismaService } from '@weats/database';
import { EncryptionService } from '@weats/encryption';
import { DEFAULT_MINUTES_FORM_UP, ERRORS, EupagoFormLangEnum } from '@weats/common';
import { EupagoCreateMbwayPaymentDto } from '@weats/contracts/dashboard/dtos/eupago';
import { EupagoCreatePaymentDto } from '@weats/contracts/dashboard/dtos/eupago/create-payment.dto';
import { RpcException } from '@nestjs/microservices';

// ─── Shared types ───────────────────────────────────────────────────────────

/** All known EuPago operation names used internally for logging and error handling. */
type EupagoOperation =
    | 'Multibanco'
    | 'MBWAY'
    | 'Payshop'
    | 'ReferenceInfo'
    | 'CreditCard'
    | 'GooglePay'
    | 'ApplePay';

const EUPAGO_ENDPOINTS: Record<EupagoOperation, string> = {
    Multibanco: '/clientes/rest_api/multibanco/create',
    MBWAY: '/api/v1.02/mbway/create',
    CreditCard: '/api/v1.02/creditcard/create',
    GooglePay: '/api/v1.02/googlepay/create',
    ApplePay: '/api/v1.02/euapplepay/create',
    Payshop: '/api/v1.02/payshop/create',
    ReferenceInfo: '/api/v1.02/reference/info',
};


/** Parameters for the unified private `post()` helper. */
interface PostRequestParams {
    url: string;
    body: object;
    /** Pass the decrypted key for header auth, or `null` for body-only auth. */
    apiKey: string | null;
    operation: EupagoOperation;
}

@Injectable()
export class EupagoService {
    private readonly logger = new Logger(EupagoService.name);

    constructor(
        private readonly http: HttpService,
        private readonly corePrismaService: CorePrismaService,
        private readonly encryption: EncryptionService,
        @Inject('EUPAGO_API_URL') private readonly eupagoApiUrl: string,
    ) { }

    // ─── Key management ─────────────────────────────────────────────────────

    async saveKey(
        establishmentId: string,
        apiKey: string,
    ): Promise<EupagoKeyStatus> {
        const encrypted = this.encryption.encrypt(apiKey);

        const record = await this.corePrismaService.establishmentIntegrations.upsert({
            where: { establishmentId },
            create: { establishmentId, eupagoEnabled: true, eupagoApiKey: encrypted },
            update: { eupagoEnabled: true, eupagoApiKey: encrypted },
        });

        this.logger.log(`EuPago key saved for establishment ${establishmentId}`);

        return {
            connected: true,
            isEnabled: record.eupagoEnabled,
            maskedKey: this.maskKey(apiKey),
            cryptoKeyConnected: !!record.eupagoCryptoKey,
            updatedAt: record.updatedAt,
        };
    }

    async getStatus(establishmentId: string): Promise<EupagoKeyStatus> {
        const record = await this.corePrismaService.establishmentIntegrations.findUnique({
            where: { establishmentId },
            select: { eupagoEnabled: true, eupagoApiKey: true, eupagoCryptoKey: true, updatedAt: true },
        });

        if (!record?.eupagoApiKey) {
            return {
                connected: false,
                isEnabled: false,
                maskedKey: null,
                cryptoKeyConnected: !!record?.eupagoCryptoKey,
                updatedAt: null,
            };
        }

        const decrypted = this.encryption.decrypt(record.eupagoApiKey);

        return {
            connected: true,
            isEnabled: record.eupagoEnabled,
            maskedKey: this.maskKey(decrypted),
            cryptoKeyConnected: !!record.eupagoCryptoKey,
            updatedAt: record.updatedAt,
        };
    }

    /**
     * Toggle the EuPago integration on or off without touching credentials.
     * Requires an API key to be present before enabling.
     */
    async toggle(establishmentId: string, enabled: boolean): Promise<EupagoToggleResult> {
        const record = await this.corePrismaService.establishmentIntegrations.findUnique({
            where: { establishmentId },
            select: { eupagoApiKey: true },
        });

        if (enabled && !record?.eupagoApiKey) {
            throw new NotFoundException({
                message: ERRORS.EUPAGO_INTEGRATION_NOT_CONFIGURED,
                code: ERRORS.EUPAGO_INTEGRATION_NOT_CONFIGURED,
            });
        }

        await this.corePrismaService.establishmentIntegrations.update({
            where: { establishmentId },
            data: { eupagoEnabled: enabled },
        });

        this.logger.log(`EuPago integration ${enabled ? 'enabled' : 'disabled'} for establishment ${establishmentId}`);

        return { isEnabled: enabled };
    }

    async deleteKey(establishmentId: string): Promise<EupagoDeleteResult> {
        const record = await this.corePrismaService.establishmentIntegrations.findUnique({
            where: { establishmentId },
        });

        if (!record) {
            throw new NotFoundException(
                `Nenhuma integração EuPago encontrada para o estabelecimento ${establishmentId}.`,
            );
        }

        await this.corePrismaService.establishmentIntegrations.update({
            where: { establishmentId },
            data: { eupagoEnabled: false, eupagoApiKey: null },
        });

        this.logger.log(`EuPago key removed for establishment ${establishmentId}`);

        return { connected: false };
    }



    /**
 * Saves (or replaces) the Chave Criptográfica gerada no backoffice EuPago.
 * Usada para verificar HMAC-SHA256 e desencriptar AES-256-CBC nos webhooks.
 */
    async saveCryptoKey(
        establishmentId: string,
        cryptoKey: string,
    ): Promise<EupagoCryptoKeyResult> {
        // Trim whitespace/newlines that may be accidentally pasted from the EuPago backoffice
        const sanitized = cryptoKey.trim();
        const encrypted = this.encryption.encrypt(sanitized);

        const record = await this.corePrismaService.establishmentIntegrations.upsert({
            where: { establishmentId },
            create: { establishmentId, eupagoCryptoKey: encrypted },
            update: { eupagoCryptoKey: encrypted },
        });

        this.logger.log(`EuPago crypto key saved for establishment ${establishmentId}`);

        return { cryptoKeyConnected: true, updatedAt: record.updatedAt };
    }



    /**
     * Retrieve and decrypt the raw API key for use in payment operations.
     *
     * @throws NotFoundException if no key is stored.
     */
    async getDecryptedKey(establishmentId: string): Promise<string> {
        const record = await this.corePrismaService.establishmentIntegrations.findUnique({
            where: { establishmentId },
            select: { eupagoApiKey: true },
        });

        if (!record?.eupagoApiKey) {
            throw new NotFoundException(
                'Integração EuPago não configurada para este estabelecimento.',
            );
        }

        return this.encryption.decrypt(record.eupagoApiKey);
    }

    async deleteCryptoKey(establishmentId: string): Promise<EupagoCryptoKeyResult> {
        const record = await this.corePrismaService.establishmentIntegrations.findUnique({
            where: { establishmentId },
        });

        if (!record) {
            throw new NotFoundException(
                `Nenhuma integração EuPago encontrada para o estabelecimento ${establishmentId}.`,
            );
        }

        await this.corePrismaService.establishmentIntegrations.update({
            where: { establishmentId },
            data: { eupagoCryptoKey: null },
        });

        this.logger.log(`EuPago crypto key removed for establishment ${establishmentId}`);

        return { cryptoKeyConnected: false, updatedAt: null };
    }

    // ─── Multibanco ─────────────────────────────────────────────────────────

    /**
     * Creates a Multibanco payment reference.
     */
    async createMultibancoReference(
        establishmentId: string,
        dto: Omit<EupagoMultibancoRequest, 'chave'>,
    ): Promise<EupagoMultibancoResponse> {
        const apiKey = await this.getDecryptedKey(establishmentId);
        const url = `${this.eupagoApiUrl}${EUPAGO_ENDPOINTS.Multibanco}`;
        const body: EupagoMultibancoRequest = { ...dto, chave: apiKey };

        return this.post<EupagoMultibancoResponse>({
            url,
            body,
            apiKey: null,
            operation: 'Multibanco',
            validator: this.assertMultibancoSuccess.bind(this),
        });
    }

    // ─── Hosted Payments (Credit Card, Google Pay, Apple Pay) ────────────────

    /**
     * Unified method for payment methods that share the same hosted checkout structure.
     */
    async createHostedPayment<T>(
        operation: 'CreditCard' | 'GooglePay' | 'ApplePay',
        establishment: Establishment,
        identifier: string,
        dto: EupagoCreatePaymentDto,
    ): Promise<T> {
        const apiKey = await this.getDecryptedKey(establishment.id);
        const payment = this.buildHostedCheckoutPayment(dto, establishment.currency, identifier);
        const url = `${this.eupagoApiUrl}${EUPAGO_ENDPOINTS[operation]}`;

        return this.post<T>({
            url,
            body: { payment },
            apiKey,
            operation,
        });
    }

    async createCreditCardPayment(
        establishment: Establishment,
        identifier: string,
        dto: EupagoCreatePaymentDto,
    ): Promise<EupagoCreditCardSuccessResponse> {
        return this.createHostedPayment<EupagoCreditCardSuccessResponse>(
            'CreditCard',
            establishment,
            identifier,
            dto,
        );
    }

    async createGooglePayPayment(
        establishment: Establishment,
        identifier: string,
        dto: EupagoCreatePaymentDto,
    ): Promise<EupagoGooglePayResponse> {
        return this.createHostedPayment<EupagoGooglePayResponse>(
            'GooglePay',
            establishment,
            identifier,
            dto,
        );
    }

    async createApplePayPayment(
        establishment: Establishment,
        identifier: string,
        dto: EupagoCreatePaymentDto,
    ): Promise<EupagoApplePayResponse> {
        return this.createHostedPayment<EupagoApplePayResponse>(
            'ApplePay',
            establishment,
            identifier,
            dto,
        );
    }

    // ─── MB WAY (v2) ────────────────────────────────────────────────────────

    /**
     * Sends a push notification to the customer's MB WAY app.
     */
    async createMbwayPayment(
        establishment: Establishment,
        identifier: string,
        dto: EupagoCreateMbwayPaymentDto,
    ): Promise<EupagoMbwayResponse> {
        const apiKey = await this.getDecryptedKey(establishment.id);
        const url = `${this.eupagoApiUrl}${EUPAGO_ENDPOINTS.MBWAY}`;

        const body: EupagoMbwayRequest = {
            payment: {
                amount: {
                    value: dto.value,
                    currency: establishment.currency,
                },
                identifier,
                customerPhone: dto.customerPhone,
                countryCode: dto.countryCode,
            },
        };

        return this.post<EupagoMbwayResponse>({
            url,
            body,
            apiKey,
            operation: 'MBWAY',
        });
    }

    // ─── Private helpers — Payment Building ─────────────────────────────────

    /**
     * Builds the common payment object used by Credit Card, Google Pay, and Apple Pay.
     */
    private buildHostedCheckoutPayment(
        dto: EupagoCreatePaymentDto,
        currency: string,
        identifier: string,
    ): PaymentRequest {
        return {
            amount: {
                value: dto.value,
                currency,
            },
            identifier,
            successUrl: dto.successUrl,
            failUrl: dto.failUrl,
            backUrl: dto.backUrl,
            lang: dto.lang || EupagoFormLangEnum.PT,
            minutesFormUp: dto.minutesFormUp || DEFAULT_MINUTES_FORM_UP,
        };
    }

    private async post<T>({
        url,
        body,
        apiKey,
        operation,
        validator = this.assertSuccess.bind(this),
    }: PostRequestParams & {
        validator?: (data: unknown, operation: string) => void;
    }): Promise<T> {
        try {
            this.logger.debug(`[${operation}] POST ${url}`);

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            };

            if (apiKey) {
                headers['Authorization'] = `ApiKey ${apiKey}`;
            }

            const { data } = await firstValueFrom(
                this.http.post<T>(url, body, { headers }),
            );

            validator(data, operation);
            this.logger.log(`[${operation}] ✅ Request succeeded`);

            return data;
        } catch (error) {
            this.logger.log(error);
            throw new RpcException({
                message: ERRORS.ERROR_CREATING_PAYMENT,
                code: error.ERROR_CREATING_PAYMENT,
            });
        }
    }


    private assertSuccess(data: unknown, operation: string): void {
        const res = data as Record<string, unknown>;
        if (res.transactionStatus !== 'Success') {
            this.logger.warn(`[${operation}] EuPago returned error: ${res.text}`);
            throw new BadRequestException(res);
        }
    }

    private assertMultibancoSuccess(data: unknown, operation: string): void {
        const res = data as Record<string, unknown>;
        if (res.sucesso !== true) {
            this.logger.warn(`[${operation}] EuPago returned error: ${res.resposta}`);
            throw new BadRequestException(res);
        }
    }

    private maskKey(key: string): string {
        const segments = key.split('-');

        if (segments.length >= 3) {
            const first = segments[0];
            const last = segments[segments.length - 1];
            const masked = segments.slice(1, -1).map((s) => '*'.repeat(s.length));
            return [first, ...masked, last].join('-');
        }

        if (key.length <= 7) return '*'.repeat(key.length);
        return `${key.slice(0, 4)}${'*'.repeat(key.length - 7)}${key.slice(-3)}`;
    }
}

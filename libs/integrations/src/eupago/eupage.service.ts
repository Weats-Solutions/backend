import {
    Injectable,
    Logger,
    BadRequestException,
    ServiceUnavailableException,
    UnauthorizedException,
    Inject,
    NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import {
    EupagoMultibancoRequest,
    EupagoMultibancoResponse,
    EupagoMbwayRequest,
    EupagoMbwayResponse,
    EupagoPayshopRequest,
    EupagoPayshopResponse,
    EupagoReferenceInfoRequest,
    EupagoReferenceInfoResponse,
    EupagoCreditCardRequest,
    EupagoCreditCardResponse,
    EupagoGooglePayRequest,
    EupagoGooglePayResponse,
    EupagoApplePayRequest,
    EupagoApplePayResponse,
    EupagoMbwayV2Request,
    EupagoMbwayV2Response,
    EupagoKeyStatus,
    EupagoToggleResult,
    EupagoDeleteResult,
} from '@weats/types';
import { CorePrismaService } from '@weats/database';
import { EncryptionService } from '@weats/encryption';
import { ERRORS } from '@weats/common';

/**
 * EuPago shared service.
 *
 * Wraps the EuPago REST API with typed methods for each payment method.
 * Each method accepts a plain API key (decrypted) — encryption/decryption
 * is handled by the caller (IntegrationsService).
 *
 * Authentication:
 *   - Multibanco, MB WAY → ApiKey header: "ApiKey <key>"
 *   - Payshop            → key sent in request body (`chave` field)
 *
 * Ref: https://eupago.readme.io/reference/summary-paymentmethods
 */
@Injectable()
export class EupagoService {
    private readonly logger = new Logger(EupagoService.name);

    constructor(
        private readonly http: HttpService,
        private readonly corePrismaService: CorePrismaService,
        private readonly encryption: EncryptionService,
        @Inject('EUPAGO_API_URL') private readonly eupagoApiUrl: string,
    ) {
    }


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
            return { connected: false, isEnabled: false, maskedKey: null, cryptoKeyConnected: !!record?.eupagoCryptoKey, updatedAt: null };
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
            throw new NotFoundException(
                {
                    message: ERRORS.EUPAGO_INTEGRATION_NOT_CONFIGURED,
                    code: ERRORS.EUPAGO_INTEGRATION_NOT_CONFIGURED,
                }
            );
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
     * Retrieve and decrypt the raw API key for use in payment operations.
     * Only call this when you need to initiate a payment via EupagoService.
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


    // ─── Multibanco ──────────────────────────────────────────────────────────

    /**
     * Creates a Multibanco payment reference.
     *
     * POST /clientes/rest_api/multibanco/create
     * Auth: ApiKey header
     *
     * @param apiKey  Decrypted EuPago API key.
     * @param amount  Amount in EUR (1–99999).
     * @param options Optional fields (id, data_fim, per_dup, valor_min, valor_max).
     */
    async createMultibancoReference(
        apiKey: string,
        amount: number,
        options?: Partial<Omit<EupagoMultibancoRequest, 'chave' | 'valor'>>,
    ): Promise<EupagoMultibancoResponse> {

        const url = `${this.eupagoApiUrl}/clientes/rest_api/multibanco/create`;
        const body: EupagoMultibancoRequest = { chave: apiKey, valor: amount, ...options };

        return this.post<EupagoMultibancoResponse>(url, body, apiKey, 'Multibanco');
    }

    // ─── MB WAY ──────────────────────────────────────────────────────────────

    /**
     * Creates an MB WAY payment request.
     * The customer has 5 minutes to accept via the MB WAY app.
     *
     * POST /api/v1.02/mbway/create
     * Auth: ApiKey header
     *
     * @param apiKey      Decrypted EuPago API key.
     * @param amount      Amount in EUR (1–99999).
     * @param phoneNumber Customer phone in E.164 without "+", e.g. "351912345678".
     * @param options     Optional fields (id, descricao).
     */
    async createMbwayPayment(
        apiKey: string,
        amount: number,
        phoneNumber: string,
        options?: Partial<Omit<EupagoMbwayRequest, 'chave' | 'valor' | 'aliasCC'>>,
    ): Promise<EupagoMbwayResponse> {


        const url = `${this.eupagoApiUrl}/api/v1.02/mbway/create`;
        const body: EupagoMbwayRequest = {
            chave: apiKey,
            valor: amount,
            aliasCC: phoneNumber,
            ...options,
        };

        return this.post<EupagoMbwayResponse>(url, body, apiKey, 'MB WAY');
    }

    // ─── Payshop ─────────────────────────────────────────────────────────────

    /**
     * Creates a Payshop cash payment reference.
     *
     * POST /clientes/rest_api/payshop/create
     * Auth: API key sent in request body (Payshop uses body auth)
     *
     * @param apiKey  Decrypted EuPago API key.
     * @param amount  Amount in EUR.
     * @param options Optional fields (id, data_fim).
     */
    async createPayshopReference(
        apiKey: string,
        amount: number,
        options?: Partial<Omit<EupagoPayshopRequest, 'chave' | 'valor'>>,
    ): Promise<EupagoPayshopResponse> {


        const url = `${this.eupagoApiUrl}/clientes/rest_api/payshop/create`;
        const body: EupagoPayshopRequest = { chave: apiKey, valor: amount, ...options };

        // Payshop uses body auth — no Authorization header needed
        return this.postBodyAuth<EupagoPayshopResponse>(url, body, 'Payshop');
    }

    // ─── Reference Information ────────────────────────────────────────────────

    /**
     * Checks the status of a Multibanco/Payshop reference.
     *
     * POST /clientes/rest_api/multibanco/info
     * Auth: API key in body
     *
     * @param apiKey     Decrypted EuPago API key.
     * @param referencia Reference number to query.
     * @param entidade   Entity number (optional for Payshop).
     */
    async getReferenceInfo(
        apiKey: string,
        referencia: string,
        entidade?: string,
    ): Promise<EupagoReferenceInfoResponse> {


        const url = `${this.eupagoApiUrl}/clientes/rest_api/multibanco/info`;
        const body: EupagoReferenceInfoRequest = {
            chave: apiKey,
            referencia,
            ...(entidade ? { entidade } : {}),
        };

        return this.postBodyAuth<EupagoReferenceInfoResponse>(url, body, 'ReferenceInfo');
    }

    // ─── Credit Card ─────────────────────────────────────────────────────────

    /**
     * Creates a hosted checkout URL for a Credit Card payment (3D Secure).
     *
     * POST /api/v1.02/creditcard/create
     * Auth: ApiKey header
     * Max amount: 3999€
     *
     * @param apiKey            Decrypted EuPago API key.
     * @param amount            Amount in EUR (1–3999).
     * @param successUrl        Redirect URL after successful payment.
     * @param failUrl           Redirect URL after failed payment.
     * @param options           Optional payment/customer fields.
     * @returns                 `url` — hosted checkout page to redirect the customer.
     */
    async createCreditCardPayment(
        apiKey: string,
        amount: number,
        successUrl: string,
        failUrl: string,
        options?: {
            backUrl?: string;
            lang?: string;
            minutesFormUp?: number;
            id?: string;
            descricao?: string;
            customer?: {
                notify?: boolean;
                name?: string;
                email?: string;
                phone?: string;
            };
        },
    ): Promise<EupagoCreditCardResponse> {


        const url = `${this.eupagoApiUrl}/api/v1.02/creditcard/create`;

        const payment: EupagoCreditCardRequest['payment'] = {
            amount: { value: amount, currency: 'EUR' },
            successUrl: successUrl.trim(),
            failUrl: failUrl.trim(),
            lang: options?.lang ?? 'PT',
            // backUrl is required by EuPago — fall back to failUrl when not explicitly provided
            backUrl: (options?.backUrl ?? failUrl).trim(),
        };
        if (options?.minutesFormUp !== undefined) payment.minutesFormUp = options.minutesFormUp;
        if (options?.id) payment.id = options.id;
        if (options?.descricao) payment.descricao = options.descricao;

        const customer: NonNullable<EupagoCreditCardRequest['customer']> = { notify: false };
        if (options?.customer?.notify !== undefined) customer.notify = options.customer.notify;
        if (options?.customer?.name) customer.name = options.customer.name;
        if (options?.customer?.email) customer.email = options.customer.email;
        if (options?.customer?.phone) customer.phone = options.customer.phone;

        const body: EupagoCreditCardRequest = { payment, customer };

        this.logger.debug(`[CreditCard] URL: ${url}`);
        this.logger.debug(`[CreditCard] Body: ${JSON.stringify(body)}`);

        return this.post<EupagoCreditCardResponse>(url, body, apiKey, 'CreditCard');
    }

    // ─── Google Pay ───────────────────────────────────────────────────────────

    /**
     * POST /api/v1.02/googlepay/create
     * Creates a hosted Google Pay checkout URL.
     *
     * Ref: https://eupago.readme.io/reference/google-pay
     */
    async createGooglePayPayment(
        apiKey: string,
        amount: number,
        successUrl: string,
        failUrl: string,
        options?: {
            backUrl?: string;
            lang?: string;
            minutesFormUp?: number;
            identifier?: string;
            customer?: { notify?: boolean; name?: string; email?: string; phone?: string };
        },
    ): Promise<EupagoGooglePayResponse> {
        const url = `${this.eupagoApiUrl}/api/v1.02/googlepay/create`;
        const payment: EupagoGooglePayRequest['payment'] = {
            amount: { value: amount, currency: 'EUR' },
            successUrl: successUrl.trim(),
            failUrl: failUrl.trim(),
            backUrl: (options?.backUrl ?? failUrl).trim(),
            lang: options?.lang ?? 'PT',
        };
        if (options?.minutesFormUp !== undefined) payment.minutesFormUp = options.minutesFormUp;
        if (options?.identifier) payment.identifier = options.identifier;

        const customer: NonNullable<EupagoGooglePayRequest['customer']> = { notify: false };
        if (options?.customer?.notify !== undefined) customer.notify = options.customer.notify;
        if (options?.customer?.name) customer.name = options.customer.name;
        if (options?.customer?.email) customer.email = options.customer.email;
        if (options?.customer?.phone) customer.phone = options.customer.phone;

        const body: EupagoGooglePayRequest = { payment, customer };
        return this.post<EupagoGooglePayResponse>(url, body, apiKey, 'GooglePay');
    }

    // ─── Apple Pay ────────────────────────────────────────────────────────────

    /**
     * POST /api/v1.02/euapplepay/create
     * Creates a hosted Apple Pay checkout URL.
     *
     * Ref: https://eupago.readme.io/reference/apple-pay
     */
    async createApplePayPayment(
        apiKey: string,
        amount: number,
        successUrl: string,
        failUrl: string,
        options?: {
            backUrl?: string;
            lang?: string;
            minutesFormUp?: number;
            identifier?: string;
            customer?: { notify?: boolean; name?: string; email?: string; phone?: string };
        },
    ): Promise<EupagoApplePayResponse> {


        const url = `${this.eupagoApiUrl}/api/v1.02/euapplepay/create`;

        const payment: EupagoApplePayRequest['payment'] = {
            amount: { value: amount, currency: 'EUR' },
            successUrl: successUrl.trim(),
            failUrl: failUrl.trim(),
            backUrl: (options?.backUrl ?? failUrl).trim(),
            lang: options?.lang ?? 'PT',
        };
        if (options?.minutesFormUp !== undefined) payment.minutesFormUp = options.minutesFormUp;
        if (options?.identifier) payment.identifier = options.identifier;

        const customer: NonNullable<EupagoApplePayRequest['customer']> = { notify: false };
        if (options?.customer?.notify !== undefined) customer.notify = options.customer.notify;
        if (options?.customer?.name) customer.name = options.customer.name;
        if (options?.customer?.email) customer.email = options.customer.email;
        if (options?.customer?.phone) customer.phone = options.customer.phone;

        const body: EupagoApplePayRequest = { payment, customer };
        return this.post<EupagoApplePayResponse>(url, body, apiKey, 'ApplePay');
    }

    // ─── MB WAY (v2) ──────────────────────────────────────────────────────────

    /**
     * POST /api/v1.02/mbway/create
     * Sends a push notification to the customer's MB WAY app.
     * No redirect URLs needed — the customer accepts in the app within 5 min.
     *
     * Ref: https://eupago.readme.io/reference/mbway
     */
    async createMbwayV2Payment(
        apiKey: string,
        amount: number,
        customerPhone: string,
        countryCode: string,
        options?: {
            identifier?: string;
        },
    ): Promise<EupagoMbwayV2Response> {


        const url = `${this.eupagoApiUrl}/api/v1.02/mbway/create`;

        const body: EupagoMbwayV2Request = {
            payment: {
                amount: { value: amount, currency: 'EUR' },
                customerPhone: customerPhone.trim(),
                countryCode: countryCode.trim(),
                ...(options?.identifier ? { identifier: options.identifier } : {}),
            },
            customer: { notify: false },
        };

        return this.post<EupagoMbwayV2Response>(url, body, apiKey, 'MbwayV2');
    }

    // ─── Private helpers ─────────────────────────────────────────────────────
    /**
     * POST with ApiKey header authentication (Multibanco, MB WAY).
     */
    private async post<T>(
        url: string,
        body: object,
        apiKey: string,
        operation: string,
    ): Promise<T> {
        try {
            this.logger.debug(`[${operation}] POST ${url}`);

            const { data } = await firstValueFrom(
                this.http.post<T>(url, body, {
                    headers: {
                        'Authorization': `ApiKey ${apiKey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                }),
            );

            this.assertSuccess(data, operation);
            this.logger.log(`[${operation}] ✅ Request succeeded`);

            return data;
        } catch (error) {
            this.handleError(error, operation);
        }
    }

    /**
     * POST with API key passed inside the request body (Payshop, Reference Info).
     */
    private async postBodyAuth<T>(
        url: string,
        body: object,
        operation: string,
    ): Promise<T> {
        try {
            this.logger.debug(`[${operation}] POST ${url} (body auth)`);

            const { data } = await firstValueFrom(
                this.http.post<T>(url, body, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                }),
            );

            this.assertSuccess(data, operation);
            this.logger.log(`[${operation}] ✅ Request succeeded`);

            return data;
        } catch (error) {
            this.handleError(error, operation);
        }
    }

    /**
     * Validates EuPago response. EuPago signals success with:
     *   - `sucesso: "1"` (Multibanco / Payshop)
     *   - `resposta: "000"` (MB WAY)
     *   - `transactionStatus: "Approved"` (Credit Card)
     */
    private assertSuccess(data: unknown, operation: string): void {
        const res = data as Record<string, unknown>;

        // Credit Card uses transactionStatus ("Success" in sandbox, "Approved" in production)
        if (res['transactionStatus'] !== undefined) {
            const status = res['transactionStatus'] as string;
            if (status !== 'Success' && status !== 'Approved') {
                const message = (res['text'] ?? res['code'] ?? `EuPago ${operation} failed`) as string;
                this.logger.warn(`[${operation}] EuPago returned error: ${message}`);
                throw new BadRequestException(message);
            }
            return;
        }

        const isMultibancoSuccess = res['sucesso'] === '1' || res['sucesso'] === 1;
        const isMbwaySuccess = res['resposta'] === '000';

        if (
            res['sucesso'] !== undefined && !isMultibancoSuccess &&
            res['resposta'] !== undefined && !isMbwaySuccess
        ) {
            const message = (res['mensagem'] ?? res['erro'] ?? `EuPago ${operation} failed`) as string;
            this.logger.warn(`[${operation}] EuPago returned error: ${message}`);
            throw new BadRequestException(message);
        }
    }

    /**
     * Normalises Axios / HTTP errors into NestJS exceptions.
     */
    private handleError(error: unknown, operation: string): never {
        if (
            error instanceof BadRequestException ||
            error instanceof ServiceUnavailableException ||
            error instanceof UnauthorizedException
        ) {
            throw error;
        }

        const axiosError = error as AxiosError;

        if (axiosError.response) {
            const status = axiosError.response.status;
            const responseData = axiosError.response.data as Record<string, unknown> | undefined;

            // Log the full response body to help diagnose EuPago errors
            this.logger.error(
                `[${operation}] HTTP ${status} — full response: ${JSON.stringify(responseData)}`,
            );

            // Credit Card errors: { transactionStatus: "Rejected", code: "URL_INVALID", text: "..." }
            if (responseData?.['transactionStatus'] === 'Rejected') {
                const msg = (responseData?.['text'] ?? responseData?.['code'] ?? 'Pedido rejeitado pela EuPago') as string;
                throw new BadRequestException(`EuPago: ${msg}`);
            }

            const message =
                responseData?.['text'] ??
                responseData?.['mensagem'] ??
                responseData?.['message'] ??
                responseData?.['erro'] ??
                responseData?.['error'] ??
                responseData?.['descricao'] ??
                axiosError.message;

            if (status === 401 || status === 403) {
                throw new UnauthorizedException(
                    'Chave EuPago inválida ou sem permissões para este canal.',
                );
            }

            throw new BadRequestException(`Erro EuPago (${operation}): ${message}`);
        }

        this.logger.error(`[${operation}] Network error — ${(error as Error).message}`);
        throw new ServiceUnavailableException(
            'Não foi possível contactar o serviço EuPago. Tenta novamente mais tarde.',
        );
    }

    private maskKey(key: string): string {
        const segments = key.split('-');

        if (segments.length >= 3) {
            const first = segments[0];
            const last = segments[segments.length - 1];
            const masked = segments.slice(1, -1).map((s) => '*'.repeat(s.length));
            return [first, ...masked, last].join('-');
        }

        // Fallback for unexpected formats
        if (key.length <= 7) return '*'.repeat(key.length);
        return `${key.slice(0, 4)}${'*'.repeat(key.length - 7)}${key.slice(-3)}`;
    }
}

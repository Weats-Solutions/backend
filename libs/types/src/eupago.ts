/**
 * EuPago integration — local response interfaces.
 *
 * These describe what IntegrationsService returns to the controller/frontend.
 * They are intentionally separate from the raw EuPago API types in
 * `shared/eupago/interfaces/eupago.interface.ts`.
 */

export type EuPagoEnvironment = 'sandbox' | 'production';

export interface EupagoKeyStatus {
    /** Whether the establishment has an active EuPago API key stored. */
    connected: boolean;
    /** Whether the integration is currently enabled and will process payments. */
    isEnabled: boolean;
    /**
     * Masked key in the original EuPago segment format.
     * Example: demo-****-****-****-439
     * Null when not connected.
     */
    maskedKey: string | null;
    /** Whether the Chave Criptográfica (webhook crypto key) is configured. */
    cryptoKeyConnected: boolean;
    /** Timestamp of the last key update. Null when not connected. */
    updatedAt: Date | null;
}

export interface EupagoToggleResult {
    isEnabled: boolean;
}

export interface EupagoDeleteResult {
    connected: false;
}

export interface EupagoCryptoKeyResult {
    cryptoKeyConnected: boolean;
    updatedAt: Date | null;
}

export interface EupagoCreditCardPaymentResult {
    /** Hosted checkout URL — redirect the customer here to complete the payment. */
    url: string;
    /** Internal EuPago payment reference, if returned. */
    referencia?: string;
}

export interface EupagoWalletPaymentResult {
    /** Hosted checkout URL — redirect the customer here to complete the payment. */
    url: string;
    referencia?: string;
}

export interface EupagoMbwayPaymentResult {
    /** MB WAY transaction ID */
    transactionID: string;
    /** Internal EuPago reference */
    referencia?: string;
}



// ─────────────────────────────────────────────────────────────────────────────
// EuPago REST API — Shared Interfaces
//
// Ref: https://eupago.readme.io/reference/summary-paymentmethods
// Auth: ApiKey header — "ApiKey xxxx-xxxx-xxxx-xxxx-xxxx"
// ─────────────────────────────────────────────────────────────────────────────

// ── Multibanco ────────────────────────────────────────────────────────────────

/**
 * POST /clientes/rest_api/multibanco/create
 * Creates a Multibanco payment reference.
 *
 * Ref: https://eupago.readme.io/reference/multibanco
 */
export interface EupagoMultibancoRequest {
    /** Payment amount in EUR (min: 1, max: 99999) */
    valor: number;
    /** Channel identifier (your API key) */
    chave: string;
    /** Unique order/payment identifier */
    id: string;
    /** Payment deadline (dd-mm-yyyy). Omit for no deadline. */
    data_fim: string;
    /**
     * Whether the reference can be paid more than once.
     * 0 = single payment, 1 = multiple payments.
     */
    per_dup: 1;
}

export interface EupagoMultibancoResponse {
    /** "0" means success */
    sucesso: string;
    estado: string;
    resposta: string;
    referencia: string;
    valor: string;
    entidade: string;
    data_inicio: string;
    data_fim: string;
}

export interface EupagoMultibancoErrorResponse {
    sucesso: string;
    estado: string;
    resposta: string;
}

// ── MB WAY ────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1.02/mbway/create
 * Creates an MB WAY payment request.
 * Customer has 5 minutes to accept the notification.
 *
 * Ref: https://eupago.readme.io/reference/mbway
 */



// ── Hosted Checkout Response (Credit Card, Google Pay, Apple Pay) ──────────────

/**
 * Base interface for all hosted checkout payment responses.
 * Used by Credit Card, Google Pay, and Apple Pay endpoints.
 */
export interface EupagoHostedCheckoutResponse {
    transactionStatus: string;
    transactionID: string;
    reference: string;
    redirectUrl: string;
}

// Aliases for backwards compatibility and explicit typing
export type EupagoCreditCardSuccessResponse = EupagoHostedCheckoutResponse;
export type EupagoGooglePayResponse = EupagoHostedCheckoutResponse;
export type EupagoApplePayResponse = EupagoHostedCheckoutResponse;

// Single canonical error response type for all hosted checkouts
export interface EupagoHostedCheckoutErrorResponse {
    transactionStatus: string;
    code: string;
    text: string;
}

// Aliases for backwards compatibility
export type EupagoCreditCardErrorResponse = EupagoHostedCheckoutErrorResponse;
export type EupagoGooglePayErrorResponse = EupagoHostedCheckoutErrorResponse;
export type EupagoApplePayErrorResponse = EupagoHostedCheckoutErrorResponse;

// ── Credit Card ───────────────────────────────────────────────────────────────

/**
 * POST /api/v1.02/creditcard/create
 * Creates a hosted checkout URL for a Credit Card payment (3D Secure).
 *
 * Ref: https://eupago.readme.io/reference/credit-card
 * Auth: ApiKey header — "ApiKey <key>"
 * Max amount: 3999€
 */
export interface EupagoCreditCardRequest {
    payment: PaymentRequest;
}

// ── Google Pay ────────────────────────────────────────────────────────────────

/**
 * POST /api/v1.02/googlepay/create
 * Creates a hosted checkout URL for a Google Pay payment.
 *
 * Ref: https://eupago.readme.io/reference/google-pay
 * Auth: ApiKey header — "ApiKey <key>"
 * Max amount: 99 999€
 */
export interface EupagoGooglePayRequest {
    payment: PaymentRequest;
}

// ── Apple Pay ─────────────────────────────────────────────────────────────────

/**
 * POST /api/v1.02/euapplepay/create
 * Creates a hosted checkout URL for an Apple Pay payment.
 *
 * Ref: https://eupago.readme.io/reference/apple-pay
 * Auth: ApiKey header — "ApiKey <key>"
 * Max amount: 99 999€
 */
export interface EupagoApplePayRequest {
    payment: PaymentRequest;
}

// ── Generic error response ────────────────────────────────────────────────────

export interface EupagoErrorResponse {
    transactionStatus: string;
    code: string;
    text: string;
}

// ── Shared Payment Request Structure ──────────────────────────────────────────

/**
 * Common payment object used by Credit Card, Google Pay, and Apple Pay.
 * Represents the nested payment structure in hosted checkout APIs.
 */
export interface PaymentRequest {
    amount: {
        value: number;
        currency: string;
    };
    lang: string;
    minutesFormUp: number;
    successUrl: string;
    failUrl: string;
    backUrl: string;
    /** Unique order/payment identifier */
    identifier: string;
}

// ── MB WAY ───────────────────────────────────────────────────────────────────

/**
 * POST /api/v1.02/mbway/create
 * Sends a payment push notification to the customer's MB WAY app.
 * The customer has 5 minutes to accept.
 *
 * Ref: https://eupago.readme.io/reference/mbway
 * Auth: ApiKey header — "ApiKey <key>"
 * Max amount: 99 999€
 */
export interface EupagoMbwayRequest {
    payment: {
        amount: {
            value: number;
            currency: string;
        };
        /** Customer phone number (without country code, e.g. "911111111") */
        customerPhone: string;
        /** Country dial code (e.g. "351" for Portugal) */
        countryCode: string;
        /** Unique order/payment identifier */
        identifier: string;
    };
    customer?: {
        notify?: boolean;
    };
}

export interface EupagoMbwayResponse {
    transactionStatus: string;
    transactionID: string;
    reference: string;
}

export interface EupagoMbwayErrorResponse {
    transactionStatus: string;
    code: string;
    text: string;
}


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
    id?: string;
    /** Payment deadline (dd-mm-yyyy). Omit for no deadline. */
    data_fim?: string;
    /**
     * Whether the reference can be paid more than once.
     * 0 = single payment, 1 = multiple payments.
     */
    per_dup?: 0 | 1;
    /** Minimum amount accepted (if no fixed amount) */
    valor_min?: number;
    /** Maximum amount accepted (if no fixed amount) */
    valor_max?: number;
}

export interface EupagoMultibancoResponse {
    /** "0" means success */
    sucesso: string;
    entidade: string;
    referencia: string;
    /** Formatted amount (e.g. "10.00") */
    valor: string;
    estado?: string;
}

// ── MB WAY ────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1.02/mbway/create
 * Creates an MB WAY payment request.
 * Customer has 5 minutes to accept the notification.
 *
 * Ref: https://eupago.readme.io/reference/mbway
 */
export interface EupagoMbwayRequest {
    /** Payment amount in EUR (min: 1, max: 99999) */
    valor: number;
    /** Channel identifier (your API key) */
    chave: string;
    /** Customer phone number in E.164 format without +, e.g. "351912345678" */
    aliasCC: string;
    /** Unique order/payment identifier */
    id?: string;
    /** Payment description shown in the MB WAY app */
    descricao?: string;
}

export interface EupagoMbwayResponse {
    /** "000" means success */
    resposta: string;
    estado?: string;
    /** MB WAY transaction reference */
    referencia?: string;
    idOperacao?: string;
}

// ── Payshop ───────────────────────────────────────────────────────────────────

/**
 * POST /clientes/rest_api/payshop/create
 * Creates a Payshop cash payment reference.
 *
 * Ref: https://eupago.readme.io/reference/payshop
 * Note: Authentication is passed in the request body, not the header.
 */
export interface EupagoPayshopRequest {
    /** Payment amount in EUR */
    valor: number;
    /** Channel identifier (your API key) — sent in body for Payshop */
    chave: string;
    /** Unique order/payment identifier */
    id?: string;
    /** Payment deadline (dd-mm-yyyy) */
    data_fim?: string;
}

export interface EupagoPayshopResponse {
    sucesso: string;
    referencia: string;
    valor: string;
    data_fim?: string;
    estado?: string;
}

// ── Reference Information ─────────────────────────────────────────────────────

/**
 * POST /clientes/rest_api/multibanco/info
 * Checks the status of a Multibanco reference.
 *
 * Ref: https://eupago.readme.io/reference/reference-information
 */
export interface EupagoReferenceInfoRequest {
    chave: string;
    referencia: string;
    entidade?: string;
}

export interface EupagoReferenceInfoResponse {
    sucesso: string;
    referencia: string;
    entidade?: string;
    valor: string;
    estado: string;
    /** ISO date string of last payment */
    data_pagamento?: string;
}

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
    payment: {
        amount: {
            value: number;
            /** Currency code — defaults to EUR */
            currency: string;
        };
        /** Language for the checkout page (e.g. "PT", "EN") */
        lang?: string;
        /** Form validity in minutes (e.g. 1440 = 24h) */
        minutesFormUp?: number;
        /** Redirect URL after successful payment */
        successUrl: string;
        /** Redirect URL after failed payment */
        failUrl: string;
        /** Redirect URL for the back button on the checkout page */
        backUrl?: string;
        /** Unique order/payment identifier */
        id?: string;
        /** Payment description shown on the checkout page */
        descricao?: string;
    };
    customer?: {
        /** Whether to notify the customer by email */
        notify?: boolean;
        name?: string;
        email?: string;
        phone?: string;
    };
}

export interface EupagoCreditCardResponse {
    transactionStatus?: string;
    /** Hosted checkout URL — redirect the customer here to pay */
    redirectUrl?: string;
    transactionID?: string;
    reference?: string;
    code?: string;
    text?: string;
}

// ── Generic error response ────────────────────────────────────────────────────

export interface EupagoErrorResponse {
    /** Non-zero / non-"0" value indicates an error */
    sucesso?: string;
    resposta?: string;
    mensagem?: string;
    erro?: string;
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
    payment: {
        amount: {
            value: number;
            currency: string;
        };
        lang?: string;
        minutesFormUp?: number;
        successUrl: string;
        failUrl: string;
        backUrl: string;
        /** Unique order/payment identifier */
        identifier?: string;
    };
    customer?: {
        notify?: boolean;
        name?: string;
        email?: string;
        phone?: string;
    };
}

export interface EupagoGooglePayResponse {
    transactionStatus?: string;
    redirectUrl?: string;
    transactionID?: string;
    reference?: string;
    code?: string;
    text?: string;
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
    payment: {
        amount: {
            value: number;
            currency: string;
        };
        lang?: string;
        minutesFormUp?: number;
        successUrl: string;
        failUrl: string;
        backUrl: string;
        /** Unique order/payment identifier */
        identifier?: string;
    };
    customer?: {
        notify?: boolean;
        name?: string;
        email?: string;
        phone?: string;
    };
}

export interface EupagoApplePayResponse {
    transactionStatus?: string;
    redirectUrl?: string;
    transactionID?: string;
    reference?: string;
    code?: string;
    text?: string;
}

// ── MB WAY (v2 REST API) ──────────────────────────────────────────────────────

/**
 * POST /api/v1.02/mbway/create
 * Sends a payment push notification to the customer's MB WAY app.
 * The customer has 5 minutes to accept.
 *
 * Ref: https://eupago.readme.io/reference/mbway
 * Auth: ApiKey header — "ApiKey <key>"
 * Max amount: 99 999€
 */
export interface EupagoMbwayV2Request {
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
        identifier?: string;
    };
    customer?: {
        notify?: boolean;
    };
}

export interface EupagoMbwayV2Response {
    transactionStatus?: string;
    transactionID?: string;
    reference?: string;
    code?: string;
    text?: string;
}


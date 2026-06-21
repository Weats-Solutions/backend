// ─── Credential Management ──────────────────────────────────────────────────

/** Current connection & configuration state of the XD Rest integration. */
export interface XdRestStatus {
    connected: boolean;
    isEnabled: boolean;
    maskedUsername: string | null;
    baseUrl: string | null;
    updatedAt: Date | null;
}

/** Result of enabling / disabling the integration. */
export interface XdRestToggleResult {
    isEnabled: boolean;
}

/** Result of removing all stored credentials. */
export interface XdRestDeleteResult {
    connected: boolean;
}

/** Result of a test-connection attempt. */
export interface XdRestTestResult {
    success: boolean;
    message: string;
}

// ─── Online Orders ──────────────────────────────────────────────────────────

/** Response from GET /gateway/online-orders/connection. */
export interface XdOnlineOrdersConnectionStatus {
    connected: boolean;
}

/** Result returned after successfully sending a table order. */
export interface XdTableOrderResult {
    success: boolean;
    data?: any;
}

export interface IfthenpayKeyStatus {
    /** Whether the establishment has an active Ifthenpay token stored. */
    connected: boolean;
    /** Whether the integration is currently enabled and will process payments. */
    isEnabled: boolean;
    /** Masked token. Null when not connected. */
    maskedKey: string | null;
    /** Timestamp of the last token update. Null when not connected. */
    updatedAt: Date | null;
}

export interface IfthenpayToggleResult {
    isEnabled: boolean;
}

export interface IfthenpayDeleteResult {
    connected: false;
}

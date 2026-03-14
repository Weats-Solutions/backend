//EUPAGO

// EuPago API key format — two accepted variants:
//   Full (5 segments):  demo-a2eb-3e54-2bfa-439
//   Short (4 segments): a2eb-3e54-2bfa-439
// Ref: https://eupago.readme.io/reference/summary-paymentmethods
export const EUPAGO_KEY_PATTERN =
  /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+){3,4}$/;

export const WALLET_URL_OPTIONS = { require_tld: false, require_protocol: true, protocols: ['https'] as string[] };
export const WALLET_URL_BLOCKED = /^(?!.*localhost)(?!.*127\.0\.0\.1)(?!.*eupago\.pt).+$/;
export const WALLET_URL_BLOCKED_MSG = 'A EuPago não aceita localhost nem URLs do domínio eupago.pt.';

export enum EupagoFormLangEnum {
  PT = 'PT',
  EN = 'EN',
  ES = 'ES',
}

export const DEFAULT_MINUTES_FORM_UP = 10;

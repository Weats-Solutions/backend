import { Currency } from "@weats/database";

export interface Establishment {
    id: string;
    ownerId: string;
    stripeCustomerId: string;
    primaryLanguage: string;
    availableLanguages: string[];
    currency: Currency;
    timezone: string;
}
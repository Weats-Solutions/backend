import { Currency } from "@weats/database";

export interface Establishment {
    id: string;
    ownerId: string;
    slug: string;
    stripeCustomerId: string;
    primaryLanguage: string;
    availableLanguages: string[];
    currency: Currency;
    timezone: string;
}
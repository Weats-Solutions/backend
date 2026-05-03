import { Currency, EstablishmentLanguage } from "@weats/database";

export interface Establishment {
    id: string;
    name: string,
    ownerId: string;
    slug: string;
    stripeCustomerId: string;
    primaryLanguage: EstablishmentLanguage;
    availableLanguages: EstablishmentLanguage[];
    currency: Currency;
    timezone: string;
}
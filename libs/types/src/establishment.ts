import { Currency, EstablishmentLanguage, SubscriptionStatus } from "@weats/database";

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
    isDemo: boolean;
    subscription?: {
        status: SubscriptionStatus;
        currentPeriodEnd?: Date | null;
    } | null;
}
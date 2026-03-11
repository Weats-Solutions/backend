export interface Establishment {
    id: string;
    ownerId: string;
    stripeCustomerId: string;
    primaryLanguage: string;
    availableLanguages: string[];
}
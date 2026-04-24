export enum EmailTemplate {
    SUBSCRIPTION_ACTIVATED = 'subscription-activated',
    SUBSCRIPTION_CANCELED = 'subscription-canceled',
    SUBSCRIPTION_REACTIVATED = 'subscription-reactivated',
    SUBSCRIPTION_TRIAL_STARTED = 'subscription-trial-started',
    WELCOME = 'welcome',
}

export const ACCEPTED_LANGUAGES = ['pt', 'en', 'es'] as const;
export type ACCEPTED_LANGUAGES = typeof ACCEPTED_LANGUAGES[number];


export type TemplateMap = {
    [EmailTemplate.SUBSCRIPTION_ACTIVATED]: SubscriptionActivatedContext;
    [EmailTemplate.SUBSCRIPTION_CANCELED]: SubscriptionCanceledContext;
    [EmailTemplate.SUBSCRIPTION_REACTIVATED]: SubscriptionReactivatedContext;
    [EmailTemplate.SUBSCRIPTION_TRIAL_STARTED]: SubscriptionTrialStartedContext;
    [EmailTemplate.WELCOME]: WelcomeContext;
};

export type SendEmailDto<T extends EmailTemplate> = {
    to: string;
    lang: ACCEPTED_LANGUAGES;
    template: T;
    context: TemplateMap[T];
};


export type SubscriptionActivatedContext = {
    firstName: string;
    lastName: string;
    establishmentName: string;
    planName: string;
    nextBillingDate?: string;
    currentPeriodEnd?: string;
    trialEndsAt?: string;
    redirectUrl: string;
};

export type SubscriptionCanceledContext = {
    firstName: string;
    lastName: string;
    establishmentName: string;
    accessUntil?: string;
    redirectUrl: string;
};

export type SubscriptionReactivatedContext = {
    firstName: string;
    lastName: string;
    establishmentName: string;
    accessUntil?: string;
    nextBillingDate?: string;
    redirectUrl: string;
};

export type SubscriptionTrialStartedContext = {
    firstName: string;
    lastName: string;
    establishmentName: string;
    planName: string;
    trialDays: number;
    trialEndsAt?: string;
    redirectUrl: string;
};

export type WelcomeContext = {
    firstName: string;
    lastName: string;
    redirectUrl: string;
};

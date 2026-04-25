export enum EmailTemplate {
    // Establishment Templates Category
    CREATE_ESTABLISHMENT = 'create-establishment',
    INVITE_EMPLOYEE = 'invite-employee',
    QRCODES = 'qrcodes',
    WELCOME = 'welcome',

    // Subscription Templates Category
    SUBSCRIPTION_INVOICE = 'subscription-invoice',
    SUBSCRIPTION_PAYMENT_FAILED = 'payment-failed',
    SUBSCRIPTION_PAYMENT_SUCCESFULL = 'payment-succeeded',
    SUBSCRIPTION_PLAN_CHANGED = 'plan-changed',
    SUBSCRIPTION_CANCELLED = 'subscription-cancelled',
    SUBSCRIPTION_CREATED = 'subscription-created',
    SUBSCRIPTION_TRIAL_STARTED = 'subscription-trial-started',
    SUBSCRIPTION_TRIAL_ENDING = 'trial-ending',
}

export enum EmailTemplateCategory {
    ESTABLISHMENT = 'establishment',
    SUBSCRIPTION = 'subscription',
}

export const ACCEPTED_LANGUAGES = ['pt', 'en', 'es'] as const;
export type ACCEPTED_LANGUAGES = typeof ACCEPTED_LANGUAGES[number];


export type TemplateMap = {

    // Establishment Templates Category
    [EmailTemplate.CREATE_ESTABLISHMENT]: CreateEstablishmentContext;
    [EmailTemplate.INVITE_EMPLOYEE]: InviteEmployeeContext;
    [EmailTemplate.QRCODES]: QRCodesContext;
    [EmailTemplate.WELCOME]: WelcomeContext;

    // Subscription Templates Category
    [EmailTemplate.SUBSCRIPTION_INVOICE]: SubscriptionInvoiceContext;
    [EmailTemplate.SUBSCRIPTION_PAYMENT_FAILED]: SubscriptionPaymentFailedContext;
    [EmailTemplate.SUBSCRIPTION_PAYMENT_SUCCESFULL]: SubscriptionPaymentSuccesfullContext;
    [EmailTemplate.SUBSCRIPTION_PLAN_CHANGED]: SubscriptionPlanChangedContext;
    [EmailTemplate.SUBSCRIPTION_CANCELLED]: SubscriptionCancelledContext;
    [EmailTemplate.SUBSCRIPTION_CREATED]: SubscriptionCreatedContext;
    [EmailTemplate.SUBSCRIPTION_TRIAL_STARTED]: SubscriptionTrialStartedContext;
    [EmailTemplate.SUBSCRIPTION_TRIAL_ENDING]: SubscriptionTrialEndingContext;

    [EmailTemplate.WELCOME]: WelcomeContext;
};

export type SendEmailDto<T extends EmailTemplate> = {
    to: string;
    lang: ACCEPTED_LANGUAGES;
    template: T;
    context: TemplateMap[T];
};

// Establishment Templates Contexts
export type CreateEstablishmentContext = {
    firstName: string;
    lastName: string;
    establishmentName: string;
    redirectUrl: string;
};

export type InviteEmployeeContext = {
    firstName: string;
    lastName: string;
    establishmentName: string;
    redirectUrl: string;
};

export type QRCodesContext = {
    firstName: string;
    lastName: string;
    establishmentName: string;
    redirectUrl: string;
};

export type WelcomeContext = {
    firstName: string;
    lastName: string;
    redirectUrl: string;
};

// Subscription Templates Contexts
export type SubscriptionInvoiceContext = {
    firstName: string;
    lastName: string;
    establishmentName: string;
    planName: string;
    nextBillingDate?: string;
    currentPeriodEnd?: string;
    trialEndsAt?: string;
    redirectUrl: string;
};

export type SubscriptionPaymentSuccesfullContext = {
    firstName: string;
    lastName: string;
    establishmentName: string;
    planName: string;
    nextBillingDate?: string;
    currentPeriodEnd?: string;
    trialEndsAt?: string;
    redirectUrl: string;
};

export type SubscriptionPaymentFailedContext = {
    firstName: string;
    lastName: string;
    establishmentName: string;
    planName: string;
    nextBillingDate?: string;
    currentPeriodEnd?: string;
    trialEndsAt?: string;
    redirectUrl: string;
};

export type SubscriptionPlanChangedContext = {
    firstName: string;
    lastName: string;
    establishmentName: string;
    planName: string;
    nextBillingDate?: string;
    currentPeriodEnd?: string;
    trialEndsAt?: string;
    redirectUrl: string;
};

export type SubscriptionCancelledContext = {
    firstName: string;
    lastName: string;
    establishmentName: string;
    accessUntil?: string;
    redirectUrl: string;
};

export type SubscriptionCreatedContext = {
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

export type SubscriptionTrialEndingContext = {
    firstName: string;
    lastName: string;
    establishmentName: string;
    planName: string;
    trialDays: number;
    trialEndsAt?: string;
    redirectUrl: string;
};
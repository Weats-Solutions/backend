export enum EmailTemplate {
    // Establishment Templates Category
    CREATE_ESTABLISHMENT = 'create-establishment',
    INVITE_EMPLOYEE = 'invite-employee',
    QRCODES = 'qrcodes',
    QRCODES_SHARED = 'qrcodes-shared',
    WELCOME = 'welcome',

    // Subscription Templates Category
    SUBSCRIPTION_INVOICE = 'subscription-invoice',
    SUBSCRIPTION_PAYMENT_FAILED = 'payment-failed',
    SUBSCRIPTION_PAYMENT_SUCCEEDED = 'payment-succeeded',
    SUBSCRIPTION_PLAN_CHANGED = 'plan-changed',
    SUBSCRIPTION_CANCELLED = 'subscription-cancelled',
    SUBSCRIPTION_CREATED = 'subscription-created',
    SUBSCRIPTION_REACTIVATED = 'subscription-reactivated',
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
    [EmailTemplate.QRCODES_SHARED]: QRCodesSharedContext;
    [EmailTemplate.WELCOME]: WelcomeContext;

    // Subscription Templates Category
    [EmailTemplate.SUBSCRIPTION_INVOICE]: SubscriptionInvoiceContext;
    [EmailTemplate.SUBSCRIPTION_PAYMENT_FAILED]: SubscriptionPaymentFailedContext;
    [EmailTemplate.SUBSCRIPTION_PAYMENT_SUCCEEDED]: SubscriptionPaymentSucceededContext;
    [EmailTemplate.SUBSCRIPTION_PLAN_CHANGED]: SubscriptionPlanChangedContext;
    [EmailTemplate.SUBSCRIPTION_CANCELLED]: SubscriptionCancelledContext;
    [EmailTemplate.SUBSCRIPTION_CREATED]: SubscriptionCreatedContext;
    [EmailTemplate.SUBSCRIPTION_REACTIVATED]: SubscriptionReactivatedContext;
    [EmailTemplate.SUBSCRIPTION_TRIAL_STARTED]: SubscriptionTrialStartedContext;
    [EmailTemplate.SUBSCRIPTION_TRIAL_ENDING]: SubscriptionTrialEndingContext;
};

export type SendEmailDto<T extends EmailTemplate> = {
    to: string;
    lang: ACCEPTED_LANGUAGES;
    template: T;
    context: TemplateMap[T];
    attachments?: Array<{
        name: string;
        content: string; // Base64
        contentType: string;
    }>;
};

// ---------------------------------------------------------------------------
// Establishment Templates Contexts
// ---------------------------------------------------------------------------

// Template: pt/establishment/create-establishment.hbs
// Variables: {{firstName}}, {{lastName}}, {{establishmentName}}, {{redirectUrl}}
export type CreateEstablishmentContext = {
    firstName: string;
    lastName: string;
    establishmentName: string;
    redirectUrl: string;
};

// Template: pt/establishment/invite-employee.hbs
// Variables: {{firstName}}, {{lastName}}, {{establishmentName}}, {{redirectUrl}}
export type InviteEmployeeContext = {
    firstName: string;
    lastName: string;
    establishmentName: string;
    redirectUrl: string;
};

// Template: pt/establishment/qrcodes.hbs
// Variables: {{establishmentName}}, {{qrCodesCount}}, {{#each serviceZones}} {{this.zoneName}}, {{this.count}} {{/each}}
export type QRCodesContext = {
    establishmentName: string;
    qrCodesCount: number;
    serviceZones: Array<{
        zoneName: string;
        count: number;
    }>;
};

// Template: pt/establishment/qrcodes-shared.hbs
// Variables: {{establishmentName}}, {{qrCodesCount}}, {{senderName}}, {{#each serviceZones}} {{this.zoneName}}, {{this.count}} {{/each}}
export type QRCodesSharedContext = {
    establishmentName: string;
    qrCodesCount: number;
    senderName: string;
    serviceZones: Array<{
        zoneName: string;
        count: number;
    }>;
};

// Template: pt/establishment/welcome.hbs + pt/welcome.hbs (user onboarding)
// Variables: {{firstName}}, {{lastName}}, {{redirectUrl}}
export type WelcomeContext = {
    firstName: string;
    lastName: string;
    redirectUrl: string;
};

// ---------------------------------------------------------------------------
// Subscription Templates Contexts
// ---------------------------------------------------------------------------

// Template: pt/subscription/invoice.hbs
// Variables: {{firstName}}, {{lastName}}, {{establishmentName}}, {{planName}},
//            {{amountPaid}}, {{periodStart}}, {{periodEnd}}, {{nextBillingDate}}, {{redirectUrl}}
export type SubscriptionInvoiceContext = {
    firstName: string;
    lastName: string;
    establishmentName: string;
    planName: string;
    amountPaid: string;
    periodStart: string;
    periodEnd: string;
    nextBillingDate: string;
    redirectUrl: string;
};

// Template: pt/subscription/payment-failed.hbs
// Variables: {{firstName}}, {{lastName}}, {{establishmentName}}, {{planName}},
//            {{amountPaid}}, {{periodStart}}, {{periodEnd}}, {{redirectUrl}}
export type SubscriptionPaymentFailedContext = {
    firstName: string;
    lastName: string;
    establishmentName: string;
    planName: string;
    amountPaid: string;
    periodStart: string;
    periodEnd: string;
    redirectUrl: string;
};

// Template: pt/subscription/payment-succeeded.hbs
// Variables: {{firstName}}, {{lastName}}, {{establishmentName}}, {{planName}},
//            {{amountPaid}}, {{periodStart}}, {{periodEnd}}, {{nextBillingDate}}, {{redirectUrl}}
export type SubscriptionPaymentSucceededContext = {
    firstName: string;
    lastName: string;
    establishmentName: string;
    planName: string;
    amountPaid: string;
    periodStart: string;
    periodEnd: string;
    nextBillingDate: string;
    redirectUrl: string;
};

// Template: pt/subscription/plan-changed.hbs
// Variables: {{firstName}}, {{lastName}}, {{establishmentName}},
//            {{previousPlanName}}, {{newPlanName}}, {{nextBillingDate}},
//            {{#if isUpgrade}} ... {{/if}}, {{redirectUrl}}
export type SubscriptionPlanChangedContext = {
    firstName: string;
    lastName: string;
    establishmentName: string;
    previousPlanName: string;
    newPlanName: string;
    nextBillingDate: string;
    isUpgrade: boolean;
    redirectUrl: string;
};

// Template: pt/subscription/subscription-cancelled.hbs
// Variables: {{firstName}}, {{lastName}}, {{establishmentName}}, {{planName}}, {{accessUntil}}, {{redirectUrl}}
export type SubscriptionCancelledContext = {
    firstName: string;
    lastName: string;
    establishmentName: string;
    planName: string;
    accessUntil: string;
    redirectUrl: string;
};

// Template: pt/subscription/subscription-created.hbs
// Variables: {{firstName}}, {{lastName}}, {{establishmentName}}, {{planName}},
//            {{#if trialEndsAt}} {{trialEndsAt}} {{/if}}, {{nextBillingDate}}, {{redirectUrl}}
export type SubscriptionCreatedContext = {
    firstName: string;
    lastName: string;
    establishmentName: string;
    planName: string;
    trialEndsAt?: string;
    nextBillingDate: string;
    redirectUrl: string;
};

// Template: pt/subscription/subscription-reactivated.hbs
// Variables: {{firstName}}, {{lastName}}, {{establishmentName}}, {{planName}}, {{nextBillingDate}}, {{redirectUrl}}
export type SubscriptionReactivatedContext = {
    firstName: string;
    lastName: string;
    establishmentName: string;
    planName: string;
    nextBillingDate: string;
    redirectUrl: string;
};

// Template: pt/subscription/subscription-trial-started.hbs
// Variables: {{firstName}}, {{lastName}}, {{establishmentName}}, {{planName}},
//            {{trialDays}}, {{trialEndsAt}}, {{redirectUrl}}
export type SubscriptionTrialStartedContext = {
    firstName: string;
    lastName: string;
    establishmentName: string;
    planName: string;
    trialDays: number;
    trialEndsAt: string;
    redirectUrl: string;
};

// Template: pt/subscription/trial-ending.hbs
// Variables: {{firstName}}, {{lastName}}, {{establishmentName}}, {{planName}}, {{trialEndsAt}}, {{redirectUrl}}
export type SubscriptionTrialEndingContext = {
    firstName: string;
    lastName: string;
    establishmentName: string;
    planName: string;
    trialEndsAt: string;
    redirectUrl: string;
};
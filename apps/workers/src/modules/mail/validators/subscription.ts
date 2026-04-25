import { z } from 'zod';

export const EstablishmentCreateEstablishmentSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    establishmentName: z.string(),
    planName: z.string(),
    nextBillingDate: z.string().optional(),
    currentPeriodEnd: z.string().optional(),
    trialEndsAt: z.string().optional(),
    redirectUrl: z.url(),
});

export const EsatblishmentInviteEmployeeSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    establishmentName: z.string(),
    redirectUrl: z.url(),
});

export const EsatblishmentQRCodesSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    establishmentName: z.string(),
    redirectUrl: z.url(),
});

export const EstablishmentWelcomeSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    establishmentName: z.string(),
    redirectUrl: z.url(),
});

// Subscription
export const SubscriptionActivatedSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    establishmentName: z.string(),
    planName: z.string(),
    nextBillingDate: z.string().optional(),
    currentPeriodEnd: z.string().optional(),
    trialEndsAt: z.string().optional(),
    redirectUrl: z.url(),
});

export const SubscriptionInvoiceSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    establishmentName: z.string(),
    planName: z.string(),
    nextBillingDate: z.string().optional(),
    currentPeriodEnd: z.string().optional(),
    trialEndsAt: z.string().optional(),
    redirectUrl: z.url(),
});

export const SubscriptionCanceledSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    establishmentName: z.string(),
    accessUntil: z.string().optional(),
    redirectUrl: z.url(),
});

export const SubscriptionPaymentFailedSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    establishmentName: z.string(),
    nextBillingDate: z.string().optional(),
    redirectUrl: z.url(),
});

export const SubscriptionPaymentSucessfullSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    establishmentName: z.string(),
    planName: z.string(),
    nextBillingDate: z.string().optional(),
    redirectUrl: z.url(),
});

export const SubscriptionPlanChangedSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    establishmentName: z.string(),
    planName: z.string(),
    nextBillingDate: z.string().optional(),
    redirectUrl: z.url(),
});

export const SubscriptionTrialStartedSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    establishmentName: z.string(),
    planName: z.string(),
    trialDays: z.number(),
    trialEndsAt: z.string().optional(),
    redirectUrl: z.url(),
});

export const SubscriptionTrialEndingSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    establishmentName: z.string(),
    trialEndsAt: z.string().optional(),
    redirectUrl: z.url(),
});

import { z } from 'zod';

// Template: subscription/invoice.hbs
// Variables: firstName, lastName, establishmentName, planName, amountPaid, periodStart, periodEnd, nextBillingDate, redirectUrl
export const SubscriptionInvoiceSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    establishmentName: z.string(),
    planName: z.string(),
    amountPaid: z.string(),
    periodStart: z.string(),
    periodEnd: z.string(),
    nextBillingDate: z.string(),
    redirectUrl: z.string().url(),
});

// Template: subscription/payment-failed.hbs
// Variables: firstName, lastName, establishmentName, planName, amountPaid, periodStart, periodEnd, redirectUrl
export const SubscriptionPaymentFailedSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    establishmentName: z.string(),
    planName: z.string(),
    amountPaid: z.string(),
    periodStart: z.string(),
    periodEnd: z.string(),
    redirectUrl: z.string().url(),
});

// Template: subscription/payment-succeeded.hbs
// Variables: firstName, lastName, establishmentName, planName, amountPaid, periodStart, periodEnd, nextBillingDate, redirectUrl
export const SubscriptionPaymentSucceededSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    establishmentName: z.string(),
    planName: z.string(),
    amountPaid: z.string(),
    periodStart: z.string(),
    periodEnd: z.string(),
    nextBillingDate: z.string(),
    redirectUrl: z.string().url(),
});

// Template: subscription/plan-changed.hbs
// Variables: firstName, lastName, establishmentName, previousPlanName, newPlanName, nextBillingDate, isUpgrade, redirectUrl
export const SubscriptionPlanChangedSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    establishmentName: z.string(),
    previousPlanName: z.string(),
    newPlanName: z.string(),
    nextBillingDate: z.string(),
    isUpgrade: z.boolean(),
    redirectUrl: z.string().url(),
});

// Template: subscription/subscription-cancelled.hbs
// Variables: firstName, lastName, establishmentName, planName, accessUntil, redirectUrl
export const SubscriptionCancelledSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    establishmentName: z.string(),
    planName: z.string(),
    accessUntil: z.string(),
    redirectUrl: z.string().url(),
});

// Template: subscription/subscription-created.hbs
// Variables: firstName, lastName, establishmentName, planName, trialEndsAt (optional), nextBillingDate, redirectUrl
export const SubscriptionCreatedSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    establishmentName: z.string(),
    planName: z.string(),
    trialEndsAt: z.string().optional(),
    nextBillingDate: z.string(),
    redirectUrl: z.string().url(),
});

// Template: subscription/subscription-reactivated.hbs
// Variables: firstName, lastName, establishmentName, planName, nextBillingDate, redirectUrl
export const SubscriptionReactivatedSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    establishmentName: z.string(),
    planName: z.string(),
    nextBillingDate: z.string(),
    redirectUrl: z.string().url(),
});

// Template: subscription/subscription-trial-started.hbs
// Variables: firstName, lastName, establishmentName, planName, trialDays, trialEndsAt, redirectUrl
export const SubscriptionTrialStartedSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    establishmentName: z.string(),
    planName: z.string(),
    trialDays: z.number().int().positive(),
    trialEndsAt: z.string(),
    redirectUrl: z.string().url(),
});

// Template: subscription/trial-ending.hbs
// Variables: firstName, lastName, establishmentName, planName, trialEndsAt, redirectUrl
export const SubscriptionTrialEndingSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    establishmentName: z.string(),
    planName: z.string(),
    trialEndsAt: z.string(),
    redirectUrl: z.string().url(),
});

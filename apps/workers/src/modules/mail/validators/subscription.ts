import { z } from 'zod';

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

export const SubscriptionCanceledSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    establishmentName: z.string(),
    accessUntil: z.string().optional(),
    redirectUrl: z.url(),
});

export const SubscriptionReactivatedSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    establishmentName: z.string(),
    accessUntil: z.string().optional(),
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

export const WelcomeSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    redirectUrl: z.url(),
});


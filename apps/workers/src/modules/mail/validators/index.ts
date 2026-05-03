import { EmailTemplate, EmailTemplateCategory } from "@weats/types";
import { ZodSchema } from "zod";

import {
    EstablishmentCreateEstablishmentSchema,
    EstablishmentInviteEmployeeSchema,
    EstablishmentQRCodesSchema,
    EstablishmentQRCodesSharedSchema,
    EstablishmentWelcomeSchema,
} from "./establishment";

import {
    SubscriptionInvoiceSchema,
    SubscriptionPaymentFailedSchema,
    SubscriptionPaymentSucceededSchema,
    SubscriptionPlanChangedSchema,
    SubscriptionCancelledSchema,
    SubscriptionCreatedSchema,
    SubscriptionReactivatedSchema,
    SubscriptionTrialStartedSchema,
    SubscriptionTrialEndingSchema,
} from "./subscription";

export const EmailTemplateConfigs: Record<EmailTemplate, { category: EmailTemplateCategory; schema: ZodSchema<any> }> = {
    // Establishment
    [EmailTemplate.CREATE_ESTABLISHMENT]: { category: EmailTemplateCategory.ESTABLISHMENT, schema: EstablishmentCreateEstablishmentSchema },
    [EmailTemplate.INVITE_EMPLOYEE]: { category: EmailTemplateCategory.ESTABLISHMENT, schema: EstablishmentInviteEmployeeSchema },
    [EmailTemplate.QRCODES]: { category: EmailTemplateCategory.ESTABLISHMENT, schema: EstablishmentQRCodesSchema },
    [EmailTemplate.QRCODES_SHARED]: { category: EmailTemplateCategory.ESTABLISHMENT, schema: EstablishmentQRCodesSharedSchema },
    [EmailTemplate.WELCOME]: { category: EmailTemplateCategory.ESTABLISHMENT, schema: EstablishmentWelcomeSchema },

    // Subscription
    [EmailTemplate.SUBSCRIPTION_INVOICE]: { category: EmailTemplateCategory.SUBSCRIPTION, schema: SubscriptionInvoiceSchema },
    [EmailTemplate.SUBSCRIPTION_PAYMENT_FAILED]: { category: EmailTemplateCategory.SUBSCRIPTION, schema: SubscriptionPaymentFailedSchema },
    [EmailTemplate.SUBSCRIPTION_PAYMENT_SUCCEEDED]: { category: EmailTemplateCategory.SUBSCRIPTION, schema: SubscriptionPaymentSucceededSchema },
    [EmailTemplate.SUBSCRIPTION_PLAN_CHANGED]: { category: EmailTemplateCategory.SUBSCRIPTION, schema: SubscriptionPlanChangedSchema },
    [EmailTemplate.SUBSCRIPTION_CANCELLED]: { category: EmailTemplateCategory.SUBSCRIPTION, schema: SubscriptionCancelledSchema },
    [EmailTemplate.SUBSCRIPTION_CREATED]: { category: EmailTemplateCategory.SUBSCRIPTION, schema: SubscriptionCreatedSchema },
    [EmailTemplate.SUBSCRIPTION_REACTIVATED]: { category: EmailTemplateCategory.SUBSCRIPTION, schema: SubscriptionReactivatedSchema },
    [EmailTemplate.SUBSCRIPTION_TRIAL_STARTED]: { category: EmailTemplateCategory.SUBSCRIPTION, schema: SubscriptionTrialStartedSchema },
    [EmailTemplate.SUBSCRIPTION_TRIAL_ENDING]: { category: EmailTemplateCategory.SUBSCRIPTION, schema: SubscriptionTrialEndingSchema },
};

// Backwards-compatible export for TemplateRenderService
export const EmailSchemas = Object.fromEntries(
    Object.entries(EmailTemplateConfigs).map(([key, val]) => [key, val.schema])
) as Record<EmailTemplate, ZodSchema<any>>;

import { EmailTemplate, EmailTemplateCategory } from "@weats/types";
import { ZodSchema } from "zod";
import {
    EsatblishmentInviteEmployeeSchema,
    EsatblishmentQRCodesSchema,
    EstablishmentCreateEstablishmentSchema,
    EstablishmentWelcomeSchema,
    SubscriptionActivatedSchema,
    SubscriptionCanceledSchema,
    SubscriptionPaymentFailedSchema,
    SubscriptionPaymentSucessfullSchema,
    SubscriptionPlanChangedSchema,
    SubscriptionTrialEndingSchema,
    SubscriptionTrialStartedSchema,
    SubscriptionInvoiceSchema
} from "./subscription";

export const EmailTemplateConfigs: Record<EmailTemplate, { category: EmailTemplateCategory; schema: ZodSchema<any> }> = {
    //Establishment
    [EmailTemplate.CREATE_ESTABLISHMENT]: { category: EmailTemplateCategory.ESTABLISHMENT, schema: EstablishmentCreateEstablishmentSchema },
    [EmailTemplate.INVITE_EMPLOYEE]: { category: EmailTemplateCategory.ESTABLISHMENT, schema: EsatblishmentInviteEmployeeSchema },
    [EmailTemplate.QRCODES]: { category: EmailTemplateCategory.ESTABLISHMENT, schema: EsatblishmentQRCodesSchema },
    [EmailTemplate.WELCOME]: { category: EmailTemplateCategory.ESTABLISHMENT, schema: EstablishmentWelcomeSchema },

    //Subscription
    [EmailTemplate.SUBSCRIPTION_CREATED]: { category: EmailTemplateCategory.SUBSCRIPTION, schema: SubscriptionActivatedSchema },
    [EmailTemplate.SUBSCRIPTION_CANCELLED]: { category: EmailTemplateCategory.SUBSCRIPTION, schema: SubscriptionCanceledSchema },
    [EmailTemplate.SUBSCRIPTION_INVOICE]: { category: EmailTemplateCategory.SUBSCRIPTION, schema: SubscriptionInvoiceSchema },
    [EmailTemplate.SUBSCRIPTION_PAYMENT_FAILED]: { category: EmailTemplateCategory.SUBSCRIPTION, schema: SubscriptionPaymentFailedSchema },
    [EmailTemplate.SUBSCRIPTION_PAYMENT_SUCCESFULL]: { category: EmailTemplateCategory.SUBSCRIPTION, schema: SubscriptionPaymentSucessfullSchema },
    [EmailTemplate.SUBSCRIPTION_PLAN_CHANGED]: { category: EmailTemplateCategory.SUBSCRIPTION, schema: SubscriptionPlanChangedSchema },
    [EmailTemplate.SUBSCRIPTION_TRIAL_STARTED]: { category: EmailTemplateCategory.SUBSCRIPTION, schema: SubscriptionTrialStartedSchema },
    [EmailTemplate.SUBSCRIPTION_TRIAL_ENDING]: { category: EmailTemplateCategory.SUBSCRIPTION, schema: SubscriptionTrialEndingSchema },
};

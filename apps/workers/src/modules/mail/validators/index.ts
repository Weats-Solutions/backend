import { EmailTemplate } from "@weats/types";
import { SubscriptionActivatedSchema, SubscriptionCanceledSchema, SubscriptionReactivatedSchema, SubscriptionTrialStartedSchema, WelcomeSchema } from "./subscription";

export const EmailSchemas = {
    [EmailTemplate.SUBSCRIPTION_ACTIVATED]: SubscriptionActivatedSchema,
    [EmailTemplate.SUBSCRIPTION_CANCELED]: SubscriptionCanceledSchema,
    [EmailTemplate.SUBSCRIPTION_REACTIVATED]: SubscriptionReactivatedSchema,
    [EmailTemplate.SUBSCRIPTION_TRIAL_STARTED]: SubscriptionTrialStartedSchema,
    [EmailTemplate.WELCOME]: WelcomeSchema,
};

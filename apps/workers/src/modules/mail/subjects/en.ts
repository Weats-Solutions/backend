import { EmailTemplate } from '@weats/types';

export const subjects = {
    //Establishment Templates Category
    [EmailTemplate.WELCOME]: 'Welcome to Weats! 👋',
    [EmailTemplate.CREATE_ESTABLISHMENT]: 'Welcome, new establishment to Weats! 👋',
    [EmailTemplate.INVITE_EMPLOYEE]: 'You have been invited to join Weats! 👋',
    [EmailTemplate.QRCODES]: 'Seus QRCodes do Weats',

    //Subscription Templates Category
    [EmailTemplate.SUBSCRIPTION_CREATED]: 'Your subscription is active',
    [EmailTemplate.SUBSCRIPTION_CANCELLED]: 'Your subscription was canceled',
    [EmailTemplate.SUBSCRIPTION_PAYMENT_FAILED]: 'Failed to pay your subscription',
    [EmailTemplate.SUBSCRIPTION_PAYMENT_SUCCESFULL]: 'Payment succeeded',
    [EmailTemplate.SUBSCRIPTION_PLAN_CHANGED]: 'Your plan has been changed',
    [EmailTemplate.SUBSCRIPTION_TRIAL_STARTED]: 'Your trial period has started',
    [EmailTemplate.SUBSCRIPTION_TRIAL_ENDING]: 'Your trial period has ended',
} as const; 
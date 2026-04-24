import { EmailTemplate } from '@weats/types';

export const subjects = {
    [EmailTemplate.WELCOME]: 'Welcome to Weats! 👋',
    [EmailTemplate.SUBSCRIPTION_ACTIVATED]: 'Your subscription is active',
    [EmailTemplate.SUBSCRIPTION_CANCELED]: 'Your subscription was canceled',
} as const;
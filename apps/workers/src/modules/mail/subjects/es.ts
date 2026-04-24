import { EmailTemplate } from '@weats/types';

export const subjects = {
    [EmailTemplate.WELCOME]: 'Bienvenido a Weats! 👋',
    [EmailTemplate.SUBSCRIPTION_ACTIVATED]: 'Tu suscripción está activa',
    [EmailTemplate.SUBSCRIPTION_CANCELED]: 'Tu suscripción ha sido cancelada',
} as const;
import { EmailTemplate } from '@weats/types';

export const subjects = {
    //Establishment Templates Category
    [EmailTemplate.WELCOME]: 'Bienvenido a Weats! 👋',
    [EmailTemplate.CREATE_ESTABLISHMENT]: 'Bienvenido, nuevo establecimiento a Weats! 👋',
    [EmailTemplate.INVITE_EMPLOYEE]: 'Has sido invitado a unirte a Weats! 👋',
    [EmailTemplate.QRCODES]: 'Seus QRCodes do Weats',

    //Subscription Templates Category
    [EmailTemplate.SUBSCRIPTION_CREATED]: 'Tu suscripción está activa',
    [EmailTemplate.SUBSCRIPTION_CANCELLED]: 'Tu suscripción ha sido cancelada',
    [EmailTemplate.SUBSCRIPTION_PAYMENT_FAILED]: 'Error al pagar tu suscripción',
    [EmailTemplate.SUBSCRIPTION_PAYMENT_SUCCEEDED]: 'Pago realizado con éxito',
    [EmailTemplate.SUBSCRIPTION_PLAN_CHANGED]: 'Tu plan ha sido cambiado',
    [EmailTemplate.SUBSCRIPTION_TRIAL_STARTED]: 'Tu periodo de prueba ha comenzado',
    [EmailTemplate.SUBSCRIPTION_TRIAL_ENDING]: 'Tu periodo de prueba ha finalizado',
    [EmailTemplate.SUBSCRIPTION_PAUSED]: 'Tu suscripción ha sido pausada',
} as const;
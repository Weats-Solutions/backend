import { EmailTemplate } from '@weats/types';

export const subjects = {
    [EmailTemplate.WELCOME]: 'Bem-vindo ao weats 👋',
    [EmailTemplate.SUBSCRIPTION_ACTIVATED]: 'A sua assinatura está ativa',
    [EmailTemplate.SUBSCRIPTION_CANCELED]: 'A sua assinatura foi cancelada',
    createEstablishment: 'Bem-vindo, novo estabelecimento ao Weats! 👋',
    inviteEmployee: 'Você foi convidado a se juntar ao Weats! 👋',
} as const;
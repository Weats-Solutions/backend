import { EmailTemplate } from '@weats/types';

export const subjects = {
    //Establishment Templates Category
    [EmailTemplate.CREATE_ESTABLISHMENT]: 'Bem-vindo, novo estabelecimento ao Weats! 👋',
    [EmailTemplate.INVITE_EMPLOYEE]: 'Você foi convidado a se juntar ao Weats! 👋',
    [EmailTemplate.QRCODES]: 'Seus QRCodes do Weats',
    [EmailTemplate.WELCOME]: 'Bem-vindo ao weats 👋',


    //Subscription Templates Category
    [EmailTemplate.SUBSCRIPTION_CREATED]: 'A sua assinatura está ativa',
    [EmailTemplate.SUBSCRIPTION_CANCELLED]: 'A sua assinatura foi cancelada',
    [EmailTemplate.SUBSCRIPTION_PAYMENT_FAILED]: 'Falha no pagamento da sua assinatura',
    [EmailTemplate.SUBSCRIPTION_PAYMENT_SUCCEEDED]: 'Pagamento bem sucedido',
    [EmailTemplate.SUBSCRIPTION_PLAN_CHANGED]: 'O seu plano foi alterado',
    [EmailTemplate.SUBSCRIPTION_TRIAL_STARTED]: 'O seu periodo de teste começou',
    [EmailTemplate.SUBSCRIPTION_TRIAL_ENDING]: 'O seu periodo de teste terminou',
} as const;
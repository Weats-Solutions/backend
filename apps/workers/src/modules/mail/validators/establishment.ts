import { z } from 'zod';

// Template: establishment/create-establishment.hbs
// Variables: firstName, lastName, establishmentName, redirectUrl
export const EstablishmentCreateEstablishmentSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    establishmentName: z.string(),
    redirectUrl: z.string().url(),
});

// Template: establishment/invite-employee.hbs
// Variables: firstName, lastName, establishmentName, redirectUrl
export const EstablishmentInviteEmployeeSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    establishmentName: z.string(),
    redirectUrl: z.string().url(),
});

// Template: establishment/qrcodes.hbs
// Variables: establishmentName, qrCodesCount, serviceZones[].zoneName, serviceZones[].count
export const EstablishmentQRCodesSchema = z.object({
    establishmentName: z.string(),
    qrCodesCount: z.number().int().positive(),
    serviceZones: z.array(z.object({
        zoneName: z.string(),
        count: z.number().int().positive(),
    })),
});

// Template: establishment/welcome.hbs
// Variables: firstName, lastName, redirectUrl
export const EstablishmentWelcomeSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    redirectUrl: z.string().url(),
});

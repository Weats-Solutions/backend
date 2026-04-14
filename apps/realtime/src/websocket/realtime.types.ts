import { User } from '@weats/types';

export interface AuthenticatedSocketData {
    user?: User;
    role?: string;
    establishmentId?: string;
    servicePointId?: string;
}

export interface ClientHelpRequestPayload {
    servicePointId: string;
    message?: string;
}

export interface StaffHelpResponsePayload {
    message?: string;
}

import { User } from '@weats/types';

export interface AuthenticatedSocketData {
    user?: User;
    role?: string;
    establishmentId?: string;
    servicePointId?: string;
    servicePointName?: string;
    zoneId?: string;
    zoneName?: string;
    maxCapacity?: number;
    clientId?: string;
}

export type StaffCallType = 'HELP' | 'BILL' | 'ORDER' | 'CLEAN';

export interface ClientCallPayload {
    type: StaffCallType;
    message?: string;
}

export interface StaffCallResponsePayload {
    servicePointId: string;
    clientId: string;
    message?: string;
}

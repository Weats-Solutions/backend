import { User } from '@weats/types';
import { RealtimeCallStatus, RealtimeMessageCode, RealtimeStaffCallType } from '@weats/contracts';

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

export type StaffCallType = RealtimeStaffCallType;

export interface ClientCallPayload {
    type: StaffCallType;
    message?: string;
}

export interface StaffCallResponsePayload {
    status: RealtimeCallStatus;
    servicePointId: string;
    clientId: string;
    message?: RealtimeMessageCode | string;
}


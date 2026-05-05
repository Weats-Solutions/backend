import { RealtimeCallStatus, RealtimeMessageCode, RealtimeStaffCallType } from '@weats/contracts';
import { User } from '@weats/types';
import { Server } from 'socket.io';

export interface RealtimeV2SocketData {
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

export interface ClientValidationContext {
  establishmentId: string;
  servicePointId: string;
  servicePointName: string;
  zoneId: string;
  zoneName: string;
  maxCapacity: number;
}

export interface StaffValidationContext {
  user: User;
  role: string;
  establishmentId: string;
}

export interface ClientCallPayload {
  type: RealtimeStaffCallType;
  message?: string;
}

export interface StaffCallResponsePayload {
  status: RealtimeCallStatus;
  servicePointId: string;
  clientId: string;
  message?: RealtimeMessageCode | string;
}

export interface CallRequestedPayload {
  servicePointId: string;
  establishmentId: string;
  servicePointName?: string;
  zoneId?: string;
  zoneName?: string;
  clientId: string;
  type: RealtimeStaffCallType;
  message: string;
  timestamp: string;
}

export interface CallRemovedPayload {
  servicePointId: string;
  clientId?: string;
}

export interface CallStatusPayload {
  status: RealtimeCallStatus;
  message: RealtimeMessageCode | string;
  timestamp: string;
  staffName?: string;
}

export interface StaffServerToClientEvents {
  'call:snapshot': (calls: CallRequestedPayload[]) => void;
  'call:requested': (payload: CallRequestedPayload) => void;
  'call:removed': (payload: CallRemovedPayload) => void;
}

export interface StaffClientToServerEvents {
  'call:response': (payload: StaffCallResponsePayload) => void;
  'admin:block:sp': (payload: { servicePointId: string; durationMinutes?: number }) => void;
  'admin:block:client': (payload: { clientId: string; durationMinutes?: number }) => void;
}

export interface ClientServerToClientEvents {
  'call:status': (payload: CallStatusPayload) => void;
}

export interface ClientClientToServerEvents {
  'call:request': (payload: ClientCallPayload) => void;
}

export type RealtimeV2StaffServer = Server<
  StaffClientToServerEvents,
  StaffServerToClientEvents,
  Record<string, never>,
  RealtimeV2SocketData
>;

export type RealtimeV2ClientServer = Server<
  ClientClientToServerEvents,
  ClientServerToClientEvents,
  Record<string, never>,
  RealtimeV2SocketData
>;

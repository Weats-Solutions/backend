import { User } from '@weats/types';
import { Server } from 'socket.io';

export const RealtimeV2Error = {
  // Erros de Handshake / Conexão
  THROTTLE: 'REALTIME_ERR_THROTTLE',
  IP_BAN: 'REALTIME_ERR_IP_BAN',
  SP_BLOCKED: 'REALTIME_ERR_SP_BLOCKED',
  INVALID_QR: 'REALTIME_ERR_INVALID_QR',
  INVALID_SP: 'REALTIME_ERR_INVALID_SP',
  CAPACITY_EXCEEDED: 'REALTIME_ERR_CAPACITY_EXCEEDED',
  ALREADY_CONNECTED: 'REALTIME_ERR_ALREADY_CONNECTED',
  
  // Erros de Pedido
  SPAM_PROTECTION: 'REALTIME_ERR_SPAM_PROTECTION',
  UNAUTHORIZED: 'REALTIME_ERR_UNAUTHORIZED',
  MISSING_AUTH: 'REALTIME_ERR_MISSING_AUTH',
  CONNECTING_LOCK: 'REALTIME_ERR_CONNECTING_LOCK',
  INTERNAL_ERROR: 'REALTIME_ERR_INTERNAL_ERROR',
} as const;

export interface AdminBlockTablePayload {
  establishmentId: string;
  servicePointId: string;
  durationMinutes?: number;
}

export interface AdminUnblockTablePayload {
  establishmentId: string;
  servicePointId: string;
}

export enum RealtimeCallStatus {
  PENDING = 'PENDING',
  RESPONDED = 'RESPONDED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED',
  ACTIVE = 'ACTIVE',
}

export enum RealtimeMessageCode {
  // Staff Responses
  STAFF_ON_WAY = 'REALTIME_MSG_STAFF_ON_WAY',
  REQUEST_RECEIVED = 'REALTIME_MSG_REQUEST_RECEIVED',
  
  // System Messages
  MESA_BLOQUEADA = 'REALTIME_ERR_SP_BLOCKED',
  MESA_LIBERADA = 'REALTIME_MSG_SP_UNBLOCKED',
  IP_BANIDO = 'REALTIME_ERR_IP_BAN',
  SPAM_PROTECTION = 'REALTIME_ERR_SPAM_PROTECTION',
  THROTTLE_ERROR = 'REALTIME_ERR_THROTTLE',
}

export enum RealtimeStaffCallType {
  HELP = 'HELP',
  BILL = 'BILL',
  ORDER = 'ORDER',
  CLEAN = 'CLEAN',
}

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
  'table:status': (payload: { servicePointId: string; status: RealtimeCallStatus; expiresAt?: string }) => void;
  'table:snapshot': (snapshot: Record<string, string>) => void;
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

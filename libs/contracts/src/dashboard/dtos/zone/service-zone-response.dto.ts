import { ServicePointType } from "@prisma/client";

export class ServicePointResponseDto {
  id: string;
  name: string;
  type: ServicePointType;
  maxCapacity: number;
  minCapacity: number;
  isReservable: boolean;
  isPriority: boolean;
  isActive: boolean;
  token: string | null;
  zoneId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ServiceZoneResponseDto {
  id: string;
  name: string;
  isActive: boolean;
  position: number;
  establishmentId: string;
  createdAt: Date;
  updatedAt: Date;
  servicePoints?: ServicePointResponseDto[];
}

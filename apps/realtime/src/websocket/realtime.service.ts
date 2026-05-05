import { Injectable, Logger } from '@nestjs/common';
import { ClerkService } from '@weats/integrations';
import { CorePrismaService } from '@weats/database';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RealtimeService {
    private readonly logger = new Logger(RealtimeService.name);

    constructor(
        private readonly clerkService: ClerkService,
        private readonly prisma: CorePrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async validateClient(servicePointId: string) {
        try {
            const servicePoint = await this.prisma.servicePoint.findUnique({
                where: { id: servicePointId },
                include: { zone: true },
            });

            if (!servicePoint || !servicePoint.isActive) {
                return null;
            }

            return {
                establishmentId: servicePoint.zone.establishmentId,
                servicePointId: servicePoint.id,
                servicePointName: servicePoint.name,
                zoneId: servicePoint.zone.id,
                zoneName: servicePoint.zone.name,
                maxCapacity: servicePoint.maxCapacity
            };
        } catch (error) {
            this.logger.error('Client validation failed', error);
            return null;
        }
    }

    async validateClientSession(sessionToken: string) {
        try {
            const payload = await this.jwtService.verifyAsync<{
                eid?: string;
                spid?: string;
                type?: string;
            }>(sessionToken, {
                issuer: 'weats-catalog',
                audience: 'weats-menu',
            });

            if (!payload?.eid || !payload?.spid || payload.type !== 'TABLE') {
                return null;
            }

            const client = await this.validateClient(payload.spid);

            if (!client || client.establishmentId !== payload.eid) {
                return null;
            }

            return client;
        } catch (error: any) {
            this.logger.warn('Client session validation failed: ' + error.message);
            return null;
        }
    }

    async validateStaff(token: string, establishmentId: string) {
        try {
            const user = await this.clerkService.verifyJwtToken(token);
            const clerkUser = await this.clerkService.getUser(user.clerkUserId);
            const establishments = clerkUser.publicMetadata?.establishments as Record<string, any>;

            if (!establishments || !establishments[establishmentId]) {
                return null;
            }

            const estRoleInfo = establishments[establishmentId];
            if (estRoleInfo.role !== 'STAFF' && estRoleInfo.role !== 'OWNER' && estRoleInfo.role !== 'ADMIN') {
                return null;
            }

            return {
                user,
                role: estRoleInfo.role,
                establishmentId
            };
        } catch (error: any) {
            this.logger.error('Staff validation failed: ' + error.message);
            return null;
        }
    }
}

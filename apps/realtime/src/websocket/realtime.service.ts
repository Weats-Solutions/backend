import { Injectable, Logger } from '@nestjs/common';
import { ClerkService } from '@weats/integrations';
import { CorePrismaService } from '@weats/database';

@Injectable()
export class RealtimeService {
    private readonly logger = new Logger(RealtimeService.name);

    constructor(
        private readonly clerkService: ClerkService,
        private readonly prisma: CorePrismaService,
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
                servicePointId: servicePoint.id
            };
        } catch (error) {
            this.logger.error('Client validation failed', error);
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

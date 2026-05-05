import { Injectable, Logger } from '@nestjs/common';
import { ClerkService } from '@weats/integrations';
import { StaffValidationContext } from './realtime-v2.types';

@Injectable()
export class RealtimeV2StaffAuthService {
  private readonly logger = new Logger(RealtimeV2StaffAuthService.name);

  constructor(private readonly clerkService: ClerkService) { }

  async validate(token: string, establishmentId: string): Promise<StaffValidationContext | null> {
    try {
      const user = await this.clerkService.verifyJwtToken(token);
      const clerkUser = await this.clerkService.getUser(user.clerkUserId);
      const establishments = clerkUser.publicMetadata?.establishments as Record<string, any>;

      if (!establishments || !establishments[establishmentId]) {
        return null;
      }

      const role = establishments[establishmentId]?.role;
      if (role !== 'STAFF' && role !== 'OWNER' && role !== 'ADMIN') {
        return null;
      }

      return {
        user,
        role,
        establishmentId,
      };
    } catch (error: any) {
      this.logger.error('Staff auth failed: ' + error.message);
      return null;
    }
  }
}

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { verifyToken, createClerkClient } from '@clerk/backend';
import { User } from '@weats/types';
import { ClerkConfigService } from '@weats/configs/clerk-config.service';
import { CorePrismaService } from '@weats/database';
import { Webhook } from 'svix';

@Injectable()
export class ClerkService {
  private readonly logger = new Logger(ClerkService.name);
  private readonly clerkClient;

  constructor(
    private readonly clerkConfig: ClerkConfigService,
    private readonly corePrismaService: CorePrismaService,
  ) {
    this.clerkClient = createClerkClient({
      secretKey: this.clerkConfig.getClerkSecretKey(),
    });
  }

  verifySignature(
    rawBody: Buffer,
    svixSignature: string,
    svixId: string,
    svixTimestamp: string,
  ): boolean {
    try {
      const wh = new Webhook(this.clerkConfig.getClerkWebhookSecret());

      wh.verify(rawBody, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });

      return true;
    } catch (err) {
      console.error('Erro ao verificar assinatura:', err);
      return false;
    }
  }

  async verifyJwtToken(token: string): Promise<User> {
    try {
      const jwtKey = this.clerkConfig.getClerkJwtKey();
      
      const payload = await verifyToken(token, {
        secretKey: this.clerkConfig.getClerkSecretKey(),
        ...(jwtKey ? { jwtKey } : {}), // Pass JWK local key if available to avoid fetch()
      });

      if (!payload || !payload.sub) {
        throw new UnauthorizedException('Invalid token payload');
      }

      const userId = payload.sub;
      this.logger.debug(`Token verified for user: ${userId}`);

      const clerkUser = await this.clerkClient.users.getUser(userId);

      if (!clerkUser) {
        throw new UnauthorizedException('User not found');
      }

      // 1) Tenta encontrar pelo clerkUserId
      let dbUser = await this.corePrismaService.user.findUnique({
        where: { clerkUserId: clerkUser.id },
        select: {
          id: true,
          clerkUserId: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      // 2) Se não existir, tenta procurar pelo email primário do Clerk
      if (!dbUser) {
        const primaryEmail =
          clerkUser.emailAddresses.find(
            (ea) => ea.id === clerkUser.primaryEmailAddressId,
          )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

        if (primaryEmail) {
          const existingByEmail = await this.corePrismaService.user.findUnique({
            where: { email: primaryEmail },
            select: {
              id: true,
              clerkUserId: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          });

          if (existingByEmail) {
            this.logger.warn(
              `Found DB user by email (${primaryEmail}). Updating clerkUserId to ${clerkUser.id}`,
            );

            dbUser = await this.corePrismaService.user.update({
              where: { id: existingByEmail.id },
              data: {
                clerkUserId: clerkUser.id,
                firstName: clerkUser.firstName || existingByEmail.firstName,
                lastName: clerkUser.lastName || existingByEmail.lastName,
              },
              select: {
                id: true,
                clerkUserId: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            });
          }
        }

        // 3) Se ainda não existir, cria o usuário. Protege contra condição de corrida (unique constraint) tentando update por email se create falhar.
        if (!dbUser) {
          this.logger.warn(
            `User ${clerkUser.id} not found in DB. Creating from Clerk data.`,
          );

          const emailToUse =
            clerkUser.emailAddresses.find(
              (ea) => ea.id === clerkUser.primaryEmailAddressId,
            )?.emailAddress ||
            clerkUser.emailAddresses[0]?.emailAddress ||
            null;

          try {
            dbUser = await this.corePrismaService.user.create({
              data: {
                clerkUserId: clerkUser.id,
                email: emailToUse,
                firstName: clerkUser.firstName || null,
                lastName: clerkUser.lastName || null,
              },
              select: {
                id: true,
                clerkUserId: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            });
          } catch (e: any) {
            // Prisma unique constraint on email (P2002) - outra request criou o user simultaneamente
            if (e?.code === 'P2002') {
              this.logger.warn(
                'Create raced with another request; attempting to find by email and update clerkUserId',
              );
              if (emailToUse) {
                const found = await this.corePrismaService.user.findUnique({
                  where: { email: emailToUse },
                });
                if (found) {
                  dbUser = await this.corePrismaService.user.update({
                    where: { id: found.id },
                    data: {
                      clerkUserId: clerkUser.id,
                      firstName: clerkUser.firstName || found.firstName,
                      lastName: clerkUser.lastName || found.lastName,
                    },
                    select: {
                      id: true,
                      clerkUserId: true,
                      email: true,
                      firstName: true,
                      lastName: true,
                    },
                  });
                }
              }
            } else {
              throw e;
            }
          }
        }
      }

      if (!dbUser) {
        this.logger.error(
          `Could not find or create DB user for Clerk id ${clerkUser.id}`,
        );
        throw new UnauthorizedException('User not found after synchronization');
      }

      const user: User = {
        id: dbUser.id,
        clerkUserId: clerkUser.id,
        email: dbUser.email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
      };

      return user;
    } catch (error: any) {
      this.logger.error(`Token verification failed: ${error?.message || JSON.stringify(error) || error}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }

  async getUser(userId: string) {
    return this.clerkClient.users.getUser(userId);
  }

  async updateUserMetadata(userId: string, metadata: any) {
    try {
      await this.clerkClient.users.updateUserMetadata(userId, {
        publicMetadata: metadata,
      });
    } catch (error) {
      this.logger.error(
        `Failed to update metadata for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }
}

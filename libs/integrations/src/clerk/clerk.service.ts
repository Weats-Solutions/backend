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

      try {
        const [, payloadBase64] = token.split('.');
        if (payloadBase64) {
          const decodedRaw = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
          const nowSecs = Math.floor(Date.now() / 1000);
          /*
          this.logger.debug(`=== JWT DIAGNOSTICS ===`);
          this.logger.debug(`Server Current Time: ${nowSecs} (${new Date().toISOString()})`);
          if (decodedRaw.iat) this.logger.debug(`Token Issued At (iat): ${decodedRaw.iat} (${new Date(decodedRaw.iat * 1000).toISOString()})`);
          if (decodedRaw.nbf) this.logger.debug(`Token Not Before (nbf): ${decodedRaw.nbf} (${new Date(decodedRaw.nbf * 1000).toISOString()})`);
          if (decodedRaw.exp) this.logger.debug(`Token Expires (exp): ${decodedRaw.exp} (${new Date(decodedRaw.exp * 1000).toISOString()})`);
          */
          if (decodedRaw.iat > nowSecs) {
            this.logger.error(`🚨 DETECTADO SKEW DE RELÓGIO! A data de emissão do token (iat) está no futuro! O servidor local atrasou ${decodedRaw.iat - nowSecs} segundos. A API Clerk irá atirar erro de assinatura!`);
          }
        }
      } catch (err) {
        this.logger.warn(`Failed to parse raw JWT for logs: ${err}`);
      }

      const payload = await verifyToken(token, {
        secretKey: this.clerkConfig.getClerkSecretKey(),
        ...(jwtKey ? { jwtKey } : {}), // Pass JWK local key if available to avoid fetch()
      });

      if (!payload || !payload.sub) {
        throw new UnauthorizedException('Invalid token payload');
      }

      const userId = payload.sub;
      this.logger.debug(`Token verified for user: ${userId}`);

      // 1) OTIMIZAÇÃO CRUCIAL: Tenta encontrar na nossa DB primeiro!
      // Evita chamadas de rede à Clerk API (getUser) em CADA request do painel.
      let dbUser = await this.corePrismaService.user.findUnique({
        where: { clerkUserId: userId },
        select: {
          id: true,
          clerkUserId: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      // 2) Se o user não existir na nossa DB local (primeiro login dele), ENTÃO fazemos fetch ao Clerk
      if (!dbUser) {
        this.logger.warn(`User ${userId} not in DB yet. Fetching from Clerk API...`);
        const clerkUser = await this.clerkClient.users.getUser(userId);

        if (!clerkUser) {
          throw new UnauthorizedException('User not found in Clerk');
        }

        const primaryEmail =
          clerkUser.emailAddresses.find(
            (ea) => ea.id === clerkUser.primaryEmailAddressId,
          )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

        if (primaryEmail) {
          const existingByEmail = await this.corePrismaService.user.findUnique({
            where: { email: primaryEmail },
            select: { id: true, firstName: true, lastName: true },
          });

          if (existingByEmail) {
            this.logger.warn(`Found DB user by email (${primaryEmail}). Updating clerkUserId to ${clerkUser.id}`);
            dbUser = await this.corePrismaService.user.update({
              where: { id: existingByEmail.id },
              data: {
                clerkUserId: clerkUser.id,
                firstName: clerkUser.firstName || existingByEmail.firstName,
                lastName: clerkUser.lastName || existingByEmail.lastName,
              },
              select: { id: true, clerkUserId: true, email: true, firstName: true, lastName: true },
            });
          }
        }

        // 3) Se ainda não existir, cria o usuário novo
        if (!dbUser) {
          const emailToUse = primaryEmail || null;
          try {
            dbUser = await this.corePrismaService.user.create({
              data: {
                clerkUserId: clerkUser.id,
                email: emailToUse,
                firstName: clerkUser.firstName || null,
                lastName: clerkUser.lastName || null,
              },
              select: { id: true, clerkUserId: true, email: true, firstName: true, lastName: true },
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
          `Could not find or create DB user for Clerk id ${userId}`,
        );
        throw new UnauthorizedException('User not found after synchronization');
      }

      const user: User = {
        id: dbUser.id,
        clerkUserId: dbUser.clerkUserId,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
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


  async getUsers() {
    return this.clerkClient.users.getUserList();
  }

  async getUser(userId: string) {
    return this.clerkClient.users.getUser(userId);
  }

}

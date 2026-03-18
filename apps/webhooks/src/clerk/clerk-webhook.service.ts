import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { CorePrismaService } from '@weats/database';

@Injectable()
export class ClerkWebhookService {
    private readonly logger = new Logger(ClerkWebhookService.name);

    constructor(
        @Inject('APP_URL') private readonly appUrl: string,
        @InjectQueue('emails') private readonly emailQueue: Queue,
        private readonly prisma: CorePrismaService,
    ) { }

    async handleEvent(body: any) {
        const eventType = body.type;
        const eventId = body.id; // Clerk (Svix) envia um ID único para o evento
        const requestId = `clerk-${eventId}-${Date.now()}`;

        this.logger.log(`🔍 Checking idempotency for Clerk event: ${eventId} (${eventType})`);

        // 1. Idempotência: Usar UPSERT atomicamente para evitar race condition
        const webhookEvent = await this.prisma.webhookEvent.upsert({
            where: {
                provider_eventId: {
                    provider: 'clerk',
                    eventId: eventId,
                },
            },
            update: {}, // Não atualiza se já existe
            create: {
                provider: 'clerk',
                eventId: eventId,
                eventType: eventType,
                status: 'PROCESSING',
                requestId: requestId,
                processedAt: new Date(),
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
            },
        });

        // 2. Verificar se foi recém-criado ou já existia
        if (webhookEvent.status !== 'PROCESSING') {
            this.logger.warn(`⚠️ Clerk event ${eventId} already processed (status: ${webhookEvent.status}). Skipping...`);
            return;
        }

        // 3. Verificar se está muito tempo em PROCESSING (crashed/stuck)
        const processingDuration = Date.now() - webhookEvent.processedAt.getTime();
        const MAX_PROCESSING_TIME = 5 * 60 * 1000; // 5 minutos
        
        if (processingDuration > MAX_PROCESSING_TIME && webhookEvent.status === 'PROCESSING') {
            this.logger.warn(`⚠️ Clerk event ${eventId} stuck in PROCESSING for ${processingDuration}ms. Resetting...`);
            await this.prisma.webhookEvent.update({
                where: { id: webhookEvent.id },
                data: { status: 'PROCESSING', processedAt: new Date() },
            });
        }

        try {
            switch (eventType) {
                case 'user.created':
                    const primaryEmail = body.data.email_addresses?.[0]?.email_address;
                    if (!primaryEmail) {
                        throw new BadRequestException('Email address is required');
                    }
                    
                    const existingUser = await this.prisma.user.findUnique({
                        where: { clerkUserId: body.data.id },
                    });

                    if (!existingUser) {
                        await this.prisma.user.create({
                            data: {
                                clerkUserId: body.data.id,
                                email: primaryEmail,
                                firstName: body.data.first_name || '',
                                lastName: body.data.last_name || '',
                                createdAt: new Date(body.data.created_at),
                            },
                        });
                    }

                    const availableLocales = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl'];
                    let lang = body.data.unsafe_metadata?.locale || 'en';

                    if (!availableLocales.includes(lang)) {
                        lang = 'en';
                    }

                    await this.emailQueue.add(
                        'send-email',
                        {
                            email: primaryEmail,
                            subject: 'Welcome to Weats!',
                            template: 'welcome',
                            lang,
                            context: {
                                firstName: body.data.first_name,
                                lastName: body.data.last_name,
                                redirectUrl: this.appUrl,
                            },
                        },
                        {
                            attempts: 3,
                            backoff: { type: 'fixed', delay: 30000 },
                            removeOnComplete: true,
                            removeOnFail: false,
                        },
                    );
                    break;

                case 'user.updated':
                    const updateEmail = body?.data?.email_addresses?.[0]?.email_address;
                    
                    // Validate email is not empty before updating
                    if (!updateEmail) {
                        this.logger.warn(`⚠️ Clerk user.updated event has no email address, skipping email update`);
                    }

                    await this.prisma.user.upsert({
                        where: { clerkUserId: body.data.id },
                        update: {
                            ...(updateEmail && { email: updateEmail }),
                            firstName: body.data.first_name || '',
                            lastName: body.data.last_name || '',
                            updatedAt: new Date(body.data.updated_at),
                        },
                        create: {
                            clerkUserId: body.data.id,
                            email: updateEmail || 'no-email@placeholder.com',
                            firstName: body.data.first_name || '',
                            lastName: body.data.last_name || '',
                            createdAt: new Date(body.data.created_at),
                        }
                    });
                    break;

                case 'user.deleted':
                    await this.prisma.user.deleteMany({
                        where: { clerkUserId: body.data.id },
                    });
                    break;

                default:
                    this.logger.warn(`⚠️ Evento não tratado: ${eventType}`);
                    break;
            }

            // 3. Sucesso
            await this.prisma.webhookEvent.update({
                where: {
                    provider_eventId: {
                        provider: 'clerk',
                        eventId: eventId,
                    },
                },
                data: { status: 'PROCESSED' },
            });

        } catch (error) {
            this.logger.error(`❌ Failed to process Clerk event ${eventId}: ${error.message}`);
            
            try {
              await this.prisma.webhookEvent.update({
                where: {
                    provider_eventId: {
                        provider: 'clerk',
                        eventId: eventId,
                    },
                },
                data: { 
                    status: 'FAILED',
                    lastError: error.message,
                    retryCount: { increment: 1 }
                },
              });
            } catch (dbUpdateError) {
              this.logger.error(
                `⚠️ Failed to update webhook status to FAILED: ${dbUpdateError.message}. Original error: ${error.message}`,
              );
            }

            throw error;
        }
    }
}

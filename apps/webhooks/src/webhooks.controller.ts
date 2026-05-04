import {
    Controller,
    Logger,
    Headers,
    Post,
    Req,
    Res,
    Version,
    RawBodyRequest
} from '@nestjs/common';
import { Request, Response } from 'express';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QUEUES } from '@weats/bull/queues/queues.constants';
import { StripeService } from "@weats/integrations/stripe/stripe.service";
import { ClerkService } from "@weats/integrations/clerk/clerk.service";
import { RateLimit } from '@weats/common';

@Controller('webhooks')
export class WebhooksController {
    private readonly logger = new Logger(WebhooksController.name);

    constructor(
        @InjectQueue(QUEUES.WEBHOOK) private readonly webhooksQueue: Queue,
        private readonly stripeService: StripeService,
        private readonly clerkService: ClerkService,
    ) { }

    @Version('1')
    @Post('stripe')
    @RateLimit('WEBHOOK')
    async handleStripeWebhook(@Req() req: RawBodyRequest<Request>, @Res() res: Response) {
        try {
            const signature = req.headers['stripe-signature'] as string;
            const rawBody = req.rawBody; // Pegamos o buffer direto do Nest (graças ao rawBody: true no main.ts)

            if (!rawBody) {
                this.logger.error('[Stripe] Webhook payload missing');
                return res.status(400).send('Webhook payload missing');
            }

            // Validação de assinatura usando o teu StripeService
            let event: any;
            try {
                event = this.stripeService.verifySignature(rawBody, signature);
            } catch (signatureError) {
                this.logger.error(`[Stripe] Signature verification failed: ${signatureError.message}`);
                return res.status(401).send('Unauthorized');
            }

            // Adicionar à fila Bull para processamento em background (Workers)
            await this.webhooksQueue.add('stripe-event', event, {
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
                removeOnComplete: true,
            });

            this.logger.log(`[Stripe] Event ${event.id} (${event.type}) enqueued for processing`);
            return res.status(200).send('ok');
        } catch (error) {
            this.logger.error(`[Stripe] Critical error: ${error.message}`);
            return res.status(500).send('Internal Error');
        }
    }

    @Version('1')
    @Post('clerk')
    @RateLimit('WEBHOOK')
    async handleClerkWebhook(
        @Headers('svix-signature') signature: string,
        @Headers('svix-id') svixId: string,
        @Headers('svix-timestamp') svixTimestamp: string,
        @Req() req: RawBodyRequest<Request>,
        @Res() res: Response,
    ) {
        try {
            const rawBody = req.rawBody;

            if (!rawBody) {
                return res.status(400).send('Payload missing');
            }

            // Validação de assinatura Clerk usando o teu ClerkService
            let verified: boolean;
            try {
                verified = this.clerkService.verifySignature(
                    rawBody,
                    signature,
                    svixId,
                    svixTimestamp
                );
            } catch (err) {
                this.logger.error(`[Clerk] Signature verification failed: ${err.message}`);
                return res.status(401).send('Unauthorized');
            }

            if (!verified) {
                this.logger.warn(`[Clerk] Invalid signature for event ID: ${svixId}`);
                return res.status(400).send('Invalid signature');
            }

            const body = JSON.parse(rawBody.toString('utf8'));
            body.eventId = svixId; // Injetamos o ID para o Worker conseguir usar como chave de idempotência

            await this.webhooksQueue.add('clerk-event', body, {
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                removeOnComplete: true,
            });

            this.logger.log(`[Clerk] Event ${body.id} (${body.type}) enqueued for processing`);
            return res.status(200).send('ok');
        } catch (err) {
            this.logger.error(`[Clerk] Critical error: ${err.message}`);
            return res.status(500).send('Error');
        }
    }
}

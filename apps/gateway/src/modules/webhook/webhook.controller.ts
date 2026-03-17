import {
    Controller,
    Logger,
    Headers,
    Param,
    Post,
    Body,
    Req,
    Res,
    Version,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ThrottleLenient } from '@weats/common/decorators/throttle.decorator';
import { WEBHOOK_SERVICE } from '@weats/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { WEBHOOK_PATTERNS } from '@weats/common/patterns/webhook.patterns';
import { ClerkService } from "@weats/integrations/clerk/clerk.service"
import { StripeService } from "@weats/integrations/stripe/stripe.service"

@Controller('webhooks')
@ThrottleLenient() // 200 requests por minuto para webhooks
export class WebhooksController {
    private readonly logger = new Logger(WebhooksController.name);

    constructor(
        @Inject(WEBHOOK_SERVICE) private readonly webhooksClient: ClientProxy,
        private readonly stripeService: StripeService,
        private readonly clerkService: ClerkService,
    ) { }

    @Version('1')
    @Post('stripe')
    async handleStripeWebhook(@Req() req: Request, @Res() res: Response) {
        try {
            const signature = req.headers['stripe-signature'] as string;
            const rawBody = req.body as Buffer;

            if (!Buffer.isBuffer(rawBody)) {
                this.logger.error(
                    `❌ ERRO: Corpo do webhook NÃO É um Buffer! Tipo: ${typeof rawBody}`,
                );
                return res.status(400).send('Webhook payload must be a Buffer');
            }

            // Signature verification pode falhar - capturar erro
            let event: any;
            try {
                event = this.stripeService.verifySignature(rawBody, signature);
            } catch (signatureError) {
                this.logger.error(`❌ Stripe signature verification failed: ${signatureError.message}`);
                return res.status(401).send('Unauthorized');
            }

            // Emit para microserviço (fire-and-forget via Redis)
            // Redis garante que a mensagem é entregue mesmo que haja delay
            this.webhooksClient.emit(WEBHOOK_PATTERNS.STRIPE_WEBHOOK, event);
            
            // Retornar OK imediatamente (Stripe recebe confirmação)
            // O processamento acontece assincronamente na fila
            res.status(200).send('Webhook recebido com sucesso');
        } catch (error) {
            this.logger.error(`❌ Erro no webhook Stripe: ${error.message}`);
            res.status(500).send(`Erro no webhook: ${error.message}`);
        }
    }

    @Version('1')
    @Post('clerk')
    async handleClerkWebhook(
        @Headers('svix-signature') signature: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        try {
            const svixId = req.headers['svix-id'] as string;
            const svixTimestamp = req.headers['svix-timestamp'] as string;
            const rawBody = req.body as Buffer;

            // Signature verification pode falhar - capturar erro
            let verified: boolean;
            try {
                verified = this.clerkService.verifySignature(
                    rawBody,
                    signature,
                    svixId,
                    svixTimestamp,
                );
            } catch (signatureError) {
                this.logger.error(`❌ Clerk signature verification failed: ${signatureError.message}`);
                return res.status(401).send('Unauthorized');
            }

            if (!verified) {
                this.logger.warn('⚠️ Assinatura inválida!');
                return res.status(400).send('Invalid signature');
            }

            const body = JSON.parse(rawBody.toString('utf8'));
            
            // Emit para microserviço (fire-and-forget via Redis)
            this.webhooksClient.emit(WEBHOOK_PATTERNS.CLERK_WEBHOOK, body);

            return res.send('ok');
        } catch (err) {
            this.logger.error(`❌ Erro ao processar webhook Clerk: ${err.message}`);
            return res.status(500).send('Erro interno');
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EuPago — Realtime Webhooks v2.0
    // Docs: https://eupago.readme.io/reference/realtime-webhooks-20
    //
    // Configure em: EuPago Backoffice → Canais → [canal] → Webhook
    //   Webhook Endpoint: <API_PUBLIC_URL>/v1/webhooks/eupago/:establishmentId
    //   Tipo de Webhook: Pagamento | Cancelamento | Expiração | Erro
    // ─────────────────────────────────────────────────────────────────────────

    /*
    @Version('1')
    @Post('eupago/:establishmentId')
    async handleEupagoWebhook(
        @Param('establishmentId') establishmentId: string,
        @Headers('x-signature') signature: string | undefined,
        @Headers('x-initialization-vector') iv: string | undefined,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const rawBody = req.body as Buffer;

        if (!Buffer.isBuffer(rawBody)) {
            Logger.error(
                `❌ EuPago webhook: corpo não é um Buffer (tipo: ${typeof rawBody})`,
            );
            return res.status(400).send('Webhook payload must be a Buffer');
        }

        try {
            await this.eupagoWebhookService.handleWebhook(establishmentId, rawBody, signature, iv);
            // EuPago expects HTTP 200 — any other status triggers a retry
            return res.status(200).send('ok');
        } catch (err) {
            Logger.error(`❌ Erro no webhook EuPago: ${err.message}`);
            // Return 200 anyway so EuPago does not keep retrying on validation errors.
            return res.status(200).send('ok');
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SumUp — Terminal Payment Webhooks
    // Docs: https://developer.sumup.com/terminal-payments/cloud-api
    //
    // Configure em: SumUp Developer → Applications → Webhooks
    //   Webhook URL: <API_PUBLIC_URL>/v1/webhooks/sumup
    //   Events: checkout.status.changed
    //
    // O endpoint é injectado automaticamente como return_url no momento da
    // criação do checkout (SumupIntegrationService.createCheckout).
    // ─────────────────────────────────────────────────────────────────────────

    @Version('1')
    @Post('sumup')
    async handleSumupWebhook(
        @Req() req: Request,
        @Body() body: unknown,
        @Res() res: Response,
    ) {
        this.logger.log(
            `[SumUp Webhook] Recebido:\n${JSON.stringify(body, null, 2)}`,
        );
        this.logger.log(
            `[SumUp Webhook] Headers: ${JSON.stringify(req.headers, null, 2)}`,
        );

        // SumUp espera HTTP 200 para confirmar a receção do evento.
        return res.status(200).json({ received: true });
    }
        */
}

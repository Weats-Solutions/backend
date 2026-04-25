import { Module } from "@nestjs/common";
import { MailProcessor } from "./mail.processor";
import { QueuesModule } from "@weats/bull";
import { MailService } from "./mail.service";
import { ConfigsModule } from "@weats/configs";
import { ZeptoConfigService } from "@weats/configs/zepto-config.service";
import { HttpModule } from "@nestjs/axios";
import { IntegrationsModule } from "@weats/integrations";
import { TemplateRenderService } from "./template-render.service";

@Module({
    imports: [QueuesModule, ConfigsModule, HttpModule, IntegrationsModule],
    controllers: [],
    providers: [
        MailProcessor,
        MailService,
        TemplateRenderService,
        {
            provide: 'ZEPTO_API_URL',
            useFactory: (zeptoConfig: ZeptoConfigService) => zeptoConfig.getZeptoApiUrl(),
            inject: [ZeptoConfigService],
        },
        {
            provide: 'ZEPTO_ZOHO_ENCZAPIKEY',
            useFactory: (zeptoConfig: ZeptoConfigService) => zeptoConfig.getZeptoENCZAPIKEY(),
            inject: [ZeptoConfigService],
        },
        {
            provide: 'ZEPTO_SENDER_EMAIL',
            useFactory: (zeptoConfig: ZeptoConfigService) => zeptoConfig.getSenderEmail(),
            inject: [ZeptoConfigService],
        },
    ],
})
export class MailModule { }
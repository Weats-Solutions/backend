import { Module } from "@nestjs/common";
import { MailProcessor } from "./mail.processor";
import { QueuesModule } from "@weats/bull";
import { MailService } from "./mail.service";
import { ConfigsModule } from "@weats/configs";
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
    ],
    exports: [MailService],
})
export class MailModule { }
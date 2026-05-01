import { Module } from '@nestjs/common';
import { QueuesModule } from '@weats/bull';
import { QrGeneratorModule } from '@weats/common/qr/qr-generator.module';
import { DatabaseModule } from '@weats/database';
import { MailModule } from '../mail/mail.module';
import { QrCodeProcessor } from './qr-code.processor';
import { EmailProducer } from '@weats/bull/producers/email.producer';
import { ConfigModule } from '@nestjs/config';
import { ConfigsModule } from '@weats/configs';
import { AppConfigService } from '@weats/configs/app-config.service';
import { IntegrationsModule } from '@weats/integrations';

@Module({
    imports: [
        ConfigModule,
        ConfigsModule,
        QueuesModule,
        QrGeneratorModule,
        MailModule,
        DatabaseModule,
        IntegrationsModule,
    ],
    providers: [
        QrCodeProcessor, 
        EmailProducer,
        {
            provide: 'CATALOG_URL',
            useFactory: (appConfig: AppConfigService) => appConfig.getCatalogUrl(),
            inject: [AppConfigService],
        },
    ],
})
export class QrCodeWorkerModule { }

import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ConfigsModule } from '@weats/configs';
import { IntegrationsModule } from '@weats/integrations';
import { DatabaseModule } from '@weats/database';
import { AppConfigService } from '@weats/configs/app-config.service';

@Module({
    imports: [ConfigsModule, IntegrationsModule, DatabaseModule],
    controllers: [UserController],
    providers: [
        {
            provide: 'APP_URL',
            useFactory: (appConfig: AppConfigService) => appConfig.getAppUrl(),
            inject: [AppConfigService],
        },
        UserService,
    ],
    exports: [UserService],
})
export class UserModule { }

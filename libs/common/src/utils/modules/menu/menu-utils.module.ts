
import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { MenuUtilsService } from "./menu-utils.service";
import { AppConfigService, ConfigsModule } from "@weats/configs";

@Module({
    imports: [
        ConfigsModule,
        HttpModule.register({
            timeout: 10000,
            maxRedirects: 5,
        }),
    ],
    providers: [MenuUtilsService, {
        provide: 'MENU_URL',
        useFactory: async (appConfig: AppConfigService) =>
            appConfig.getMenuUrl(),
        inject: [AppConfigService],
    },
        {
            provide: 'MENU_CACHE_TOKEN',
            useFactory: async (appConfig: AppConfigService) =>
                appConfig.getMenuCacheToken(),
            inject: [AppConfigService],
        },
    ],
    exports: [MenuUtilsService],
})
export class MenuUtilsModule { }

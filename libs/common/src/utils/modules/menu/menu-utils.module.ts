
import { Module } from "@nestjs/common";
import { MenuUtilsService } from "./menu-utils.service";
import { ConfigsModule } from "@weats/configs";
import { CacheModule } from "@weats/cache";

@Module({
    imports: [
        ConfigsModule,
        CacheModule,
    ],
    providers: [MenuUtilsService],
    exports: [MenuUtilsService],
})
export class MenuUtilsModule { }


import { Module } from "@nestjs/common";
import { MenuUtilsService } from "./menu-utils.service";
import { ConfigsModule } from "@weats/configs";

@Module({
    imports: [
        ConfigsModule,
    ],
    providers: [MenuUtilsService],
    exports: [MenuUtilsService],
})
export class MenuUtilsModule { }

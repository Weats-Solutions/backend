import { IsBoolean, IsNotEmpty } from "class-validator";

export class UpdateEstablishmentModuleSettingsDto {
    @IsBoolean()
    @IsNotEmpty()
    myPageModule: boolean;

    @IsBoolean()
    @IsNotEmpty()
    menusModule: boolean;

    @IsBoolean()
    @IsNotEmpty()
    callStaffModule: boolean;
}

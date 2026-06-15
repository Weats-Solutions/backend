import { CallStaffOption } from "@weats/database";
import { IsBoolean, IsNotEmpty, IsArray, IsEnum, IsOptional, IsString } from "class-validator";

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

    @IsArray()
    @IsEnum(CallStaffOption, { each: true })
    @IsOptional()
    callStaffOptions?: CallStaffOption[];

    @IsBoolean()
    @IsNotEmpty()
    reservationsModule: boolean;

    @IsString()
    @IsOptional()
    reservationsLink?: string;
}

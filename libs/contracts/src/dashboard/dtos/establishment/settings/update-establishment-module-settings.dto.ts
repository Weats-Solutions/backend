import { CallStaffOption, ReservationsPlataform } from "@weats/database";
import { IsBoolean, IsNotEmpty, IsArray, IsEnum, IsOptional, IsString, ValidateIf, IsUrl } from "class-validator";

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

    @ValidateIf(o => o.reservationsModule === true)
    @IsEnum(ReservationsPlataform)
    @IsNotEmpty({ message: 'Reservations platform is required when reservations module is active' })
    reservationsPlatform?: ReservationsPlataform;

    @ValidateIf(o => o.reservationsModule === true)
    @IsString()
    @IsNotEmpty({ message: 'Reservations link is required when reservations module is active' })
    @IsUrl({}, { message: 'Reservations link must be a valid URL' })
    reservationsLink?: string;
}

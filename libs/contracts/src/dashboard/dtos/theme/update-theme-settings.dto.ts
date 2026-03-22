import { IsObject, IsString } from "class-validator";

export class UpdateThemeSettingsDto {
    @IsString()
    name: string

    @IsObject()
    config: Record<string, any>
}
import { IsObject, IsString, IsOptional } from "class-validator";

export class UpdateThemeSettingsDto {
    @IsString()
    name: string

    @IsObject()
    config: Record<string, any>

    @IsOptional()
    @IsString()
    themeId?: string
}
import { IsObject, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class GeralConfigDto {
    @IsString()
    geralBackgroundColor: string

    @IsString()
    geralTitleColor: string

    @IsString()
    borderRadius: string

    @IsString()
    fontFamily: string
}

export class CardConfigDto {
    @IsString()
    backgroundColor: string

    @IsString()
    titleColor: string

    @IsString()
    descriptionColor: string

    @IsString()
    observationColor: string

    @IsString()
    iconColor: string

    @IsString()
    highlightedBackgroundColor: string

    @IsString()
    highlightedTitleColor: string

    @IsString()
    highlightedDescriptionColor: string

    @IsString()
    highlightedObservationColor: string

    @IsString()
    highlightedIconColor: string
}

export class ThemeConfigDto {
    @ValidateNested()
    @Type(() => GeralConfigDto)
    geral: GeralConfigDto

    @ValidateNested()
    @Type(() => CardConfigDto)
    card: CardConfigDto
}

export class CreateThemeDto {
    @IsString()
    name: string

    @ValidateNested()
    @Type(() => ThemeConfigDto)
    config: ThemeConfigDto
}
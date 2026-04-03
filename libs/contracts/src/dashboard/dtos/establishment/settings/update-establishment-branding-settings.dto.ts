import { IsIn, IsNotEmpty, IsString, IsOptional, IsUrl } from "class-validator";
import { Type } from "class-transformer";

class EstablishmentBrandingDto {
    @IsString()
    @IsOptional()
    logoImageId?: string;

    @IsString()
    @IsOptional()
    bannerImageId?: string;

    @IsString()
    @IsOptional()
    activeThemeId?: string;
}

class EstablishmentSocialMediaDto {
    @IsUrl()
    @IsOptional()
    instagramUrl?: string;

    @IsUrl()
    @IsOptional()
    tiktokUrl?: string;

    @IsUrl()
    @IsOptional()
    facebookUrl?: string;

    @IsUrl()
    @IsOptional()
    googleReviewUrl?: string;

    @IsUrl()
    @IsOptional()
    tripAdvisorUrl?: string;

    @IsUrl()
    @IsOptional()
    websiteUrl?: string;
}

export class UpdateEstablishmentBrandingSettingsDto {

    @IsString()
    @IsNotEmpty()
    @IsIn(['branding', 'socialMedia'])
    section: string;

    @Type(() => EstablishmentBrandingDto)
    @IsOptional()
    branding?: EstablishmentBrandingDto;

    @Type(() => EstablishmentSocialMediaDto)
    @IsOptional()
    socialMedia?: EstablishmentSocialMediaDto;
}

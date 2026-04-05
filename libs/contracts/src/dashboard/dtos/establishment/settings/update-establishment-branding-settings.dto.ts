import { IsIn, IsNotEmpty, IsString, IsOptional, IsUrl, ValidateIf, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class ImageObjectSchema {
    @IsString()
    id: string;

    @IsString()
    url: string;
}

export class EstablishmentBrandingDto {
    @Type(() => ImageObjectSchema)
    @ValidateNested()
    @IsOptional()
    logoImage?: ImageObjectSchema;


    @Type(() => ImageObjectSchema)
    @ValidateNested()
    @IsOptional()
    bannerImage?: ImageObjectSchema;
}

export class EstablishmentSocialMediaDto {
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
    @IsIn(['branding', 'socials'])
    section: string;

    @ValidateIf(o => o.section === 'branding')
    @Type(() => EstablishmentBrandingDto)
    @IsNotEmpty()
    branding: EstablishmentBrandingDto;

    @ValidateIf(o => o.section === 'socials')
    @Type(() => EstablishmentSocialMediaDto)
    @IsNotEmpty()
    socials: EstablishmentSocialMediaDto;
}

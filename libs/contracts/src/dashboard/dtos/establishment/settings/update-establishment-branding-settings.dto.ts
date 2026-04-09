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

export class EstablishmentMetadataDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    shortName?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @Type(() => ImageObjectSchema)
    @ValidateNested()
    @IsOptional()
    ogImage?: ImageObjectSchema;
}

export class EstablishmentFaviconDto {
    @Type(() => ImageObjectSchema)
    @ValidateNested()
    @IsOptional()
    favicon?: ImageObjectSchema;
}

export class UpdateEstablishmentBrandingSettingsDto {
    @IsString()
    @IsNotEmpty()
    @IsIn(['branding', 'socials', 'metadata', 'favicon'])
    section: string;

    @ValidateIf(o => o.section === 'branding')
    @Type(() => EstablishmentBrandingDto)
    @IsNotEmpty()
    branding: EstablishmentBrandingDto;

    @ValidateIf(o => o.section === 'socials')
    @Type(() => EstablishmentSocialMediaDto)
    @IsNotEmpty()
    socials: EstablishmentSocialMediaDto;

    @ValidateIf(o => o.section === 'metadata')
    @Type(() => EstablishmentMetadataDto)
    @IsNotEmpty()
    metadata: EstablishmentMetadataDto;

    @ValidateIf(o => o.section === 'favicon')
    @Type(() => EstablishmentFaviconDto)
    @IsNotEmpty()
    favicon: EstablishmentFaviconDto;
}

import {
    IsOptional,
    IsEnum,
    IsBoolean,
    IsInt,
    IsString,
    Min,
    Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ItemStatus, MarketingTag, SpiceLevel } from '@weats/database';

export enum ItemSortBy {
    NAME = 'name',
    PRICE = 'price',
    STATUS = 'status',
    CREATED_AT = 'createdAt',
    UPDATED_AT = 'updatedAt',
}

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc',
}

export class GetItemsQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(ItemStatus)
    status?: ItemStatus;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    isFeatured?: boolean;

    @IsOptional()
    @IsEnum(MarketingTag)
    marketingTag?: MarketingTag;

    @IsOptional()
    @IsEnum(SpiceLevel)
    spiceLevel?: SpiceLevel;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    hasVariants?: boolean;

    @IsOptional()
    @IsEnum(ItemSortBy)
    sortBy?: ItemSortBy = ItemSortBy.CREATED_AT;

    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: SortOrder = SortOrder.DESC;
}

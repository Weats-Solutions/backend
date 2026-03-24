import { Type } from 'class-transformer';
import {
    IsArray,
    IsEnum,
    IsNotEmpty,
    IsString,
    ValidateNested,
} from 'class-validator';
import { DayOfWeek } from '@weats/database';
import { MenuTranslationDto } from '../translations/menu-translation.dto';

export class CreateScheduleDto {
    @IsEnum(DayOfWeek)
    dayOfWeek: DayOfWeek;

    @IsString()
    @IsNotEmpty()
    openTime: string;

    @IsString()
    @IsNotEmpty()
    closeTime: string;
}

export class CreateMenuDto {
    @IsArray()
    @Type(() => MenuTranslationDto)
    @ValidateNested({ each: true })
    translations: MenuTranslationDto[];

    @IsArray()
    @Type(() => CreateScheduleDto)
    @ValidateNested({ each: true })
    menuSchedule: CreateScheduleDto[];
}

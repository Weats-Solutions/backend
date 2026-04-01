import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { DayOfWeek } from '@weats/database';
import {
    IsValidTime,
    NoOverlappingIntervals,
    AllDaysPresent,
    ScheduleDaysConsistent,
} from '@weats/common';

export class TimeIntervalDto {
    @IsString()
    @IsNotEmpty()
    @IsValidTime()
    startTime: string; // Format: "HH:mm"

    @IsString()
    @IsNotEmpty()
    @IsValidTime()
    endTime: string; // Format: "HH:mm"
}

export class ScheduleDayDto {
    @IsEnum(DayOfWeek)
    dayOfWeek: DayOfWeek;

    @IsBoolean()
    @IsOptional()
    isOpen?: boolean;

    @IsArray()
    @NoOverlappingIntervals()
    @Type(() => TimeIntervalDto)
    @ValidateNested({ each: true })
    intervals: TimeIntervalDto[];
}

export class CreateScheduleDto {
    @IsString()
    @IsNotEmpty()
    name: string; // e.g., "Almoço", "Jantar", "Café da manhã"

    @IsArray()
    @AllDaysPresent()
    @ScheduleDaysConsistent()
    @Type(() => ScheduleDayDto)
    @ValidateNested({ each: true })
    days: ScheduleDayDto[];
}

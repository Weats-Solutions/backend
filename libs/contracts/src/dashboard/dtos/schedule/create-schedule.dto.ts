import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEmpty,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { DayOfWeek, ScheduleType } from '@weats/database';
import {
    IsValidTime,
    NoOverlappingIntervals,
    AllDaysPresent,
    ScheduleDaysConsistent,
    SCHEDULE_VALIDATION_GROUPS,
} from '@weats/common';

export class TimeIntervalDto {
    @IsString()
    @IsNotEmpty()
    @IsValidTime({ always: true })
    startTime: string; // Format: "HH:mm"

    @IsString()
    @IsNotEmpty()
    @IsValidTime({ always: true })
    endTime: string; // Format: "HH:mm"
}

export class ScheduleDayDto {
    @IsEnum(DayOfWeek)
    dayOfWeek: DayOfWeek;

    @IsBoolean()
    @IsOptional()
    isOpen?: boolean;

    @IsArray({ always: true })
    @NoOverlappingIntervals({ always: true })
    @Type(() => TimeIntervalDto)
    @ValidateNested({ each: true, always: true })
    intervals: TimeIntervalDto[];
}

export class CreateScheduleDto {
    @IsString({ groups: [SCHEDULE_VALIDATION_GROUPS.MENU] })
    @IsNotEmpty({ groups: [SCHEDULE_VALIDATION_GROUPS.MENU] })
    @IsOptional({ groups: [SCHEDULE_VALIDATION_GROUPS.ESTABLISHMENT] })
    name?: string;

    @IsArray({ always: true })
    @AllDaysPresent({ always: true })
    @ScheduleDaysConsistent({ always: true })
    @Type(() => ScheduleDayDto)
    @ValidateNested({ each: true, always: true })
    days: ScheduleDayDto[];
}

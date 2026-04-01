import type { Schedule, ScheduleDay, TimeInterval } from '@weats/database';

/**
 * Represents a normalized day schedule for API responses
 */
export interface NormalizedDaySchedule {
    dayOfWeek: string; // e.g., "MONDAY"
    isOpen: boolean;
    intervals: Array<{
        id: string;
        startTime: string;
        endTime: string;
    }>;
}

/**
 * Represents a fully normalized schedule for API responses
 */
export interface NormalizedSchedule {
    id: string;
    days: NormalizedDaySchedule[];
}

/**
 * Normalizes a Schedule object from Prisma (with nested days and intervals)
 * into a clean, flat structure suitable for API responses.
 *
 * @param schedule - Schedule with days included via Prisma include
 * @returns Normalized schedule object
 * @throws Error if schedule is null or malformed
 */
export function normalizeSchedule(
    schedule: Schedule & {
        days?: (ScheduleDay & { intervals: TimeInterval[] })[];
    },
): NormalizedSchedule {
    if (!schedule || !schedule.days) {
        throw new Error('Schedule must include days with intervals');
    }

    return {
        id: schedule.id,
        days: schedule.days.map((day) => ({
            dayOfWeek: day.dayOfWeek,
            isOpen: day.isOpen,
            intervals: day.intervals.map((interval) => ({
                id: interval.id,
                startTime: interval.startTime,
                endTime: interval.endTime,
            })),
        })),
    };
}

/**
 * Normalizes an array of schedules
 * @param schedules - Array of schedules with days included
 * @returns Array of normalized schedules
 */
export function normalizeSchedules(
    schedules: Array<
        Schedule & {
            days?: (ScheduleDay & { intervals: TimeInterval[] })[];
        }
    >,
): NormalizedSchedule[] {
    return schedules.map(normalizeSchedule);
}

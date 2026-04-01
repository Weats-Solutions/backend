import {
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
    ValidationOptions,
    registerDecorator,
} from 'class-validator';
import { DayOfWeek } from '@weats/database';

// ============================================================================
// Types
// ============================================================================

export interface ITimeInterval {
    startTime: string;
    endTime: string;
}

export interface IScheduleDay {
    dayOfWeek: DayOfWeek;
    isOpen?: boolean;
    intervals: ITimeInterval[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Converts time string "HH:mm" to minutes since midnight.
 * Throws if format is invalid.
 */
function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

/**
 * Validates time string is in format "HH:mm" with valid hours/minutes.
 */
function isValidTimeFormat(time: string): boolean {
    // Force strict HH:mm format (two digits each)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(time);
}

// ============================================================================
// Validators
// ============================================================================

/**
 * Validates time format (HH:mm) and checks if hours/minutes are valid.
 * Enforces strict format: always 2 digits (09:00, not 9:00).
 */
@ValidatorConstraint({ name: 'isValidTime', async: false })
export class IsValidTimeConstraint implements ValidatorConstraintInterface {
    validate(time: string): boolean {
        if (typeof time !== 'string') return false;
        return isValidTimeFormat(time);
    }

    defaultMessage(args: ValidationArguments): string {
        return `${args.property} must be in strict format "HH:mm" (e.g., "14:30", not "14:3" or "2:30"). Got: "${args.value}"`;
    }
}

/**
 * Decorator to validate time format
 */
export function IsValidTime(validationOptions?: ValidationOptions) {
    return function (target: object, propertyName: string) {
        registerDecorator({
            target: target.constructor,
            propertyName,
            constraints: [],
            options: validationOptions,
            validator: IsValidTimeConstraint,
        });
    };
}

/**
 * Validates time intervals don't overlap and are consistent.
 * Also prevents midnight-spanning intervals (e.g., 22:00–02:00).
 * For a single day (when used on ScheduleDayDto).
 */
@ValidatorConstraint({ name: 'noOverlappingIntervals', async: false })
export class NoOverlappingIntervalsConstraint implements ValidatorConstraintInterface {
    validate(intervals: ITimeInterval[]): boolean {
        if (!Array.isArray(intervals) || intervals.length === 0) return true;

        // Validate and normalize: convert times to minutes once
        const normalized: { start: number; end: number }[] = [];

        for (const interval of intervals) {
            if (!isValidTimeFormat(interval.startTime) || !isValidTimeFormat(interval.endTime)) {
                return false;
            }

            const start = timeToMinutes(interval.startTime);
            const end = timeToMinutes(interval.endTime);

            // Block midnight-spanning intervals (e.g., 22:00–02:00) and start == end
            if (start >= end) {
                return false;
            }

            normalized.push({ start, end });
        }

        if (normalized.length <= 1) return true;

        // Sort intervals by start time
        normalized.sort((a, b) => a.start - b.start);

        // Check for overlaps
        for (let i = 0; i < normalized.length - 1; i++) {
            const current = normalized[i];
            const next = normalized[i + 1];

            // Overlapping if next interval starts before current ends
            if (next.start < current.end) {
                return false;
            }
        }

        return true;
    }

    defaultMessage(): string {
        return 'Intervals invalid: startTime must be < endTime (no midnight spans), and intervals cannot overlap. Example valid: [09:00–12:00, 12:00–15:00]. Example invalid: [22:00–02:00, 09:00–12:00, 11:00–13:00]';
    }
}

/**
 * Decorator to validate no overlapping intervals
 */
export function NoOverlappingIntervals(validationOptions?: ValidationOptions) {
    return function (target: object, propertyName: string) {
        registerDecorator({
            target: target.constructor,
            propertyName,
            constraints: [],
            options: validationOptions,
            validator: NoOverlappingIntervalsConstraint,
        });
    };
}

/**
 * Validates all 7 days are present and consistent
 */
@ValidatorConstraint({ name: 'allDaysPresent', async: false })
export class AllDaysPresentConstraint implements ValidatorConstraintInterface {
    private readonly allDays = Object.values(DayOfWeek);

    validate(days: IScheduleDay[]): boolean {
        if (!Array.isArray(days)) return false;

        // Check all 7 days are present
        const presentDays = new Set(days.map((d) => d.dayOfWeek));
        return presentDays.size === 7 && this.allDays.every((d) => presentDays.has(d));
    }

    defaultMessage(): string {
        return `Schedule must include all 7 days: ${Object.values(DayOfWeek).join(', ')}`;
    }
}

/**
 * Decorator to validate all days are present
 */
export function AllDaysPresent(validationOptions?: ValidationOptions) {
    return function (target: object, propertyName: string) {
        registerDecorator({
            target: target.constructor,
            propertyName,
            constraints: [],
            options: validationOptions,
            validator: AllDaysPresentConstraint,
        });
    };
}

/**
 * Validates consistency of schedule days:
 * - No duplicate days
 * - If isOpen=true, intervals.length > 0
 * - If isOpen=false, intervals.length === 0
 */
@ValidatorConstraint({ name: 'scheduleDaysConsistent', async: false })
export class ScheduleDaysConsistentConstraint implements ValidatorConstraintInterface {
    validate(days: IScheduleDay[]): boolean {
        if (!Array.isArray(days)) return false;

        const seenDays = new Set<DayOfWeek>();

        for (const day of days) {
            // Check for duplicate days
            if (seenDays.has(day.dayOfWeek)) {
                return false;
            }
            seenDays.add(day.dayOfWeek);

            // Check isOpen consistency with intervals
            const hasIntervals = Array.isArray(day.intervals) && day.intervals.length > 0;
            const isOpen = day.isOpen !== false; // Default to true if not specified

            // If open, must have intervals; if closed, must not have intervals
            if (isOpen && !hasIntervals) {
                return false;
            }
            if (!isOpen && hasIntervals) {
                return false;
            }
        }

        return true;
    }

    defaultMessage(): string {
        return 'Schedule days consistency error: no duplicate days, open days must have intervals, closed days must not have intervals';
    }
}

/**
 * Decorator to validate schedule days consistency
 */
export function ScheduleDaysConsistent(validationOptions?: ValidationOptions) {
    return function (target: object, propertyName: string) {
        registerDecorator({
            target: target.constructor,
            propertyName,
            constraints: [],
            options: validationOptions,
            validator: ScheduleDaysConsistentConstraint,
        });
    };
}

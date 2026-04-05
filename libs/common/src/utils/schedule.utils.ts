import type { Schedule, ScheduleDay, TimeInterval } from "@weats/database";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Monday=0, ..., Sunday=6 (aligned with custom week starting Monday)
const DAY_INDEX_MAP = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
] as const;

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Validates and converts time string (HH:mm) to minutes.
 * Throws if format is invalid.
 *
 * @param time - Time string in format "HH:mm"
 * @returns Minutes since midnight
 * @throws Error if time format is invalid
 */
function timeToMinutes(time: string): number {
    const [hoursStr, minutesStr] = time.split(":");

    if (!hoursStr || !minutesStr) {
        throw new Error(`Invalid time format: "${time}". Expected "HH:mm"`);
    }

    const hours = Number.parseInt(hoursStr, 10);
    const minutes = Number.parseInt(minutesStr, 10);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        throw new Error(`Invalid time format: "${time}". Expected "HH:mm"`);
    }

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new Error(`Invalid time values: "${time}". Hours must be 0-23, minutes must be 0-59`);
    }

    return hours * 60 + minutes;
}

/**
 * Pure utility — no NestJS dependencies, no DB, no side effects.
 * Checks whether the schedule is active at the current moment
 * in the given IANA timezone. Handles midnight-spanning ranges (e.g. 22:00–02:00).
 *
 * @param schedule - Schedule with days and intervals included via Prisma include
 * @param tz - IANA timezone string (e.g., "Europe/Lisbon")
 * @returns true if any schedule interval is active right now
 * @throws Error if time format is invalid
 */
export function isScheduleOpenNow(
    schedule: Schedule & { days?: (ScheduleDay & { intervals: TimeInterval[] })[] },
    tz: string,
): boolean {
    if (!schedule?.days || schedule.days.length === 0) return false;
    console.log(tz)
    const now = dayjs().tz(tz);
    const todayDayOfWeek = DAY_INDEX_MAP[(now.day() + 6) % 7];
    const currentMinutes = now.hour() * 60 + now.minute();

    // Iterate through schedule days without creating intermediate arrays
    for (const day of schedule.days) {
        // Skip if day is closed or has no intervals
        if (!day.isOpen || day.intervals.length === 0) continue;

        // Check if this is today
        if (day.dayOfWeek !== todayDayOfWeek) continue;

        // Check if current time falls within any interval for today
        for (const interval of day.intervals) {
            const open = timeToMinutes(interval.startTime);
            const close = timeToMinutes(interval.endTime);

            // Midnight-spanning: e.g. open=22:00 (1320), close=02:00 (120)
            const isActive =
                close < open
                    ? currentMinutes >= open || currentMinutes < close
                    : currentMinutes >= open && currentMinutes < close;

            if (isActive) return true;
        }
    }

    return false;
}

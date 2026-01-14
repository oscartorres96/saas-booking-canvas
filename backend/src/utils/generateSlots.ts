import { addMinutes, format, isBefore, startOfDay } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';

interface Interval {
    startTime: string; // "HH:mm"
    endTime: string;   // "HH:mm"
}

interface BusinessHour {
    day: string; // "monday", "tuesday", etc.
    isOpen: boolean;
    intervals?: Interval[];
    startTime?: string; // Legacy support
    endTime?: string;   // Legacy support
}

interface ExistingBooking {
    scheduledAt: Date;
    durationMinutes: number;
}

/**
 * Normalize time string to HH:mm format (24-hour)
 */
const normalizeTime = (timeStr: string): string => {
    const cleaned = timeStr.trim().replace(/\s+/g, ' ').toLowerCase();
    const isAM = cleaned.includes('a.m') || cleaned.includes('a. m');
    const isPM = cleaned.includes('p.m') || cleaned.includes('p. m');

    const timeMatch = cleaned.match(/(\d{1,2}):(\d{2})/);
    if (!timeMatch) return timeStr;

    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2];

    if (isAM || isPM) {
        if (isPM && hours !== 12) hours += 12;
        else if (isAM && hours === 12) hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

export const generateSlots = (
    date: Date,
    serviceDurationMinutes: number,
    businessHours: BusinessHour[],
    existingBookings: ExistingBooking[],
    maxCapacity: number = 1,
    timezone: string = 'America/Mexico_City'
): { time: string, isAvailable: boolean }[] => {
    // Generate day name in English to match stored names (e.g. "monday", "tuesday")
    const dayName = format(date, 'eeee').toLowerCase();

    const todaySchedule = businessHours.find((h) => h.day.toLowerCase() === dayName);

    if (!todaySchedule || !todaySchedule.isOpen) {
        return [];
    }

    let intervals: Interval[] = [];
    if (todaySchedule.intervals && todaySchedule.intervals.length > 0) {
        intervals = todaySchedule.intervals.map(interval => ({
            startTime: normalizeTime(interval.startTime),
            endTime: normalizeTime(interval.endTime)
        }));
    } else if (todaySchedule.startTime && todaySchedule.endTime) {
        intervals = [{
            startTime: normalizeTime(todaySchedule.startTime),
            endTime: normalizeTime(todaySchedule.endTime)
        }];
    } else {
        intervals = [{ startTime: '09:00', endTime: '18:00' }];
    }

    const slots: { time: string, isAvailable: boolean }[] = [];
    const dateString = format(date, 'yyyy-MM-dd');
    const now = new Date();

    intervals.forEach((interval) => {
        // Create dates as wall-clock time in the business timezone
        let current = fromZonedTime(`${dateString} ${interval.startTime}`, timezone);
        const end = fromZonedTime(`${dateString} ${interval.endTime}`, timezone);

        while (isBefore(current, end)) {
            // Get the display time in the business timezone
            const zonedDate = toZonedTime(current, timezone);
            const currentSlotTime = format(zonedDate, 'HH:mm');

            // Filter out slots in the past
            if (isBefore(current, now)) {
                slots.push({ time: currentSlotTime, isAvailable: false });
                current = addMinutes(current, serviceDurationMinutes);
                continue;
            }

            const slotEnd = addMinutes(current, serviceDurationMinutes);

            if (isBefore(slotEnd, end) || slotEnd.getTime() === end.getTime()) {
                const overlappingBookings = existingBookings.filter((booking) => {
                    const bookingStart = new Date(booking.scheduledAt);
                    const bookingEnd = addMinutes(bookingStart, booking.durationMinutes || serviceDurationMinutes);
                    return current < bookingEnd && slotEnd > bookingStart;
                });

                slots.push({
                    time: currentSlotTime,
                    isAvailable: overlappingBookings.length < maxCapacity
                });
            }
            current = addMinutes(current, serviceDurationMinutes);
        }
    });

    return slots;
};

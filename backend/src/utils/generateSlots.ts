import { addMinutes, format, isBefore, parse, startOfDay } from 'date-fns';
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
 * Handles formats like:
 * - "09:00" (already 24h)
 * - "09:00 a. m." or "09:00 a.m." (12h AM)
 * - "02:00 p. m." or "02:00 p.m." (12h PM)
 */
const normalizeTime = (timeStr: string): string => {
    // Remove extra spaces and dots
    const cleaned = timeStr.trim().replace(/\s+/g, ' ').toLowerCase();

    // Check if it contains AM/PM markers
    const isAM = cleaned.includes('a.m') || cleaned.includes('a. m');
    const isPM = cleaned.includes('p.m') || cleaned.includes('p. m');

    // Extract the time part (HH:mm)
    const timeMatch = cleaned.match(/(\d{1,2}):(\d{2})/);
    if (!timeMatch) {
        console.warn(`Invalid time format: ${timeStr}. Using original.`);
        return timeStr;
    }

    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2];

    // Convert to 24-hour format if needed
    if (isAM || isPM) {
        if (isPM && hours !== 12) {
            hours += 12;
        } else if (isAM && hours === 12) {
            hours = 0;
        }
    }

    // Ensure two-digit format
    const hoursStr = hours.toString().padStart(2, '0');

    return `${hoursStr}:${minutes}`;
};

export const generateSlots = (
    date: Date,
    serviceDurationMinutes: number,
    businessHours: BusinessHour[],
    existingBookings: ExistingBooking[],
    maxCapacity: number = 1
): { time: string, isAvailable: boolean }[] => {
    // Use Spanish locale to match stored day names (e.g., "Lunes", "Martes")
    const dayName = format(date, 'EEEE', { locale: es }).toLowerCase();
    console.log(`[generateSlots] Detecting day for date ${date}: "${dayName}"`);

    const todaySchedule = businessHours.find((h) => h.day.toLowerCase() === dayName);
    console.log(`[generateSlots] Found schedule:`, todaySchedule);

    if (!todaySchedule || !todaySchedule.isOpen) {
        console.log(`[generateSlots] Day not found or closed. todaySchedule:`, todaySchedule);
        return [];
    }

    // Normalize intervals and convert to 24-hour format
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
        // Default fallback if open but no times (shouldn't happen ideally)
        intervals = [{ startTime: '09:00', endTime: '18:00' }];
    }

    const slots: { time: string, isAvailable: boolean }[] = [];
    const dateString = format(date, 'yyyy-MM-dd');

    intervals.forEach((interval) => {
        let current = parse(`${dateString} ${interval.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
        const end = parse(`${dateString} ${interval.endTime}`, 'yyyy-MM-dd HH:mm', new Date());

        while (isBefore(current, end)) {
            const currentSlotTime = format(current, 'HH:mm');

            // Filter out slots in the past
            if (isBefore(current, new Date())) {
                slots.push({ time: currentSlotTime, isAvailable: false });
                current = addMinutes(current, serviceDurationMinutes);
                continue;
            }

            const slotEnd = addMinutes(current, serviceDurationMinutes);

            if (isBefore(slotEnd, end) || slotEnd.getTime() === end.getTime()) {
                // Check collision based on capacity
                const overlappingBookings = existingBookings.filter((booking) => {
                    const bookingStart = new Date(booking.scheduledAt);
                    const bookingEnd = addMinutes(bookingStart, booking.durationMinutes || serviceDurationMinutes);

                    // Overlap logic: (StartA < EndB) and (EndA > StartB)
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

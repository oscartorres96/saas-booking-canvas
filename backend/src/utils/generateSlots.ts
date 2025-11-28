import { addMinutes, format, isBefore, parse, startOfDay } from 'date-fns';

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

export const generateSlots = (
    date: Date,
    serviceDurationMinutes: number,
    businessHours: BusinessHour[],
    existingBookings: ExistingBooking[]
): string[] => {
    const dayName = format(date, 'EEEE').toLowerCase();
    const todaySchedule = businessHours.find((h) => h.day.toLowerCase() === dayName);

    if (!todaySchedule || !todaySchedule.isOpen) {
        return [];
    }

    // Normalize intervals
    let intervals: Interval[] = [];
    if (todaySchedule.intervals && todaySchedule.intervals.length > 0) {
        intervals = todaySchedule.intervals;
    } else if (todaySchedule.startTime && todaySchedule.endTime) {
        intervals = [{ startTime: todaySchedule.startTime, endTime: todaySchedule.endTime }];
    } else {
        // Default fallback if open but no times (shouldn't happen ideally)
        intervals = [{ startTime: '09:00', endTime: '18:00' }];
    }

    const slots: string[] = [];
    const dateString = format(date, 'yyyy-MM-dd');

    intervals.forEach((interval) => {
        let current = parse(`${dateString} ${interval.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
        const end = parse(`${dateString} ${interval.endTime}`, 'yyyy-MM-dd HH:mm', new Date());

        while (isBefore(current, end)) {
            const slotEnd = addMinutes(current, serviceDurationMinutes);

            if (isBefore(slotEnd, end) || slotEnd.getTime() === end.getTime()) {
                // Check collision
                const isBusy = existingBookings.some((booking) => {
                    const bookingStart = new Date(booking.scheduledAt);
                    // Default duration if not stored? Assume 30 min or passed in?
                    // The payload usually has duration. If not, we might assume collision logic.
                    // Ideally booking has duration. If not, let's assume it blocks the slot.
                    // But wait, existingBookings passed here should have duration.
                    const bookingEnd = addMinutes(bookingStart, booking.durationMinutes || serviceDurationMinutes); // Fallback

                    // Overlap logic: (StartA < EndB) and (EndA > StartB)
                    return current < bookingEnd && slotEnd > bookingStart;
                });

                if (!isBusy) {
                    slots.push(format(current, 'HH:mm'));
                }
            }
            current = addMinutes(current, serviceDurationMinutes);
        }
    });

    return slots;
};

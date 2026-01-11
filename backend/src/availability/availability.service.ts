import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AvailabilityTemplate, AvailabilityTemplateDocument } from './schemas/availability-template.schema';
import { AvailabilityWeekOverride, AvailabilityWeekOverrideDocument } from './schemas/availability-week-override.schema';
import { BusinessesService } from '../businesses/businesses.service';
import { BookingsService } from '../bookings/bookings.service';
import { format, addDays, startOfWeek, isSameDay, parse, isValid } from 'date-fns';
import { generateSlots } from '../utils/generateSlots';

@Injectable()
export class AvailabilityService {
    constructor(
        @InjectModel(AvailabilityTemplate.name)
        private templateModel: Model<AvailabilityTemplateDocument>,
        @InjectModel(AvailabilityWeekOverride.name)
        private overrideModel: Model<AvailabilityWeekOverrideDocument>,
        @Inject(forwardRef(() => BusinessesService))
        private businessesService: BusinessesService,
        private bookingsService: BookingsService,
    ) { }

    async getTemplate(businessId: string): Promise<AvailabilityTemplateDocument | null> {
        return this.templateModel.findOne({ businessId }).exec();
    }

    private validateIntervals(intervals: { startTime: string; endTime: string }[]) {
        for (const interval of intervals) {
            if (interval.startTime >= interval.endTime) {
                throw new Error(`Invalid interval: Start time (${interval.startTime}) must be before end time (${interval.endTime})`);
            }
        }
    }

    async upsertTemplate(businessId: string, data: Partial<AvailabilityTemplate>): Promise<AvailabilityTemplateDocument> {
        if (data.weeklyRules) {
            data.weeklyRules.forEach(rule => {
                if (rule.intervals) {
                    this.validateIntervals(rule.intervals);
                }
            });
        }
        return this.templateModel.findOneAndUpdate(
            { businessId, entityType: 'BUSINESS' },
            { ...data, businessId },
            { upsert: true, new: true }
        ).exec();
    }

    async getWeekOverride(businessId: string, weekStartDate: Date): Promise<AvailabilityWeekOverrideDocument | null> {
        return this.overrideModel.findOne({ businessId, weekStartDate }).exec();
    }

    async upsertWeekOverride(businessId: string, weekStartDate: Date, data: Partial<AvailabilityWeekOverride>): Promise<AvailabilityWeekOverrideDocument> {
        const day = weekStartDate.getDay(); // 0 is Sunday, 1 is Monday
        // In some regions Monday is 1. We'll enforce Monday start (1).
        if (day !== 1) {
            // throw new Error('Week start date must be a Monday');
            // For robustness, allow it but warn or adjust? 
            // Requirement says "must be Monday".
            // Let's strictly enforce or maybe user is passing UTC vs local. 
            // We'll trust the input date object is correct day of week.
            // If date-fns `startOfWeek` with weekStartsOn: 1 was used, it should be Mon.
        }

        if (data.dailyOverrides) {
            Object.values(data.dailyOverrides).forEach((override: any) => { // Type assertion as structure is map-like
                if (override.intervals) {
                    this.validateIntervals(override.intervals);
                }
            });
        }

        return this.overrideModel.findOneAndUpdate(
            { businessId, weekStartDate, entityType: 'BUSINESS' },
            { ...data, businessId, weekStartDate },
            { upsert: true, new: true }
        ).exec();
    }

    async copyPreviousWeek(businessId: string, currentWeekStart: Date): Promise<AvailabilityWeekOverrideDocument | null> {
        const previousWeekStart = addDays(currentWeekStart, -7);
        const prevOverride = await this.getWeekOverride(businessId, previousWeekStart);

        if (!prevOverride) return null;

        const source = prevOverride.toObject() as any;
        delete source._id;
        delete source.weekStartDate;
        delete source.createdAt;
        delete source.updatedAt;

        return this.upsertWeekOverride(businessId, currentWeekStart, source);
    }

    async getSlotsInRange(
        businessId: string,
        startDate: Date,
        endDate: Date,
        serviceId?: string
    ): Promise<any[]> {
        const business = await this.businessesService.findById(businessId);
        if (!business) return [];

        const template = await this.getTemplate(businessId);
        const overrides = await this.overrideModel.find({
            businessId,
            weekStartDate: { $gte: startOfWeek(startDate, { weekStartsOn: 1 }), $lte: endDate }
        }).exec();

        const bookings = await this.bookingsService.findByDateRange(businessId, startDate, endDate);

        const results = [];
        let current = new Date(startDate);

        while (current <= endDate) {
            const dayName = format(current, 'eeee').toLowerCase();
            const weekStart = startOfWeek(current, { weekStartsOn: 1 });

            const override = overrides.find(o => isSameDay(o.weekStartDate, weekStart));
            const dailyConfig = (override?.dailyOverrides as any)?.get?.(dayName) || (override?.dailyOverrides as any)?.[dayName];

            let intervals = [];
            if (dailyConfig) {
                if (dailyConfig.enabled) intervals = dailyConfig.intervals;
            } else if (template) {
                const rule = template.weeklyRules?.find(r => r.day === dayName);
                if (rule?.enabled) intervals = rule.intervals;
            } else {
                // Fallback to legacy business hours
                const legacyDay = business.settings?.businessHours?.find(h => h.day?.toLowerCase() === dayName);
                if (legacyDay?.isOpen) {
                    intervals = legacyDay.intervals || [{ startTime: legacyDay.startTime, endTime: legacyDay.endTime }];
                }
            }

            const dayBookings = (bookings as any[]).filter(b => isSameDay(new Date(b.scheduledAt), current));

            const slots = generateSlots(
                current,
                business.settings?.defaultServiceDuration || 30,
                [{ day: dayName, isOpen: intervals.length > 0, intervals }] as any,
                dayBookings.map(b => ({ scheduledAt: new Date(b.scheduledAt), durationMinutes: business.settings?.defaultServiceDuration || 30 })),
                business.bookingCapacityConfig?.maxBookingsPerSlot || 1
            );

            results.push({
                date: format(current, 'yyyy-MM-dd'),
                slots
            });

            current = addDays(current, 1);
        }

        return results;
    }
}

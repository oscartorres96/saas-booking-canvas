import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AvailabilityTemplate, AvailabilityTemplateDocument } from './schemas/availability-template.schema';
import { AvailabilityWeekOverride, AvailabilityWeekOverrideDocument } from './schemas/availability-week-override.schema';
import { ResourceMap, ResourceMapDocument } from '../resource-map/schemas/resource-map.schema';
import { BookingsService } from '../bookings/bookings.service';
import { BusinessesService } from '../businesses/businesses.service';
import { ServicesService } from '../services/services.service';
import { startOfDay, endOfDay, addDays, format, parse, isBefore, startOfWeek, isSameDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { generateSlots } from '../utils/generateSlots';
import { es, enUS } from 'date-fns/locale';

@Injectable()
export class AvailabilityService {
    constructor(
        @InjectModel(AvailabilityTemplate.name) private templateModel: Model<AvailabilityTemplateDocument>,
        @InjectModel(AvailabilityWeekOverride.name) private overrideModel: Model<AvailabilityWeekOverrideDocument>,
        @Inject(forwardRef(() => BookingsService)) private bookingsService: BookingsService,
        @Inject(forwardRef(() => BusinessesService)) private businessesService: BusinessesService,
        private readonly servicesService: ServicesService,
        @InjectModel(ResourceMap.name) private resourceMapModel: Model<ResourceMapDocument>,
    ) { }

    async getTemplate(businessId: string, entityType: string, entityId?: string) {
        const query: any = { businessId: new Types.ObjectId(businessId), entityType };
        if (entityId) query.entityId = entityId;
        return this.templateModel.findOne(query).exec();
    }

    async upsertTemplate(data: any) {
        const { businessId, entityType, entityId, ...rest } = data;
        const query: any = { businessId: new Types.ObjectId(businessId), entityType };
        if (entityId) query.entityId = entityId;

        return this.templateModel.findOneAndUpdate(
            query,
            { ...rest, businessId, entityType, entityId },
            { upsert: true, new: true }
        ).exec();
    }

    async getWeekOverride(businessId: string, entityType: string, entityId: string | undefined, weekStartDate: string) {
        const query: any = { businessId: new Types.ObjectId(businessId), entityType, weekStartDate };
        if (entityId) query.entityId = entityId;
        return this.overrideModel.findOne(query).exec();
    }

    async upsertWeekOverride(data: any) {
        const { businessId, entityType, entityId, weekStartDate, ...rest } = data;

        // Normalize weekStartDate to Monday
        const date = parse(weekStartDate, 'yyyy-MM-dd', new Date());
        const monday = startOfWeek(date, { weekStartsOn: 1 });
        const normalizedWeekStart = format(monday, 'yyyy-MM-dd');

        const query: any = { businessId: new Types.ObjectId(businessId), entityType, weekStartDate: normalizedWeekStart };
        if (entityId) query.entityId = entityId;

        return this.overrideModel.findOneAndUpdate(
            query,
            { ...rest, businessId, entityType, entityId, weekStartDate: normalizedWeekStart },
            { upsert: true, new: true }
        ).exec();
    }

    async copyWeek(payload: { businessId: string, entityType: string, entityId?: string, fromWeekStartDate: string, toWeekStartDate: string }) {
        const { businessId, entityType, entityId, fromWeekStartDate, toWeekStartDate } = payload;
        const source = await this.getWeekOverride(businessId, entityType, entityId, fromWeekStartDate);
        if (!source) throw new NotFoundException('Source week not found');

        const newData = source.toObject() as any;
        delete newData._id;
        delete newData.createdAt;
        delete newData.updatedAt;

        const toDate = parse(toWeekStartDate, 'yyyy-MM-dd', new Date());
        const monday = startOfWeek(toDate, { weekStartsOn: 1 });
        const normalizedToWeekStart = format(monday, 'yyyy-MM-dd');
        newData.weekStartDate = normalizedToWeekStart;
        newData.source = 'COPY_PREV';

        // Update dates in the 'days' array to match the new week
        newData.days = newData.days.map((day: any, index: number) => ({
            ...day,
            date: format(addDays(monday, index), 'yyyy-MM-dd')
        }));

        return this.upsertWeekOverride(newData);
    }

    async getSlotsInRange(businessId: string, startDate: string, endDate: string, serviceId: string, entityType: string = 'BUSINESS', entityId?: string) {
        const business = await this.businessesService.findOne(businessId, { role: 'public', userId: 'system' });
        const service = await this.servicesService.findOne(serviceId, { role: 'public', userId: 'system' });

        const start = parse(startDate, 'yyyy-MM-dd', new Date());
        const end = parse(endDate, 'yyyy-MM-dd', new Date());

        // 1. Load template
        const template = await this.getTemplate(businessId, entityType, entityId);

        // 2. Load overrides for weeks in range
        const weekStarts: string[] = [];
        let cur = startOfWeek(start, { weekStartsOn: 1 });
        while (isBefore(cur, end) || format(cur, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
            weekStarts.push(format(cur, 'yyyy-MM-dd'));
            cur = addDays(cur, 7);
        }

        const overrides = await this.overrideModel.find({
            businessId: new Types.ObjectId(businessId),
            entityType,
            entityId,
            weekStartDate: { $in: weekStarts }
        }).lean();

        const overrideMap = new Map(overrides.map(o => [o.weekStartDate, o]));

        // 3. Load Bookings (Widen range by 24h to handle timezone boundaries)
        const bookings = await this.bookingsService.findByDateRange(
            businessId,
            new Date(startOfDay(start).getTime() - 24 * 60 * 60000),
            new Date(endOfDay(end).getTime() + 24 * 60 * 60000)
        );
        const allServices = await this.servicesService.findAll({ role: 'public', userId: 'system' }, businessId);
        const serviceDurationMap = new Map(allServices.map(s => [s._id.toString(), s.durationMinutes]));

        // 4. Determine Capacity
        let activeResourceConfig = await this.resourceMapModel.findOne({
            businessId,
            serviceId
        }).lean();

        if (!activeResourceConfig) {
            if (business.resourceConfig?.enabled) {
                activeResourceConfig = business.resourceConfig as any;
            }
        }

        let maxCapacity = 1;
        if (activeResourceConfig?.enabled) {
            maxCapacity = activeResourceConfig.resources?.filter(r => r.isActive).length || 1;
        } else if (business.bookingCapacityConfig?.mode === 'MULTIPLE') {
            maxCapacity = business.bookingCapacityConfig.maxBookingsPerSlot || 1;
        }

        // 5. Compute slots for each day
        const result = [];
        let currentDay = start;
        while (isBefore(currentDay, end) || format(currentDay, 'yyyy-MM-dd') === endDate) {
            const dateStr = format(currentDay, 'yyyy-MM-dd');
            const dayOfWeek = (currentDay.getDay() + 6) % 7; // 0=Mon, 6=Sun
            const weekStartStr = format(startOfWeek(currentDay, { weekStartsOn: 1 }), 'yyyy-MM-dd');

            const weekOverride = overrideMap.get(weekStartStr);
            const dayOverride = weekOverride?.days.find(d => d.date === dateStr);
            const templateRule = template?.weeklyRules.find(r => r.dayOfWeek === dayOfWeek);
            let businessHoursForDay: any[];

            const bizTimezone = template?.timezone || business.settings?.timezone || 'America/Mexico_City';
            const dayNameEn = format(currentDay, 'eeee', { locale: enUS }).toLowerCase();
            const dayNameEs = format(currentDay, 'eeee', { locale: es }).toLowerCase();

            if (dayOverride) {
                businessHoursForDay = [{
                    day: dayNameEn,
                    isOpen: dayOverride.enabled,
                    intervals: dayOverride.blocks || []
                }];
            } else if (templateRule) {
                // If template exists and has a specific rule for this day
                businessHoursForDay = [{
                    day: dayNameEn,
                    isOpen: templateRule.enabled,
                    intervals: templateRule.blocks || []
                }];
            } else {
                // Fallback to legacy business settings if no override or template rule exists
                // We search in business.settings.businessHours for a matching day name
                const legacyHours = business.settings?.businessHours?.find(h => {
                    const d = h.day.toLowerCase();
                    return d === dayNameEn || d === dayNameEs;
                });

                if (legacyHours) {
                    businessHoursForDay = [legacyHours];
                } else if (template) {
                    // If template exists but no rule for this day, default to closed
                    businessHoursForDay = [{
                        day: dayNameEn,
                        isOpen: false,
                        intervals: []
                    }];
                } else {
                    // Total fallback
                    businessHoursForDay = business.settings?.businessHours || [];
                }
            }
            const slots = generateSlots(
                currentDay,
                service.durationMinutes,
                businessHoursForDay,
                bookings.map(b => ({
                    scheduledAt: b.scheduledAt,
                    durationMinutes: serviceDurationMap.get(b.serviceId?.toString()) || service.durationMinutes
                })),
                maxCapacity,
                bizTimezone
            );

            // Apply blockedRanges if they exist in override
            let finalSlots = slots;
            if (dayOverride?.blockedRanges && dayOverride.blockedRanges.length > 0) {
                finalSlots = slots.filter(slot => {
                    const slotTime = slot.time;
                    return !dayOverride.blockedRanges.some(range => {
                        return slotTime >= range.start && slotTime < range.end;
                    });
                });
            }

            result.push({ date: dateStr, slots: finalSlots });
            currentDay = addDays(currentDay, 1);
        }

        return result;
    }
}

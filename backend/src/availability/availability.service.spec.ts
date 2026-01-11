
import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityService } from './availability.service';
import { getModelToken } from '@nestjs/mongoose';
import { AvailabilityTemplate } from './schemas/availability-template.schema';
import { AvailabilityWeekOverride } from './schemas/availability-week-override.schema';
import { BusinessesService } from '../businesses/businesses.service';
import { BookingsService } from '../bookings/bookings.service';
import { startOfWeek, addDays, format } from 'date-fns';

describe('AvailabilityService', () => {
    let service: AvailabilityService;

    const mockTemplateModel = {
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn(),
    };

    const mockOverrideModel = {
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn(),
        find: jest.fn(),
    };

    const mockBusinessesService = {
        findById: jest.fn(),
    };

    const mockBookingsService = {
        findByDateRange: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AvailabilityService,
                {
                    provide: getModelToken(AvailabilityTemplate.name),
                    useValue: mockTemplateModel,
                },
                {
                    provide: getModelToken(AvailabilityWeekOverride.name),
                    useValue: mockOverrideModel,
                },
                {
                    provide: BusinessesService,
                    useValue: mockBusinessesService,
                },
                {
                    provide: BookingsService,
                    useValue: mockBookingsService,
                }
            ],
        }).compile();

        service = module.get<AvailabilityService>(AvailabilityService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('upsertTemplate', () => {
        it('should validate intervals', async () => {
            const invalidData: any = {
                weeklyRules: [
                    { day: 'monday', enabled: true, intervals: [{ startTime: '10:00', endTime: '09:00' }] }
                ]
            };

            await expect(service.upsertTemplate('biz1', invalidData)).rejects.toThrow('Invalid interval');
        });

        it('should accept valid intervals', async () => {
            const validData: any = {
                weeklyRules: [
                    { day: 'monday', enabled: true, intervals: [{ startTime: '09:00', endTime: '10:00' }] }
                ]
            };
            mockTemplateModel.findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });

            await expect(service.upsertTemplate('biz1', validData)).resolves.not.toThrow();
        });
    });

    describe('getSlotsInRange', () => {
        it('should return slots merged with bookings', async () => {
            const businessId = 'biz1';
            const startDate = new Date('2025-01-01'); // Wednesday
            const endDate = new Date('2025-01-01');

            // Mock Business
            mockBusinessesService.findById.mockResolvedValue({
                _id: businessId,
                settings: { defaultServiceDuration: 60 }
            });

            // Mock Template (Base schedule: 09:00 - 12:00)
            mockTemplateModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue({
                    weeklyRules: [
                        { day: 'wednesday', enabled: true, intervals: [{ startTime: '09:00', endTime: '12:00' }] }
                    ]
                })
            });

            // Mock Overrides (None)
            mockOverrideModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue([])
            });

            // Mock Bookings (One booking at 10:00)
            mockBookingsService.findByDateRange.mockResolvedValue([
                { scheduledAt: '2025-01-01T10:00:00.000Z', durationMinutes: 60 }
            ]);

            const result = await service.getSlotsInRange(businessId, startDate, endDate);

            expect(result).toHaveLength(1); // One day
            const daySlots = result[0].slots;

            // Should have 09:00 (Available), 10:00 (Unavailable), 11:00 (Available)
            // Note: generateSlots implementation specific details involved here.
            // Assuming generateSlots works:

            const slot10 = daySlots.find((s: any) => s.time === '10:00');
            const slot09 = daySlots.find((s: any) => s.time === '09:00');

            expect(slot09.isAvailable).toBe(true);
            expect(slot10.isAvailable).toBe(false);
        });
    });
});

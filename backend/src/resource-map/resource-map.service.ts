import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResourceHold, ResourceHoldDocument } from './schemas/resource-hold.schema';
import { Booking, BookingDocument, BookingStatus } from '../bookings/schemas/booking.schema';
import { Business, BusinessDocument } from '../businesses/schemas/business.schema';

@Injectable()
export class ResourceMapService {
    constructor(
        @InjectModel(ResourceHold.name) private resourceHoldModel: Model<ResourceHoldDocument>,
        @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
        @InjectModel(Business.name) private businessModel: Model<BusinessDocument>,
    ) { }

    async getAvailability(businessId: string, scheduledAt: Date, sessionId?: string) {
        const business = await this.businessModel.findById(businessId).lean();
        if (!business || !business.resourceConfig?.enabled) {
            return null;
        }

        // Define time window (e.g., 1 hour from scheduledAt, or service duration)
        // For simplicity, let's say resources are locked for the exact start time 
        // (Actual implementation should consider service duration)
        const start = new Date(scheduledAt);
        const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour window

        // Find confirmed bookings for this time
        const bookings = await this.bookingModel.find({
            businessId,
            scheduledAt: { $gte: start, $lt: end },
            status: { $ne: BookingStatus.Cancelled },
            resourceId: { $exists: true, $ne: null },
        }).lean();

        // Find active holds
        const holds = await this.resourceHoldModel.find({
            businessId,
            scheduledAt: { $gte: start, $lt: end },
            expiresAt: { $gt: new Date() },
        }).lean();

        const occupiedResourceIds = [
            ...bookings.map(b => b.resourceId),
            ...holds.filter(h => h.sessionId !== sessionId).map(h => h.resourceId),
        ];

        const userHoldResourceId = sessionId ? holds.find(h => h.sessionId === sessionId)?.resourceId : null;

        return {
            resourceConfig: business.resourceConfig,
            occupiedResourceIds,
            userHoldResourceId,
        };
    }

    async createHold(businessId: string, resourceId: string, scheduledAt: Date, sessionId?: string) {
        // Check if already occupied
        const availability = await this.getAvailability(businessId, scheduledAt, sessionId);
        if (availability && availability.occupiedResourceIds.includes(resourceId)) {
            throw new BadRequestException('Resource already occupied or held');
        }

        // If user already had another hold for the same time, delete it
        if (sessionId) {
            await this.resourceHoldModel.deleteMany({
                businessId,
                scheduledAt: { $gte: new Date(scheduledAt.getTime() - 1000), $lt: new Date(scheduledAt.getTime() + 1000) },
                sessionId,
            });
        }

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes hold

        const hold = new this.resourceHoldModel({
            businessId,
            resourceId,
            scheduledAt,
            expiresAt,
            sessionId,
        });

        return hold.save();
    }

    async updateConfig(businessId: string, config: any) {
        const business = await this.businessModel.findByIdAndUpdate(
            businessId,
            { $set: { resourceConfig: config } },
            { new: true }
        );
        if (!business) throw new NotFoundException('Business not found');
        return business.resourceConfig;
    }
}

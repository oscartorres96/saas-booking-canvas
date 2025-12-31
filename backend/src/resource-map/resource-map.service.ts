import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResourceHold, ResourceHoldDocument } from './schemas/resource-hold.schema';
import { Booking, BookingDocument, BookingStatus } from '../bookings/schemas/booking.schema';
import { Business, BusinessDocument } from '../businesses/schemas/business.schema';
import { ResourceMap, ResourceMapDocument } from './schemas/resource-map.schema';

@Injectable()
export class ResourceMapService {
    constructor(
        @InjectModel(ResourceHold.name) private resourceHoldModel: Model<ResourceHoldDocument>,
        @InjectModel(ResourceMap.name) private resourceMapModel: Model<ResourceMapDocument>,
        @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
        @InjectModel(Business.name) private businessModel: Model<BusinessDocument>,
    ) { }

    async getAvailability(businessId: string, serviceId: string, scheduledAt: Date, sessionId?: string) {
        // First look for a service-specific map
        let resourceConfig = await this.resourceMapModel.findOne({ businessId, serviceId }).lean();

        // Backward compatibility: If no service map, check business global config
        if (!resourceConfig) {
            const business = await this.businessModel.findById(businessId).lean();
            if (business?.resourceConfig?.enabled) {
                resourceConfig = business.resourceConfig as any;
            }
        }

        if (!resourceConfig || !resourceConfig.enabled) {
            return null;
        }

        const start = new Date(scheduledAt);
        const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour window

        // Find confirmed bookings for this time
        // Note: We currently filter by businessId and resourceId.
        // If resourceIds are unique per business, this works even if they are in different service maps.
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
        ].filter(Boolean) as string[];

        const userHoldResourceId = sessionId ? holds.find(h => h.sessionId === sessionId)?.resourceId : null;

        return {
            resourceConfig,
            occupiedResourceIds,
            userHoldResourceId,
        };
    }

    async createHold(businessId: string, serviceId: string, resourceId: string, scheduledAt: Date, sessionId?: string) {
        // Check if already occupied
        const availability = await this.getAvailability(businessId, serviceId, scheduledAt, sessionId);
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
        expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes hold

        const hold = new this.resourceHoldModel({
            businessId,
            resourceId,
            scheduledAt,
            expiresAt,
            sessionId,
        });

        return hold.save();
    }

    async deleteHold(businessId: string, resourceId: string, scheduledAt: Date, sessionId: string) {
        await this.resourceHoldModel.deleteMany({
            businessId,
            resourceId,
            scheduledAt: { $gte: new Date(scheduledAt.getTime() - 1000), $lt: new Date(scheduledAt.getTime() + 1000) },
            sessionId,
        });
    }

    async releaseAllUserHolds(businessId: string, sessionId: string) {
        await this.resourceHoldModel.deleteMany({
            businessId,
            sessionId,
        });
    }

    async updateConfig(businessId: string, serviceId: string, config: any) {
        try {
            // Sanitize config to avoid potential Mongoose/MongoDB errors with immutable or internal fields
            // Also strip UI-only fields like isGlobalFallback
            const { _id, __v, createdAt, updatedAt, businessId: bId, serviceId: sId, isGlobalFallback, ...sanitizedConfig } = config;

            const resourceMap = await this.resourceMapModel.findOneAndUpdate(
                { businessId, serviceId },
                { $set: { ...sanitizedConfig, businessId, serviceId } },
                { new: true, upsert: true, runValidators: true }
            );
            return resourceMap;
        } catch (error) {
            console.error(`Error updating resource map config for business ${businessId}, service ${serviceId}:`, error);
            throw error;
        }
    }

    async getConfig(businessId: string, serviceId: string) {
        try {
            let resourceConfig = await this.resourceMapModel.findOne({ businessId, serviceId }).lean();

            // Fallback for UI configuration
            if (!resourceConfig) {
                const business = await this.businessModel.findById(businessId).lean();
                if (business?.resourceConfig) {
                    return { ...business.resourceConfig, isGlobalFallback: true };
                }
            }

            return resourceConfig;
        } catch (error) {
            console.error(`Error getting resource map config for business ${businessId}, service ${serviceId}:`, error);
            throw error;
        }
    }
}

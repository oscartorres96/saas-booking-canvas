import { Controller, Get, Post, Body, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ResourceMapService } from './resource-map.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('resource-map')
export class ResourceMapController {
    constructor(private readonly resourceMapService: ResourceMapService) { }

    @Get(':businessId/availability')
    async getAvailability(
        @Param('businessId') businessId: string,
        @Query('serviceId') serviceId: string,
        @Query('scheduledAt') scheduledAt: string,
        @Query('sessionId') sessionId?: string,
    ) {
        return this.resourceMapService.getAvailability(businessId, serviceId, new Date(scheduledAt), sessionId);
    }

    @Get(':businessId/:serviceId/config')
    async getConfig(
        @Param('businessId') businessId: string,
        @Param('serviceId') serviceId: string,
    ) {
        return this.resourceMapService.getConfig(businessId, serviceId);
    }

    @Post('hold')
    async createHold(
        @Body() body: { businessId: string; serviceId: string; resourceId: string; scheduledAt: string; sessionId?: string },
    ) {
        return this.resourceMapService.createHold(
            body.businessId,
            body.serviceId,
            body.resourceId,
            new Date(body.scheduledAt),
            body.sessionId,
        );
    }

    @Post('release-holds')
    async releaseHolds(
        @Body() body: { businessId: string; sessionId: string },
    ) {
        return this.resourceMapService.releaseAllUserHolds(body.businessId, body.sessionId);
    }

    @UseGuards(JwtAuthGuard)
    @Put(':businessId/:serviceId/config')
    async updateConfig(
        @Param('businessId') businessId: string,
        @Param('serviceId') serviceId: string,
        @Body() config: any,
    ) {
        return this.resourceMapService.updateConfig(businessId, serviceId, config);
    }
}

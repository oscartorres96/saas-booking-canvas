import { Controller, Get, Post, Body, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ResourceMapService } from './resource-map.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('resource-map')
export class ResourceMapController {
    constructor(private readonly resourceMapService: ResourceMapService) { }

    @Get(':businessId/availability')
    async getAvailability(
        @Param('businessId') businessId: string,
        @Query('scheduledAt') scheduledAt: string,
        @Query('sessionId') sessionId?: string,
    ) {
        return this.resourceMapService.getAvailability(businessId, new Date(scheduledAt), sessionId);
    }

    @Post('hold')
    async createHold(
        @Body() body: { businessId: string; resourceId: string; scheduledAt: string; sessionId?: string },
    ) {
        return this.resourceMapService.createHold(
            body.businessId,
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
    @Put(':businessId/config')
    async updateConfig(
        @Param('businessId') businessId: string,
        @Body() config: any,
    ) {
        return this.resourceMapService.updateConfig(businessId, config);
    }
}

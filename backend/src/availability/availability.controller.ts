import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('availability')
export class AvailabilityController {
    constructor(private readonly availabilityService: AvailabilityService) { }

    @UseGuards(JwtAuthGuard)
    @Get('template/:businessId')
    async getTemplate(@Param('businessId') businessId: string) {
        return this.availabilityService.getTemplate(businessId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('template/:businessId')
    async upsertTemplate(@Param('businessId') businessId: string, @Body() data: any) {
        return this.availabilityService.upsertTemplate(businessId, data);
    }

    @UseGuards(JwtAuthGuard)
    @Get('override/:businessId')
    async getOverride(
        @Param('businessId') businessId: string,
        @Query('weekStart') weekStart: string
    ) {
        return this.availabilityService.getWeekOverride(businessId, new Date(weekStart));
    }

    @UseGuards(JwtAuthGuard)
    @Post('override/:businessId')
    async upsertOverride(
        @Param('businessId') businessId: string,
        @Body() body: { weekStart: string; data: any }
    ) {
        return this.availabilityService.upsertWeekOverride(businessId, new Date(body.weekStart), body.data);
    }

    @UseGuards(JwtAuthGuard)
    @Post('copy-previous/:businessId')
    async copyPrevious(
        @Param('businessId') businessId: string,
        @Body() body: { currentWeekStart: string }
    ) {
        return this.availabilityService.copyPreviousWeek(businessId, new Date(body.currentWeekStart));
    }

    @Get('slots/:businessId')
    async getSlots(
        @Param('businessId') businessId: string,
        @Query('start') start: string,
        @Query('end') end: string,
        @Query('serviceId') serviceId?: string
    ) {
        return this.availabilityService.getSlotsInRange(businessId, new Date(start), new Date(end), serviceId);
    }
}

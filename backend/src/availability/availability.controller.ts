import { Body, Controller, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AvailabilityService } from './availability.service';

@Controller('availability')
export class AvailabilityController {
    constructor(private readonly availabilityService: AvailabilityService) { }

    @UseGuards(JwtAuthGuard)
    @Get('template')
    getTemplate(
        @Query('businessId') businessId: string,
        @Query('entityType') entityType: string,
        @Query('entityId') entityId?: string,
    ) {
        return this.availabilityService.getTemplate(businessId, entityType, entityId);
    }

    @UseGuards(JwtAuthGuard)
    @Put('template')
    upsertTemplate(@Body() body: any) {
        return this.availabilityService.upsertTemplate(body);
    }

    @UseGuards(JwtAuthGuard)
    @Get('week')
    getWeekOverride(
        @Query('businessId') businessId: string,
        @Query('entityType') entityType: string,
        @Query('weekStartDate') weekStartDate: string,
        @Query('entityId') entityId?: string,
    ) {
        return this.availabilityService.getWeekOverride(businessId, entityType, entityId, weekStartDate);
    }

    @UseGuards(JwtAuthGuard)
    @Put('week')
    upsertWeekOverride(@Body() body: any) {
        return this.availabilityService.upsertWeekOverride(body);
    }

    @UseGuards(JwtAuthGuard)
    @Post('week/copy')
    copyWeek(@Body() body: any) {
        return this.availabilityService.copyWeek(body);
    }

    @Get('slots')
    getSlots(
        @Query('businessId') businessId: string,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('serviceId') serviceId: string,
        @Query('entityType') entityType?: string,
        @Query('entityId') entityId?: string,
    ) {
        return this.availabilityService.getSlotsInRange(businessId, startDate, endDate, serviceId, entityType, entityId);
    }
}

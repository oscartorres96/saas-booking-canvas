import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ReportsService } from './reports.service';
import { ReportFilterDto } from './dto/report-filter.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('overview')
    getOverview(@Req() req: any, @Query() filter: ReportFilterDto) {
        const businessId = filter.businessId || req.user.businessId;
        return this.reportsService.getOverview(businessId, filter);
    }

    @Get('revenue')
    getRevenue(@Req() req: any, @Query() filter: ReportFilterDto) {
        const businessId = filter.businessId || req.user.businessId;
        return this.reportsService.getRevenue(businessId, filter);
    }

    @Get('peak-hours')
    getPeakHours(@Req() req: any, @Query() filter: ReportFilterDto) {
        const businessId = filter.businessId || req.user.businessId;
        return this.reportsService.getPeakHours(businessId, filter);
    }

    @Get('services')
    getServices(@Req() req: any, @Query() filter: ReportFilterDto) {
        const businessId = filter.businessId || req.user.businessId;
        return this.reportsService.getServices(businessId, filter);
    }

    @Get('customers')
    getCustomers(@Req() req: any, @Query() filter: ReportFilterDto) {
        const businessId = filter.businessId || req.user.businessId;
        return this.reportsService.getCustomers(businessId, filter);
    }

    @Get('no-shows')
    getNoShows(@Req() req: any, @Query() filter: ReportFilterDto) {
        const businessId = filter.businessId || req.user.businessId;
        return this.reportsService.getNoShows(businessId, filter);
    }
}

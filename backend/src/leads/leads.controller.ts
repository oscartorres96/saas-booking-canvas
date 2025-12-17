import { Body, Controller, Get, Param, Post, UseGuards, Request } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { ApproveLeadDto } from './dto/approve-lead.dto';
import { RejectLeadDto } from './dto/reject-lead.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('leads')
export class LeadsController {
    constructor(private readonly leadsService: LeadsService) { }

    @Post('demo')
    create(@Body() createLeadDto: CreateLeadDto) {
        return this.leadsService.create(createLeadDto);
    }

    @Post('register')
    register(@Body() createLeadDto: CreateLeadDto) {
        return this.leadsService.createBusinessRegistration(createLeadDto);
    }

    // Admin endpoints
    @UseGuards(JwtAuthGuard, AdminGuard)
    @Get('pending')
    getPendingLeads() {
        return this.leadsService.getPendingLeads();
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Get()
    getAllLeads() {
        return this.leadsService.getAllLeads();
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Post(':id/approve')
    approveLead(
        @Param('id') id: string,
        @Body() approveDto: ApproveLeadDto,
        @Request() req: any
    ) {
        return this.leadsService.approveLead(id, approveDto, req.user.userId);
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Post(':id/reject')
    rejectLead(
        @Param('id') id: string,
        @Body() rejectDto: RejectLeadDto,
        @Request() req: any
    ) {
        return this.leadsService.rejectLead(id, rejectDto, req.user.userId);
    }
}

import { Body, Controller, Post } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';

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
}

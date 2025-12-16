import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateLeadDto } from './dto/create-lead.dto';
import { NotificationService } from '../services/notification.service';
import { Lead, LeadDocument } from './schemas/lead.schema';

@Injectable()
export class LeadsService {
    constructor(
        @InjectModel(Lead.name) private leadModel: Model<LeadDocument>,
        private readonly notificationService: NotificationService
    ) { }

    async create(createLeadDto: CreateLeadDto) {
        // Save to DB
        const createdLead = new this.leadModel({
            ...createLeadDto,
            type: 'demo',
            status: 'new'
        });
        await createdLead.save();

        // Send Notifications
        await this.notificationService.sendDemoRequestNotification(createLeadDto);
        return { success: true, message: 'Solicitud enviada correctamente' };
    }

    async createBusinessRegistration(createLeadDto: CreateLeadDto) {
        // Save to DB
        const createdLead = new this.leadModel({
            ...createLeadDto,
            type: 'registration',
            status: 'new'
        });
        await createdLead.save();

        // Send Notifications
        await this.notificationService.sendBusinessRegistrationNotification(createLeadDto);
        return { success: true, message: 'Solicitud de registro enviada correctamente' };
    }
}

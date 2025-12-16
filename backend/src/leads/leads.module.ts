import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { ServicesModule } from '../services/services.module';
import { Lead, LeadSchema } from './schemas/lead.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Lead.name, schema: LeadSchema }]),
        ServicesModule
    ],
    controllers: [LeadsController],
    providers: [LeadsService],
})
export class LeadsModule { }

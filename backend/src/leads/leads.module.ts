import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { ServicesModule } from '../services/services.module';
import { Lead, LeadSchema } from './schemas/lead.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Business, BusinessSchema } from '../businesses/schemas/business.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Lead.name, schema: LeadSchema },
            { name: User.name, schema: UserSchema },
            { name: Business.name, schema: BusinessSchema },
        ]),
        ServicesModule
    ],
    controllers: [LeadsController],
    providers: [LeadsService],
})
export class LeadsModule { }

import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { AvailabilityTemplate, AvailabilityTemplateSchema } from './schemas/availability-template.schema';
import { AvailabilityWeekOverride, AvailabilityWeekOverrideSchema } from './schemas/availability-week-override.schema';
import { ResourceMap, ResourceMapSchema } from '../resource-map/schemas/resource-map.schema';
import { BookingsModule } from '../bookings/bookings.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { ServicesModule } from '../services/services.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AvailabilityTemplate.name, schema: AvailabilityTemplateSchema },
            { name: AvailabilityWeekOverride.name, schema: AvailabilityWeekOverrideSchema },
            { name: ResourceMap.name, schema: ResourceMapSchema },
        ]),
        forwardRef(() => BookingsModule),
        forwardRef(() => BusinessesModule),
        forwardRef(() => ServicesModule),
    ],
    controllers: [AvailabilityController],
    providers: [AvailabilityService],
    exports: [AvailabilityService],
})
export class AvailabilityModule { }

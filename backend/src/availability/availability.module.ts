import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { AvailabilityTemplate, AvailabilityTemplateSchema } from './schemas/availability-template.schema';
import { AvailabilityWeekOverride, AvailabilityWeekOverrideSchema } from './schemas/availability-week-override.schema';
import { BusinessesModule } from '../businesses/businesses.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AvailabilityTemplate.name, schema: AvailabilityTemplateSchema },
            { name: AvailabilityWeekOverride.name, schema: AvailabilityWeekOverrideSchema },
        ]),
        forwardRef(() => BusinessesModule),
        BookingsModule,
    ],
    providers: [AvailabilityService],
    controllers: [AvailabilityController],
    exports: [AvailabilityService],
})
export class AvailabilityModule { }

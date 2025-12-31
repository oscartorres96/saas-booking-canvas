import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResourceMapService } from './resource-map.service';
import { ResourceMapController } from './resource-map.controller';
import { ResourceHold, ResourceHoldSchema } from './schemas/resource-hold.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { Business, BusinessSchema } from '../businesses/schemas/business.schema';

import { ResourceMap, ResourceMapSchema } from './schemas/resource-map.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ResourceHold.name, schema: ResourceHoldSchema },
            { name: ResourceMap.name, schema: ResourceMapSchema },
            { name: Booking.name, schema: BookingSchema },
            { name: Business.name, schema: BusinessSchema },
        ]),
    ],
    controllers: [ResourceMapController],
    providers: [ResourceMapService],
    exports: [ResourceMapService],
})
export class ResourceMapModule { }

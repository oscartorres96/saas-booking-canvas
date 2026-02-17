import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Booking.name, schema: BookingSchema },
        ]),
    ],
    controllers: [ReportsController],
    providers: [ReportsService],
    exports: [ReportsService],
})
export class ReportsModule { }

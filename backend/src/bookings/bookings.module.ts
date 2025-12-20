import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { Business, BusinessSchema } from '../businesses/schemas/business.schema';
import { ServicesModule } from '../services/services.module';
import { CustomerAssetsModule } from '../customer-assets/customer-assets.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: Business.name, schema: BusinessSchema },
    ]),
    forwardRef(() => ServicesModule),
    CustomerAssetsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, JwtAuthGuard],
  exports: [BookingsService],
})
export class BookingsModule { }

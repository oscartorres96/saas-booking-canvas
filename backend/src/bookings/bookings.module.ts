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
import { OtpService } from './otp/otp.service';
import { OtpController } from './otp/otp.controller';
import { OtpVerification, OtpVerificationSchema } from './schemas/otp-verification.schema';
import { ResourceHold, ResourceHoldSchema } from '../resource-map/schemas/resource-hold.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: Business.name, schema: BusinessSchema },
      { name: OtpVerification.name, schema: OtpVerificationSchema },
      { name: ResourceHold.name, schema: ResourceHoldSchema },
    ]),
    forwardRef(() => ServicesModule),
    CustomerAssetsModule,
  ],
  controllers: [BookingsController, OtpController],
  providers: [BookingsService, JwtAuthGuard, OtpService],
  exports: [BookingsService, OtpService],
})
export class BookingsModule { }

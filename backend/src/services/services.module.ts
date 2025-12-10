import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { Service, ServiceSchema } from './schemas/service.schema';
import { Business, BusinessSchema } from '../businesses/schemas/business.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { NotificationService } from './notification.service';
import { CronService } from './cron.service';
import { TestEmailController } from './test-email.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Service.name, schema: ServiceSchema },
      { name: Business.name, schema: BusinessSchema },
      { name: Booking.name, schema: BookingSchema },
    ])
  ],
  controllers: [ServicesController, TestEmailController],
  providers: [ServicesService, JwtAuthGuard, NotificationService, CronService],
  exports: [ServicesService, NotificationService, CronService],
})
export class ServicesModule { }

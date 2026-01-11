import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { Business, BusinessSchema } from './schemas/business.schema';
import { UsersModule } from '../users/users.module';
import { ServicesModule } from '../services/services.module';
import { BookingsModule } from '../bookings/bookings.module';
import { UploadsModule } from '../uploads/uploads.module';
import { AvailabilityModule } from '../availability/availability.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }]),
    UsersModule,
    forwardRef(() => ServicesModule),
    forwardRef(() => BookingsModule),
    forwardRef(() => AvailabilityModule),
    UploadsModule,
  ],
  controllers: [BusinessesController],
  providers: [BusinessesService],
  exports: [BusinessesService],
})
export class BusinessesModule { }

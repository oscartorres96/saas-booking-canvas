import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { Business, BusinessSchema } from './schemas/business.schema';
import { UsersModule } from '../users/users.module';
import { ServicesModule } from '../services/services.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }]),
    UsersModule,
    ServicesModule,
    BookingsModule,
  ],
  controllers: [BusinessesController],
  providers: [BusinessesService],
})
export class BusinessesModule { }

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import envConfig from './config/env.config';
import { MongoDbModule } from './database/mongodb.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BookingsModule } from './bookings/bookings.module';
import { ServicesModule } from './services/services.module';
import { BusinessesModule } from './businesses/businesses.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),
    MongoDbModule,
    AuthModule,
    UsersModule,
    BookingsModule,
    ServicesModule,
    BusinessesModule,
    UploadsModule,
  ],
})
export class AppModule { }

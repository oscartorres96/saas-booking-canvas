import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { JwtStrategy } from './jwt.strategy';
import { Subscription, SubscriptionSchema } from '../stripe/schemas/subscription.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Business, BusinessSchema } from '../businesses/schemas/business.schema';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwtSecret'),
        signOptions: {
          expiresIn: configService.get<string>('jwtExpiresIn') as any,
        },
      }),

    }),
    MongooseModule.forFeature([
      { name: Business.name, schema: BusinessSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AuthModule { }

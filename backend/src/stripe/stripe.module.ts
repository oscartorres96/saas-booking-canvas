import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { Subscription, SubscriptionSchema } from './schemas/subscription.schema';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { Business, BusinessSchema } from '../businesses/schemas/business.schema';
import { Lead, LeadSchema } from '../leads/schemas/lead.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { NotificationService } from '../services/notification.service';
import { PayoutService } from './payout.service';
import { CustomerAssetsModule } from '../customer-assets/customer-assets.module';
import { ProductsModule } from '../products/products.module';
import { BookingsModule } from '../bookings/bookings.module';
import { forwardRef } from '@nestjs/common';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Subscription.name, schema: SubscriptionSchema },
            { name: Payment.name, schema: PaymentSchema },
            { name: Business.name, schema: BusinessSchema },
            { name: Lead.name, schema: LeadSchema },
            { name: User.name, schema: UserSchema },
            { name: Booking.name, schema: BookingSchema },
        ]),
        CustomerAssetsModule,
        ProductsModule,
        forwardRef(() => BookingsModule),
    ],
    controllers: [StripeController],
    providers: [StripeService, NotificationService, PayoutService],
    exports: [StripeService, PayoutService],
})
export class StripeModule { }

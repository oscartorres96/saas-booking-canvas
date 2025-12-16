import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { Subscription, SubscriptionSchema } from './schemas/subscription.schema';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { Business, BusinessSchema } from '../businesses/schemas/business.schema';
import { Lead, LeadSchema } from '../leads/schemas/lead.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { NotificationService } from '../services/notification.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Subscription.name, schema: SubscriptionSchema },
            { name: Payment.name, schema: PaymentSchema },
            { name: Business.name, schema: BusinessSchema },
            { name: Lead.name, schema: LeadSchema },
            { name: User.name, schema: UserSchema },
        ]),
    ],
    controllers: [StripeController],
    providers: [StripeService, NotificationService],
    exports: [StripeService],
})
export class StripeModule { }

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { Business, BusinessDocument } from '../businesses/schemas/business.schema';

@Injectable()
export class PayoutService {
    private readonly logger = new Logger(PayoutService.name);

    constructor(
        @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
        @InjectModel(Business.name) private businessModel: Model<BusinessDocument>,
    ) { }

    /**
     * Get all payments pending payout, grouped by business
     * These are payments made via INTERMEDIATED model that BookPro needs to disperse.
     */
    async getPendingPayoutsGroupedByBusiness() {
        const pendingPayments = await this.paymentModel.find({
            status: 'PENDING_PAYOUT',
            paymentModel: 'INTERMEDIATED',
        }).sort({ createdAt: 1 }).lean();

        const businessIds = [...new Set(pendingPayments.map(p => p.businessId))];
        const businesses = await this.businessModel.find({ _id: { $in: businessIds } }).lean();

        const businessMap = businesses.reduce((acc, b) => {
            acc[String(b._id)] = b;
            return acc;
        }, {} as Record<string, any>);

        const grouped = pendingPayments.reduce((acc, payment) => {
            const bId = payment.businessId;
            if (!acc[bId]) {
                const business = businessMap[bId];
                acc[bId] = {
                    businessId: bId,
                    businessName: business?.businessName || business?.name || 'Unknown Business',
                    businessEmail: business?.email,
                    paymentConfig: business?.paymentConfig, // Contains bank info for manual transfer
                    totalAmount: 0,
                    count: 0,
                    payments: [],
                };
            }
            acc[bId].totalAmount += payment.amount;
            acc[bId].count += 1;
            acc[bId].payments.push({
                id: payment._id,
                amount: payment.amount,
                currency: payment.currency,
                bookingId: payment.bookingId,
                createdAt: payment.createdAt,
            });
            return acc;
        }, {} as Record<string, any>);

        return Object.values(grouped);
    }

    /**
     * Mark a set of payments as PAID_OUT after manual dispersion is completed.
     */
    async markPaymentsAsPaidOut(paymentIds: string[]) {
        this.logger.log(`Marking ${paymentIds.length} payments as PAID_OUT`);
        const result = await this.paymentModel.updateMany(
            { _id: { $in: paymentIds }, status: 'PENDING_PAYOUT' },
            { $set: { status: 'PAID_OUT' } }
        );
        return {
            modifiedCount: result.modifiedCount,
            success: true,
        };
    }
}

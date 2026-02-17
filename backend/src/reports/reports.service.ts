import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { ReportFilterDto } from './dto/report-filter.dto';

@Injectable()
export class ReportsService {
    constructor(
        @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    ) { }

    async getOverview(businessId: string, filter: ReportFilterDto) {
        const query = this.buildQuery(businessId, filter);

        const bookings = await this.bookingModel.find(query).sort({ scheduledAt: -1 }).lean();

        const totalBookings = bookings.length;
        const completedBookings = bookings.filter(b => b.status === 'confirmed').length;
        const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
        const revenue = bookings
            .filter(b => b.paymentStatus === 'paid')
            .reduce((acc, b: any) => acc + (Number(b.resourceMapSnapshot?.price) || 0), 0);

        const chartDataMap: Record<string, number> = {};
        bookings.forEach((b: any) => {
            const date = b.scheduledAt ? new Date(b.scheduledAt).toISOString().split('T')[0] : 'Unknown';
            chartDataMap[date] = (chartDataMap[date] || 0) + 1;
        });

        const chartData = Object.entries(chartDataMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => a.name.localeCompare(b.name))
            .slice(-15);

        return {
            kpis: {
                totalBookings,
                completedBookings,
                cancelledBookings,
                revenue,
            },
            chartData,
            details: bookings.slice(0, 10),
        };
    }

    async getRevenue(businessId: string, filter: ReportFilterDto) {
        const query = this.buildQuery(businessId, filter);
        const bookings = await this.bookingModel.find(query).lean();

        const paidBookings = bookings.filter(b => b.paymentStatus === 'paid');
        const totalRevenue = paidBookings.reduce((acc, b: any) => acc + (Number(b.resourceMapSnapshot?.price) || 0), 0);
        const averageTicket = paidBookings.length > 0 ? totalRevenue / paidBookings.length : 0;

        // Group by day for chart
        const revenueMap: Record<string, number> = {};
        paidBookings.forEach((b: any) => {
            const date = b.scheduledAt ? new Date(b.scheduledAt).toISOString().split('T')[0] : 'Unknown';
            revenueMap[date] = (revenueMap[date] || 0) + (Number(b.resourceMapSnapshot?.price) || 0);
        });

        const chartData = Object.entries(revenueMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => a.name.localeCompare(b.name))
            .slice(-30);

        return {
            kpis: {
                totalRevenue,
                averageTicket,
                growth: 0, // Would need previous period comparison logic
            },
            chartData,
            details: paidBookings.slice(0, 20),
        };
    }

    async getPeakHours(businessId: string, filter: ReportFilterDto) {
        const query = this.buildQuery(businessId, filter);
        const bookings = await this.bookingModel.find(query).lean();

        const hourMap: Record<number, number> = {};
        const dayMap: Record<number, number> = {};

        bookings.forEach((b: any) => {
            if (!b.scheduledAt) return;
            const date = new Date(b.scheduledAt);
            const hour = date.getHours();
            const day = date.getDay(); // 0-6

            hourMap[hour] = (hourMap[hour] || 0) + 1;
            dayMap[day] = (dayMap[day] || 0) + 1;
        });

        const sortedHours = Object.entries(hourMap).sort((a, b) => b[1] - a[1]);
        const sortedDays = Object.entries(dayMap).sort((a, b) => b[1] - a[1]);

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        const chartData = Array.from({ length: 24 }, (_, i) => ({
            name: `${i}:00`,
            value: hourMap[i] || 0
        }));

        return {
            kpis: {
                busiestDay: sortedDays[0] ? days[parseInt(sortedDays[0][0])] : 'N/A',
                busiestHour: sortedHours[0] ? `${sortedHours[0][0]}:00` : 'N/A',
            },
            chartData,
            details: sortedDays.map(([day, count]) => ({ name: days[parseInt(day)], value: count })),
        };
    }

    async getServices(businessId: string, filter: ReportFilterDto) {
        const query = this.buildQuery(businessId, filter);
        const bookings = await this.bookingModel.find(query).lean();

        const serviceStats: Record<string, { count: number, revenue: number, name: string }> = {};

        bookings.forEach((b: any) => {
            const sId = b.serviceId;
            if (!sId) return;

            if (!serviceStats[sId]) {
                serviceStats[sId] = { count: 0, revenue: 0, name: b.serviceName || 'Service' };
            }

            serviceStats[sId].count++;
            if (b.paymentStatus === 'paid') {
                serviceStats[sId].revenue += (Number(b.resourceMapSnapshot?.price) || 0);
            }
        });

        const sortedServices = Object.values(serviceStats).sort((a, b) => b.count - a.count);

        return {
            kpis: {
                mostPopular: sortedServices[0]?.name || 'N/A',
                leastPopular: sortedServices[sortedServices.length - 1]?.name || 'N/A',
            },
            chartData: sortedServices.map(s => ({ name: s.name, value: s.count })),
            details: sortedServices,
        };
    }

    async getCustomers(businessId: string, filter: ReportFilterDto) {
        const query = this.buildQuery(businessId, filter);
        const bookings = await this.bookingModel.find(query).lean();

        const customerMap: Record<string, { name: string, email: string, count: number, revenue: number }> = {};

        bookings.forEach((b: any) => {
            const email = b.clientEmail || 'no-email';
            if (!customerMap[email]) {
                customerMap[email] = { name: b.clientName, email: b.clientEmail, count: 0, revenue: 0 };
            }
            customerMap[email].count++;
            if (b.paymentStatus === 'paid') {
                customerMap[email].revenue += (Number(b.resourceMapSnapshot?.price) || 0);
            }
        });

        const sortedCustomers = Object.values(customerMap).sort((a, b) => b.count - a.count);
        const totalCustomers = sortedCustomers.length;
        const recurringCustomers = sortedCustomers.filter(c => c.count > 1).length;

        return {
            kpis: {
                totalCustomers,
                recurringCustomers,
                newCustomers: totalCustomers - recurringCustomers, // Rough estimation without signup date
            },
            chartData: sortedCustomers.slice(0, 10).map(c => ({ name: c.name, value: c.count })),
            details: sortedCustomers.slice(0, 20),
        };
    }

    async getNoShows(businessId: string, filter: ReportFilterDto) {
        const query = this.buildQuery(businessId, filter);
        const bookings = await this.bookingModel.find(query).lean();

        const totalBookings = bookings.length;
        const noShows = bookings.filter(b => b.status === 'no-show').length;
        const rate = totalBookings > 0 ? (noShows / totalBookings) * 100 : 0;

        // Group by day for chart
        const noShowMap: Record<string, number> = {};
        bookings.filter(b => b.status === 'no-show').forEach((b: any) => {
            const date = b.scheduledAt ? new Date(b.scheduledAt).toISOString().split('T')[0] : 'Unknown';
            noShowMap[date] = (noShowMap[date] || 0) + 1;
        });

        return {
            kpis: {
                totalNoShows: noShows,
                rate: `${rate.toFixed(1)}%`,
            },
            chartData: Object.entries(noShowMap).map(([name, value]) => ({ name, value })),
            details: bookings.filter(b => b.status === 'no-show').slice(0, 10),
        };
    }


    private buildQuery(businessId: string, filter: ReportFilterDto) {
        const query: any = { businessId };

        if (filter.from && filter.to) {
            query.scheduledAt = {
                $gte: new Date(filter.from),
                $lte: new Date(filter.to),
            };
        }

        if (filter.status) {
            query.status = filter.status;
        }

        if (filter.paymentMethod) {
            query.paymentMethod = filter.paymentMethod;
        }

        return query;
    }
}

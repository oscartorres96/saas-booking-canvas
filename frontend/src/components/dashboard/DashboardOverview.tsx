import React from "react";
import { format, isSameDay, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import {
    Calendar,
    Users,
    Clock,
    Package,
    AlertCircle,
    CheckCircle2,
    XCircle,
    ArrowRight,
    Search,
    User,
    DollarSign,
    TrendingUp
} from "lucide-react";
import {
    DashboardSection,
    SectionHeader,
    InnerCard,
    AdminLabel
} from "./DashboardBase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Booking } from "@/api/bookingsApi";
import { Service } from "@/api/servicesApi";
import { Product } from "@/api/productsApi";
import { CustomerAsset } from "@/api/customerAssetsApi";
import {
    startOfDay,
    endOfDay,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    subDays
} from "date-fns";

interface DashboardOverviewProps {
    business: any;
    bookings: Booking[];
    services: Service[];
    products: Product[];
    customerAssets: CustomerAsset[];
    payments?: any[];
    onViewBooking: (booking: Booking) => void;
    onViewCustomer?: (email: string) => void;
}

export const DashboardOverview = ({
    business,
    bookings,
    services,
    products,
    customerAssets,
    payments = [],
    onViewBooking,
    onViewCustomer
}: DashboardOverviewProps) => {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'en' ? enUS : es;

    const now = new Date();
    const [revenuePeriod, setRevenuePeriod] = React.useState<'today' | 'week' | 'month' | 'year'>('month');

    // --- KPIs ---
    const bookingsToday = bookings.filter(b => isSameDay(new Date(b.scheduledAt), now) && b.status !== 'cancelled');

    const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 });
    const endOfThisWeek = endOfWeek(now, { weekStartsOn: 1 });

    const bookingsThisWeek = bookings.filter(b =>
        isWithinInterval(new Date(b.scheduledAt), { start: startOfThisWeek, end: endOfThisWeek }) &&
        b.status !== 'cancelled'
    );

    const uniqueCustomersThisWeek = new Set(bookingsThisWeek.map(b => b.clientEmail)).size;

    const pendingConfirmations = bookings.filter(b => b.status === 'pending').length;

    const activePackages = customerAssets.filter(a => a.status === 'ACTIVE').length;

    // --- Revenue Calculation ---
    const getDetailedRevenue = (period: 'today' | 'week' | 'month' | 'year') => {
        let start: Date;
        let end: Date = endOfDay(now);

        switch (period) {
            case 'today':
                start = startOfDay(now);
                break;
            case 'week':
                start = startOfThisWeek;
                break;
            case 'month':
                start = startOfMonth(now);
                break;
            case 'year':
                start = startOfYear(now);
                break;
        }

        const interval = { start, end };

        let servicesStripe = 0;
        let packagesStripe = 0;
        let manual = 0;

        // Revenue from Stripe Payments (Packages, Direct Bookings)
        payments.forEach(p => {
            if (p.status !== 'PAID' && p.status !== 'PENDING_PAYOUT' && p.status !== 'PAID_OUT') return;

            const date = p.createdAt ? new Date(p.createdAt) : now;

            if (!isNaN(date.getTime()) && isWithinInterval(date, interval)) {
                const amount = Number(p.amount) / 100;
                if (p.bookingId) {
                    servicesStripe += amount;
                } else {
                    // If no bookingId, we assume it's a package purchase
                    packagesStripe += amount;
                }
            }
        });

        // Revenue from Manual Paid Bookings (Bank Transfer, Cash)
        bookings.forEach(b => {
            if (b.paymentStatus !== 'paid' || b.status === 'cancelled' || b.paymentMethod === 'stripe' || b.assetId) return;

            const createdAtDate = b.createdAt ? new Date(b.createdAt) : null;
            const scheduledAtDate = b.scheduledAt ? new Date(b.scheduledAt) : null;
            const date = (createdAtDate && !isNaN(createdAtDate.getTime())) ? createdAtDate : scheduledAtDate;

            if (date && !isNaN(date.getTime()) && isWithinInterval(date, interval)) {
                const service = services.find(s => s._id?.toString() === b.serviceId?.toString());
                manual += Number(service?.price || 0);
            }
        });

        return {
            total: servicesStripe + packagesStripe + manual,
            services: servicesStripe + manual,
            packages: packagesStripe,
            manual: manual,
            interval // Return interval to reuse it
        };
    };

    const { total, services: revServices, packages: revPackages, manual: revManual, interval: currentInterval } = getDetailedRevenue(revenuePeriod);
    const revenueData = { total, services: revServices, packages: revPackages, manual: revManual };

    // --- Insights (Period Aware) ---
    const serviceBookingCounts = bookings.reduce((acc: Record<string, number>, b) => {
        if (b.status === 'cancelled') return acc;

        // Filter by period
        const date = b.createdAt ? new Date(b.createdAt) : new Date(b.scheduledAt);
        if (!isWithinInterval(date, currentInterval)) return acc;

        const id = b.serviceId?.toString();
        if (id) {
            acc[id] = (acc[id] || 0) + 1;
        }
        return acc;
    }, {});

    const topServiceId = Object.entries(serviceBookingCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topService = services.find(s => s._id?.toString() === topServiceId);

    const assetPurchaseCounts = customerAssets.reduce((acc: Record<string, number>, a) => {
        // Filter by period
        const date = (a as any).createdAt ? new Date((a as any).createdAt) : now;
        if (!isWithinInterval(date, currentInterval)) return acc;

        const id = (typeof a.productId === 'string' ? a.productId : (a.productId as any)?._id)?.toString();
        if (id) {
            acc[id] = (acc[id] || 0) + 1;
        }
        return acc;
    }, {});

    const topProductId = Object.entries(assetPurchaseCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topProduct = products.find(p => p._id?.toString() === topProductId);

    // --- Activity Feed ---
    const activityFromBookings = bookings.map(b => ({
        ...b,
        activityType: 'booking' as const,
        activityDate: b.createdAt ? new Date(b.createdAt) : new Date(b.scheduledAt)
    }));

    const activityFromAssets = customerAssets.map(a => ({
        ...a,
        activityType: 'asset_purchase' as const,
        activityDate: (a as any).createdAt ? new Date((a as any).createdAt) : new Date()
    }));

    const recentActivity = [...activityFromBookings, ...activityFromAssets]
        .sort((a, b) => b.activityDate.getTime() - a.activityDate.getTime())
        .slice(0, 10);

    // Helper to get time for activity
    const getActivityTime = (activity: any) => {
        return format(activity.activityDate, "HH:mm", { locale });
    };

    const getActivityDate = (activity: any) => {
        return format(activity.activityDate, "d MMM", { locale });
    };

    // --- Requires Attention ---
    const requiresAttention = [
        ...bookings.filter(b => b.status === 'pending').map(b => ({ type: 'pending_booking', data: b })),
        ...bookings.filter(b => b.paymentStatus === 'pending_verification').map(b => ({ type: 'pending_payment', data: b })),
        ...customerAssets.filter(a => {
            if (!a.expiresAt) return false;
            const expiry = new Date(a.expiresAt);
            const daysToExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            return daysToExpiry > 0 && daysToExpiry < 7;
        }).map(a => ({ type: 'expiring_package', data: a }))
    ].sort((a, b) => {
        // Simple priority
        return 0;
    }).slice(0, 5);

    // --- Active/Relevant Customers ---
    const customerStats = bookings.reduce((acc: any, b) => {
        const email = b.clientEmail || 'no-email';
        if (!acc[email]) {
            acc[email] = {
                name: b.clientName,
                email: b.clientEmail,
                bookingCount: 0,
                lastBooking: b,
                status: 'active'
            };
        }
        acc[email].bookingCount++;
        if (new Date(b.scheduledAt) > new Date(acc[email].lastBooking.scheduledAt)) {
            acc[email].lastBooking = b;
        }
        return acc;
    }, {});

    const relevantCustomers = Object.values(customerStats)
        .sort((a: any, b: any) => b.bookingCount - a.bookingCount)
        .slice(0, 5);

    return (
        <div className="space-y-6 md:space-y-8">
            <div className="flex items-center justify-end">
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-full">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Live</span>
                </div>
            </div>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <InnerCard className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900 border-blue-100 dark:border-blue-900 p-3 md:p-6">
                    <AdminLabel icon={Calendar}>{t('dashboard.v2.kpis.bookings_today', 'Reservas de hoy')}</AdminLabel>
                    <div className="flex items-end justify-between">
                        <div className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">{bookingsToday.length}</div>
                        <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </InnerCard>

                <InnerCard className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-slate-900 border-purple-100 dark:border-purple-900 p-3 md:p-6">
                    <AdminLabel icon={Users}>{t('dashboard.v2.kpis.customers_week', 'Clientes únicos (semana)')}</AdminLabel>
                    <div className="flex items-end justify-between">
                        <div className="text-3xl font-bold tracking-tight text-purple-600 dark:text-purple-400">{uniqueCustomersThisWeek}</div>
                        <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                            <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </InnerCard>

                <InnerCard className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900 border-amber-100 dark:border-amber-900 p-3 md:p-6">
                    <AdminLabel icon={Clock}>{t('dashboard.v2.kpis.pending', 'Pendientes de confirmar')}</AdminLabel>
                    <div className="flex items-end justify-between">
                        <div className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">{pendingConfirmations}</div>
                        <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                </InnerCard>

                <InnerCard className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900 border-emerald-100 dark:border-emerald-900 p-3 md:p-6">
                    <AdminLabel icon={Package}>{t('dashboard.v2.kpis.packages', 'Paquetes activos')}</AdminLabel>
                    <div className="flex items-end justify-between">
                        <div className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{activePackages}</div>
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                            <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                </InnerCard>
            </div>

            {/* Revenue Widget */}
            <InnerCard className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800 p-4 md:p-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                    <TrendingUp className="h-32 w-32" />
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-primary/10 rounded-lg">
                                <DollarSign className="h-4 w-4 text-primary" />
                            </div>
                            <h3 className="font-bold text-lg">{t('dashboard.v2.revenue.title', 'Ingresos')}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{t('dashboard.v2.revenue.label', 'Ingreso obtenido')}</p>
                    </div>

                    <div className="flex bg-muted p-1 rounded-xl w-fit">
                        {(['today', 'week', 'month', 'year'] as const).map((period) => (
                            <button
                                key={period}
                                onClick={() => setRevenuePeriod(period)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                                    revenuePeriod === period
                                        ? "bg-white dark:bg-slate-800 shadow-sm text-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {t(`dashboard.v2.revenue.periods.${period}`)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                    <div className="space-y-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl md:text-5xl font-black tracking-tight">${revenueData.total.toLocaleString()}</span>
                            <span className="text-muted-foreground font-medium text-lg">MXN</span>
                        </div>

                        {/* Breakdown Progress Bars */}
                        <div className="space-y-3 pt-2">
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    <span>{t('dashboard.v2.revenue.services', 'Servicios')}</span>
                                    <span>${revenueData.services.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${revenueData.total > 0 ? (revenueData.services / revenueData.total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    <span>{t('dashboard.v2.revenue.packages', 'Paquetes')}</span>
                                    <span>${revenueData.packages.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${revenueData.total > 0 ? (revenueData.packages / revenueData.total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                            {revenueData.manual > 0 && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        <span>{t('dashboard.v2.revenue.manual', 'Manual (Caja)')}</span>
                                        <span>${revenueData.manual.toLocaleString()}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${revenueData.total > 0 ? (revenueData.manual / revenueData.total) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Insights Breakdown */}
                    <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/50">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                            <TrendingUp className="h-3 w-3" />
                            {t('dashboard.v2.insights.title', 'Insights Clave')}
                        </h4>
                        <div className="space-y-3">
                            {topService ? (
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <Calendar className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase">{t('dashboard.v2.insights.most_sold_service')}</p>
                                        <p className="text-sm font-bold truncate">{topService.name}</p>
                                    </div>
                                </div>
                            ) : null}

                            {topProduct ? (
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                        <Package className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase">{t('dashboard.v2.insights.most_sold_package')}</p>
                                        <p className="text-sm font-bold truncate">{topProduct.name}</p>
                                    </div>
                                </div>
                            ) : null}

                            {!topService && !topProduct && (
                                <p className="text-xs italic text-muted-foreground py-2 text-center">
                                    {t('dashboard.v2.insights.no_data', 'Aún no hay suficientes datos')}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </InnerCard>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Activity Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <DashboardSection>
                        <SectionHeader
                            title={t('dashboard.v2.activity.title', 'Actividad Reciente')}
                            description={t('dashboard.v2.activity.description', 'Lo que está pasando ahora mismo')}
                            icon={CheckCircle2}
                        />
                        <div className="p-4 md:p-6">
                            <div className="space-y-6">
                                {recentActivity.length > 0 ? (
                                    recentActivity.map((activity: any, idx) => {
                                        if (activity.activityType === 'booking') {
                                            const service = services.find(s => s._id === activity.serviceId);
                                            return (
                                                <div key={activity._id} className="flex gap-4 group cursor-pointer" onClick={() => onViewBooking(activity)}>
                                                    <div className="flex flex-col items-center">
                                                        <div className={cn(
                                                            "h-10 w-10 rounded-full flex items-center justify-center shrink-0 border-2",
                                                            activity.status === 'confirmed' ? "bg-green-50 border-green-100 text-green-600" :
                                                                activity.status === 'pending' ? "bg-amber-50 border-amber-100 text-amber-600" :
                                                                    activity.status === 'cancelled' ? "bg-red-50 border-red-100 text-red-600" :
                                                                        "bg-blue-50 border-blue-100 text-blue-600"
                                                        )}>
                                                            {activity.status === 'confirmed' ? <CheckCircle2 className="h-5 w-5" /> :
                                                                activity.status === 'cancelled' ? <XCircle className="h-5 w-5" /> :
                                                                    <Clock className="h-5 w-5" />}
                                                        </div>
                                                        {idx !== recentActivity.length - 1 && <div className="w-0.5 h-full bg-slate-100 dark:bg-slate-800 mt-1" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0 pb-6">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                                            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm md:text-base leading-tight">
                                                                {activity.clientName}
                                                                <span className="font-normal text-muted-foreground mx-1">
                                                                    {activity.status === 'confirmed' ? 'reservó' :
                                                                        activity.status === 'pending' ? 'solicitó una reserva para' :
                                                                            activity.status === 'cancelled' ? 'canceló' : 'reservó'}
                                                                </span>
                                                                <span className="font-medium text-primary block sm:inline">{service?.name || 'Servicio'}</span>
                                                                {activity.resourceId && (
                                                                    <span className="ml-1 text-[10px] font-black italic text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                                                        {business?.resourceConfig?.resources?.find((r: any) => r.id === activity.resourceId)?.label || activity.resourceId}
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <span className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">
                                                                {getActivityTime(activity)}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                            <Badge variant="outline" className="text-[9px] md:text-[10px] h-4 md:h-5 py-0">
                                                                {getActivityDate(activity)}
                                                            </Badge>
                                                            {activity.assetId && (
                                                                <Badge className="bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800 text-[9px] md:text-[10px] h-4 md:h-5 py-0">
                                                                    <Package className="h-2 w-2 mr-1" />
                                                                    {t('dashboard.v2.activity.used_package', 'Usó paquete')}
                                                                </Badge>
                                                            )}
                                                            {customerStats[activity.clientEmail || '']?.bookingCount > 1 && (
                                                                <Badge className="bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 text-[9px] md:text-[10px] h-4 md:h-5 py-0">
                                                                    <Users className="h-2 w-2 mr-1" />
                                                                    {t('dashboard.v2.activity.recurring', 'Recurrente')}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        } else {
                                            // Asset purchase activity
                                            const product = products.find(p => p._id === (typeof activity.productId === 'string' ? activity.productId : activity.productId?._id));
                                            return (
                                                <div key={activity._id} className="flex gap-4 group">
                                                    <div className="flex flex-col items-center">
                                                        <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 border-2 bg-purple-50 border-purple-100 text-purple-600 shadow-sm">
                                                            <Package className="h-5 w-5" />
                                                        </div>
                                                        {idx !== recentActivity.length - 1 && <div className="w-0.5 h-full bg-slate-100 dark:bg-slate-800 mt-1" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0 pb-6">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                                            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm md:text-base leading-tight">
                                                                {activity.clientEmail}
                                                                <span className="font-normal text-muted-foreground mx-1">
                                                                    adquirió el paquete
                                                                </span>
                                                                <span className="font-medium text-purple-600 block sm:inline">{product?.name || (activity.productId as any)?.name || 'Paquete'}</span>
                                                            </p>
                                                            <span className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">
                                                                {getActivityTime(activity)}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                            <Badge variant="outline" className="text-[9px] md:text-[10px] h-4 md:h-5 py-0">
                                                                {getActivityDate(activity)}
                                                            </Badge>
                                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 text-[9px] md:text-[10px] h-4 md:h-5 py-0">
                                                                <DollarSign className="h-2 w-2 mr-1" />
                                                                Venta
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    })
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground italic">
                                        {t('dashboard.v2.activity.empty', 'No hay actividad reciente')}
                                    </div>
                                )}
                            </div>
                            {recentActivity.length > 0 && (
                                <Button variant="ghost" className="w-full text-primary hover:text-primary/80 text-sm mt-4">
                                    {t('dashboard.v2.activity.view_all', 'Ver todo el historial')} <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            )}
                        </div>
                    </DashboardSection>
                </div>

                {/* Sidebar Column: Attention & Top Customers */}
                <div className="space-y-8">
                    {/* Requires Attention */}
                    <div className="bg-slate-900 dark:bg-slate-950 rounded-[2rem] p-4 md:p-6 shadow-2xl overflow-hidden relative">
                        {/* Decorative circle */}
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-3xl invisible md:visible" />

                        <div className="relative space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-xl">
                                    <AlertCircle className="h-5 w-5 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-white">{t('dashboard.v2.attention.title', 'Requiere atención')}</h3>
                            </div>

                            <div className="space-y-4">
                                {requiresAttention.length > 0 ? (
                                    requiresAttention.map((item, idx) => (
                                        <div key={idx} className="bg-white/5 hover:bg-white/10 transition-colors rounded-2xl p-4 cursor-pointer group" onClick={() => {
                                            if (item.type === 'pending_booking' || item.type === 'pending_payment') {
                                                onViewBooking(item.data as Booking);
                                            }
                                        }}>
                                            <div className="flex items-start gap-3">
                                                <div className={cn(
                                                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                                                    item.type === 'expiring_package' ? "bg-red-500/20 text-red-400" : "bg-primary/20 text-primary-foreground"
                                                )}>
                                                    <AlertCircle className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs md:text-sm font-semibold text-white break-words">
                                                        {item.type === 'pending_booking' ? `Reserva de ${(item.data as Booking).clientName}` :
                                                            item.type === 'pending_payment' ? `Verificar pago de ${(item.data as Booking).clientName}` :
                                                                `Paquete de ${(item.data as any).clientEmail} por vencer`}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        {item.type === 'pending_booking' ? 'Pendiente de confirmación' :
                                                            item.type === 'pending_payment' ? 'Transferencia por verificar' :
                                                                'Vence en menos de una semana'}
                                                    </p>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-slate-500 text-sm italic text-center py-4">Todo al día ✨</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Active/Top Customers */}
                    <DashboardSection className="!space-y-0">
                        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    {t('dashboard.v2.customers.title', 'Clientes Relevantes')}
                                </h3>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Search className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </div>
                        </div>
                        <div className="p-1 md:p-2">
                            {relevantCustomers.map((customer: any, idx) => (
                                <div
                                    key={customer.email}
                                    className="flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl transition-colors cursor-pointer group"
                                    onClick={() => onViewCustomer?.(customer.email)}
                                >
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {customer.name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs md:text-sm font-semibold truncate">{customer.name}</p>
                                        <p className="text-[10px] md:text-xs text-muted-foreground truncate">{customer.email}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{customer.bookingCount} reservas</p>
                                        <Badge variant="secondary" className="text-[9px] h-4 py-0 px-1 font-medium bg-slate-100 dark:bg-slate-800">
                                            {customer.lastBooking?.status === 'confirmed' ? 'Activo' : 'Pendiente'}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </DashboardSection>
                </div>
            </div>
        </div>
    );
};

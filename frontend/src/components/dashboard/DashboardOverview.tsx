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
    User
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
import { CustomerAsset } from "@/api/customerAssetsApi";

interface DashboardOverviewProps {
    business: any;
    bookings: Booking[];
    services: Service[];
    customerAssets: CustomerAsset[];
    onViewBooking: (booking: Booking) => void;
    onViewCustomer?: (email: string) => void;
}

export const DashboardOverview = ({
    business,
    bookings,
    services,
    customerAssets,
    onViewBooking,
    onViewCustomer
}: DashboardOverviewProps) => {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'en' ? enUS : es;

    const now = new Date();
    const today = new Date();

    // --- KPIs ---
    const bookingsToday = bookings.filter(b => isSameDay(new Date(b.scheduledAt), today) && b.status !== 'cancelled');

    const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 });
    const endOfThisWeek = endOfWeek(now, { weekStartsOn: 1 });

    const bookingsThisWeek = bookings.filter(b =>
        isWithinInterval(new Date(b.scheduledAt), { start: startOfThisWeek, end: endOfThisWeek }) &&
        b.status !== 'cancelled'
    );

    const uniqueCustomersThisWeek = new Set(bookingsThisWeek.map(b => b.clientEmail)).size;

    const pendingConfirmations = bookings.filter(b => b.status === 'pending').length;

    const activePackages = customerAssets.filter(a => a.status === 'ACTIVE').length;

    // --- Activity Feed ---
    const recentActivity = [...bookings]
        .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.scheduledAt).getTime();
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.scheduledAt).getTime();
            return dateB - dateA;
        })
        .slice(0, 10);

    // Helper to get time for activity
    const getActivityTime = (booking: Booking) => {
        const date = booking.createdAt ? new Date(booking.createdAt) : new Date(booking.scheduledAt);
        return format(date, "HH:mm", { locale });
    };

    const getActivityDate = (booking: Booking) => {
        const date = booking.createdAt ? new Date(booking.createdAt) : new Date(booking.scheduledAt);
        return format(date, "d MMM", { locale });
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
                                    recentActivity.map((activity, idx) => {
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

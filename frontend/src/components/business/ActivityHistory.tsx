import React, { useMemo, useState } from "react";
import {
    format,
    isWithinInterval,
    startOfDay,
    endOfDay,
    subDays,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay
} from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import {
    Search,
    Filter,
    Calendar,
    Package,
    CheckCircle2,
    XCircle,
    Clock,
    TrendingUp,
    Users,
    DollarSign,
    ChevronDown,
    ArrowUpRight,
    ArrowDownRight,
    LucideIcon
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";
import {
    DashboardSection,
    SectionHeader,
    InnerCard,
    AdminLabel
} from "../dashboard/DashboardBase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Booking } from "@/api/bookingsApi";
import { Service } from "@/api/servicesApi";
import { Product } from "@/api/productsApi";
import { CustomerAsset } from "@/api/customerAssetsApi";

interface ActivityHistoryProps {
    business: any;
    bookings: Booking[];
    services: Service[];
    products: Product[];
    customerAssets: CustomerAsset[];
    payments?: any[];
    onViewBooking: (booking: Booking) => void;
    initialSearchTerm?: string;
}

export const ActivityHistory = ({
    business,
    bookings,
    services,
    products,
    customerAssets,
    payments = [],
    onViewBooking,
    initialSearchTerm = ""
}: ActivityHistoryProps) => {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'en' ? enUS : es;
    const now = new Date();

    const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
    const [typeFilter, setTypeFilter] = useState("all");
    const [periodFilter, setPeriodFilter] = useState("30d");

    // --- Date Interval Calculation ---
    const interval = useMemo(() => {
        let start: Date;
        let end: Date = endOfDay(now);

        switch (periodFilter) {
            case "7d":
                start = startOfDay(subDays(now, 7));
                break;
            case "30d":
                start = startOfDay(subDays(now, 30));
                break;
            case "90d":
                start = startOfDay(subDays(now, 90));
                break;
            case "month":
                start = startOfMonth(now);
                end = endOfMonth(now);
                break;
            default:
                start = startOfDay(subDays(now, 30));
        }

        return { start, end };
    }, [periodFilter]);

    // --- Data Preparation ---
    const allActivities = useMemo(() => {
        const fromBookings = bookings.map(b => ({
            id: b._id,
            type: 'booking',
            status: b.status,
            clientName: b.clientName,
            clientEmail: b.clientEmail,
            title: b.clientName,
            subtitle: services.find(s => s._id === b.serviceId)?.name || 'Servicio',
            date: b.createdAt ? new Date(b.createdAt) : new Date(b.scheduledAt),
            amount: services.find(s => s._id === b.serviceId)?.price || 0,
            original: b
        }));

        const fromAssets = customerAssets.map(a => {
            const product = products.find(p => p._id === (typeof a.productId === 'string' ? a.productId : a.productId?._id));
            return {
                id: a._id,
                type: 'sale',
                status: 'completed',
                clientName: a.clientEmail, // Asset usually has email
                clientEmail: a.clientEmail,
                title: a.clientEmail,
                subtitle: `Adquirió ${product?.name || 'Paquete'}`,
                date: (a as any).createdAt ? new Date((a as any).createdAt) : new Date(),
                amount: product?.price || 0,
                original: a
            };
        });

        return [...fromBookings, ...fromAssets]
            .filter(act => isWithinInterval(act.date, interval))
            .sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [bookings, customerAssets, services, products, interval]);

    const filteredActivities = useMemo(() => {
        return allActivities.filter(act => {
            const matchesSearch =
                act.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                act.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                act.subtitle?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesType = typeFilter === "all" ||
                (typeFilter === "booking" && act.type === "booking") ||
                (typeFilter === "sale" && act.type === "sale") ||
                (typeFilter === "cancel" && act.status === "cancelled");

            return matchesSearch && matchesType;
        });
    }, [allActivities, searchTerm, typeFilter]);

    // --- Insights Data ---
    const chartData = useMemo(() => {
        const days = eachDayOfInterval(interval);
        return days.map(day => {
            const dayBookings = allActivities.filter(a => a.type === 'booking' && isSameDay(a.date, day));
            const daySales = allActivities.filter(a => a.type === 'sale' && isSameDay(a.date, day));
            return {
                name: format(day, "d MMM", { locale }),
                reservas: dayBookings.length,
                ventas: daySales.reduce((sum, s) => sum + s.amount, 0)
            };
        });
    }, [allActivities, interval, locale]);

    const topClients = useMemo(() => {
        const counts: Record<string, { email: string, name: string, count: number }> = {};
        allActivities.filter(a => a.type === 'booking').forEach(a => {
            if (!counts[a.clientEmail]) {
                counts[a.clientEmail] = { email: a.clientEmail, name: a.clientName || a.clientEmail, count: 0 };
            }
            counts[a.clientEmail].count++;
        });
        return Object.values(counts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);
    }, [allActivities]);

    const stats = useMemo(() => {
        const totalRevenue = allActivities.reduce((sum, a) => sum + (a.type === 'sale' ? a.amount : 0), 0);
        const totalBookings = allActivities.filter(a => a.type === 'booking' && a.status !== 'cancelled').length;
        const cancellations = allActivities.filter(a => a.status === 'cancelled').length;
        const newClients = new Set(allActivities.map(a => a.clientEmail)).size;

        return {
            totalRevenue,
            totalBookings,
            cancellations,
            newClients
        };
    }, [allActivities]);

    const getStatusIcon = (status: string, type: string) => {
        if (type === 'sale') return <Package className="h-4 w-4 text-emerald-500" />;
        if (status === 'cancelled') return <XCircle className="h-4 w-4 text-red-500" />;
        if (status === 'confirmed') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
        return <Clock className="h-4 w-4 text-amber-500" />;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Ingreso Total"
                    value={`$${stats.totalRevenue.toLocaleString()}`}
                    subtitle="En el periodo seleccionado"
                    icon={DollarSign}
                    trend={12}
                    color="emerald"
                />
                <StatCard
                    title="Reservas"
                    value={stats.totalBookings}
                    subtitle="Confirmadas/Presentadas"
                    icon={Calendar}
                    trend={5}
                    color="blue"
                />
                <StatCard
                    title="Clientes Atendidos"
                    value={stats.newClients}
                    subtitle="Usuarios únicos"
                    icon={Users}
                    trend={-2}
                    color="purple"
                />
                <StatCard
                    title="Cancelaciones"
                    value={stats.cancellations}
                    subtitle="Tasa: {((stats.cancellations / (stats.totalBookings + stats.cancellations || 1)) * 100).toFixed(1)}%"
                    icon={XCircle}
                    trend={-8}
                    color="red"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <InnerCard className="lg:col-span-2 p-6 h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <AdminLabel icon={TrendingUp}>Tendencia de Actividad</AdminLabel>
                        <Select value={periodFilter} onValueChange={setPeriodFilter}>
                            <SelectTrigger className="w-[140px] h-8 text-xs font-semibold rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7d">Últimos 7 días</SelectItem>
                                <SelectItem value="30d">Últimos 30 días</SelectItem>
                                <SelectItem value="90d">Últimos 90 días</SelectItem>
                                <SelectItem value="month">Este mes</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <ResponsiveContainer width="100%" height="85%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="name"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                interval={periodFilter === '90d' ? 6 : (periodFilter === '30d' ? 3 : 0)}
                            />
                            <YAxis fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="reservas"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorRes)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </InnerCard>

                <InnerCard className="p-6">
                    <AdminLabel icon={Users}>Retención e Insights</AdminLabel>
                    <div className="flex flex-col items-center justify-center space-y-4 pt-4">
                        <div className="relative h-32 w-32">
                            <svg className="h-full w-full" viewBox="0 0 36 36">
                                <path
                                    className="stroke-slate-100 dark:stroke-slate-800"
                                    strokeWidth="3"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                    className="stroke-primary"
                                    strokeWidth="3"
                                    strokeDasharray="75, 100"
                                    strokeLinecap="round"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black">75%</span>
                                <span className="text-[8px] uppercase font-bold text-muted-foreground">Recurrentes</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-center text-muted-foreground px-4">
                            3 de cada 4 clientes han reservado más de una vez.
                        </p>

                        <div className="w-full pt-4 space-y-3">
                            <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <TrendingUp className="h-3 w-3" />
                                Clientes Estrella
                            </h5>
                            <div className="space-y-2">
                                {topClients.map((client, i) => (
                                    <div key={client.email} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                                {i + 1}
                                            </div>
                                            <span className="text-xs font-bold truncate">{client.name}</span>
                                        </div>
                                        <Badge variant="secondary" className="text-[9px] font-black h-4 px-1.5 bg-white dark:bg-slate-800">
                                            {client.count}
                                        </Badge>
                                    </div>
                                ))}
                                {topClients.length === 0 && (
                                    <p className="text-[10px] italic text-muted-foreground text-center py-2">Sin datos suficientes</p>
                                )}
                            </div>
                        </div>
                    </div>
                </InnerCard>
            </div>

            {/* Main Log Section */}
            <DashboardSection>
                <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <SectionHeader
                                title="Historial Detallado"
                                description="Explora toda la actividad de tu negocio con filtros avanzados"
                                icon={Clock}
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar cliente o servicio..."
                                    className="pl-9 rounded-xl h-10 text-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-[140px] h-10 rounded-xl">
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todo</SelectItem>
                                    <SelectItem value="booking">Reservas</SelectItem>
                                    <SelectItem value="sale">Ventas</SelectItem>
                                    <SelectItem value="cancel">Cancelaciones</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        {filteredActivities.length > 0 ? (
                            filteredActivities.map((activity, idx) => (
                                <div
                                    key={activity.id}
                                    className={cn(
                                        "flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all cursor-pointer group rounded-2xl",
                                        idx !== filteredActivities.length - 1 && "border-b border-slate-50 dark:border-slate-800/50"
                                    )}
                                    onClick={() => activity.type === 'booking' && onViewBooking(activity.original as Booking)}
                                >
                                    <div className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border",
                                        activity.type === 'sale' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                                            activity.status === 'cancelled' ? "bg-red-50 border-red-100 text-red-600" : "bg-blue-50 border-blue-100 text-blue-600"
                                    )}>
                                        {getStatusIcon(activity.status, activity.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                                {activity.title}
                                            </p>
                                            <span className="text-xs font-medium text-slate-500">
                                                {format(activity.date, "p", { locale })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-sm text-muted-foreground truncate">{activity.subtitle}</p>
                                            <Badge variant="outline" className="text-[10px] py-0 h-4 bg-white/50">
                                                {format(activity.date, "dd MMM", { locale })}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                        <span className="font-black text-sm">
                                            {activity.amount > 0 ? `$${activity.amount}` : '--'}
                                        </span>
                                        <Badge
                                            className={cn(
                                                "text-[9px] uppercase font-bold",
                                                activity.status === 'confirmed' ? "bg-emerald-100 text-emerald-700" :
                                                    activity.status === 'cancelled' ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                                            )}
                                        >
                                            {activity.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center">
                                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 mb-4">
                                    <Clock className="h-8 w-8 text-slate-300" />
                                </div>
                                <p className="text-slate-500 font-medium font-italic">No se encontraron actividades para este periodo.</p>
                            </div>
                        )}
                    </div>
                </div>
            </DashboardSection>
        </div>
    );
};

// --- Sub-components ---

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle: string;
    icon: LucideIcon;
    trend: number;
    color: 'emerald' | 'blue' | 'purple' | 'red';
}

const StatCard = ({ title, value, subtitle, icon: Icon, trend, color }: StatCardProps) => {
    const colorClasses = {
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-900",
        blue: "text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-950/20 dark:border-blue-900",
        purple: "text-purple-600 bg-purple-50 border-purple-100 dark:text-purple-400 dark:bg-purple-950/20 dark:border-purple-900",
        red: "text-red-600 bg-red-50 border-red-100 dark:text-red-400 dark:bg-red-950/20 dark:border-red-900"
    };

    return (
        <InnerCard className="p-5 flex flex-col justify-between group hover:shadow-xl transition-all duration-300 border-transparent hover:border-slate-200 dark:hover:border-slate-800">
            <div className="flex items-start justify-between mb-4">
                <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", colorClasses[color])}>
                    <Icon className="h-5 w-5" />
                </div>
                {trend !== 0 && (
                    <div className={cn(
                        "flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full",
                        trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    )}>
                        {trend > 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{title}</p>
                <h4 className="text-2xl font-black tracking-tight">{value}</h4>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">{subtitle}</p>
            </div>
        </InnerCard>
    );
};

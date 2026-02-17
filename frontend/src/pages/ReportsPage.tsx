import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    BarChart3,
    TrendingUp,
    Clock,
    Package,
    Users,
    Target,
    Filter,
    Download,
    Calendar as CalendarIcon,
    X,
    DollarSign
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import useAuth from "@/auth/useAuth";
import { reportsApi, ReportFilter, ReportData } from '@/api/reportsApi';
import { getBusinessById, type Business } from "@/api/businessesApi";
import { toast } from 'sonner';
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { BusinessThemeToggle } from "@/components/BusinessThemeToggle";

import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

const ReportsPage = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const locale = i18n.language === 'en' ? enUS : es;

    const [business, setBusiness] = useState<Business | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [isBookingsDialogOpen, setIsBookingsDialogOpen] = useState(false);
    const [filters, setFilters] = useState<ReportFilter>({
        from: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
        to: format(new Date(), 'yyyy-MM-dd'),
    });

    const businessId = user?.businessId;

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (businessId) {
            loadBusiness();
        }
    }, [user, businessId, navigate]);

    useEffect(() => {
        if (businessId) {
            setReportData(null); // Clear old data to prevent cross-tab rendering crashes
            fetchReport();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, filters, businessId]);

    const loadBusiness = async () => {
        try {
            if (!businessId) return;
            const data = await getBusinessById(businessId);
            setBusiness(data);
        } catch (error) {
            console.error("Error loading business:", error);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            let data: ReportData;
            const params = { ...filters, businessId };

            switch (activeTab) {
                case 'overview': data = await reportsApi.getOverview(params); break;
                case 'revenue': data = await reportsApi.getRevenue(params); break;
                case 'peak-hours': data = await reportsApi.getPeakHours(params); break;
                case 'services': data = await reportsApi.getServices(params); break;
                case 'customers': data = await reportsApi.getCustomers(params as any); break;
                case 'no-shows': data = await reportsApi.getNoShows(params); break;
                default: data = await reportsApi.getOverview(params);
            }
            setReportData(data);
        } catch (error) {
            toast.error(t('common.load_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!reportData?.details || reportData.details.length === 0) {
            toast.error(t('common.no_data_to_export') || "No data to export");
            return;
        }

        try {
            const data = reportData.details;
            const headers = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object' || data[0][k] === null);

            // Special handling for resourceMapSnapshot to include price in bookings export
            const includesPrice = data[0].resourceMapSnapshot !== undefined;
            if (includesPrice) headers.push('price');

            const csvRows = [];
            // Add Header
            csvRows.push(headers.join(','));

            // Add Data
            for (const row of data) {
                const values = headers.map(header => {
                    if (header === 'price') return row.resourceMapSnapshot?.price || 0;
                    const val = row[header];
                    const escaped = ('' + val).replace(/"/g, '""');
                    return `"${escaped}"`;
                });
                csvRows.push(values.join(','));
            }

            const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `report_${activeTab}_${format(new Date(), 'yyyyMMdd')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(t('reports.actions.export_success') || "Report exported successfully");
        } catch (error) {
            console.error("Export error:", error);
            toast.error(t('reports.actions.export_error') || "Error exporting report");
        }
    };

    const FilterContent = ({ isMobile = false }) => (
        <div className={cn("flex flex-wrap items-center gap-4", isMobile && "flex-col items-stretch")}>
            <div className={cn("flex-1 min-w-[200px]", isMobile && "w-full")}>
                <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black uppercase text-slate-400">
                        {t('reports.filters.date_range')}
                    </label>
                    <Select defaultValue="last_30_days">
                        <SelectTrigger className="w-full bg-white dark:bg-slate-800 rounded-xl">
                            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                            <SelectValue placeholder={t('reports.filters.date_range')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">{t('reports.filters.presets.today')}</SelectItem>
                            <SelectItem value="last_7_days">{t('reports.filters.presets.last_7_days')}</SelectItem>
                            <SelectItem value="last_30_days">{t('reports.filters.presets.last_30_days')}</SelectItem>
                            <SelectItem value="month_to_date">{t('reports.filters.presets.month_to_date')}</SelectItem>
                            <SelectItem value="custom">{t('reports.filters.presets.custom')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className={cn("flex items-end gap-3", isMobile && "flex-col items-stretch")}>
                <div className="space-y-1.5 flex-1 text-left">
                    <label className="text-[10px] font-black uppercase text-slate-400">
                        {t('reports.filters.status')}
                    </label>
                    <Select>
                        <SelectTrigger className={cn("w-[220px] bg-white dark:bg-slate-800 rounded-xl", isMobile && "w-full")}>
                            <SelectValue placeholder={t('reports.filters.status')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" className="rounded-xl" onClick={() => setFilters({})}>
                        {t('reports.filters.reset')}
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex-1">
                        {t('reports.filters.apply')}
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-black p-4 md:p-10 pb-24">
            <div className="max-w-7xl mx-auto space-y-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-white">
                            <BarChart3 className="h-7 w-7" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                                {t('reports.title')}
                            </h1>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                                {t('reports.subtitle')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 w-fit">
                        <LanguageSwitcher />
                        <BusinessThemeToggle />
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
                        <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-red-500" onClick={() => navigate(-1)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Global Filters Bar (Desktop) */}
                <div className="hidden md:block sticky top-8 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-3 pl-8 shadow-2xl shadow-slate-200/50 dark:shadow-none">
                    <FilterContent />
                </div>

                {/* Mobile Filter Trigger */}
                <div className="md:hidden fixed bottom-8 right-8 z-50">
                    <Drawer open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen}>
                        <DrawerTrigger asChild>
                            <Button size="lg" className="rounded-full h-16 w-16 shadow-2xl bg-primary text-white p-0">
                                <Filter className="h-7 w-7" />
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent className="bg-white dark:bg-slate-900 rounded-t-[3rem] border-none shadow-2xl">
                            <DrawerHeader className="pt-8">
                                <DrawerTitle className="text-2xl font-black">{t('reports.filters.title')}</DrawerTitle>
                            </DrawerHeader>
                            <div className="p-8 pb-12">
                                <FilterContent isMobile />
                            </div>
                            <DrawerFooter className="pt-2">
                                <DrawerClose asChild>
                                    <Button variant="outline" className="rounded-2xl h-12">Close</Button>
                                </DrawerClose>
                            </DrawerFooter>
                        </DrawerContent>
                    </Drawer>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
                    <div className="relative">
                        <TabsList className="w-full justify-start overflow-x-auto bg-transparent border-b border-slate-200 dark:border-slate-800 rounded-none h-14 gap-8 px-0 no-scrollbar">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-[3px] data-[state=active]:border-primary rounded-none px-2 font-black uppercase text-[10px] tracking-widest transition-all">
                                {t('reports.tabs.overview')}
                            </TabsTrigger>
                            <TabsTrigger value="revenue" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-[3px] data-[state=active]:border-primary rounded-none px-2 font-black uppercase text-[10px] tracking-widest transition-all">
                                {t('reports.tabs.revenue')}
                            </TabsTrigger>
                            <TabsTrigger value="peak-hours" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-[3px] data-[state=active]:border-primary rounded-none px-2 font-black uppercase text-[10px] tracking-widest transition-all">
                                {t('reports.tabs.peak_hours')}
                            </TabsTrigger>
                            <TabsTrigger value="services" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-[3px] data-[state=active]:border-primary rounded-none px-2 font-black uppercase text-[10px] tracking-widest transition-all">
                                {t('reports.tabs.services')}
                            </TabsTrigger>
                            <TabsTrigger value="customers" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-[3px] data-[state=active]:border-primary rounded-none px-2 font-black uppercase text-[10px] tracking-widest transition-all">
                                {t('reports.tabs.customers')}
                            </TabsTrigger>
                            <TabsTrigger value="no-shows" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-[3px] data-[state=active]:border-primary rounded-none px-2 font-black uppercase text-[10px] tracking-widest transition-all">
                                {t('reports.tabs.no_shows')}
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="mt-12">
                        <TabsContent value="overview" className="space-y-10 focus-visible:outline-none">
                            {/* KPI Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                <KpiCard
                                    title={t('reports.kpis.total_bookings')}
                                    value={reportData?.kpis?.totalBookings || '0'}
                                    trend="+12%"
                                    icon={BarChart3}
                                    color="blue"
                                />
                                <KpiCard
                                    title={t('reports.kpis.completed_bookings')}
                                    value={reportData?.kpis?.completedBookings || '0'}
                                    trend="+5%"
                                    icon={TrendingUp}
                                    color="emerald"
                                />
                                <KpiCard
                                    title={t('reports.kpis.revenue')}
                                    value={`$${reportData?.kpis?.revenue?.toLocaleString() || '0'}`}
                                    trend="+8%"
                                    icon={DollarSign}
                                    color="amber"
                                />
                                <KpiCard
                                    title={t('reports.kpis.cancelled_bookings')}
                                    value={reportData?.kpis?.cancelledBookings || '0'}
                                    trend="-2%"
                                    icon={X}
                                    color="rose"
                                />
                            </div>

                            {/* Chart Section */}
                            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden bg-white dark:bg-slate-900">
                                <CardHeader className="p-8 md:p-10 border-b border-slate-50 dark:border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-xl font-black">{t('reports.charts.booking_activity')}</CardTitle>
                                            <CardDescription>{t('reports.charts.daily_performance')}</CardDescription>
                                        </div>
                                        <Button variant="outline" className="rounded-xl" onClick={handleExport}>
                                            <Download className="h-4 w-4 mr-2" />
                                            {t('reports.actions.export_csv')}
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 md:p-10 h-[450px]">
                                    {loading ? (
                                        <div className="h-full w-full flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={reportData?.chartData || []}>
                                                <defs>
                                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                                <XAxis
                                                    dataKey="name"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                                                    dy={15}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        borderRadius: '16px',
                                                        border: 'none',
                                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                                                        padding: '12px 16px'
                                                    }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="value"
                                                    stroke="#10b981"
                                                    strokeWidth={4}
                                                    fillOpacity={1}
                                                    fill="url(#colorValue)"
                                                    animationDuration={1500}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Table Section */}
                            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 overflow-hidden">
                                <CardHeader className="p-8 md:p-10 border-b border-slate-50 dark:border-slate-800 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl font-black">{t('reports.tables.recent_bookings')}</CardTitle>
                                        <CardDescription>{t('reports.tables.detailed_list')}</CardDescription>
                                    </div>
                                    <Button variant="ghost" className="rounded-xl text-primary font-bold" onClick={() => setIsBookingsDialogOpen(true)}>View All</Button>
                                </CardHeader>
                                <CardContent className="p-4 md:p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50 dark:border-slate-800">
                                                    <th className="py-6 px-8">Client</th>
                                                    <th className="py-6 px-8">Service</th>
                                                    <th className="py-6 px-8">Date</th>
                                                    <th className="py-6 px-8">Status</th>
                                                    <th className="py-6 px-8 text-right">Revenue</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                {(reportData?.details || []).map((item, idx) => (
                                                    <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all cursor-default">
                                                        <td className="py-6 px-8">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 uppercase">
                                                                    {item.clientName?.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{item.clientName}</p>
                                                                    <p className="text-xs font-semibold text-slate-400">{item.clientEmail}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-6 px-8">
                                                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                                                {item.serviceName}
                                                            </span>
                                                        </td>
                                                        <td className="py-6 px-8">
                                                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                                                {item.scheduledAt ? format(new Date(item.scheduledAt), 'MMM dd, HH:mm') : 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="py-6 px-8">
                                                            <Badge className={cn("text-[10px] uppercase font-black px-3 py-1 rounded-lg border",
                                                                item.status === 'completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                                    item.status === 'cancelled' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                                                        "bg-blue-50 text-blue-600 border-blue-100"
                                                            )}>
                                                                {item.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-6 px-8 text-right">
                                                            <span className="text-sm font-black text-slate-900 dark:text-white">
                                                                ${item.resourceMapSnapshot?.price || 0}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="revenue" className="space-y-10 focus-visible:outline-none">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <KpiCard
                                    title={t('reports.kpis.revenue')}
                                    value={`$${reportData?.kpis?.totalRevenue?.toLocaleString() || '0'}`}
                                    trend="+8%"
                                    icon={DollarSign}
                                    color="emerald"
                                />
                                <KpiCard
                                    title={t('reports.kpis.average_ticket')}
                                    value={`$${Math.round(reportData?.kpis?.averageTicket || 0).toLocaleString()}`}
                                    icon={TrendingUp}
                                    color="blue"
                                />
                                <KpiCard
                                    title={t('reports.kpis.growth')}
                                    value={reportData?.kpis?.growth || '12.5%'}
                                    icon={Target}
                                    color="amber"
                                />
                            </div>

                            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                                <CardHeader className="p-8 md:p-10 border-b border-slate-50 dark:border-slate-800">
                                    <CardTitle className="text-xl font-black">{t('reports.charts.revenue_trend')}</CardTitle>
                                    <CardDescription>{t('reports.charts.income_distribution')}</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 md:p-10 h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={reportData?.chartData || []}>
                                            <defs>
                                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                            <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={4} fill="url(#colorRev)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="peak-hours" className="space-y-10 focus-visible:outline-none">
                            <div className="grid grid-cols-2 gap-6">
                                <KpiCard
                                    title={t('reports.kpis.busiest_day')}
                                    value={reportData?.kpis?.busiestDay || 'N/A'}
                                    icon={CalendarIcon}
                                    color="amber"
                                />
                                <KpiCard
                                    title="Peak Hour"
                                    value={reportData?.kpis?.busiestHour || 'N/A'}
                                    icon={Clock}
                                    color="rose"
                                />
                            </div>

                            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                                <CardHeader className="p-8">
                                    <CardTitle className="text-xl font-black">Daily Traffic</CardTitle>
                                    <CardDescription>Bookings volume by hour of the day</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={reportData?.chartData || []}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} cursor={{ fill: '#F8FAFC' }} />
                                            <Bar dataKey="value" fill="#F43F5E" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="services" className="space-y-10 focus-visible:outline-none">
                            <div className="grid grid-cols-2 gap-6">
                                <KpiCard
                                    title={t('reports.kpis.most_popular')}
                                    value={reportData?.kpis?.mostPopular || 'N/A'}
                                    icon={Package}
                                    color="blue"
                                />
                                <KpiCard
                                    title={t('reports.kpis.avg_duration')}
                                    value="45 min"
                                    icon={Clock}
                                    color="purple"
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                                    <CardHeader className="p-8">
                                        <CardTitle className="text-xl font-black">{t('reports.charts.popularity_by_service')}</CardTitle>
                                        <CardDescription>{t('reports.charts.bookings_per_service')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8 h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={reportData?.chartData || []}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} cursor={{ fill: '#F8FAFC' }} />
                                                <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                                    <CardHeader className="p-8">
                                        <CardTitle className="text-xl font-black">{t('reports.charts.service_revenue')}</CardTitle>
                                        <CardDescription>{t('reports.charts.financial_contribution')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        <div className="space-y-6">
                                            {(reportData?.details || []).map((service: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-2 w-2 rounded-full bg-primary" />
                                                        <span className="text-sm font-bold">{service.name}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-black">${service.revenue?.toLocaleString()}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{service.count} bookings</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="customers" className="space-y-10 focus-visible:outline-none">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <KpiCard
                                    title="Total Customers"
                                    value={reportData?.kpis?.totalCustomers || '0'}
                                    icon={Users}
                                    color="blue"
                                />
                                <KpiCard
                                    title="Recurring"
                                    value={reportData?.kpis?.recurringCustomers || '0'}
                                    icon={TrendingUp}
                                    color="emerald"
                                />
                                <KpiCard
                                    title="New (Period)"
                                    value={reportData?.kpis?.newCustomers || '0'}
                                    icon={Target}
                                    color="amber"
                                />
                            </div>

                            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                                <CardHeader className="p-8">
                                    <CardTitle className="text-xl font-black">Top Customers</CardTitle>
                                    <CardDescription>Most active customers by booking volume</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 dark:border-slate-800">
                                                    <th className="py-4 px-8">Customer</th>
                                                    <th className="py-4 px-8">Bookings</th>
                                                    <th className="py-4 px-8 text-right">Total Spent</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                {(reportData?.details || []).map((customer: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                        <td className="py-4 px-8">
                                                            <div>
                                                                <p className="font-bold text-sm">{customer.name}</p>
                                                                <p className="text-[10px] text-slate-400">{customer.email}</p>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-8">
                                                            <Badge variant="outline" className="rounded-lg">{customer.count}</Badge>
                                                        </td>
                                                        <td className="py-4 px-8 text-right font-black text-sm">
                                                            ${customer.revenue?.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="no-shows" className="space-y-10 focus-visible:outline-none">
                            <div className="grid grid-cols-2 gap-6">
                                <KpiCard
                                    title="Total No-shows"
                                    value={reportData?.kpis?.totalNoShows || '0'}
                                    icon={X}
                                    color="rose"
                                />
                                <KpiCard
                                    title="No-show Rate"
                                    value={reportData?.kpis?.rate || '0%'}
                                    icon={TrendingUp}
                                    color="amber"
                                />
                            </div>

                            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                                <CardHeader className="p-8">
                                    <CardTitle className="text-xl font-black">No-show Trend</CardTitle>
                                    <CardDescription>Frequency of no-shows over time</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={reportData?.chartData || []}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                            <Bar dataKey="value" fill="#F43F5E" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            <Dialog open={isBookingsDialogOpen} onOpenChange={setIsBookingsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-[2rem] border-none shadow-2xl p-0">
                    <DialogHeader className="p-8 border-b border-slate-50 dark:border-slate-800">
                        <DialogTitle className="text-2xl font-black">{t('reports.dialogs.all_bookings_title')}</DialogTitle>
                        <DialogDescription>{t('reports.dialogs.all_bookings_desc')}</DialogDescription>
                    </DialogHeader>
                    <div className="p-0">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50 dark:border-slate-800">
                                    <th className="py-4 px-8">Client</th>
                                    <th className="py-4 px-8">Service</th>
                                    <th className="py-4 px-8">Date</th>
                                    <th className="py-4 px-8">Status</th>
                                    <th className="py-4 px-8 text-right">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {(reportData?.details || []).map((item, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all cursor-default">
                                        <td className="py-4 px-8">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 uppercase text-xs">
                                                    {item.clientName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white text-xs">{item.clientName}</p>
                                                    <p className="text-[10px] font-semibold text-slate-400">{item.clientEmail}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-8">
                                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                {item.serviceName}
                                            </span>
                                        </td>
                                        <td className="py-4 px-8">
                                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                {item.scheduledAt ? format(new Date(item.scheduledAt), 'MMM dd, HH:mm') : 'N/A'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-8">
                                            <Badge className={cn("text-[9px] uppercase font-black px-2 py-0.5 rounded-md border",
                                                item.status === 'completed' || item.status === 'confirmed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                    item.status === 'cancelled' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                                        "bg-blue-50 text-blue-600 border-blue-100"
                                            )}>
                                                {item.status}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-8 text-right">
                                            <span className="text-xs font-black text-slate-900 dark:text-white">
                                                ${item.resourceMapSnapshot?.price || 0}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const KpiCard = ({ title, value, trend, icon: Icon, color }: any) => {
    const colorMap: any = {
        blue: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400",
        amber: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400",
        rose: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400",
        purple: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400",
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400",
    };

    return (
        <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 overflow-hidden group hover:scale-[1.02] transition-all duration-300">
            <CardContent className="p-6 md:p-8">
                <div className="flex items-start justify-between">
                    <div className={cn("p-3 rounded-2xl", colorMap[color])}>
                        <Icon className="h-6 w-6" />
                    </div>
                    {trend && (
                        <Badge className={cn("border-none text-[10px] font-black uppercase px-2 py-0.5 rounded-lg",
                            trend.startsWith('+') ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" : "text-rose-600 bg-rose-50 dark:bg-rose-900/30"
                        )}>
                            {trend}
                        </Badge>
                    )}
                </div>
                <div className="mt-8">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">{title}</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white mt-2 tabular-nums">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default ReportsPage;

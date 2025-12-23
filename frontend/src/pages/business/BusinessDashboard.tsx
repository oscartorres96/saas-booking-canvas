import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import "@/styles/premium-tabs.css";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Search,
    Plus,
    MoreHorizontal,
    Users,
    Calendar as CalendarIcon,
    DollarSign,
    Clock,
    Filter,
    Package,
    LogOut,
    Copy,
    BookOpen,
    QrCode,
    ExternalLink,
    Grid3X3,
    User,
    Mail,
    Phone,
    Info,
    CreditCard,
    CheckCircle2,
    XCircle,
    CalendarCheck
} from "lucide-react";
import { QRGenerator } from "@/components/QRGenerator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BusinessSettings } from "@/components/business/BusinessSettings";
import { Billing } from "@/components/business/Billing";
import { BusinessThemeToggle } from "@/components/BusinessThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import useAuth from "@/auth/useAuth";
import { getBusinessById, type Business } from "@/api/businessesApi";
import { getServicesByBusiness, createService, updateService, deleteService, type Service } from "@/api/servicesApi";
import { getBookingsByBusiness, updateBooking, verifyPayment, rejectPayment, resendConfirmation, type Booking } from "@/api/bookingsApi";
import { getProductsByBusiness, type Product } from "@/api/productsApi";
import { getByBusiness as getCustomerAssetsByBusiness, type CustomerAsset } from "@/api/customerAssetsApi";
import { getPaymentsByBusiness } from "@/api/stripeApi";
import { ExpirationBanner } from "@/components/ExpirationBanner";
import { ResourceMapEditor } from "@/components/business/ResourceMapEditor";
import { CatalogManager } from "@/components/business/CatalogManager";
import {
    DashboardSection,
    SectionHeader,
    ConfigPanel,
    AdminLabel,
    InnerCard
} from "@/components/dashboard/DashboardBase";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";


const serviceFormSchema = z.object({
    name: z.string().min(2, { message: "El nombre es requerido" }),
    description: z.string().optional(),
    durationMinutes: z.coerce.number().min(1, { message: "Duración inválida" }),
    price: z.coerce.number().min(0, { message: "Precio inválido" }),
    active: z.boolean().default(true),
    isOnline: z.boolean().default(false),
    requirePayment: z.boolean().default(false),
    requireResource: z.boolean().default(false),
    requireProduct: z.boolean().default(false),
});

const BusinessDashboard = () => {
    const { businessId: paramBusinessId } = useParams<{ businessId: string }>();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Determine the effective business ID: URL param takes precedence, then user's businessId
    const businessId = paramBusinessId || user?.businessId;

    // Read tab from URL query parameter
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');

    const [business, setBusiness] = useState<Business | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [customerAssets, setCustomerAssets] = useState<CustomerAsset[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
    const [isEditServiceDialogOpen, setIsEditServiceDialogOpen] = useState(false);
    const [isDeleteServiceDialogOpen, setIsDeleteServiceDialogOpen] = useState(false);
    const [isBookingDetailsDialogOpen, setIsBookingDetailsDialogOpen] = useState(false);
    const [isCancelConfirmDialogOpen, setIsCancelConfirmDialogOpen] = useState(false);
    const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);
    const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
    const [bookingToView, setBookingToView] = useState<Booking | null>(null);
    const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
    const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(tabParam === 'settings' ? 'settings' : (tabParam === 'catalog' ? 'catalog' : 'dashboard'));
    const { t, i18n } = useTranslation();

    const serviceForm = useForm<z.infer<typeof serviceFormSchema>>({
        resolver: zodResolver(serviceFormSchema),
        defaultValues: {
            name: "",
            description: "",
            durationMinutes: 30,
            price: 0,
            active: true,
            isOnline: false,
            requirePayment: false,
            requireResource: false,
            requireProduct: false,
        },
    });

    const editServiceForm = useForm<z.infer<typeof serviceFormSchema>>({
        resolver: zodResolver(serviceFormSchema),
        defaultValues: {
            name: "",
            description: "",
            durationMinutes: 30,
            price: 0,
            active: true,
            isOnline: false,
            requirePayment: false,
            requireResource: false,
            requireProduct: false,
        },
    });

    useEffect(() => {
        // Check authorization
        if (!user) {
            navigate("/login");
            return;
        }

        // Si no hay businessId disponible ni en URL ni en usuario
        if (!businessId) {
            setLoading(false);
            return;
        }

        // Owner can access any business, business role must match businessId
        if (paramBusinessId && user.role === "business" && user.businessId !== paramBusinessId) {
            toast.error(t('common.access_denied'));
            navigate("/");
            return;
        }

        if (user.role === "client") {
            toast.error(t('common.client_access_denied'));
            navigate("/");
            return;
        }

        if (businessId) {
            loadData();
        } else {
            setLoading(false);
        }
    }, [user, businessId, paramBusinessId, navigate]);

    // Auto-refresh data every 30 seconds to keep dashboard "live"
    useEffect(() => {
        if (!businessId || activeTab !== 'dashboard') return;

        const interval = setInterval(() => {
            console.log('Refreshing dashboard data...');
            loadData(false);
        }, 30000);

        return () => clearInterval(interval);
    }, [businessId, activeTab]);

    useEffect(() => {
        if (business?.settings?.defaultServiceDuration) {
            const currentValues = serviceForm.getValues();
            if (currentValues.durationMinutes === 30 && currentValues.name === "") {
                serviceForm.setValue("durationMinutes", business.settings.defaultServiceDuration);
            }
        }
    }, [business, serviceForm]);

    // Event listener for edit-service custom event from CatalogManager
    useEffect(() => {
        const handleEditService = (event: CustomEvent) => {
            const service = event.detail;
            if (service) {
                openEditService(service);
            }
        };

        window.addEventListener('edit-service', handleEditService as EventListener);
        return () => {
            window.removeEventListener('edit-service', handleEditService as EventListener);
        };
    }, []);

    const loadData = async (showLoading = true) => {
        if (!businessId) {
            setLoading(false);
            return;
        }

        try {
            if (showLoading) setLoading(true);
            const businessData = await getBusinessById(businessId);
            setBusiness(businessData);

            const servicesData = await getServicesByBusiness(businessId);
            setServices(servicesData);

            const bookingsData = await getBookingsByBusiness(businessId);
            setBookings(bookingsData);

            // Fetch products for QR Generator
            try {
                const productsData = await getProductsByBusiness(businessId);
                setProducts(productsData);
            } catch (error) {
                // Products are optional, so don't fail if they're not available
                console.log('Products not available:', error);
                setProducts([]);
            }

            try {
                const assetsData = await getCustomerAssetsByBusiness(businessId);
                setCustomerAssets(assetsData);
            } catch (error) {
                console.log('Customer assets not available:', error);
                setCustomerAssets([]);
            }

            try {
                const paymentsData = await getPaymentsByBusiness(businessId);
                setPayments(paymentsData);
            } catch (error) {
                console.log('Payments not available:', error);
                setPayments([]);
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error && 'response' in error
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;
            toast.error(errorMessage || t('common.load_error'));
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const onCreateService = async (values: z.infer<typeof serviceFormSchema>) => {
        if (!businessId) return;

        try {
            const newService = await createService({
                ...values,
                businessId,
            });

            setServices([newService, ...services]);
            setIsServiceDialogOpen(false);
            serviceForm.reset({
                name: "",
                description: "",
                durationMinutes: business?.settings?.defaultServiceDuration ?? 30,
                price: 0,
                active: true,
                isOnline: false,
                requirePayment: false,
                requireResource: false,
                requireProduct: false,
            });
            toast.success(t('dashboard.services.toasts.created'));
        } catch (error: any) {
            const errorData = error.response?.data;
            const detailedMessage = Array.isArray(errorData?.message)
                ? errorData.message.join(", ")
                : errorData?.message;
            toast.error(detailedMessage || t('dashboard.services.toasts.error_create'));
        }
    };

    const openEditService = (service: Service) => {
        setServiceToEdit(service);
        editServiceForm.reset({
            name: service.name,
            description: service.description ?? "",
            durationMinutes: service.durationMinutes,
            price: service.price,
            active: service.active ?? true,
            isOnline: service.isOnline ?? false,
            requirePayment: service.requirePayment ?? false,
            requireResource: service.requireResource ?? false,
            requireProduct: service.requireProduct ?? false,
        });
        setIsEditServiceDialogOpen(true);
    };

    const onUpdateService = async (values: z.infer<typeof serviceFormSchema>) => {
        if (!serviceToEdit) return;
        try {
            const updated = await updateService(serviceToEdit._id, values);
            setServices(prev => prev.map(s => (s._id === updated._id ? updated : s)));
            setIsEditServiceDialogOpen(false);
            toast.success(t('dashboard.services.toasts.updated'));
        } catch (error: any) {
            const errorData = error.response?.data;
            const detailedMessage = Array.isArray(errorData?.message)
                ? errorData.message.join(", ")
                : errorData?.message;
            toast.error(detailedMessage || t('dashboard.services.toasts.error_update'));
        }
    };

    const openDeleteService = (service: Service) => {
        setServiceToDelete(service);
        setIsDeleteServiceDialogOpen(true);
    };

    const onDeleteService = async () => {
        if (!serviceToDelete) return;
        try {
            await deleteService(serviceToDelete._id);
            setServices(prev => prev.filter(s => s._id !== serviceToDelete._id));
            toast.success(t('dashboard.services.toasts.deleted'));
        } catch (error: any) {
            const errorData = error.response?.data;
            const detailedMessage = Array.isArray(errorData?.message)
                ? errorData.message.join(", ")
                : errorData?.message;
            toast.error(detailedMessage || t('dashboard.services.toasts.error_delete'));
        } finally {
            setIsDeleteServiceDialogOpen(false);
            setServiceToDelete(null);
        }
    };

    const handleVerifyPayment = async (bookingId: string) => {
        try {
            await verifyPayment(bookingId);
            setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, paymentStatus: 'paid' as any, status: 'confirmed' as any } : b));
            toast.success(t('dashboard.bookings.toasts.payment_verified', 'Pago verificado correctamente'));
        } catch (error) {
            toast.error(t('dashboard.bookings.toasts.error_verify', 'Error al verificar pago'));
        }
    };

    const handleRejectPayment = async (bookingId: string) => {
        try {
            await rejectPayment(bookingId);
            setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, paymentStatus: 'rejected' as any } : b));
            toast.success(t('dashboard.bookings.toasts.payment_rejected', 'Pago rechazado'));
        } catch (error) {
            toast.error(t('dashboard.bookings.toasts.error_reject', 'Error al rechazar pago'));
        }
    };

    const onUpdateBookingStatus = async (bookingId: string, newStatus: 'confirmed' | 'completed' | 'cancelled') => {
        try {
            await updateBooking(bookingId, { status: newStatus });
            setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: newStatus } : b));
            toast.success(t('dashboard.bookings.toasts.status_updated', { status: getStatusLabel(newStatus).toLowerCase() }));
        } catch (error) {
            toast.error(t('dashboard.bookings.toasts.error_update'));
            console.error(error);
        }
    };

    const handleResendConfirmation = async (bookingId: string) => {
        try {
            await resendConfirmation(bookingId);
            toast.success(t('manual.faq.items.resend_success', 'Confirmación reenviada correctamente'));
        } catch (error) {
            toast.error(t('manual.faq.items.resend_error', 'Error al reenviar la confirmación'));
        }
    };

    const handleCopyInvitation = () => {
        const url = `${window.location.origin}/business/${businessId}/booking`;
        const message = t('dashboard.invitationMessage', { businessName: business?.businessName, url });
        navigator.clipboard.writeText(message);
        toast.success(t('dashboard.invitationCopied'));
    };

    const handleCopyServiceLink = (service: Service) => {
        const url = `${window.location.origin}/business/${businessId}/booking?serviceId=${service._id}`;
        const message = t('dashboard.serviceLinkMessage', { serviceName: service.name, url });
        navigator.clipboard.writeText(message);
        toast.success(t('dashboard.services.toasts.link_copied'));
    };

    const openBookingDetails = (booking: Booking) => {
        setBookingToView(booking);
        setIsBookingDetailsDialogOpen(true);
    };

    const openCancelConfirmation = (booking: Booking) => {
        setBookingToCancel(booking);
        setIsCancelConfirmDialogOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!bookingToCancel) return;
        await onUpdateBookingStatus(bookingToCancel._id, 'cancelled');
        setIsCancelConfirmDialogOpen(false);
        setBookingToCancel(null);
        setIsBookingDetailsDialogOpen(false);
    };

    const filteredBookings = bookings.filter(booking =>
        booking.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const upcomingBookings = filteredBookings.filter(b => new Date(b.scheduledAt) > new Date());

    const getStatusColor = (status: string) => {
        switch (status) {
            case "confirmed": return "bg-green-100 text-green-800 hover:bg-green-100";
            case "pending": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
            case "completed": return "bg-blue-100 text-blue-800 hover:bg-blue-100";
            case "cancelled": return "bg-red-100 text-red-800 hover:bg-red-100";
            case "pending_payment": return "bg-amber-100 text-amber-800 hover:bg-amber-100";
            default: return "bg-gray-100 text-gray-800";
        }
    };


    const getStatusLabel = (status: string) => {
        return t(`dashboard.bookings.status.${status}`, status);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-200"></div>
                    <div className="h-4 w-48 bg-slate-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!business) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900">Negocio no encontrado</h2>
                    <Button className="mt-4" onClick={() => navigate("/")}>{t('common.back_to_home', 'Volver al inicio')}</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-black">
            <ExpirationBanner />
            <div className="p-4 md:p-6">
                <div className="max-w-7xl mx-auto space-y-6">

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        {/* Header */}
                        <div className="flex flex-col gap-6 w-full lg:flex-row lg:items-center lg:justify-between">
                            {/* Identidad del Negocio */}
                            <div className="flex items-center gap-4">
                                {business.logoUrl && business.logoUrl !== "/placeholder.svg" ? (
                                    <img
                                        src={business.logoUrl}
                                        alt="Logo"
                                        className="h-14 w-14 rounded-2xl object-cover shadow-sm bg-background border p-1"
                                    />
                                ) : (
                                    <div
                                        className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm border"
                                        style={{
                                            backgroundColor: business.settings?.primaryColor ? `${business.settings.primaryColor}15` : undefined,
                                            borderColor: business.settings?.primaryColor ? `${business.settings.primaryColor}30` : undefined
                                        }}
                                    >
                                        <CalendarIcon
                                            className="h-7 w-7"
                                            style={{ color: business.settings?.primaryColor || undefined }}
                                        />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h1 className="text-2xl font-bold tracking-tight text-foreground">{business.businessName}</h1>
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                                        {t('dashboard.subtitle')}
                                    </p>
                                </div>

                                <div className="flex lg:hidden items-center gap-1">
                                    <LanguageSwitcher />
                                    <BusinessThemeToggle />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            logout();
                                            toast.success(t('auth.logout_success') || 'Sesión cerrada exitosamente');
                                            navigate('/');
                                        }}
                                        className="h-9 w-9 text-muted-foreground hover:text-destructive transition-colors"
                                        title={t('auth.logout') || 'Cerrar sesión'}
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span className="sr-only">{t('auth.logout') || 'Cerrar sesión'}</span>
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 w-full lg:w-auto lg:items-end">
                                <div className="grid grid-cols-2 md:flex md:flex-row gap-2 w-full lg:w-auto">
                                    <Button
                                        variant="outline"
                                        className="h-9 md:h-10 text-[10px] md:text-xs px-2 md:px-3 font-medium order-2 md:order-none"
                                        onClick={() => window.open(`/business/${businessId}/booking`, '_blank')}
                                    >
                                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                        {t('dashboard.viewBookingPage')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-9 md:h-10 text-[10px] md:text-xs px-2 md:px-3 font-medium order-3 md:order-none"
                                        onClick={() => navigate('/manual')}
                                    >
                                        <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                                        Manual
                                    </Button>
                                    <Button
                                        variant="default"
                                        className="h-9 md:h-10 text-[10px] md:text-xs px-2 md:px-3 font-semibold col-span-2 md:col-auto order-1 md:order-none shadow-md shadow-primary/20"
                                        onClick={handleCopyInvitation}
                                    >
                                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                                        {t('dashboard.copyInvitation')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-9 md:h-10 text-[10px] md:text-xs px-2 md:px-3 font-medium order-4 md:order-none"
                                        onClick={() => setIsQrDialogOpen(true)}
                                    >
                                        <QrCode className="mr-1.5 h-3.5 w-3.5" />
                                        QR
                                    </Button>

                                    <div className="hidden lg:flex items-center gap-1 pl-2 border-l ml-2">
                                        <LanguageSwitcher />
                                        <BusinessThemeToggle />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                logout();
                                                toast.success(t('auth.logout_success') || 'Sesión cerrada exitosamente');
                                                navigate('/');
                                            }}
                                            className="h-9 w-9 text-muted-foreground hover:text-destructive transition-colors"
                                            title={t('auth.logout') || 'Cerrar sesión'}
                                        >
                                            <LogOut className="h-4 w-4" />
                                            <span className="sr-only">{t('auth.logout') || 'Cerrar sesión'}</span>
                                        </Button>
                                    </div>
                                </div>

                                <div className="premium-tabs-container">
                                    <TabsList className="premium-tabs-list">
                                        <TabsTrigger value="dashboard" className="premium-tab-trigger">{t('dashboard.tabs.dashboard')}</TabsTrigger>
                                        <TabsTrigger value="catalog" className="premium-tab-trigger">{t('dashboard.tabs.catalog', 'Oferta')}</TabsTrigger>
                                        <TabsTrigger value="settings" className="premium-tab-trigger">{t('dashboard.tabs.settings')}</TabsTrigger>
                                        <TabsTrigger value="billing" className="premium-tab-trigger">{t('dashboard.tabs.billing')}</TabsTrigger>
                                        <TabsTrigger value="resource-map" className="premium-tab-trigger">{t('dashboard.tabs.resource_map', 'Mapa de Recursos')}</TabsTrigger>
                                    </TabsList>
                                </div>
                            </div>
                        </div>

                        <TabsContent value="dashboard" className="space-y-8">
                            <DashboardOverview
                                business={business}
                                bookings={bookings}
                                services={services}
                                products={products}
                                customerAssets={customerAssets}
                                payments={payments}
                                onViewBooking={openBookingDetails}
                                onViewCustomer={(email) => {
                                    setSearchTerm(email);
                                    // Optionally scroll to table or just filter it
                                }}
                            />

                            <div className="pt-8 border-t">
                                <DashboardSection>
                                    <SectionHeader
                                        title={t('dashboard.bookings.title')}
                                        description={t('dashboard.bookings.description')}
                                        icon={CalendarIcon}
                                        rightElement={
                                            <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                                                <div className="relative w-full md:w-64">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder={t('dashboard.bookings.search_placeholder')}
                                                        className="pl-9 w-full rounded-xl bg-background h-9 md:h-10 text-sm"
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                    />
                                                </div>
                                                <Button variant="outline" size="sm" className="rounded-xl h-9 md:h-10 w-full md:w-auto">
                                                    <Filter className="h-4 w-4 mr-2 md:mr-0" />
                                                    <span className="md:hidden">Filtrar</span>
                                                </Button>
                                            </div>
                                        }
                                    />
                                    <CardContent className="p-0">
                                        {upcomingBookings.length === 0 ? (
                                            <div className="text-center py-12 text-muted-foreground italic">
                                                {t('dashboard.bookings.empty')}
                                            </div>
                                        ) : (
                                            <>
                                                {/* Desktop Table View */}
                                                <div className="hidden md:block overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>{t('dashboard.bookings.table.client')}</TableHead>
                                                                <TableHead>{t('dashboard.bookings.table.service')}</TableHead>
                                                                <TableHead>{t('dashboard.bookings.table.date')}</TableHead>
                                                                <TableHead>{t('dashboard.bookings.table.status')}</TableHead>
                                                                <TableHead className="text-right">{t('dashboard.bookings.table.actions')}</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {upcomingBookings.map((booking) => {
                                                                const service = services.find(s => s._id === booking.serviceId);
                                                                return (
                                                                    <TableRow
                                                                        key={booking._id}
                                                                        className="cursor-pointer hover:bg-muted/50"
                                                                        onClick={() => openBookingDetails(booking)}
                                                                    >
                                                                        <TableCell className="font-medium">
                                                                            <div className="flex flex-col">
                                                                                <span className="font-semibold">{booking.clientName}</span>
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    {booking.clientEmail || booking.clientPhone || "N/A"}
                                                                                </span>
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div className="flex items-center gap-2">
                                                                                {service?.name || booking.serviceId}
                                                                                {booking.assetId && (
                                                                                    <Badge variant="outline" className="h-5 px-1 bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800 text-[9px] font-bold">
                                                                                        <Package className="h-2.5 w-2.5 mr-0.5" />
                                                                                        PAQUETE
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div className="flex flex-col">
                                                                                <span>{format(new Date(booking.scheduledAt), "PPP", { locale: i18n.language === 'en' ? enUS : es })}</span>
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    {format(new Date(booking.scheduledAt), "p", { locale: i18n.language === 'en' ? enUS : es })}
                                                                                </span>
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div className="flex flex-col gap-1 items-start">
                                                                                <Badge className={getStatusColor(booking.status)} variant="secondary">
                                                                                    {getStatusLabel(booking.status)}
                                                                                </Badge>
                                                                                {booking.paymentStatus && (booking.paymentStatus as string) !== 'none' && (
                                                                                    <Badge variant="outline" className={cn(
                                                                                        "text-[10px] px-1 py-0 h-4 uppercase font-bold",
                                                                                        booking.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' :
                                                                                            booking.paymentStatus === 'pending_verification' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' :
                                                                                                'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                                                                                    )}>
                                                                                        {t(`dashboard.bookings.payment_status.${booking.paymentStatus}`, booking.paymentStatus)}
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger asChild>
                                                                                    <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground">
                                                                                        <span className="sr-only">{t('common.actions')}</span>
                                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                                    </Button>
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent align="end" className="w-48">
                                                                                    <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                                                                                    <DropdownMenuItem onClick={() => openBookingDetails(booking)}>{t('dashboard.bookings.actions.view_details')}</DropdownMenuItem>
                                                                                    <DropdownMenuSeparator />
                                                                                    {booking.paymentStatus === 'pending_verification' && (
                                                                                        <>
                                                                                            <DropdownMenuItem className="text-green-600 font-semibold" onClick={() => handleVerifyPayment(booking._id)}>
                                                                                                {t('dashboard.bookings.actions.verify_payment')}
                                                                                            </DropdownMenuItem>
                                                                                            <DropdownMenuItem className="text-red-600" onClick={() => handleRejectPayment(booking._id)}>
                                                                                                {t('dashboard.bookings.actions.reject_payment')}
                                                                                            </DropdownMenuItem>
                                                                                            <DropdownMenuSeparator />
                                                                                        </>
                                                                                    )}
                                                                                    {booking.status === 'pending' && (
                                                                                        <DropdownMenuItem className="text-green-600" onClick={() => onUpdateBookingStatus(booking._id, 'confirmed')}>
                                                                                            {t('dashboard.bookings.actions.confirm')}
                                                                                        </DropdownMenuItem>
                                                                                    )}
                                                                                    {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                                                                                        <DropdownMenuItem className="text-blue-600" onClick={() => onUpdateBookingStatus(booking._id, 'completed')}>
                                                                                            {t('dashboard.bookings.actions.complete')}
                                                                                        </DropdownMenuItem>
                                                                                    )}
                                                                                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                                                                        <DropdownMenuItem className="text-red-600" onClick={() => openCancelConfirmation(booking)}>
                                                                                            {t('dashboard.bookings.actions.cancel')}
                                                                                        </DropdownMenuItem>
                                                                                    )}
                                                                                    <DropdownMenuSeparator />
                                                                                    <DropdownMenuItem onClick={() => handleResendConfirmation(booking._id)}>
                                                                                        <Mail className="mr-2 h-4 w-4" />
                                                                                        Reenviar confirmación
                                                                                    </DropdownMenuItem>
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>

                                                {/* Mobile Card List View */}
                                                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                                                    {upcomingBookings.map((booking) => {
                                                        const service = services.find(s => s._id === booking.serviceId);
                                                        return (
                                                            <div
                                                                key={booking._id}
                                                                className="p-4 active:bg-slate-50 dark:active:bg-slate-900 transition-colors"
                                                                onClick={() => openBookingDetails(booking)}
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{booking.clientName}</span>
                                                                        <div className="flex items-center gap-2 truncate">
                                                                            <span className="text-xs text-muted-foreground truncate">{service?.name || 'Servicio'}</span>
                                                                            {booking.assetId && (
                                                                                <Badge variant="outline" className="h-4 px-1 bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800 text-[8px] font-bold">
                                                                                    PAQUETE
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <Badge className={cn(getStatusColor(booking.status), "text-[10px] h-5")} variant="secondary">
                                                                        {getStatusLabel(booking.status)}
                                                                    </Badge>
                                                                </div>

                                                                <div className="flex items-center justify-between mt-3">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                                                            {format(new Date(booking.scheduledAt), "d MMM, HH:mm", { locale: i18n.language === 'en' ? enUS : es })}
                                                                        </span>
                                                                        {booking.paymentStatus && (booking.paymentStatus as string) !== 'none' && (
                                                                            <Badge variant="outline" className={cn(
                                                                                "text-[9px] px-1 py-0 h-4 mt-1 uppercase font-bold border-none",
                                                                                booking.paymentStatus === 'paid' ? 'text-green-600 dark:text-green-400' :
                                                                                    booking.paymentStatus === 'pending_verification' ? 'text-amber-600 dark:text-amber-400' :
                                                                                        'text-red-600 dark:text-red-400'
                                                                            )}>
                                                                                • {t(`dashboard.bookings.payment_status.${booking.paymentStatus}`, booking.paymentStatus)}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <div onClick={(e) => e.stopPropagation()}>
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                                </Button>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent align="end" className="w-56">
                                                                                <DropdownMenuItem onClick={() => openBookingDetails(booking)}>Ver Detalles</DropdownMenuItem>
                                                                                <DropdownMenuSeparator />
                                                                                {booking.paymentStatus === 'pending_verification' && (
                                                                                    <>
                                                                                        <DropdownMenuItem className="text-green-600 font-semibold" onClick={() => handleVerifyPayment(booking._id)}>Verificar Pago</DropdownMenuItem>
                                                                                        <DropdownMenuItem className="text-red-600" onClick={() => handleRejectPayment(booking._id)}>Rechazar Pago</DropdownMenuItem>
                                                                                        <DropdownMenuSeparator />
                                                                                    </>
                                                                                )}
                                                                                {booking.status === 'pending' && (
                                                                                    <DropdownMenuItem className="text-green-600" onClick={() => onUpdateBookingStatus(booking._id, 'confirmed')}>Confirmar Cita</DropdownMenuItem>
                                                                                )}
                                                                                {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                                                                                    <DropdownMenuItem className="text-blue-600" onClick={() => onUpdateBookingStatus(booking._id, 'completed')}>Completar</DropdownMenuItem>
                                                                                )}
                                                                                <DropdownMenuItem className="text-red-600" onClick={() => openCancelConfirmation(booking)}>Cancelar</DropdownMenuItem>
                                                                                <DropdownMenuSeparator />
                                                                                <DropdownMenuItem onClick={() => handleResendConfirmation(booking._id)}>
                                                                                    <Mail className="mr-2 h-4 w-4" />
                                                                                    Reenviar confirmación
                                                                                </DropdownMenuItem>
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </DashboardSection>
                            </div>
                        </TabsContent>

                        <TabsContent value="catalog" className="space-y-6">
                            <DashboardSection>
                                <SectionHeader
                                    title={t('dashboard.catalog.title', 'Mi Oferta')}
                                    description={t('dashboard.catalog.description', 'Gestiona tus servicios y las formas en que los vendes (pases y paquetes).')}
                                    icon={Grid3X3}
                                    rightElement={
                                        <Button className="rounded-xl px-6" onClick={() => setIsServiceDialogOpen(true)}>
                                            <Plus className="mr-2 h-4 w-4" /> {t('dashboard.services.create')}
                                        </Button>
                                    }
                                />
                                <CardContent className="p-3 sm:p-6">

                                    <CatalogManager
                                        businessId={businessId || ""}
                                        services={services}
                                        products={products}
                                        onDataUpdate={() => loadData(false)}
                                    />
                                </CardContent>
                            </DashboardSection>
                        </TabsContent>

                        <TabsContent value="settings">
                            <BusinessSettings businessId={businessId!} />
                        </TabsContent>

                        <TabsContent value="billing">
                            <Billing businessId={businessId!} />
                        </TabsContent>

                        <TabsContent value="resource-map">
                            <ResourceMapEditor
                                businessId={businessId!}
                                initialConfig={business.resourceConfig ? {
                                    enabled: Boolean(business.resourceConfig.enabled),
                                    resourceType: String(business.resourceConfig.resourceType || "Bici"),
                                    resourceLabel: String(business.resourceConfig.resourceLabel || "B"),
                                    layoutType: String(business.resourceConfig.layoutType || "spinning"),
                                    rows: Number(business.resourceConfig.rows || 4),
                                    cols: Number(business.resourceConfig.cols || 6),
                                    resources: business.resourceConfig.resources || []
                                } : undefined}
                            />
                        </TabsContent>
                    </Tabs>

                    {/* QR Code Dialog */}
                    <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
                        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader className="sr-only">
                                <DialogTitle>{t('dashboard.qr.title', 'Generador de código QR')}</DialogTitle>
                                <DialogDescription>{t('dashboard.qr.subtitle', 'Crea códigos QR personalizados para tu negocio, servicios o paquetes.')}</DialogDescription>
                            </DialogHeader>
                            <QRGenerator
                                businessId={businessId || ""}
                                businessName={business?.businessName || ""}
                                services={services}
                                packages={products}
                            />
                        </DialogContent>
                    </Dialog>

                    {/* Delete Service Modal */}
                    <Dialog open={isDeleteServiceDialogOpen} onOpenChange={setIsDeleteServiceDialogOpen}>
                        <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{t('dashboard.services.delete_title')}</DialogTitle>
                                <DialogDescription>
                                    {t('dashboard.services.delete_description', { name: serviceToDelete?.name })}
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="flex flex-row justify-end gap-2">
                                <Button variant="ghost" onClick={() => setIsDeleteServiceDialogOpen(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button variant="destructive" onClick={onDeleteService}>
                                    {t('common.delete')}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Create Service Dialog */}
                    <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{t('dashboard.services.create_title', 'Crear Nuevo Servicio')}</DialogTitle>
                                <DialogDescription>
                                    {t('dashboard.services.create_description', 'Agrega un nuevo servicio a tu catálogo.')}
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...serviceForm}>
                                <form onSubmit={serviceForm.handleSubmit(onCreateService)} className="space-y-6">
                                    <div className="space-y-4">
                                        {/* Basic Information */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 pb-2 border-b">
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                                                <h3 className="text-sm font-semibold text-foreground">Información Básica</h3>
                                            </div>

                                            <FormField
                                                control={serviceForm.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{t('dashboard.services.form.name')}</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Ej: Consulta General" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={serviceForm.control}
                                                name="description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{t('dashboard.services.form.description')}</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Breve descripción del servicio" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={serviceForm.control}
                                                    name="durationMinutes"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('dashboard.services.form.duration')}</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" min="1" placeholder="30" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={serviceForm.control}
                                                    name="price"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('dashboard.services.form.price')}</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        {/* Service Options */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 pb-2 border-b">
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                                                <h3 className="text-sm font-semibold text-foreground">Opciones del Servicio</h3>
                                            </div>

                                            <FormField
                                                control={serviceForm.control}
                                                name="active"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-base">Servicio Activo</FormLabel>
                                                            <p className="text-sm text-muted-foreground">
                                                                Los clientes pueden reservar este servicio
                                                            </p>
                                                        </div>
                                                        <FormControl>
                                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={serviceForm.control}
                                                name="isOnline"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-base">Servicio en Línea</FormLabel>
                                                            <p className="text-sm text-muted-foreground">
                                                                Este servicio se proporciona de forma remota
                                                            </p>
                                                        </div>
                                                        <FormControl>
                                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={serviceForm.control}
                                                name="requirePayment"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-base">Requiere Pago Previo</FormLabel>
                                                            <p className="text-sm text-muted-foreground">
                                                                El cliente debe pagar antes de confirmar la reserva
                                                            </p>
                                                        </div>
                                                        <FormControl>
                                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={serviceForm.control}
                                                name="requireResource"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-base">Requiere Recurso</FormLabel>
                                                            <p className="text-sm text-muted-foreground">
                                                                El cliente debe seleccionar un recurso específico (sala, equipo)
                                                            </p>
                                                        </div>
                                                        <FormControl>
                                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={serviceForm.control}
                                                name="requireProduct"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-base">Solo con Paquete</FormLabel>
                                                            <p className="text-sm text-muted-foreground">
                                                                El cliente debe comprar un paquete para usar este servicio
                                                            </p>
                                                        </div>
                                                        <FormControl>
                                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button type="button" variant="ghost" onClick={() => setIsServiceDialogOpen(false)}>
                                            {t('common.cancel')}
                                        </Button>
                                        <Button type="submit">{t('common.save')}</Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>

                    {/* Edit Service Dialog */}
                    <Dialog open={isEditServiceDialogOpen} onOpenChange={setIsEditServiceDialogOpen}>
                        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{t('dashboard.services.edit_title', 'Editar Servicio')}</DialogTitle>
                                <DialogDescription>
                                    {t('dashboard.services.edit_description', 'Modifica los detalles de tu servicio.')}
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...editServiceForm}>
                                <form onSubmit={editServiceForm.handleSubmit(onUpdateService)} className="space-y-6">
                                    <div className="space-y-4">
                                        {/* Basic Information */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 pb-2 border-b">
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                                                <h3 className="text-sm font-semibold text-foreground">Información Básica</h3>
                                            </div>

                                            <FormField
                                                control={editServiceForm.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{t('dashboard.services.form.name')}</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Ej: Consulta General" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={editServiceForm.control}
                                                name="description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{t('dashboard.services.form.description')}</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Breve descripción del servicio" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={editServiceForm.control}
                                                    name="durationMinutes"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('dashboard.services.form.duration')}</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" min="1" placeholder="30" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={editServiceForm.control}
                                                    name="price"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('dashboard.services.form.price')}</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        {/* Service Options */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 pb-2 border-b">
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                                                <h3 className="text-sm font-semibold text-foreground">Opciones del Servicio</h3>
                                            </div>

                                            <FormField
                                                control={editServiceForm.control}
                                                name="active"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-base">Servicio Activo</FormLabel>
                                                            <p className="text-sm text-muted-foreground">
                                                                Los clientes pueden reservar este servicio
                                                            </p>
                                                        </div>
                                                        <FormControl>
                                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={editServiceForm.control}
                                                name="isOnline"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-base">Servicio en Línea</FormLabel>
                                                            <p className="text-sm text-muted-foreground">
                                                                Este servicio se proporciona de forma remota
                                                            </p>
                                                        </div>
                                                        <FormControl>
                                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={editServiceForm.control}
                                                name="requirePayment"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-base">Requiere Pago Previo</FormLabel>
                                                            <p className="text-sm text-muted-foreground">
                                                                El cliente debe pagar antes de confirmar la reserva
                                                            </p>
                                                        </div>
                                                        <FormControl>
                                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={editServiceForm.control}
                                                name="requireResource"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-base">Requiere Recurso</FormLabel>
                                                            <p className="text-sm text-muted-foreground">
                                                                El cliente debe seleccionar un recurso específico (sala, equipo)
                                                            </p>
                                                        </div>
                                                        <FormControl>
                                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={editServiceForm.control}
                                                name="requireProduct"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-base">Solo con Paquete</FormLabel>
                                                            <p className="text-sm text-muted-foreground">
                                                                El cliente debe comprar un paquete para usar este servicio
                                                            </p>
                                                        </div>
                                                        <FormControl>
                                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button type="button" variant="ghost" onClick={() => setIsEditServiceDialogOpen(false)}>
                                            {t('common.cancel')}
                                        </Button>
                                        <Button type="submit">{t('common.save')}</Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>

                    {/* Booking Details Modal */}
                    <Dialog open={isBookingDetailsDialogOpen} onOpenChange={setIsBookingDetailsDialogOpen}>
                        <DialogContent className="sm:max-w-[600px] max-h-[98vh] overflow-y-auto gap-0 p-0 border-none shadow-2xl custom-scrollbar">
                            <DialogHeader className="p-6 pb-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl">
                                        <CalendarCheck className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <DialogTitle className="text-xl font-bold">{t('dashboard.bookings.details.title')}</DialogTitle>
                                        <DialogDescription className="text-sm font-medium text-muted-foreground">
                                            {t('dashboard.bookings.details.modal_description')}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="p-6">
                                {bookingToView && (
                                    <div className="space-y-8">
                                        {/* Client Info Section */}
                                        <div className="space-y-3">
                                            <AdminLabel icon={User}>{t('dashboard.bookings.details.client_info')}</AdminLabel>
                                            <InnerCard className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 p-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                        <User className="h-4 w-4 text-slate-500" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{t('dashboard.bookings.details.name')}</p>
                                                        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">{bookingToView.clientName}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                        <Mail className="h-4 w-4 text-slate-500" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{t('dashboard.bookings.details.email')}</p>
                                                        <p className="font-medium text-slate-700 dark:text-slate-300 text-sm truncate">{bookingToView.clientEmail || 'N/A'}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                        <Phone className="h-4 w-4 text-slate-500" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{t('dashboard.bookings.details.phone')}</p>
                                                        <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">{bookingToView.clientPhone || 'N/A'}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                        <Info className="h-4 w-4 text-slate-500" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{t('dashboard.bookings.details.status')}</p>
                                                        <Badge className={cn(getStatusColor(bookingToView.status), "h-5 text-[10px] font-bold uppercase px-2")} variant="secondary">
                                                            {getStatusLabel(bookingToView.status)}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </InnerCard>
                                        </div>

                                        {/* Payment Info Section (Conditional) */}
                                        {bookingToView.paymentMethod === 'bank_transfer' && bookingToView.paymentDetails && (
                                            <div className="space-y-3">
                                                <AdminLabel icon={CreditCard}>{t('dashboard.bookings.details.payment_info')}</AdminLabel>
                                                <InnerCard className="bg-amber-50/50 dark:bg-amber-500/5 border-amber-200/50 dark:border-amber-500/20 p-5 space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700/70 dark:text-amber-400/70 mb-1">{t('dashboard.bookings.details.payment_status')}</p>
                                                            <Badge variant="outline" className="uppercase font-bold text-[10px] h-5 bg-white dark:bg-slate-900 text-amber-600 border-amber-200">
                                                                {t(`dashboard.bookings.payment_status.${bookingToView.paymentStatus}`, bookingToView.paymentStatus)}
                                                            </Badge>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700/70 dark:text-amber-400/70 mb-1">{t('dashboard.bookings.details.payment_method')}</p>
                                                            <p className="font-semibold text-sm text-slate-800 dark:text-amber-200">{t('dashboard.bookings.details.bank_transfer')}</p>
                                                        </div>
                                                        {bookingToView.paymentDetails.holderName && (
                                                            <div>
                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700/70 dark:text-amber-400/70 mb-1">{t('dashboard.bookings.details.holder')}</p>
                                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{bookingToView.paymentDetails.holderName}</p>
                                                            </div>
                                                        )}
                                                        {bookingToView.paymentDetails.clabe && (
                                                            <div>
                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700/70 dark:text-amber-400/70 mb-1">{t('dashboard.bookings.details.clabe')}</p>
                                                                <p className="text-sm font-medium font-mono text-slate-700 dark:text-slate-300">{bookingToView.paymentDetails.clabe}</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {bookingToView.paymentDetails.transferDate && (
                                                        <div className="pt-3 border-t border-amber-200/50 dark:border-amber-500/10">
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700/70 dark:text-amber-400/70 mb-1">{t('dashboard.bookings.details.transfer_date')}</p>
                                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                                {format(new Date(bookingToView.paymentDetails.transferDate), "PPp", { locale: i18n.language === 'en' ? enUS : es })}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {bookingToView.paymentStatus === 'pending_verification' && (
                                                        <div className="flex gap-2 pt-2">
                                                            <Button className="flex-1 rounded-xl h-10 font-bold bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20" onClick={() => {
                                                                handleVerifyPayment(bookingToView._id);
                                                                setIsBookingDetailsDialogOpen(false);
                                                            }}>
                                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                {t('dashboard.bookings.actions.confirm_receipt')}
                                                            </Button>
                                                            <Button variant="outline" className="flex-1 rounded-xl h-10 font-bold text-red-600 border-red-200 hover:bg-red-50" onClick={() => {
                                                                handleRejectPayment(bookingToView._id);
                                                                setIsBookingDetailsDialogOpen(false);
                                                            }}>
                                                                <XCircle className="mr-2 h-4 w-4" />
                                                                {t('dashboard.bookings.actions.reject_payment')}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </InnerCard>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Service Info */}
                                            <div className="space-y-3">
                                                <AdminLabel icon={Package}>{t('dashboard.bookings.details.service_info')}</AdminLabel>
                                                <InnerCard className="p-5 flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                                        <Package className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{t('dashboard.bookings.details.service_name')}</p>
                                                        <p className="font-bold text-slate-900 dark:text-slate-100 text-base leading-tight">
                                                            {services.find(s => s._id === bookingToView.serviceId)?.name || bookingToView.serviceId}
                                                        </p>
                                                    </div>
                                                </InnerCard>
                                            </div>

                                            {/* Date & Time Info */}
                                            <div className="space-y-3">
                                                <AdminLabel icon={CalendarIcon}>{t('dashboard.bookings.details.datetime_info')}</AdminLabel>
                                                <InnerCard className="p-5 flex flex-col gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                            <CalendarIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{t('dashboard.bookings.details.date')}</p>
                                                            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                                                                {format(new Date(bookingToView.scheduledAt), "PPP", { locale: i18n.language === 'en' ? enUS : es })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 pt-3 border-t">
                                                        <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                            <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{t('dashboard.bookings.details.time')}</p>
                                                            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                                                                {format(new Date(bookingToView.scheduledAt), "p", { locale: i18n.language === 'en' ? enUS : es })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </InnerCard>
                                            </div>
                                        </div>

                                        {/* Actions Footer */}
                                        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                                            {bookingToView.status === 'pending' && (
                                                <Button className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-primary/20" variant="default" onClick={() => {
                                                    onUpdateBookingStatus(bookingToView._id, 'confirmed');
                                                    setIsBookingDetailsDialogOpen(false);
                                                }}>
                                                    <CheckCircle2 className="mr-2 h-5 w-5" />
                                                    {t('dashboard.bookings.actions.confirm')}
                                                </Button>
                                            )}
                                            {bookingToView.status !== 'completed' && bookingToView.status !== 'cancelled' && (
                                                <Button className="flex-1 rounded-2xl h-12 font-bold" variant="outline" onClick={() => {
                                                    onUpdateBookingStatus(bookingToView._id, 'completed');
                                                    setIsBookingDetailsDialogOpen(false);
                                                }}>
                                                    <div className="p-1 px-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-2 text-[10px]">FIX</div>
                                                    {t('dashboard.bookings.actions.complete')}
                                                </Button>
                                            )}
                                            {bookingToView.status !== 'cancelled' && bookingToView.status !== 'completed' && (
                                                <Button className="flex-1 rounded-2xl h-12 font-bold text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700 transition-all" variant="ghost" onClick={() => openCancelConfirmation(bookingToView)}>
                                                    <XCircle className="mr-2 h-5 w-5" />
                                                    {t('dashboard.bookings.actions.cancel')}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Cancel Confirmation Dialog */}
                    <Dialog open={isCancelConfirmDialogOpen} onOpenChange={setIsCancelConfirmDialogOpen}>
                        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{t('dashboard.bookings.cancel_confirm.title')}</DialogTitle>
                                <DialogDescription>
                                    {t('dashboard.bookings.cancel_confirm.description')}
                                </DialogDescription>
                            </DialogHeader>
                            {bookingToCancel && (
                                <div className="space-y-4 py-4">
                                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                                        <div>
                                            <span className="text-sm font-semibold">{t('dashboard.bookings.details.client_info')}: </span>
                                            <span className="text-sm">{bookingToCancel.clientName}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm font-semibold">{t('dashboard.bookings.details.service_name')}: </span>
                                            <span className="text-sm">
                                                {services.find(s => s._id === bookingToCancel.serviceId)?.name || bookingToCancel.serviceId}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-sm font-semibold">{t('dashboard.bookings.details.date')}: </span>
                                            <span className="text-sm">
                                                {format(new Date(bookingToCancel.scheduledAt), "PPP", { locale: i18n.language === 'en' ? enUS : es })}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {t('dashboard.bookings.cancel_confirm.warning')}
                                    </p>
                                </div>
                            )}
                            <DialogFooter className="flex flex-row justify-end gap-2">
                                <Button variant="outline" onClick={() => {
                                    setIsCancelConfirmDialogOpen(false);
                                    setBookingToCancel(null);
                                }}>
                                    {t('common.cancel')}
                                </Button>
                                <Button variant="destructive" onClick={handleConfirmCancel}>
                                    {t('dashboard.bookings.cancel_confirm.confirm_button')}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </div>
            </div>
        </div>
    );
};

export default BusinessDashboard;

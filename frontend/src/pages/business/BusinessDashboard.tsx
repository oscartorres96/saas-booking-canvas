import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
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
    Copy
} from "lucide-react";
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
import { BusinessThemeToggle } from "@/components/BusinessThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import useAuth from "@/auth/useAuth";
import { getBusinessById, type Business } from "@/api/businessesApi";
import { getServicesByBusiness, createService, updateService, deleteService, type Service } from "@/api/servicesApi";
import { getBookingsByBusiness, updateBooking, type Booking } from "@/api/bookingsApi";

const serviceFormSchema = z.object({
    name: z.string().min(2, { message: "El nombre es requerido" }),
    description: z.string().optional(),
    durationMinutes: z.coerce.number().min(1, { message: "Duración inválida" }),
    price: z.coerce.number().min(0, { message: "Precio inválido" }),
    active: z.boolean().default(true),
    isOnline: z.boolean().default(false),
});

const BusinessDashboard = () => {
    const { businessId } = useParams<{ businessId: string }>();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [business, setBusiness] = useState<Business | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
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
    const [activeTab, setActiveTab] = useState("dashboard");
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
        },
    });

    useEffect(() => {
        // Check authorization
        if (!user) {
            navigate("/login");
            return;
        }

        // Owner can access any business, business role must match businessId
        if (user.role === "business" && user.businessId !== businessId) {
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
        }
    }, [user, businessId, navigate]);

    useEffect(() => {
        if (business?.settings?.defaultServiceDuration) {
            const currentValues = serviceForm.getValues();
            // Only update if it matches the hardcoded default (30) and name is empty, to avoid overwriting user input
            if (currentValues.durationMinutes === 30 && currentValues.name === "") {
                serviceForm.setValue("durationMinutes", business.settings.defaultServiceDuration);
            }
        }
    }, [business, serviceForm]);

    const loadData = async () => {
        if (!businessId) return;

        try {
            setLoading(true);

            // Fetch business details
            const businessData = await getBusinessById(businessId);
            setBusiness(businessData);

            // Fetch services
            const servicesData = await getServicesByBusiness(businessId);
            setServices(servicesData);

            // Fetch bookings
            const bookingsData = await getBookingsByBusiness(businessId);
            setBookings(bookingsData);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error && 'response' in error
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;
            toast.error(errorMessage || t('common.load_error'));
        } finally {
            setLoading(false);
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
            });
            toast.success(t('dashboard.services.toasts.created'));
        } catch (error: unknown) {
            const errorMessage = error instanceof Error && 'response' in error
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;
            toast.error(errorMessage || t('dashboard.services.toasts.error_create'));
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
        } catch (error: unknown) {
            const errorMessage = error instanceof Error && 'response' in error
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;
            toast.error(errorMessage || t('dashboard.services.toasts.error_update'));
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
        } catch (error: unknown) {
            const errorMessage = error instanceof Error && 'response' in error
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;
            toast.error(errorMessage || t('dashboard.services.toasts.error_delete'));
        } finally {
            setIsDeleteServiceDialogOpen(false);
            setServiceToDelete(null);
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
                    <Button className="mt-4" onClick={() => navigate("/")}>Volver al inicio</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-black p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            {business.logoUrl && business.logoUrl !== "/placeholder.svg" ? (
                                <img
                                    src={business.logoUrl}
                                    alt="Logo"
                                    className="h-14 w-14 rounded-xl object-cover shadow-sm bg-background border"
                                />
                            ) : (
                                <div
                                    className="h-14 w-14 rounded-xl flex items-center justify-center shadow-sm border"
                                    style={{
                                        backgroundColor: business.settings?.primaryColor ? `${business.settings.primaryColor}15` : undefined, // 15 = ~10% opacity hex
                                        borderColor: business.settings?.primaryColor ? `${business.settings.primaryColor}30` : undefined
                                    }}
                                >
                                    <CalendarIcon
                                        className="h-7 w-7"
                                        style={{ color: business.settings?.primaryColor || undefined }}
                                    />
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">{business.businessName}</h1>
                                <p className="text-muted-foreground text-sm">
                                    {t('dashboard.subtitle')}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
                            <Button
                                variant="outline"
                                className="w-full md:w-auto order-last md:order-first"
                                onClick={() => window.open(`/business/${businessId}/booking`, '_blank')}
                            >
                                {t('dashboard.viewBookingPage')}
                            </Button>
                            <Button
                                variant="default"
                                className="w-full md:w-auto order-last md:order-first"
                                onClick={handleCopyInvitation}
                            >
                                <Copy className="mr-2 h-4 w-4" />
                                {t('dashboard.copyInvitation')}
                            </Button>
                            <TabsList className="order-first md:order-none w-full md:w-auto">
                                <TabsTrigger value="dashboard" className="flex-1 md:flex-none">{t('dashboard.tabs.dashboard')}</TabsTrigger>
                                <TabsTrigger value="settings" className="flex-1 md:flex-none">{t('dashboard.tabs.settings')}</TabsTrigger>
                            </TabsList>
                            <div className="flex items-center gap-2 ml-auto md:ml-0">
                                <LanguageSwitcher />
                                <BusinessThemeToggle />
                                <Button variant="outline" size="icon" onClick={logout} title="Cerrar Sesión">
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <TabsContent value="dashboard" className="space-y-6">

                        {/* Stats Cards */}
                        {/* Stats Cards */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.stats.services')}</CardTitle>
                                    <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Package className="h-4 w-4 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-semibold">{services.length}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {services.filter(s => s.active).length} {t('dashboard.stats.active_services')}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.stats.upcoming_bookings')}</CardTitle>
                                    <div className="h-8 w-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                        <Clock className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-semibold">{upcomingBookings.length}</div>
                                    <p className="text-xs text-muted-foreground mt-1">{t('dashboard.stats.future_bookings')}</p>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.stats.total_bookings')}</CardTitle>
                                    <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-semibold">{bookings.length}</div>
                                    <p className="text-xs text-muted-foreground mt-1">{t('dashboard.stats.all_bookings')}</p>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.stats.pending_bookings')}</CardTitle>
                                    <div className="h-8 w-8 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                                        <Users className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-semibold">
                                        {bookings.filter(b => b.status === 'pending').length}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{t('dashboard.stats.to_confirm')}</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Services Section */}
                        <Card className="border-none shadow-md">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>{t('dashboard.services.title')}</CardTitle>
                                        <CardDescription>{t('dashboard.services.description')}</CardDescription>
                                    </div>
                                    <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button>
                                                <Plus className="mr-2 h-4 w-4" /> {t('dashboard.services.create')}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle>{t('dashboard.services.new_title')}</DialogTitle>
                                                <DialogDescription>
                                                    {t('dashboard.services.new_description')}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <Form {...serviceForm}>
                                                <form onSubmit={serviceForm.handleSubmit(onCreateService)} className="space-y-4">
                                                    <FormField
                                                        control={serviceForm.control}
                                                        name="name"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>{t('dashboard.services.name_label')}</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder={t('dashboard.services.name_placeholder')} {...field} />
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
                                                                <FormLabel>{t('dashboard.services.desc_label')}</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder={t('dashboard.services.desc_placeholder')} {...field} />
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
                                                                    <FormLabel>{t('dashboard.services.duration_label')}</FormLabel>
                                                                    <FormControl>
                                                                        <Input type="number" {...field} />
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
                                                                    <FormLabel>{t('dashboard.services.price_label')}</FormLabel>
                                                                    <FormControl>
                                                                        <Input type="number" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                    <FormField
                                                        control={serviceForm.control}
                                                        name="isOnline"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>{t('dashboard.services.mode_label')}</FormLabel>
                                                                <Select
                                                                    value={field.value ? "online" : "offline"}
                                                                    onValueChange={(val) => field.onChange(val === "online")}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="offline">{t('dashboard.services.mode_offline')}</SelectItem>
                                                                        <SelectItem value="online">{t('dashboard.services.mode_online')}</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <DialogFooter>
                                                        <Button type="submit">{t('dashboard.services.create')}</Button>
                                                    </DialogFooter>
                                                </form>
                                            </Form>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {services.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {t('dashboard.services.empty')}
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>{t('dashboard.services.name_label')}</TableHead>
                                                    <TableHead>{t('dashboard.services.duration_label')}</TableHead>
                                                    <TableHead>{t('dashboard.services.price_label')}</TableHead>
                                                    <TableHead>{t('dashboard.services.status_header')}</TableHead>
                                                    <TableHead className="text-right">{t('dashboard.services.actions_header')}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {services.map((service) => (
                                                    <TableRow key={service._id}>
                                                        <TableCell className="font-medium">
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold">{service.name}</span>
                                                                {service.description && (
                                                                    <span className="text-xs text-muted-foreground">{service.description}</span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{service.durationMinutes} min</TableCell>
                                                        <TableCell>${service.price}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={service.active ? "default" : "secondary"}>
                                                                {service.active ? t('common.active') : t('common.inactive')}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                                        <span className="sr-only">Abrir menú</span>
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                                                                    <DropdownMenuItem onClick={() => handleCopyServiceLink(service)}>
                                                                        {t('dashboard.services.copy_link')}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => openEditService(service)}>
                                                                        {t('common.edit')}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-red-600"
                                                                        onClick={() => openDeleteService(service)}
                                                                    >
                                                                        {t('common.delete')}
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Edit Service Modal */}
                        <Dialog open={isEditServiceDialogOpen} onOpenChange={setIsEditServiceDialogOpen}>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>{t('dashboard.services.edit_title')}</DialogTitle>
                                    <DialogDescription>{t('dashboard.services.edit_description')}</DialogDescription>
                                </DialogHeader>
                                <Form {...editServiceForm}>
                                    <form onSubmit={editServiceForm.handleSubmit(onUpdateService)} className="space-y-4">
                                        <FormField
                                            control={editServiceForm.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('dashboard.services.name_label')}</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder={t('dashboard.services.name_placeholder')} {...field} />
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
                                                    <FormLabel>{t('dashboard.services.desc_label')}</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder={t('dashboard.services.desc_placeholder')} {...field} />
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
                                                        <FormLabel>{t('dashboard.services.duration_label')}</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" {...field} />
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
                                                        <FormLabel>{t('dashboard.services.price_label')}</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={editServiceForm.control}
                                            name="isOnline"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('dashboard.services.mode_label')}</FormLabel>
                                                    <Select
                                                        value={field.value ? "online" : "offline"}
                                                        onValueChange={(val) => field.onChange(val === "online")}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="offline">{t('dashboard.services.mode_offline')}</SelectItem>
                                                            <SelectItem value="online">{t('dashboard.services.mode_online')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={editServiceForm.control}
                                            name="active"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('dashboard.services.status_header')}</FormLabel>
                                                    <Select
                                                        value={field.value ? "active" : "inactive"}
                                                        onValueChange={(val) => field.onChange(val === "active")}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="active">{t('common.active')}</SelectItem>
                                                            <SelectItem value="inactive">{t('common.inactive')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <DialogFooter>
                                            <Button type="submit">{t('common.save')}</Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>

                        {/* Delete Service Modal */}
                        <Dialog open={isDeleteServiceDialogOpen} onOpenChange={setIsDeleteServiceDialogOpen}>
                            <DialogContent className="sm:max-w-[400px]">
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

                        {/* Upcoming Bookings Section */}
                        <Card className="border-none shadow-md">
                            <CardHeader>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <CardTitle>{t('dashboard.bookings.title')}</CardTitle>
                                        <CardDescription>{t('dashboard.bookings.description')}</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                        <div className="relative w-full md:w-64">
                                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder={t('dashboard.bookings.search_placeholder')}
                                                className="pl-8 w-full"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <Button variant="outline" size="icon">
                                            <Filter className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {upcomingBookings.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {t('dashboard.bookings.empty')}
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
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
                                                            <TableCell>{service?.name || booking.serviceId}</TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-col">
                                                                    <span>{format(new Date(booking.scheduledAt), "PPP", { locale: i18n.language === 'en' ? enUS : es })}</span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {format(new Date(booking.scheduledAt), "p", { locale: i18n.language === 'en' ? enUS : es })}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge className={getStatusColor(booking.status)} variant="secondary">
                                                                    {getStatusLabel(booking.status)}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                                            <span className="sr-only">{t('common.actions')}</span>
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                                                                        <DropdownMenuItem onClick={() => openBookingDetails(booking)}>{t('dashboard.bookings.actions.view_details')}</DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        {booking.status === 'pending' && (
                                                                            <DropdownMenuItem
                                                                                className="text-green-600"
                                                                                onClick={() => onUpdateBookingStatus(booking._id, 'confirmed')}
                                                                            >
                                                                                {t('dashboard.bookings.actions.confirm')}
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                                                                            <DropdownMenuItem
                                                                                className="text-blue-600"
                                                                                onClick={() => onUpdateBookingStatus(booking._id, 'completed')}
                                                                            >
                                                                                {t('dashboard.bookings.actions.complete')}
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                                                            <DropdownMenuItem
                                                                                className="text-red-600"
                                                                                onClick={() => openCancelConfirmation(booking)}
                                                                            >
                                                                                {t('dashboard.bookings.actions.cancel')}
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Booking Details Modal */}
                        <Dialog open={isBookingDetailsDialogOpen} onOpenChange={setIsBookingDetailsDialogOpen}>
                            <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                    <DialogTitle>{t('dashboard.bookings.details.title')}</DialogTitle>
                                    <DialogDescription>{t('dashboard.bookings.details.modal_description')}</DialogDescription>
                                </DialogHeader>
                                {bookingToView && (
                                    <div className="space-y-6">
                                        {/* Client Information */}
                                        <div className="space-y-3">
                                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                                {t('dashboard.bookings.details.client_info')}
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">{t('dashboard.bookings.details.name')}</p>
                                                    <p className="font-medium">{bookingToView.clientName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">{t('dashboard.bookings.details.email')}</p>
                                                    <p className="font-medium text-sm">{bookingToView.clientEmail || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">{t('dashboard.bookings.details.phone')}</p>
                                                    <p className="font-medium">{bookingToView.clientPhone || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">{t('dashboard.bookings.details.status')}</p>
                                                    <Badge className={getStatusColor(bookingToView.status)} variant="secondary">
                                                        {getStatusLabel(bookingToView.status)}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Service Information */}
                                        <div className="space-y-3">
                                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                                {t('dashboard.bookings.details.service_info')}
                                            </h3>
                                            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">{t('dashboard.bookings.details.service_name')}</p>
                                                    <p className="font-medium">
                                                        {services.find(s => s._id === bookingToView.serviceId)?.name || bookingToView.serviceId}
                                                    </p>
                                                </div>
                                                {services.find(s => s._id === bookingToView.serviceId)?.description && (
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1">{t('dashboard.bookings.details.service_description')}</p>
                                                        <p className="text-sm">
                                                            {services.find(s => s._id === bookingToView.serviceId)?.description}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* DateTime Information */}
                                        <div className="space-y-3">
                                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                                {t('dashboard.bookings.details.datetime_info')}
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">{t('dashboard.bookings.details.date')}</p>
                                                    <p className="font-medium">
                                                        {format(new Date(bookingToView.scheduledAt), "PPP", { locale: i18n.language === 'en' ? enUS : es })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">{t('dashboard.bookings.details.time')}</p>
                                                    <p className="font-medium">
                                                        {format(new Date(bookingToView.scheduledAt), "p", { locale: i18n.language === 'en' ? enUS : es })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">{t('dashboard.bookings.details.created_at')}</p>
                                                    <p className="text-sm">
                                                        {format(new Date(bookingToView.createdAt), "PPp", { locale: i18n.language === 'en' ? enUS : es })}
                                                    </p>
                                                </div>
                                                {bookingToView.updatedAt && bookingToView.updatedAt !== bookingToView.createdAt && (
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1">{t('dashboard.bookings.details.updated_at')}</p>
                                                        <p className="text-sm">
                                                            {format(new Date(bookingToView.updatedAt), "PPp", { locale: i18n.language === 'en' ? enUS : es })}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        {bookingToView.notes && (
                                            <div className="space-y-3">
                                                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                                    {t('dashboard.bookings.details.notes')}
                                                </h3>
                                                <div className="bg-muted/50 p-4 rounded-lg">
                                                    <p className="text-sm whitespace-pre-wrap">{bookingToView.notes}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-4 border-t">
                                            {bookingToView.status === 'pending' && (
                                                <Button
                                                    className="flex-1"
                                                    variant="default"
                                                    onClick={() => {
                                                        onUpdateBookingStatus(bookingToView._id, 'confirmed');
                                                        setIsBookingDetailsDialogOpen(false);
                                                    }}
                                                >
                                                    {t('dashboard.bookings.actions.confirm')}
                                                </Button>
                                            )}
                                            {bookingToView.status !== 'completed' && bookingToView.status !== 'cancelled' && (
                                                <Button
                                                    className="flex-1"
                                                    variant="outline"
                                                    onClick={() => {
                                                        onUpdateBookingStatus(bookingToView._id, 'completed');
                                                        setIsBookingDetailsDialogOpen(false);
                                                    }}
                                                >
                                                    {t('dashboard.bookings.actions.complete')}
                                                </Button>
                                            )}
                                            {bookingToView.status !== 'cancelled' && bookingToView.status !== 'completed' && (
                                                <Button
                                                    className="flex-1"
                                                    variant="destructive"
                                                    onClick={() => openCancelConfirmation(bookingToView)}
                                                >
                                                    {t('dashboard.bookings.actions.cancel')}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>

                        {/* Cancel Confirmation Dialog */}
                        <Dialog open={isCancelConfirmDialogOpen} onOpenChange={setIsCancelConfirmDialogOpen}>
                            <DialogContent className="sm:max-w-[425px]">
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
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsCancelConfirmDialogOpen(false);
                                            setBookingToCancel(null);
                                        }}
                                    >
                                        {t('common.cancel')}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleConfirmCancel}
                                    >
                                        {t('dashboard.bookings.cancel_confirm.confirm_button')}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </TabsContent>

                    <TabsContent value="settings">
                        <BusinessSettings businessId={businessId!} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default BusinessDashboard;


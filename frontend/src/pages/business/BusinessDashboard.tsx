import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
    Package
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
import { ThemeToggle } from "@/components/ThemeToggle";
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
    const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);
    const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
    const [activeTab, setActiveTab] = useState("dashboard");

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
            toast.error("No tienes acceso a este negocio");
            navigate("/");
            return;
        }

        if (user.role === "client") {
            toast.error("No tienes acceso a este panel");
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
            toast.error(errorMessage || "Error al cargar datos");
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
            toast.success("Servicio creado exitosamente");
        } catch (error: unknown) {
            const errorMessage = error instanceof Error && 'response' in error
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;
            toast.error(errorMessage || "Error al crear servicio");
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
            toast.success("Servicio actualizado");
        } catch (error: unknown) {
            const errorMessage = error instanceof Error && 'response' in error
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;
            toast.error(errorMessage || "Error al actualizar servicio");
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
            toast.success("Servicio eliminado");
        } catch (error: unknown) {
            const errorMessage = error instanceof Error && 'response' in error
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;
            toast.error(errorMessage || "Error al eliminar servicio");
        } finally {
            setIsDeleteServiceDialogOpen(false);
            setServiceToDelete(null);
        }
    };

    const onUpdateBookingStatus = async (bookingId: string, newStatus: 'confirmed' | 'completed' | 'cancelled') => {
        try {
            await updateBooking(bookingId, { status: newStatus });
            setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: newStatus } : b));
            toast.success(`Cita marcada como ${getStatusLabel(newStatus).toLowerCase()}`);
        } catch (error) {
            toast.error("Error al actualizar el estado de la cita");
            console.error(error);
        }
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
        switch (status) {
            case "confirmed": return "Confirmada";
            case "pending": return "Pendiente";
            case "completed": return "Completada";
            case "cancelled": return "Cancelada";
            default: return status;
        }
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
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">{business.businessName}</h1>
                            <p className="text-muted-foreground text-sm">
                                Panel de gestión de tu negocio
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={() => window.open(`/business/${businessId}/booking`, '_blank')}
                            >
                                Ver página de reservas
                            </Button>
                            <TabsList>
                                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                                <TabsTrigger value="settings">Configuración</TabsTrigger>
                            </TabsList>
                            <ThemeToggle />
                            <Button variant="outline" onClick={logout}>
                                Cerrar Sesión
                            </Button>
                        </div>
                    </div>

                    <TabsContent value="dashboard" className="space-y-6">

                        {/* Stats Cards */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Servicios</CardTitle>
                                    <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Package className="h-4 w-4 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-semibold">{services.length}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {services.filter(s => s.active).length} activos
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Próximas Citas</CardTitle>
                                    <div className="h-8 w-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                        <Clock className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-semibold">{upcomingBookings.length}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Agendadas a futuro</p>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Reservas</CardTitle>
                                    <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-semibold">{bookings.length}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Todas las citas</p>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
                                    <div className="h-8 w-8 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                                        <Users className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-semibold">
                                        {bookings.filter(b => b.status === 'pending').length}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Por confirmar</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Services Section */}
                        <Card className="border-none shadow-md">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Servicios</CardTitle>
                                        <CardDescription>Gestiona los servicios que ofreces.</CardDescription>
                                    </div>
                                    <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button>
                                                <Plus className="mr-2 h-4 w-4" /> Crear Servicio
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle>Nuevo Servicio</DialogTitle>
                                                <DialogDescription>
                                                    Crea un nuevo servicio para tu negocio.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <Form {...serviceForm}>
                                                <form onSubmit={serviceForm.handleSubmit(onCreateService)} className="space-y-4">
                                                    <FormField
                                                        control={serviceForm.control}
                                                        name="name"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Nombre del Servicio</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="Ej. Corte de cabello" {...field} />
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
                                                                <FormLabel>Descripción (opcional)</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="Descripción del servicio" {...field} />
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
                                                                    <FormLabel>Duración (min)</FormLabel>
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
                                                                    <FormLabel>Precio ($)</FormLabel>
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
                                                                <FormLabel>Modalidad</FormLabel>
                                                                <Select
                                                                    value={field.value ? "online" : "offline"}
                                                                    onValueChange={(val) => field.onChange(val === "online")}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="offline">Solo presencial</SelectItem>
                                                                        <SelectItem value="online">Servicio en línea</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <DialogFooter>
                                                        <Button type="submit">Crear Servicio</Button>
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
                                        No hay servicios creados. Crea tu primer servicio.
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nombre</TableHead>
                                                <TableHead>Duración</TableHead>
                                                <TableHead>Precio</TableHead>
                                                <TableHead>Estado</TableHead>
                                                <TableHead className="text-right">Acciones</TableHead>
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
                                                            {service.active ? "Activo" : "Inactivo"}
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
                                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                                <DropdownMenuItem onClick={() => openEditService(service)}>
                                                                    Editar
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => openDeleteService(service)}
                                                                >
                                                                    Eliminar
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>

                        {/* Edit Service Modal */}
                        <Dialog open={isEditServiceDialogOpen} onOpenChange={setIsEditServiceDialogOpen}>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Editar Servicio</DialogTitle>
                                    <DialogDescription>Modifica los datos del servicio.</DialogDescription>
                                </DialogHeader>
                                <Form {...editServiceForm}>
                                    <form onSubmit={editServiceForm.handleSubmit(onUpdateService)} className="space-y-4">
                                        <FormField
                                            control={editServiceForm.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nombre del Servicio</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ej. Corte de cabello" {...field} />
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
                                                    <FormLabel>Descripción (opcional)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Descripción del servicio" {...field} />
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
                                                        <FormLabel>Duración (min)</FormLabel>
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
                                                        <FormLabel>Precio ($)</FormLabel>
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
                                                    <FormLabel>Modalidad</FormLabel>
                                                    <Select
                                                        value={field.value ? "online" : "offline"}
                                                        onValueChange={(val) => field.onChange(val === "online")}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="offline">Solo presencial</SelectItem>
                                                            <SelectItem value="online">Servicio en lAnea</SelectItem>
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
                                                    <FormLabel>Estado</FormLabel>
                                                    <Select
                                                        value={field.value ? "active" : "inactive"}
                                                        onValueChange={(val) => field.onChange(val === "active")}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="active">Activo</SelectItem>
                                                            <SelectItem value="inactive">Inactivo</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <DialogFooter>
                                            <Button type="submit">Guardar cambios</Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>

                        {/* Delete Service Modal */}
                        <Dialog open={isDeleteServiceDialogOpen} onOpenChange={setIsDeleteServiceDialogOpen}>
                            <DialogContent className="sm:max-w-[400px]">
                                <DialogHeader>
                                    <DialogTitle>Eliminar servicio</DialogTitle>
                                    <DialogDescription>
                                        Esta acción no se puede deshacer. ¿Deseas eliminar "{serviceToDelete?.name}"?
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="flex flex-row justify-end gap-2">
                                    <Button variant="ghost" onClick={() => setIsDeleteServiceDialogOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button variant="destructive" onClick={onDeleteService}>
                                        Eliminar
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Upcoming Bookings Section */}
                        <Card className="border-none shadow-md">
                            <CardHeader>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <CardTitle>Próximas Citas</CardTitle>
                                        <CardDescription>Gestiona las reservas de tus clientes.</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                        <div className="relative w-full md:w-64">
                                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Buscar cliente..."
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
                                        No hay citas próximas.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Cliente</TableHead>
                                                    <TableHead>Servicio</TableHead>
                                                    <TableHead>Fecha y Hora</TableHead>
                                                    <TableHead>Estado</TableHead>
                                                    <TableHead className="text-right">Acciones</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {upcomingBookings.map((booking) => {
                                                    const service = services.find(s => s._id === booking.serviceId);
                                                    return (
                                                        <TableRow key={booking._id}>
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
                                                                    <span>{format(new Date(booking.scheduledAt), "PPP", { locale: es })}</span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {format(new Date(booking.scheduledAt), "p", { locale: es })}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge className={getStatusColor(booking.status)} variant="secondary">
                                                                    {getStatusLabel(booking.status)}
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
                                                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                                        <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        {booking.status === 'pending' && (
                                                                            <DropdownMenuItem
                                                                                className="text-green-600"
                                                                                onClick={() => onUpdateBookingStatus(booking._id, 'confirmed')}
                                                                            >
                                                                                Confirmar
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                                                                            <DropdownMenuItem
                                                                                className="text-blue-600"
                                                                                onClick={() => onUpdateBookingStatus(booking._id, 'completed')}
                                                                            >
                                                                                Marcar como Completada
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                                                            <DropdownMenuItem
                                                                                className="text-red-600"
                                                                                onClick={() => onUpdateBookingStatus(booking._id, 'cancelled')}
                                                                            >
                                                                                Cancelar
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
                    </TabsContent>

                    <TabsContent value="settings">
                        \u003cBusinessSettings businessId={businessId!} /\u003e
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default BusinessDashboard;


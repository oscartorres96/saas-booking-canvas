import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    Calendar as CalendarIcon,
    Clock,
    DollarSign,
    CheckCircle2,
    Building2
} from "lucide-react";
import useAuth from "@/auth/useAuth";
import { getBusinessById, type Business } from "@/api/businessesApi";
import { getServicesByBusiness, type Service } from "@/api/servicesApi";
import { createBooking, getBookingsByClient, type Booking } from "@/api/bookingsApi";
import { Badge } from "@/components/ui/badge";
import { useSlots } from "@/hooks/useSlots";
import { BusinessThemeToggle } from "@/components/BusinessThemeToggle";
import { useTheme } from "@/hooks/useTheme";

const bookingFormSchema = z.object({
    serviceId: z.string().min(1, { message: "Selecciona un servicio" }),
    date: z.date({ required_error: "Fecha requerida" }),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Hora inválida (HH:MM)" }),
    clientName: z.string().min(2, { message: "El nombre es requerido" }),
    clientEmail: z.string().email({ message: "Email inválido" }),
    clientPhone: z.string().min(8, { message: "Teléfono inválido" }),
    notes: z.string().optional(),
});

const BusinessBookingPage = () => {
    const { businessId } = useParams<{ businessId: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    const [business, setBusiness] = useState<Business | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [myBookings, setMyBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const { theme, setTheme } = useTheme();

    const form = useForm<z.infer<typeof bookingFormSchema>>({
        resolver: zodResolver(bookingFormSchema),
        defaultValues: {
            serviceId: "",
            date: undefined,
            time: "",
            clientName: user?.name || "",
            clientEmail: user?.email || "",
            clientPhone: "",
            notes: "",
        },
    });

    const selectedDate = form.watch("date");
    const selectedServiceId = form.watch("serviceId");

    const { data: slots, isLoading: isLoadingSlots } = useSlots(
        businessId,
        selectedDate,
        selectedServiceId
    );

    useEffect(() => {
        if (businessId) {
            loadData();
        }
    }, [businessId, user]);

    // Apply custom colors when business data is loaded AND theme is custom
    useEffect(() => {
        if (theme === 'custom' && business?.settings?.primaryColor) {
            const primaryHsl = hexToHSL(business.settings.primaryColor);
            const secondaryHsl = business.settings.secondaryColor ? hexToHSL(business.settings.secondaryColor) : null;

            if (primaryHsl) {
                document.documentElement.style.setProperty('--primary', primaryHsl);

                // Calculate contrast for foreground
                const isDark = isColorDark(business.settings.primaryColor);
                document.documentElement.style.setProperty('--primary-foreground', isDark ? '0 0% 100%' : '0 0% 0%');
                document.documentElement.style.setProperty('--ring', primaryHsl);
            }

            if (secondaryHsl) {
                document.documentElement.style.setProperty('--secondary', secondaryHsl);
                const isSecondaryDark = isColorDark(business.settings.secondaryColor);
                document.documentElement.style.setProperty('--secondary-foreground', isSecondaryDark ? '0 0% 100%' : '0 0% 0%');
            }
        } else {
            // Reset to default when not using custom theme
            document.documentElement.style.removeProperty('--primary');
            document.documentElement.style.removeProperty('--primary-foreground');
            document.documentElement.style.removeProperty('--ring');
            document.documentElement.style.removeProperty('--secondary');
            document.documentElement.style.removeProperty('--secondary-foreground');
        }

        // Return cleanup function
        return () => {
            document.documentElement.style.removeProperty('--primary');
            document.documentElement.style.removeProperty('--primary-foreground');
            document.documentElement.style.removeProperty('--ring');
            document.documentElement.style.removeProperty('--secondary');
            document.documentElement.style.removeProperty('--secondary-foreground');
        };
    }, [business, theme]);

    // Auto-set custom theme if business has custom colors and no theme preference is saved for this business
    useEffect(() => {
        if (!businessId || !business) return;

        const businessThemeKey = `theme-business-${businessId}`;
        const savedThemeForBusiness = localStorage.getItem(businessThemeKey);

        // If no theme preference for THIS business AND business has custom colors, set to custom
        if (!savedThemeForBusiness && business.settings?.primaryColor) {
            setTheme('custom');
            localStorage.setItem(businessThemeKey, 'custom');
        } else if (savedThemeForBusiness && savedThemeForBusiness !== theme) {
            // Restore saved preference for this business
            setTheme(savedThemeForBusiness as any);
        }
    }, [business, businessId]);

    // Save theme preference when user changes it
    useEffect(() => {
        if (!businessId) return;
        const businessThemeKey = `theme-business-${businessId}`;
        localStorage.setItem(businessThemeKey, theme);
    }, [theme, businessId]);

    const loadData = async () => {
        if (!businessId) return;

        try {
            setLoading(true);

            const businessData = await getBusinessById(businessId);
            setBusiness(businessData);

            const servicesData = await getServicesByBusiness(businessId);
            // Mostrar todos los servicios activos (incluidos los que son en linea)
            setServices(servicesData.filter(s => s.active !== false));

            if (user?.userId) {
                try {
                    const bookingsData = await getBookingsByClient(user.userId);
                    setMyBookings(bookingsData.filter(b => b.businessId === businessId));
                } catch {
                    console.log("Could not fetch user bookings");
                }
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Error al cargar datos");
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (values: z.infer<typeof bookingFormSchema>) => {
        if (!businessId) return;

        try {
            const [hours, minutes] = values.time.split(":").map(Number);
            const scheduledDate = new Date(values.date);
            scheduledDate.setHours(hours, minutes, 0, 0);

            const bookingData = {
                businessId,
                serviceId: values.serviceId,
                clientName: values.clientName,
                clientEmail: values.clientEmail,
                clientPhone: values.clientPhone,
                scheduledAt: scheduledDate.toISOString(),
                status: "pending" as const,
                notes: values.notes,
            };

            const booking = await createBooking(bookingData);

            setBookingSuccess(true);
            toast.success("¡Reserva creada exitosamente! Redirigiendo...");

            setTimeout(() => {
                navigate(
                    `/my-bookings?email=${encodeURIComponent(values.clientEmail)}&code=${encodeURIComponent(booking.accessCode || "")}&businessId=${encodeURIComponent(businessId)}`
                );
            }, 2000);

            if (user?.userId) {
                const bookingsData = await getBookingsByClient(user.userId);
                setMyBookings(bookingsData.filter(b => b.businessId === businessId));
            }

            form.reset({
                serviceId: "",
                date: undefined,
                time: "09:00",
                clientName: user?.name || "",
                clientEmail: user?.email || "",
                clientPhone: "",
                notes: "",
            });
            setSelectedService(null);
        } catch (error: any) {
            const errData = error?.response?.data;
            if (errData?.code === "BOOKING_ALREADY_EXISTS") {
                const params = new URLSearchParams({
                    email: values.clientEmail,
                    ...(errData.accessCode ? { code: errData.accessCode } : {}),
                    ...(businessId ? { businessId } : {}),
                });
                toast.error("Ya tienes una cita para ese dia. Consulta tus reservas para cancelarla o reagendar.", {
                    action: {
                        label: "Ir a Mis reservas",
                        onClick: () => navigate(`/my-bookings?${params.toString()}`),
                    },
                });
                return;
            }
            toast.error(errData?.message || "Error al crear reserva");
        }
    };

    // Prefill from query params (coming from "Volver a reservar" or shared link)
    useEffect(() => {
        const serviceIdParam = searchParams.get("serviceId");
        const nameParam = searchParams.get("name");
        const emailParam = searchParams.get("email");
        const phoneParam = searchParams.get("phone");

        // Only attempt to select service if services are loaded
        if (serviceIdParam && services.length > 0) {
            const service = services.find(s => s._id === serviceIdParam);
            if (service) {
                if (form.getValues("serviceId") !== serviceIdParam) {
                    handleServiceSelect(serviceIdParam);
                }
            }
        }

        // These can be set immediately as they don't depend on async data
        if (nameParam && form.getValues("clientName") !== nameParam) {
            form.setValue("clientName", nameParam);
        }
        if (emailParam && form.getValues("clientEmail") !== emailParam) {
            form.setValue("clientEmail", emailParam);
        }
        if (phoneParam && form.getValues("clientPhone") !== phoneParam) {
            form.setValue("clientPhone", phoneParam);
        }
    }, [searchParams, services]);

    const handleServiceSelect = (serviceId: string) => {
        const service = services.find(s => s._id === serviceId);
        setSelectedService(service || null);
        form.setValue("serviceId", serviceId);
    };

    const isDateDisabled = (date: Date) => {
        // Disable past dates
        if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
            return true;
        }

        // Disable days that are closed according to business hours
        if (business?.settings?.businessHours) {
            const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
            const dayOfWeek = dayNames[date.getDay()];

            const dayConfig = business.settings.businessHours.find(
                (bh: any) => bh.day.toLowerCase() === dayOfWeek
            );

            // If day is explicitly set as closed or not configured
            if (!dayConfig || dayConfig.isOpen === false) {
                return true;
            }

            // If day has no intervals and no legacy times, it's closed
            if (!dayConfig.intervals?.length && !dayConfig.startTime) {
                return true;
            }
        }

        return false;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-200"></div>
                    <div className="h-4 w-48 bg-slate-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!business) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">Negocio no encontrado</h2>
                    <Button className="mt-4" onClick={() => navigate("/")}>Volver al inicio</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="bg-card border-b border-border shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {business.logoUrl ? (
                            <div className="h-16 w-16 rounded-xl overflow-hidden flex items-center justify-center bg-muted">
                                <img
                                    src={business.logoUrl}
                                    alt={`${business.businessName} logo`}
                                    className="h-full w-full object-contain"
                                    onError={(e) => {
                                        // Fallback to icon if image fails to load
                                        e.currentTarget.style.display = 'none';
                                        const parent = e.currentTarget.parentElement;
                                        if (parent) {
                                            parent.innerHTML = '<div class="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center"><svg class="h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M9 8h1"/><path d="M14 8h1"/><path d="M6 21V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17"/></svg></div>';
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-8 w-8 text-primary" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold">{business.businessName}</h1>
                            <p className="text-sm text-muted-foreground">Reserva tu cita en línea</p>
                        </div>
                    </div>
                    <BusinessThemeToggle hasCustomTheme={!!business.settings?.primaryColor} />
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
                {bookingSuccess && (
                    <Card className="border-green-200 bg-green-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                                <div>
                                    <h3 className="font-semibold text-green-900">¡Reserva confirmada!</h3>
                                    <p className="text-sm text-green-700">
                                        Recibirás un correo de confirmación (si ingresaste tu email).
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Nuestros Servicios</CardTitle>
                        <CardDescription>Selecciona el servicio que deseas reservar</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {services.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No hay servicios disponibles en este momento.
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {services.map((service) => (
                                    <Card
                                        key={service._id}
                                        className={cn(
                                            "cursor-pointer transition-all hover:shadow-md",
                                            selectedService?._id === service._id && "ring-2 ring-primary"
                                        )}
                                        onClick={() => handleServiceSelect(service._id)}
                                    >
                                        <CardHeader>
                                            <CardTitle className="text-lg">{service.name}</CardTitle>
                                            {service.description && (
                                                <CardDescription>{service.description}</CardDescription>
                                            )}
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Clock className="h-4 w-4" />
                                                <span>{service.durationMinutes} minutos</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                                <DollarSign className="h-4 w-4" />
                                                <span>${service.price}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Agendar Cita</CardTitle>
                        <CardDescription>Completa el formulario para reservar tu cita</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="serviceId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Servicio</FormLabel>
                                            <Select onValueChange={(val) => { field.onChange(val); handleServiceSelect(val); }} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona un servicio" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {services.map((service) => (
                                                        <SelectItem key={service._id} value={service._id}>
                                                            {service.name} - ${service.price}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="date"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Fecha</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "PPP", { locale: es })
                                                                ) : (
                                                                    <span>Seleccionar fecha</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={(date) => {
                                                                field.onChange(date);
                                                                form.setValue("time", ""); // Reset time when date changes
                                                            }}
                                                            disabled={isDateDisabled}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="time"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Hora</FormLabel>
                                                <FormControl>
                                                    <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-2">
                                                        {!selectedServiceId ? (
                                                            <div className="col-span-full text-center text-sm text-muted-foreground py-4 border-2 border-dashed rounded-md">
                                                                ⬆️ Primero selecciona un servicio
                                                            </div>
                                                        ) : !selectedDate ? (
                                                            <div className="col-span-full text-center text-sm text-muted-foreground py-4 border-2 border-dashed rounded-md">
                                                                ⬅️ Selecciona una fecha
                                                            </div>
                                                        ) : isLoadingSlots ? (
                                                            <div className="col-span-full text-center text-sm text-muted-foreground py-4">
                                                                ⏳ Cargando horarios...
                                                            </div>
                                                        ) : slots?.length === 0 ? (
                                                            <div className="col-span-full text-center text-sm text-muted-foreground py-4 border-2 border-dashed rounded-md border-orange-300 bg-orange-50">
                                                                ❌ No hay horarios disponibles para esta fecha
                                                            </div>
                                                        ) : (
                                                            slots?.map((slot) => (
                                                                <Button
                                                                    key={slot}
                                                                    type="button"
                                                                    variant={field.value === slot ? "default" : "outline"}
                                                                    size="sm"
                                                                    className={cn(
                                                                        "w-full",
                                                                        field.value === slot && "bg-primary text-primary-foreground"
                                                                    )}
                                                                    onClick={() => field.onChange(slot)}
                                                                >
                                                                    {slot}
                                                                </Button>
                                                            ))
                                                        )}
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="clientName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre Completo</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Tu nombre" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="clientEmail"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input type="email" required placeholder="tu@email.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="clientPhone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Teléfono</FormLabel>
                                                <FormControl>
                                                    <PhoneInput
                                                        country={business?.settings?.language?.startsWith('en') ? 'us' : 'mx'}
                                                        enableSearch
                                                        countryCodeEditable={false}
                                                        value={field.value}
                                                        onChange={(value) => field.onChange(value)}
                                                        placeholder={business?.settings?.language?.startsWith('en') ? '+1 (555) 000-0000' : '+52 55 1234 5678'}
                                                        containerClass="w-full"
                                                        inputClass="!w-full !h-10 !text-base !bg-background !border !border-input !rounded-md !pl-14 !text-foreground focus:!ring-2 focus:!ring-ring focus:!ring-offset-2"
                                                        buttonClass="!h-10 !bg-background !border !border-input !rounded-l-md !px-3"
                                                        dropdownClass="!bg-popover !text-foreground !shadow-lg !border !rounded-md"
                                                        inputStyle={{ paddingLeft: '3.5rem' }}
                                                        inputProps={{ required: true }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Notas (opcional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Información adicional..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full" size="lg">
                                    Confirmar Reserva
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {myBookings.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Mis Reservas</CardTitle>
                            <CardDescription>Tus citas agendadas en {business.businessName}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {myBookings.map((booking) => {
                                    const service = services.find(s => s._id === booking.serviceId);
                                    return (
                                        <div key={booking._id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="space-y-1">
                                                <p className="font-semibold">{service?.name || "Servicio"}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {format(new Date(booking.scheduledAt), "PPP 'a las' p", { locale: es })}
                                                </p>
                                                {booking.accessCode && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Código de acceso: <span className="font-medium text-foreground">{booking.accessCode}</span>
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                                                {booking.status === "confirmed" ? "Confirmada" :
                                                    booking.status === "pending" ? "Pendiente" :
                                                        booking.status === "completed" ? "Completada" : "Cancelada"}
                                            </Badge>
                                        </div>
                                    );
                                })}
                                <div className="pt-2">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => navigate(`/my-bookings?businessId=${businessId}`)}
                                    >
                                        Ver todas mis reservas (usa tu código de acceso)
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default BusinessBookingPage;

// Helper to convert hex to HSL (Tailwind format: "H S% L%")
function hexToHSL(hex: string): string | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    let r = parseInt(result[1], 16);
    let g = parseInt(result[2], 16);
    let b = parseInt(result[3], 16);
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    const hDeg = Math.round(h * 360);
    const sPct = Math.round(s * 100);
    const lPct = Math.round(l * 100);
    return `${hDeg} ${sPct}% ${lPct}%`;
}

function isColorDark(hex: string): boolean {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return false;
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);

    // Perceived brightness formula
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128; // If less than 128, it IS dark
}

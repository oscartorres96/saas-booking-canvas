import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { lookupBookings, cancelBookingPublic, type Booking } from "@/api/bookingsApi";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";

const lookupSchema = z.object({
    clientEmail: z.string().email({ message: "Correo inválido" }),
    accessCode: z.string().min(4, { message: "Ingresa tu código de acceso" }),
    businessId: z.string().optional(),
});

const MyBookings = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const form = useForm<z.infer<typeof lookupSchema>>({
        resolver: zodResolver(lookupSchema),
        defaultValues: {
            clientEmail: searchParams.get("email") || "",
            accessCode: searchParams.get("code") || "",
            businessId: "",
        },
    });

    // Auto-search if params are present
    useEffect(() => {
        const email = searchParams.get("email");
        const code = searchParams.get("code");
        if (email && code) {
            form.handleSubmit(onSubmit)();
        }
    }, [searchParams]);

    const onSubmit = async (values: z.infer<typeof lookupSchema>) => {
        try {
            setLoading(true);
            const results = await lookupBookings({
                clientEmail: values.clientEmail.trim(),
                accessCode: values.accessCode.trim(),
                businessId: values.businessId || undefined,
            });
            const now = new Date();
            const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
            const filtered = results.filter((b) => {
                if (b.status !== 'cancelled') return true;
                const createdAt = b.createdAt ? new Date(b.createdAt) : null;
                if (!createdAt) return true;
                return createdAt >= threeDaysAgo;
            });
            setBookings(filtered);
        } catch (error: unknown) {
            setBookings([]);
            form.setError("accessCode", { message: "No encontramos reservas con esos datos" });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (bookingId: string) => {
        if (!confirm("¿Estás seguro de que quieres cancelar esta reserva?")) return;

        try {
            const values = form.getValues();
            await cancelBookingPublic({
                bookingId,
                clientEmail: values.clientEmail,
                accessCode: values.accessCode,
            });

            // Refresh list
            const results = await lookupBookings({
                clientEmail: values.clientEmail.trim(),
                accessCode: values.accessCode.trim(),
                businessId: values.businessId || undefined,
            });
            setBookings(results);
        } catch (error) {
            alert("Error al cancelar la reserva");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 transition-colors duration-300">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 sm:space-y-8 relative">
                <div className="absolute top-4 right-4 md:top-12 md:right-8">
                    <ThemeToggle />
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                        BookPro
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50">Mis reservas</h1>
                    <p className="text-muted-foreground">
                        Consulta tus citas con tu correo y el código de acceso que recibiste al reservar.
                    </p>
                </div>

                <Card className="dark:bg-slate-900/50 dark:border-slate-800">
                    <CardHeader>
                        <CardTitle>Buscar reservas</CardTitle>
                        <CardDescription>Introduce tus datos para ver tus citas.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="clientEmail"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-1">
                                            <FormLabel>Correo</FormLabel>
                                            <FormControl>
                                                <Input placeholder="tu@email.com" {...field} className="dark:bg-slate-950" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="accessCode"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-1">
                                            <FormLabel>
                                                Código de acceso{" "}
                                                <span className="text-xs text-muted-foreground hidden sm:inline">(lo recibiste en el correo de confirmación)</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej. 123456" {...field} className="dark:bg-slate-950" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="businessId"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>ID de negocio (opcional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Deja en blanco para ver todos tus negocios" {...field} className="dark:bg-slate-950" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="md:col-span-2 flex justify-end">
                                    <Button type="submit" disabled={loading}>
                                        {loading ? "Buscando..." : "Buscar reservas"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {bookings.length > 0 && (
                    <Card className="dark:bg-slate-900/50 dark:border-slate-800">
                        <CardHeader>
                            <CardTitle>Resultados</CardTitle>
                            <CardDescription>Tus próximas y pasadas reservas.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {bookings.map((booking) => (
                                <div key={booking._id} className="p-4 rounded-lg border bg-white dark:bg-slate-950 dark:border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="font-semibold text-slate-900 dark:text-slate-50">{booking.serviceName || "Servicio"}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(booking.scheduledAt), "PPPp", { locale: es })}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={booking.status === 'cancelled' ? 'destructive' : 'secondary'}
                                            className="capitalize"
                                        >
                                            {booking.status === 'cancelled' ? 'Cancelada' : booking.status}
                                        </Badge>
                                    </div>
                                    <Separator className="dark:bg-slate-800" />
                                    <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                        <p>Cliente: {booking.clientName}</p>
                                        {booking.businessId && <p className="break-all">ID Negocio: {booking.businessId}</p>}
                                        {booking.accessCode && <p>Código de acceso: {booking.accessCode}</p>}
                                        {booking.status === 'cancelled' && (
                                            <p className="text-xs text-muted-foreground">
                                                Reserva cancelada (visible por 3 días desde su creación).
                                            </p>
                                        )}
                                    </div>
                                    <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2">
                                        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleCancel(booking._id)}
                                            >
                                                Cancelar reserva
                                            </Button>
                                        )}
                                        {(() => {
                                            const targetBusinessId = booking.businessId || form.getValues().businessId;
                                            const disabled = !targetBusinessId;
                                            const scheduled = booking.scheduledAt ? new Date(booking.scheduledAt) : null;
                                            const params = new URLSearchParams({
                                                ...(booking.serviceId ? { serviceId: booking.serviceId } : {}),
                                                ...(booking.clientName ? { name: booking.clientName } : {}),
                                                ...(booking.clientEmail ? { email: booking.clientEmail } : {}),
                                                ...(booking.clientPhone ? { phone: booking.clientPhone } : {}),
                                            });
                                            return (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={disabled}
                                                    onClick={() => {
                                                        if (disabled) return;
                                                        const qs = params.toString();
                                                        navigate(`/business/${targetBusinessId}/booking${qs ? `?${qs}` : ''}`);
                                                    }}
                                                >
                                                    Volver a reservar
                                                </Button>
                                            );
                                        })()}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {bookings.length === 0 && !loading && (
                    <p className="text-sm text-muted-foreground text-center">
                        No hay reservas para mostrar. Ingresa tu correo y código de acceso.
                    </p>
                )}
            </div>
        </div>
    );
};

export default MyBookings;

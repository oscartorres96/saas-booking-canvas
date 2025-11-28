import { useState } from "react";
import { useForm } from "react-hook-form";
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

const lookupSchema = z.object({
    clientEmail: z.string().email({ message: "Correo inválido" }),
    accessCode: z.string().min(4, { message: "Ingresa tu código de acceso" }),
    businessId: z.string().optional(),
});

const MyBookings = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof lookupSchema>>({
        resolver: zodResolver(lookupSchema),
        defaultValues: {
            clientEmail: "",
            accessCode: "",
            businessId: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof lookupSchema>) => {
        try {
            setLoading(true);
            const results = await lookupBookings({
                clientEmail: values.clientEmail.trim(),
                accessCode: values.accessCode.trim(),
                businessId: values.businessId || undefined,
            });
            setBookings(results);
        } catch (error: any) {
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
        <div className="min-h-screen bg-slate-50/60">
            <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
                <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        BookPro
                    </p>
                    <h1 className="text-3xl font-bold text-slate-900">Mis reservas</h1>
                    <p className="text-muted-foreground">
                        Consulta tus citas con tu correo y el código de acceso que recibiste al reservar.
                    </p>
                </div>

                <Card>
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
                                                <Input placeholder="tu@email.com" {...field} />
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
                                            <FormLabel>Código de acceso</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej. 123456" {...field} />
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
                                                <Input placeholder="Deja en blanco para ver todos tus negocios" {...field} />
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
                    <Card>
                        <CardHeader>
                            <CardTitle>Resultados</CardTitle>
                            <CardDescription>Tus próximas y pasadas reservas.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {bookings.map((booking) => (
                                <div key={booking._id} className="p-4 rounded-lg border bg-white space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="font-semibold text-slate-900">{booking.serviceName || "Servicio"}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(booking.scheduledAt), "PPPp", { locale: es })}
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className="capitalize">
                                            {booking.status}
                                        </Badge>
                                    </div>
                                    <Separator />
                                    <div className="text-sm text-slate-600 space-y-1">
                                        <p>Cliente: {booking.clientName}</p>
                                        {booking.businessId && <p>ID Negocio: {booking.businessId}</p>}
                                        {booking.accessCode && <p>Código de acceso: {booking.accessCode}</p>}
                                    </div>
                                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                        <div className="pt-2 flex justify-end">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleCancel(booking._id)}
                                            >
                                                Cancelar reserva
                                            </Button>
                                        </div>
                                    )}
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

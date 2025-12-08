import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthContext } from "@/auth/AuthContext";
import { getBusinessById, updateBusinessSettings } from "@/api/businessesApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { BusinessHoursForm, daysOfWeek } from "./BusinessHoursForm";

const intervalSchema = z.object({
    startTime: z.string(),
    endTime: z.string(),
});

const formSchema = z.object({
    businessName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    logoUrl: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
    primaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Color inválido").optional(),
    secondaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Color inválido").optional(),
    description: z.string().max(500, "Máximo 500 caracteres").optional(),
    defaultServiceDuration: z.coerce.number().min(5, "Mínimo 5 minutos").default(30),
    businessHours: z.array(z.object({
        day: z.string(),
        isOpen: z.boolean(),
        intervals: z.array(intervalSchema).min(1, "Agrega al menos un intervalo"),
    })).superRefine((val, ctx) => {
        val.forEach((day, idx) => {
            if (!day.isOpen) return;
            const sorted = [...day.intervals].sort((a, b) => a.startTime.localeCompare(b.startTime));
            for (let i = 0; i < sorted.length; i++) {
                const { startTime, endTime } = sorted[i];
                if (startTime >= endTime) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "La hora de inicio debe ser antes que la de fin",
                        path: ["businessHours", idx, "intervals", i, "startTime"],
                    });
                }
                if (i > 0) {
                    const prev = sorted[i - 1];
                    if (startTime < prev.endTime) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: "Los intervalos no pueden traslaparse",
                            path: ["businessHours", idx, "intervals", i, "startTime"],
                        });
                    }
                }
            }
        });
    }),
});

export function BusinessSettings({ businessId }: { businessId: string }) {
    const { user } = useAuthContext();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            businessName: "",
            logoUrl: "",
            primaryColor: "#000000",
            secondaryColor: "#ffffff",
            description: "",
            defaultServiceDuration: 30,
            businessHours: daysOfWeek.map(d => ({
                day: d.key,
                isOpen: true,
                intervals: [{ startTime: "09:00", endTime: "18:00" }],
            }))
        },
    });

    useEffect(() => {
        async function loadSettings() {
            if (!businessId) return;
            try {
                const business = await getBusinessById(businessId);
                form.reset({
                    businessName: business.businessName || business.name || "",
                    logoUrl: business.logoUrl || "",
                    primaryColor: business.settings?.primaryColor || "#000000",
                    secondaryColor: business.settings?.secondaryColor || "#ffffff",
                    description: business.settings?.description || "",
                    defaultServiceDuration: business.settings?.defaultServiceDuration || 30,
                    businessHours: business.settings?.businessHours?.length
                        ? business.settings.businessHours.map((bh) => ({
                            day: bh.day,
                            isOpen: bh.isOpen ?? true,
                            intervals: bh.intervals && bh.intervals.length > 0
                                ? bh.intervals
                                : [{
                                    startTime: bh.startTime || "09:00",
                                    endTime: bh.endTime || "18:00",
                                }],
                        }))
                        : daysOfWeek.map(d => ({
                            day: d.key,
                            isOpen: true,
                            intervals: [{ startTime: "09:00", endTime: "18:00" }],
                        }))
                });
            } catch (error) {
                toast.error("Error al cargar configuración");
            } finally {
                setIsLoading(false);
            }
        }
        loadSettings();
    }, [businessId, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!businessId) return;
        setIsSaving(true);
        try {
            await updateBusinessSettings(businessId, values);
            toast.success("Configuración guardada");
        } catch (error) {
            toast.error("Error al guardar");
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Configuración del Negocio</h2>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Cambios
                    </Button>
                </div>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList>
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="branding">Marca</TabsTrigger>
                        <TabsTrigger value="hours">Horarios</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general">
                        <Card>
                            <CardHeader>
                                <CardTitle>Información General</CardTitle>
                                <CardDescription>Detalles básicos de tu negocio visible para los clientes.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="businessName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre del Negocio</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descripción Corta</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="defaultServiceDuration"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Duración por defecto de servicios (min)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="logoUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>URL del Logo</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="https://..." />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="branding">
                        <Card>
                            <CardHeader>
                                <CardTitle>Apariencia</CardTitle>
                                <CardDescription>Personaliza los colores de tu página de reservas.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="primaryColor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Color Primario</FormLabel>
                                                <div className="flex gap-2">
                                                    <Input type="color" className="w-12 p-1 h-10" {...field} />
                                                    <Input {...field} />
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="secondaryColor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Color Secundario</FormLabel>
                                                <div className="flex gap-2">
                                                    <Input type="color" className="w-12 p-1 h-10" {...field} />
                                                    <Input {...field} />
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="hours">
                        <Card>
                            <CardHeader>
                                <CardTitle>Horarios de Atención</CardTitle>
                                <CardDescription>Define los días y horas en que tu negocio está abierto.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <BusinessHoursForm form={form} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </form>
        </Form>
    );
}

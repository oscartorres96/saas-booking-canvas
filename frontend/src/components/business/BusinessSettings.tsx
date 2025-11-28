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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

const daysOfWeek = [
    { key: "monday", label: "Lunes" },
    { key: "tuesday", label: "Martes" },
    { key: "wednesday", label: "Miércoles" },
    { key: "thursday", label: "Jueves" },
    { key: "friday", label: "Viernes" },
    { key: "saturday", label: "Sábado" },
    { key: "sunday", label: "Domingo" },
];

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

export function BusinessSettings() {
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
            businessHours: daysOfWeek.map(d => ({
                day: d.key,
                isOpen: true,
                intervals: [{ startTime: "09:00", endTime: "18:00" }],
            }))
        },
    });

    useEffect(() => {
        async function loadSettings() {
            if (!user?.businessId) return;
            try {
                const business = await getBusinessById(user.businessId);
                form.reset({
                    businessName: business.businessName || business.name || "",
                    logoUrl: business.logoUrl || "",
                    primaryColor: business.settings?.primaryColor || "#000000",
                    secondaryColor: business.settings?.secondaryColor || "#ffffff",
                    description: business.settings?.description || "",
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
    }, [user?.businessId, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!user?.businessId) return;
        setIsSaving(true);
        try {
            await updateBusinessSettings(user.businessId, values);
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
                            <CardContent className="space-y-4">
                                {daysOfWeek.map((day, index) => {
                                    const intervals = form.watch(`businessHours.${index}.intervals`);
                                    const isOpen = form.watch(`businessHours.${index}.isOpen`);
                                    return (
                                        <div key={day.key} className="flex flex-col gap-3 p-3 border rounded-md bg-card">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name={`businessHours.${index}.isOpen`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                            <FormControl>
                                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                            </FormControl>
                                                            <FormLabel className="w-24">{day.label}</FormLabel>
                                                        </FormItem>
                                                    )}
                                                />
                                                {!isOpen && (
                                                    <span className="text-muted-foreground text-sm italic">Cerrado</span>
                                                )}
                                            </div>
                                            {isOpen && (
                                                <div className="space-y-3">
                                                    {intervals?.map((interval, intervalIndex) => (
                                                        <div key={intervalIndex} className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                            <FormField
                                                                control={form.control}
                                                                name={`businessHours.${index}.intervals.${intervalIndex}.startTime`}
                                                                render={({ field }) => (
                                                                    <FormItem className="flex-1">
                                                                        <FormControl>
                                                                            <Input type="time" {...field} className="w-full" />
                                                                        </FormControl>
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <span className="text-center sm:w-auto">a</span>
                                                            <FormField
                                                                control={form.control}
                                                                name={`businessHours.${index}.intervals.${intervalIndex}.endTime`}
                                                                render={({ field }) => (
                                                                    <FormItem className="flex-1">
                                                                        <FormControl>
                                                                            <Input type="time" {...field} className="w-full" />
                                                                        </FormControl>
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            {intervals.length > 1 && (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="self-start"
                                                                    onClick={() => {
                                                                        const next = intervals.filter((_, i) => i !== intervalIndex);
                                                                        form.setValue(`businessHours.${index}.intervals`, next, { shouldDirty: true });
                                                                    }}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {(intervals?.length ?? 0) < 2 && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-full sm:w-auto"
                                                            onClick={() => {
                                                                const next = [
                                                                    ...(intervals || []),
                                                                    { startTime: "09:00", endTime: "18:00" },
                                                                ];
                                                                form.setValue(`businessHours.${index}.intervals`, next, { shouldDirty: true });
                                                            }}
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" /> Agregar intervalo
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </form>
        </Form>
    );
}

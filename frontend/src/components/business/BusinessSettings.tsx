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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { BusinessHoursForm, daysOfWeek } from "./BusinessHoursForm";
import { ImageUpload } from "@/components/ImageUpload";
import { useTranslation } from "react-i18next";

const intervalSchema = z.object({
    startTime: z.string(),
    endTime: z.string(),
});

const formSchema = z.object({
    businessName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    language: z.enum(["es", "en"]).default("es"),
    logoUrl: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
    primaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Color inválido").optional(),
    secondaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Color inválido").optional(),
    description: z.string().max(500, "Máximo 500 caracteres").optional(),
    communicationLanguage: z.string().optional(),
    defaultServiceDuration: z.coerce.number().min(5, "Mínimo 5 minutos").default(30),
    facebook: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
    instagram: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
    twitter: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
    website: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
    businessHours: z.array(z.object({
        day: z.string(),
        isOpen: z.boolean(),
        intervals: z.array(intervalSchema),
    })).superRefine((val, ctx) => {
        val.forEach((day, idx) => {
            if (!day.isOpen) return;

            if (day.intervals.length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Agrega al menos un intervalo",
                    path: ["businessHours", idx, "intervals"],
                });
            }

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
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("general");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            businessName: "",
            language: "es",
            logoUrl: "",
            primaryColor: "#000000",
            secondaryColor: "#ffffff",
            description: "",
            communicationLanguage: "es_MX",
            defaultServiceDuration: 30,
            facebook: "",
            instagram: "",
            twitter: "",
            website: "",
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
                    language: (business.language as "es" | "en") || "es",
                    logoUrl: business.logoUrl || "",
                    primaryColor: business.settings?.primaryColor || "#000000",
                    secondaryColor: business.settings?.secondaryColor || "#ffffff",
                    description: business.settings?.description || "",
                    communicationLanguage: business.settings?.language || "es_MX",
                    defaultServiceDuration: business.settings?.defaultServiceDuration || 30,
                    facebook: business.settings?.facebook || "",
                    instagram: business.settings?.instagram || "",
                    twitter: business.settings?.twitter || "",
                    website: business.settings?.website || "",
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

        // Manually trigger validation only for the active tab's fields
        let isValid = false;

        if (activeTab === "general") {
            isValid = await form.trigger(["businessName", "logoUrl", "description", "language", "defaultServiceDuration"]);
        } else if (activeTab === "branding") {
            isValid = await form.trigger(["logoUrl", "primaryColor", "secondaryColor"]);
        } else if (activeTab === "hours") {
            isValid = await form.trigger(["businessHours"]);
        }

        if (!isValid) {
            toast.error("Por favor corrige los errores en el formulario");
            return;
        }

        setIsSaving(true);
        try {
            // Only send the fields relevant to the current tab
            let dataToSubmit: any = {};

            if (activeTab === "general") {
                // General tab: name, logo, description, language, duration
                dataToSubmit = {
                    businessName: values.businessName,
                    language: values.language,
                    description: values.description,
                    defaultServiceDuration: values.defaultServiceDuration,
                };
            } else if (activeTab === "branding") {
                // Branding tab: colors, logo, and communication language
                dataToSubmit = {
                    logoUrl: values.logoUrl,
                    primaryColor: values.primaryColor,
                    secondaryColor: values.secondaryColor,
                    language: values.communicationLanguage,
                    facebook: values.facebook,
                    instagram: values.instagram,
                    twitter: values.twitter,
                    website: values.website,
                };
            } else if (activeTab === "hours") {
                // Hours tab: only business hours
                dataToSubmit = {
                    businessHours: values.businessHours,
                };
            }

            await updateBusinessSettings(businessId, dataToSubmit);
            toast.success(t('settings.saved'));
        } catch (error) {
            toast.error(t('settings.error'));
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    const onInvalid = (errors: any) => {
        console.log("Form errors:", errors);
        const errorCount = Object.keys(errors).length;
        const firstErrorField = Object.keys(errors)[0];
        toast.error(`Tienes ${errorCount} errores en el formulario. Revisa el campo: ${firstErrorField}`);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const values = form.getValues();
        await onSubmit(values);
    };

    return (
        <Form {...form}>
            <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">{t('settings.title')}</h2>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('settings.save')}
                    </Button>
                </div>

                <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList>
                        <TabsTrigger value="general">{t('settings.tabs.general')}</TabsTrigger>
                        <TabsTrigger value="branding">{t('settings.tabs.branding')}</TabsTrigger>
                        <TabsTrigger value="hours">{t('settings.tabs.hours')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('settings.general.title')}</CardTitle>
                                <CardDescription>{t('settings.general.description')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="businessName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('settings.general.name')}</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="language"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('settings.language')}</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="es">Español</SelectItem>
                                                    <SelectItem value="en">English</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-sm text-muted-foreground">{t('settings.language_desc')}</p>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('settings.general.short_desc')}</FormLabel>
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
                                            <FormLabel>{t('settings.general.default_duration')}</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
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
                                <CardTitle>{t('settings.branding.title')}</CardTitle>
                                <CardDescription>{t('settings.branding.description')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="communicationLanguage"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Idioma de Comunicación</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona idioma" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="es_MX">Español (México) 🇲🇽</SelectItem>
                                                    <SelectItem value="en_US">English (USA) 🇺🇸</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">Este idioma afecta los correos y la bandera del teléfono en la página de reservas</p>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="logoUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('settings.general.logo')}</FormLabel>
                                            <FormControl>
                                                <ImageUpload
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    businessId={businessId}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="primaryColor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('settings.branding.primary')}</FormLabel>
                                                <div className="flex gap-2">
                                                    <input type="color" className="w-12 h-10 p-1 rounded-md border border-input bg-background cursor-pointer" {...field} />
                                                    <Input {...field} placeholder="#000000" />
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
                                                <FormLabel>{t('settings.branding.secondary')}</FormLabel>
                                                <div className="flex gap-2">
                                                    <input type="color" className="w-12 h-10 p-1 rounded-md border border-input bg-background cursor-pointer" {...field} />
                                                    <Input {...field} placeholder="#ffffff" />
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="space-y-4 pt-4 border-t">
                                    <h3 className="font-semibold text-sm">Redes Sociales</h3>
                                    <p className="text-xs text-muted-foreground">Agrega tus redes sociales para mostrarse en la página de reservas</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="facebook"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Facebook</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="https://facebook.com/tu-pagina" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="instagram"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Instagram</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="https://instagram.com/tu-perfil" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="twitter"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Twitter/X</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="https://twitter.com/tu-cuenta" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="website"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Sitio Web</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="https://tu-sitio.com" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="hours">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('settings.hours.title')}</CardTitle>
                                <CardDescription>{t('settings.hours.description')}</CardDescription>
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

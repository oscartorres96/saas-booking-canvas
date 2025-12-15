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

const intervalSchema = (t: any) => z.object({
    startTime: z.string(),
    endTime: z.string(),
});

const createFormSchema = (t: any) => z.object({
    businessName: z.string().min(2, t('settings.validation.name_min')),
    language: z.enum(["es", "en"]).default("es"),
    logoUrl: z.string().url(t('settings.validation.url_invalid')).optional().or(z.literal("")),
    primaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, t('settings.validation.color_invalid')).optional(),
    secondaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, t('settings.validation.color_invalid')).optional(),
    description: z.string().max(500, t('settings.validation.desc_max')).optional(),
    communicationLanguage: z.string().optional(),
    defaultServiceDuration: z.coerce.number().min(5, t('settings.validation.duration_min')).default(30),
    facebook: z.string().url(t('settings.validation.url_invalid')).optional().or(z.literal("")),
    instagram: z.string().url(t('settings.validation.url_invalid')).optional().or(z.literal("")),
    twitter: z.string().url(t('settings.validation.url_invalid')).optional().or(z.literal("")),
    website: z.string().url(t('settings.validation.url_invalid')).optional().or(z.literal("")),
    businessHours: z.array(z.object({
        day: z.string(),
        isOpen: z.boolean(),
        intervals: z.array(intervalSchema(t)),
    })).superRefine((val, ctx) => {
        val.forEach((day, idx) => {
            if (!day.isOpen) return;

            if (day.intervals.length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: t('settings.validation.interval_required'),
                    path: ["businessHours", idx, "intervals"],
                });
            }

            const sorted = [...day.intervals].sort((a, b) => a.startTime.localeCompare(b.startTime));
            for (let i = 0; i < sorted.length; i++) {
                const { startTime, endTime } = sorted[i];
                if (startTime >= endTime) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: t('settings.validation.start_before_end'),
                        path: ["businessHours", idx, "intervals", i, "startTime"],
                    });
                }
                if (i > 0) {
                    const prev = sorted[i - 1];
                    if (startTime < prev.endTime) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: t('settings.validation.intervals_overlap'),
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

    const formSchema = createFormSchema(t);
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
                toast.error(t('settings.error_loading'));
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
            toast.error(t('settings.fix_errors'));
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
        toast.error(t('settings.form_errors', { count: errorCount, field: firstErrorField }));
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
                                                    <SelectItem value="es">{t('settings.languages.es')}</SelectItem>
                                                    <SelectItem value="en">{t('settings.languages.en')}</SelectItem>
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
                                            <FormLabel>{t('settings.branding.communication_language')}</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t('settings.branding.select_language_placeholder')} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="es_MX">{t('settings.languages.es_mx')}</SelectItem>
                                                    <SelectItem value="en_US">{t('settings.languages.en_us')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">{t('settings.branding.language_hint')}</p>
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
                                    <h3 className="font-semibold text-sm">{t('settings.social.title')}</h3>
                                    <p className="text-xs text-muted-foreground">{t('settings.social.description')}</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="facebook"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('settings.social.facebook')}</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder={t('settings.social.facebook_placeholder')} {...field} />
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
                                                    <FormLabel>{t('settings.social.instagram')}</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder={t('settings.social.instagram_placeholder')} {...field} />
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
                                                    <FormLabel>{t('settings.social.twitter')}</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder={t('settings.social.twitter_placeholder')} {...field} />
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
                                                    <FormLabel>{t('settings.social.website')}</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder={t('settings.social.website_placeholder')} {...field} />
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
        </Form >
    );
}

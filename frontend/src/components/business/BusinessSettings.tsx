import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthContext } from "@/auth/AuthContext";
import { getBusinessById, updateBusinessSettings, updatePaymentConfig, type Business } from "@/api/businessesApi";
import { createConnectAccount, syncConnectAccount } from "@/api/stripeApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { BusinessHoursForm, daysOfWeek } from "./BusinessHoursForm";
import { ImageUpload } from "@/components/ImageUpload";
import { useTranslation } from "react-i18next";
import {
    DashboardSection,
    SectionHeader,
    ConfigPanel,
    AdminLabel,
    InnerCard
} from "@/components/dashboard/DashboardBase";
import { Settings, Save, Globe, Palette, Clock, CreditCard, ShieldCheck, Building2, Zap, Check, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

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
    allowMultipleBookingsPerDay: z.boolean().default(false),
    cancellationWindowHours: z.coerce.number().min(0).default(0),
    bookingCapacityMode: z.enum(['SINGLE', 'MULTIPLE']).default('SINGLE'),
    maxBookingsPerSlot: z.coerce.number().min(2, t('settings.booking.capacity.validation_min')).optional().nullable(),
    paymentPolicy: z.enum(['RESERVE_ONLY', 'PAY_BEFORE_BOOKING', 'PACKAGE_OR_PAY']).default('RESERVE_ONLY'),
    allowCash: z.boolean().default(false),
    paymentMode: z.enum(["BOOKPRO_COLLECTS", "DIRECT_TO_BUSINESS"]).default("BOOKPRO_COLLECTS"),
    stripeConnectAccountId: z.string().optional(),
    taxId: z.string().optional(),
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
    const [hasPaymentModelSet, setHasPaymentModelSet] = useState(false);
    const [activeTab, setActiveTab] = useState("general");
    const [businessData, setBusinessData] = useState<Business | null>(null);
    const [isConnectingStripe, setIsConnectingStripe] = useState(false);

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
            allowMultipleBookingsPerDay: false,
            cancellationWindowHours: 0,
            bookingCapacityMode: "SINGLE",
            maxBookingsPerSlot: null,
            paymentPolicy: "RESERVE_ONLY",
            allowCash: false,
            paymentMode: "BOOKPRO_COLLECTS",
            stripeConnectAccountId: "",
            taxId: "",
            businessHours: daysOfWeek.map(d => ({
                day: d.key,
                isOpen: true,
                intervals: [{ startTime: "09:00", endTime: "18:00" }],
            }))
        },
    });

    useEffect(() => {
        const checkStripeStatus = async () => {
            const params = new URLSearchParams(window.location.search);
            if (params.get('stripe_success') === 'true' && businessId) {
                try {
                    console.log('[STRIPE] Detected success redirect, syncing account...');
                    await syncConnectAccount(businessId);
                    const business = await getBusinessById(businessId);
                    setBusinessData(business);
                    toast.success(t('settings.payments.sync_success', '¡Conexión exitosa! Ahora puedes cobrar directamente.'));

                    // Cleanup URL
                    const newSearchParams = new URLSearchParams(window.location.search);
                    newSearchParams.delete('stripe_success');
                    const newUrl = window.location.pathname + (newSearchParams.toString() ? `?${newSearchParams.toString()}` : '');
                    window.history.replaceState({}, '', newUrl);
                } catch (error) {
                    console.error('Error syncing Stripe status:', error);
                }
            }
        };
        checkStripeStatus();
    }, [businessId, t]);

    useEffect(() => {
        async function loadSettings() {
            if (!businessId) return;
            try {
                const business = await getBusinessById(businessId);
                setBusinessData(business);
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
                    allowMultipleBookingsPerDay: business.bookingConfig?.allowMultipleBookingsPerDay ?? false,
                    cancellationWindowHours: business.bookingConfig?.cancellationWindowHours ?? 0,
                    bookingCapacityMode: business.bookingCapacityConfig?.mode || "SINGLE",
                    maxBookingsPerSlot: business.bookingCapacityConfig?.maxBookingsPerSlot || null,
                    paymentPolicy: (business.paymentConfig?.paymentPolicy === 'PAY_BEFORE_BOOKING' ? 'PACKAGE_OR_PAY' : business.paymentConfig?.paymentPolicy) || "RESERVE_ONLY",
                    allowCash: business.paymentConfig?.allowCash ?? false,
                    paymentMode: business.paymentMode || "BOOKPRO_COLLECTS",
                    stripeConnectAccountId: business.stripeConnectAccountId || "",
                    taxId: business.taxConfig?.taxId || "",
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
                if (business.paymentMode) {
                    setHasPaymentModelSet(true);
                }
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
        } else if (activeTab === "booking") {
            isValid = await form.trigger([
                "allowMultipleBookingsPerDay",
                "cancellationWindowHours",
                "bookingCapacityMode",
                ...(values.bookingCapacityMode === 'MULTIPLE' ? ["maxBookingsPerSlot"] as const : [])
            ]);
        } else if (activeTab === "payments") {
            isValid = await form.trigger(["paymentPolicy", "allowCash", "taxId"]);
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
            } else if (activeTab === "booking") {
                // Booking tab: rules and logic including capacity
                dataToSubmit = {
                    bookingConfig: {
                        allowMultipleBookingsPerDay: Boolean(values.allowMultipleBookingsPerDay),
                        cancellationWindowHours: Number(values.cancellationWindowHours) || 0,
                    },
                    bookingCapacityConfig: {
                        mode: values.bookingCapacityMode,
                        maxBookingsPerSlot: values.bookingCapacityMode === 'MULTIPLE'
                            ? Number(values.maxBookingsPerSlot) || null
                            : null,
                    }
                };
                console.log('[DEBUG] Saving booking config:', dataToSubmit);
            } else if (activeTab === "payments") {
                await updatePaymentConfig(businessId, {
                    paymentPolicy: values.paymentPolicy,
                    allowTransfer: false,
                    allowCash: values.allowCash,
                    method: 'none', // Bank transfer disabled
                });

                // Update business settings for taxConfig.taxId (allow clearing it)
                await updateBusinessSettings(businessId, {
                    taxConfig: {
                        ...businessData?.taxConfig,
                        taxId: values.taxId || "",
                        enabled: Boolean(values.taxId)
                    }
                });

                toast.success(t('settings.saved'));
                setIsSaving(false);
                return;
            }

            await updateBusinessSettings(businessId, dataToSubmit);
            toast.success(t('settings.saved'));
        } catch (error: any) {
            console.error('[ERROR] Failed to save settings:', error);
            const errorMessage = error?.response?.data?.message || error?.message || t('settings.error');
            toast.error(errorMessage);
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

    const handleSyncStatus = async () => {
        if (!businessId) return;
        setIsConnectingStripe(true);
        const toastId = toast.loading(t('settings.payments.syncing', 'Sincronizando estado con Stripe...'));
        try {
            const result = await syncConnectAccount(businessId);
            const business = await getBusinessById(businessId);
            setBusinessData(business);

            // Update form values to match business data
            form.setValue("paymentMode", business.paymentMode || "BOOKPRO_COLLECTS");
            form.setValue("stripeConnectAccountId", business.stripeConnectAccountId || "");
            if (business.taxConfig?.taxId) {
                form.setValue("taxId", business.taxConfig.taxId);
            }

            toast.success(t('settings.payments.sync_success', 'Estado de cuenta actualizado correctamente'), { id: toastId });
        } catch (error: any) {
            console.error('[ERROR] Failed to sync Stripe status:', error);
            toast.error(t('settings.payments.sync_error', 'Error al sincronizar con Stripe'), { id: toastId });
        } finally {
            setIsConnectingStripe(false);
        }
    };

    const handleConnectStripe = async () => {
        if (!businessId) return;

        setIsConnectingStripe(true);
        try {
            // AUTO-SAVE TaxId before redirecting, if it has changed
            const currentTaxId = form.getValues("taxId");
            if (currentTaxId && currentTaxId !== businessData?.taxConfig?.taxId) {
                console.log('[STRIPE] Auto-saving taxId before redirect...');
                await updateBusinessSettings(businessId, {
                    taxConfig: {
                        ...businessData?.taxConfig,
                        taxId: currentTaxId,
                        enabled: true
                    }
                });
            }

            const { url } = await createConnectAccount(businessId);
            window.location.href = url;
        } catch (error: any) {
            console.error('[ERROR] Failed to create Connect account:', error);
            const errorData = error?.response?.data;
            const detailedMessage = Array.isArray(errorData?.message)
                ? errorData.message.join(", ")
                : errorData?.message || error?.message || t('settings.payments.connect_error', 'Error al iniciar conexión con Stripe');
            toast.error(detailedMessage);
        } finally {
            setIsConnectingStripe(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const values = form.getValues();
        await onSubmit(values);
    };

    return (
        <Form {...form}>
            <form onSubmit={handleFormSubmit}>
                <DashboardSection>
                    <SectionHeader
                        title={t('settings.title')}
                        description={t('settings.general.description')}
                        icon={Settings}
                        rightElement={
                            <Button type="submit" disabled={isSaving} className="rounded-xl px-8 h-12 shadow-lg shadow-primary/20 transition-all hover:scale-[1.03] active:scale-[0.97]">
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {t('settings.save')}
                            </Button>
                        }
                    />

                    <div className="p-4 md:p-8 space-y-8">
                        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <div className="premium-tabs-container mb-6">
                                <TabsList className="premium-tabs-list">
                                    <TabsTrigger value="general" className="premium-tab-trigger">{t('settings.tabs.general')}</TabsTrigger>
                                    <TabsTrigger value="branding" className="premium-tab-trigger">{t('settings.tabs.branding')}</TabsTrigger>
                                    <TabsTrigger value="booking" className="premium-tab-trigger">{t('settings.booking.title', 'Políticas')}</TabsTrigger>
                                    <TabsTrigger value="hours" className="premium-tab-trigger">{t('settings.tabs.hours')}</TabsTrigger>
                                    <TabsTrigger value="payments" className="premium-tab-trigger">{t('settings.tabs.payments', 'Pagos')}</TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="general" className="mt-6 space-y-6">
                                <ConfigPanel className="md:grid-cols-2 lg:grid-cols-2">
                                    <InnerCard className="col-span-1">
                                        <AdminLabel icon={Globe}>{t('settings.tabs.general')}</AdminLabel>
                                        <div className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="businessName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">{t('settings.general.name')}</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} className="rounded-xl border-muted bg-white dark:bg-slate-950" />
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
                                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">{t('settings.language')}</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="rounded-xl border-muted bg-white dark:bg-slate-950">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="es">{t('settings.languages.es')}</SelectItem>
                                                                <SelectItem value="en">{t('settings.languages.en')}</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <p className="text-[10px] text-muted-foreground mt-1">{t('settings.language_desc')}</p>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </InnerCard>

                                    <InnerCard className="col-span-1">
                                        <AdminLabel icon={Clock}>{t('settings.general.default_duration')}</AdminLabel>
                                        <div className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">{t('settings.general.short_desc')}</FormLabel>
                                                        <FormControl>
                                                            <Textarea {...field} className="rounded-xl min-h-[100px] border-muted bg-white dark:bg-slate-950" />
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
                                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">{t('settings.general.default_duration')}</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" {...field} className="rounded-xl border-muted bg-white dark:bg-slate-950" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </InnerCard>
                                </ConfigPanel>
                            </TabsContent>

                            <TabsContent value="branding" className="mt-6 space-y-6">
                                <InnerCard>
                                    <AdminLabel icon={Palette}>{t('settings.branding.title')}</AdminLabel>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                        <FormField
                                            control={form.control}
                                            name="communicationLanguage"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">{t('settings.branding.communication_language')}</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="rounded-xl border-muted bg-white dark:bg-slate-950">
                                                                <SelectValue placeholder={t('settings.branding.select_language_placeholder')} />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="es_MX">{t('settings.languages.es_mx')}</SelectItem>
                                                            <SelectItem value="en_US">{t('settings.languages.en_us')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <p className="text-[10px] text-muted-foreground mt-1">{t('settings.branding.language_hint')}</p>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="logoUrl"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">{t('settings.general.logo')}</FormLabel>
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
                                        <FormField
                                            control={form.control}
                                            name="primaryColor"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">{t('settings.branding.primary')}</FormLabel>
                                                    <div className="flex gap-2">
                                                        <input type="color" className="w-12 h-10 p-1 rounded-xl border border-muted bg-background cursor-pointer" {...field} />
                                                        <Input {...field} placeholder="#000000" className="rounded-xl border-muted bg-white dark:bg-slate-950" />
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
                                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">{t('settings.branding.secondary')}</FormLabel>
                                                    <div className="flex gap-2">
                                                        <input type="color" className="w-12 h-10 p-1 rounded-xl border border-muted bg-background cursor-pointer" {...field} />
                                                        <Input {...field} placeholder="#ffffff" className="rounded-xl border-muted bg-white dark:bg-slate-950" />
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


                                </InnerCard>
                            </TabsContent>

                            <TabsContent value="booking" className="mt-6 space-y-6">
                                <InnerCard>
                                    <AdminLabel icon={ShieldCheck}>{t('settings.booking.title')}</AdminLabel>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                        <FormField
                                            control={form.control}
                                            name="allowMultipleBookingsPerDay"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 shadow-sm">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base">{t('settings.booking.allow_multiple')}</FormLabel>
                                                        <div className="text-[10px] text-muted-foreground pr-4">
                                                            {t('settings.booking.allow_multiple_desc')}
                                                        </div>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />


                                        <FormField
                                            control={form.control}
                                            name="cancellationWindowHours"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                                                        {t('settings.booking.cancellation_window')}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="number"
                                                                value={field.value}
                                                                onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                                                                className="rounded-xl border-muted bg-white dark:bg-slate-950 w-24"
                                                            />
                                                            <span className="text-sm text-muted-foreground">{t('common.hours', 'horas')}</span>
                                                        </div>
                                                    </FormControl>
                                                    <div className="text-[10px] text-muted-foreground mt-1">
                                                        {t('settings.booking.cancellation_window_desc')}
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </InnerCard>

                                {/* NUEVA SECCIÓN: Capacidad de Reservas por Horario */}
                                <InnerCard>
                                    <AdminLabel icon={Zap}>{t('settings.booking.capacity.title')}</AdminLabel>
                                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                                        {t('settings.booking.capacity.description')}
                                    </p>

                                    <div className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="bookingCapacityMode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-base font-semibold">
                                                        {t('settings.booking.capacity.mode_label')}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <RadioGroup
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                            className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2"
                                                        >
                                                            {/* SINGLE MODE */}
                                                            <FormItem>
                                                                <FormControl>
                                                                    <RadioGroupItem value="SINGLE" className="peer sr-only" />
                                                                </FormControl>
                                                                <div
                                                                    className={`
                                                                        cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-muted/50
                                                                        peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5
                                                                        ${field.value === 'SINGLE' ? 'border-primary bg-primary/5' : 'border-muted'}
                                                                    `}
                                                                    onClick={() => {
                                                                        field.onChange('SINGLE');
                                                                        form.setValue('maxBookingsPerSlot', null);
                                                                    }}
                                                                >
                                                                    <div className="flex items-start gap-2 mb-2">
                                                                        <div className="flex-1">
                                                                            <div className="font-semibold text-sm flex items-center gap-2">
                                                                                {t('settings.booking.capacity.single_radio')}
                                                                                {field.value === 'SINGLE' && <Check className="h-4 w-4 text-primary" />}
                                                                            </div>
                                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                                {t('settings.booking.capacity.single_desc')}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-[10px] text-muted-foreground bg-muted/50 rounded-lg p-2 mt-2">
                                                                        💡 {t('settings.booking.capacity.tooltip_single')}
                                                                    </div>
                                                                </div>
                                                            </FormItem>

                                                            {/* MULTIPLE MODE */}
                                                            <FormItem>
                                                                <FormControl>
                                                                    <RadioGroupItem value="MULTIPLE" className="peer sr-only" />
                                                                </FormControl>
                                                                <div
                                                                    className={`
                                                                        cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-muted/50
                                                                        peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5
                                                                        ${field.value === 'MULTIPLE' ? 'border-primary bg-primary/5' : 'border-muted'}
                                                                    `}
                                                                    onClick={() => field.onChange('MULTIPLE')}
                                                                >
                                                                    <div className="flex items-start gap-2 mb-2">
                                                                        <div className="flex-1">
                                                                            <div className="font-semibold text-sm flex items-center gap-2">
                                                                                {t('settings.booking.capacity.multiple_radio')}
                                                                                {field.value === 'MULTIPLE' && <Check className="h-4 w-4 text-primary" />}
                                                                            </div>
                                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                                {t('settings.booking.capacity.multiple_desc')}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-[10px] text-muted-foreground bg-muted/50 rounded-lg p-2 mt-2">
                                                                        💡 {t('settings.booking.capacity.tooltip_multiple')}
                                                                    </div>
                                                                </div>
                                                            </FormItem>
                                                        </RadioGroup>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Campo condicional para MULTIPLE */}
                                        {form.watch("bookingCapacityMode") === "MULTIPLE" && (
                                            <FormField
                                                control={form.control}
                                                name="maxBookingsPerSlot"
                                                render={({ field }) => (
                                                    <FormItem className="animate-in fade-in slide-in-from-top-2">
                                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                                                            {t('settings.booking.capacity.max_label')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min="2"
                                                                placeholder={t('settings.booking.capacity.max_placeholder')}
                                                                value={field.value || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value ? Number(e.target.value) : null;
                                                                    field.onChange(val);
                                                                }}
                                                                className="rounded-xl border-muted bg-white dark:bg-slate-950 max-w-xs"
                                                            />
                                                        </FormControl>
                                                        <div className="text-[10px] text-muted-foreground mt-1">
                                                            {t('settings.booking.capacity.max_helper')}
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </div>
                                </InnerCard>
                            </TabsContent>

                            <TabsContent value="hours" className="mt-6">
                                <InnerCard>
                                    <AdminLabel icon={Clock}>{t('settings.hours.title')}</AdminLabel>
                                    <div className="pt-4">
                                        <BusinessHoursForm form={form} />
                                    </div>
                                </InnerCard>
                            </TabsContent>

                            <TabsContent value="payments" className="mt-6 space-y-8">
                                {/* SECTION A: PAYMENT POLICY */}
                                <InnerCard>
                                    <AdminLabel icon={ShieldCheck}>{t('settings.payments.policy_title', 'Política de Cobro')}</AdminLabel>
                                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                                        {t('settings.payments.policy_desc', '¿Cuándo debe pagar el cliente el servicio?')}
                                    </p>

                                    <FormField
                                        control={form.control}
                                        name="paymentPolicy"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <RadioGroup
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                                    >
                                                        {['RESERVE_ONLY', 'PACKAGE_OR_PAY'].map((policy) => (
                                                            <FormItem key={policy}>
                                                                <FormControl>
                                                                    <RadioGroupItem value={policy} className="peer sr-only" />
                                                                </FormControl>
                                                                <div className={`
                                                                 cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-muted/50
                                                                 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5
                                                                 ${field.value === policy ? 'border-primary bg-primary/5' : 'border-muted'}
                                                             `}
                                                                    onClick={() => field.onChange(policy)}
                                                                >
                                                                    <div className="font-semibold text-sm mb-1 flex items-center gap-2">
                                                                        {t(`settings.payments.policies.${policy.toLowerCase()}.title`)}
                                                                        {policy === 'PACKAGE_OR_PAY' && (
                                                                            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                                                {t('settings.payments.methods.stripe_badge', 'Recomendado')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {t(`settings.payments.policies.${policy.toLowerCase()}.desc`)}
                                                                    </div>
                                                                </div>
                                                            </FormItem>
                                                        ))}
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </InnerCard>

                                {/* SECTION B: METHODS */}
                                <ConfigPanel className="md:grid-cols-2">
                                    <InnerCard>
                                        <AdminLabel icon={CreditCard}>{t('settings.payments.methods_title', 'Métodos Aceptados')}</AdminLabel>
                                        <p className="text-sm text-muted-foreground mt-1 mb-4">
                                            {t('settings.payments.methods_desc')}
                                        </p>
                                        <div className="space-y-4 pt-1">
                                            {/* Stripe (Read-only/Default) */}
                                            <div className="flex items-start space-x-3 rounded-lg border p-4 bg-muted/30">
                                                <Checkbox checked={true} disabled />
                                                <div className="space-y-1">
                                                    <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                        {t('settings.payments.methods.stripe')}
                                                        <span className="ml-2 inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                            {t('settings.payments.methods.stripe_badge')}
                                                        </span>
                                                    </FormLabel>
                                                    <p className="text-xs text-muted-foreground">
                                                        {t('settings.payments.online_desc')}
                                                    </p>
                                                </div>
                                            </div>



                                            {/* Efectivo */}
                                            <FormField
                                                control={form.control}
                                                name="allowCash"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-start space-x-3 rounded-lg border p-4">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                        <div className="space-y-1 leading-none">
                                                            <FormLabel className="text-sm font-medium">
                                                                {t('settings.payments.methods.cash')}
                                                            </FormLabel>
                                                            <p className="text-xs text-muted-foreground">
                                                                {t('settings.payments.methods.cash_desc')}
                                                            </p>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </InnerCard>


                                </ConfigPanel>

                                {/* SECTION D: STRIPE CONFIGURATION & TAX ID */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-1 space-y-6">
                                        <InnerCard>
                                            <AdminLabel icon={Building2}>{t('settings.payments.tax_info_title', 'Información Fiscal')}</AdminLabel>
                                            <p className="text-xs text-muted-foreground mt-1 mb-4">
                                                {t('settings.payments.tax_info_desc', 'Necesaria para activar pagos directos a tu cuenta Stripe.')}
                                            </p>
                                            <FormField
                                                control={form.control}
                                                name="taxId"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                                                            {t('settings.payments.tax_id', 'RFC / Tax ID')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder="ABC123456XYZ" className="rounded-xl" />
                                                        </FormControl>
                                                        {!businessData?.stripeConnectAccountId && (
                                                            <p className="text-[10px] text-muted-foreground mt-2">
                                                                {t('settings.payments.tax_id_hint', 'Guarda los cambios antes de activar Stripe Connect.')}
                                                            </p>
                                                        )}
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </InnerCard>
                                    </div>

                                    <div className="lg:col-span-2">
                                        <InnerCard className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-900/50 border-slate-200 dark:border-slate-800 h-full">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                                    <Zap className="h-6 w-6 text-[#635BFF]" />
                                                </div>
                                                <div className="space-y-1 flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                                            {t('settings.payments.online_title')}
                                                            {businessData?.paymentMode === 'DIRECT_TO_BUSINESS' ? (
                                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
                                                                    <Check className="h-3 w-3" />
                                                                    {t('settings.payments.status.direct', 'Pagos Directos Activos')}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full">
                                                                    {t('settings.payments.status.intermediated', 'Modelo Intermediado')}
                                                                </span>
                                                            )}
                                                        </h3>
                                                    </div>
                                                    <p className="text-sm text-foreground/80 max-w-2xl mt-2">
                                                        {businessData?.paymentMode === 'DIRECT_TO_BUSINESS'
                                                            ? t('settings.payments.models.connect_desc', 'El dinero de tus ventas llega directamente a tu cuenta de Stripe. BookPro solo aplica la comisión correspondiente.')
                                                            : t('settings.payments.models.intermediated_desc', 'BookPro procesa los pagos y los transfiere a tu cuenta bancaria de forma programada. Es el modelo por defecto mientras activas Stripe Connect.')}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                                <div className="space-y-4">
                                                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                        {t('settings.payments.connection_status', 'Estado de Conexión')}
                                                        {businessData?.stripeConnectAccountId && (
                                                            <button
                                                                type="button"
                                                                onClick={handleSyncStatus}
                                                                disabled={isConnectingStripe}
                                                                className="text-[10px] bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ml-2"
                                                            >
                                                                <RefreshCw className={cn("h-2.5 w-2.5", isConnectingStripe && "animate-spin")} />
                                                                {t('common.refresh', 'Sincronizar')}
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {!businessData?.stripeConnectAccountId ? (
                                                            <>
                                                                <div className="h-2 w-2 rounded-full bg-slate-400" />
                                                                <span className="font-medium text-slate-500 italic">
                                                                    {t('settings.payments.status.not_connected', 'No configurado')}
                                                                </span>
                                                            </>
                                                        ) : businessData.connectStatus === 'ACTIVE' ? (
                                                            <>
                                                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                                                <span className="font-medium">
                                                                    {t('settings.payments.status.active', 'Conectado y Activo')}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                                                                <span className="font-medium text-yellow-600">
                                                                    {t('settings.payments.status.pending', 'Pendiente de completar')}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex justify-end">
                                                    {businessData?.connectStatus !== 'ACTIVE' && (
                                                        <Button
                                                            type="button"
                                                            variant={!form.watch('taxId') ? "outline" : "default"}
                                                            disabled={isConnectingStripe || !form.watch('taxId')}
                                                            onClick={handleConnectStripe}
                                                            className={`rounded-xl h-11 px-6 shadow-md transition-all ${form.watch('taxId') ? 'bg-[#635BFF] hover:bg-[#5249db] text-white' : ''}`}
                                                        >
                                                            {isConnectingStripe ? (
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Zap className="mr-2 h-4 w-4 fill-current" />
                                                            )}
                                                            {businessData?.stripeConnectAccountId
                                                                ? t('settings.payments.cta.complete_connect', 'Completar registro Stripe')
                                                                : t('settings.payments.cta.activate_connect', 'Activar Pagos Directos')}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {!form.watch('taxId') && businessData?.connectStatus !== 'ACTIVE' && (
                                                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg flex items-start gap-3">
                                                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                                                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                                                        {t('settings.payments.connect_requirement', 'Para activar los pagos directos, primero debes ingresar tu RFC / Tax ID y guardar los cambios.')}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-[10px] text-muted-foreground">
                                                <p>{t('settings.payments.legal_notice', 'Todas las transacciones son procesadas de forma segura de acuerdo a los términos de Stripe.')}</p>
                                                <div className="font-semibold text-[#635BFF] flex items-center gap-1">
                                                    <ShieldCheck className="h-3 w-3" />
                                                    {t('settings.payments.powered_by', 'Powered by Stripe')}
                                                </div>
                                            </div>
                                        </InnerCard>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </DashboardSection>
            </form>
        </Form >
    );
}

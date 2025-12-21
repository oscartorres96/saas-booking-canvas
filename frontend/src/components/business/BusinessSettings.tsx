import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthContext } from "@/auth/AuthContext";
import { getBusinessById, updateBusinessSettings, updatePaymentConfig } from "@/api/businessesApi";
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
import { Settings, Save, Globe, Palette, Clock, CreditCard, ShieldCheck, Building2, Zap, Check, AlertCircle } from "lucide-react";

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
    paymentPolicy: z.enum(['RESERVE_ONLY', 'PAY_BEFORE_BOOKING', 'PACKAGE_OR_PAY']).default('RESERVE_ONLY'),
    allowTransfer: z.boolean().default(false),
    allowCash: z.boolean().default(false),
    bank: z.string().optional(),
    clabe: z.string().optional(),
    holderName: z.string().optional(),
    instructions: z.string().optional(),
    paymentMode: z.enum(["BOOKPRO_COLLECTS", "DIRECT_TO_BUSINESS"]).default("BOOKPRO_COLLECTS"),
    stripeConnectAccountId: z.string().optional(),
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
            paymentPolicy: "RESERVE_ONLY",
            allowTransfer: false,
            allowCash: false,
            bank: "",
            clabe: "",
            holderName: "",
            instructions: "",
            paymentMode: "BOOKPRO_COLLECTS",
            stripeConnectAccountId: "",
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
                    allowMultipleBookingsPerDay: business.bookingConfig?.allowMultipleBookingsPerDay ?? false,
                    cancellationWindowHours: business.bookingConfig?.cancellationWindowHours ?? 0,
                    paymentPolicy: business.paymentConfig?.paymentPolicy || "RESERVE_ONLY",
                    allowTransfer: business.paymentConfig?.allowTransfer ?? (business.paymentConfig?.method === "bank_transfer"),
                    allowCash: business.paymentConfig?.allowCash ?? false,
                    bank: business.paymentConfig?.bank || "",
                    clabe: business.paymentConfig?.clabe || "",
                    holderName: business.paymentConfig?.holderName || "",
                    instructions: business.paymentConfig?.instructions || "",
                    paymentMode: business.paymentMode || "BOOKPRO_COLLECTS",
                    stripeConnectAccountId: business.stripeConnectAccountId || "",
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
            isValid = await form.trigger(["allowMultipleBookingsPerDay", "cancellationWindowHours"]);
        } else if (activeTab === "payments") {
            isValid = await form.trigger(["paymentPolicy", "allowTransfer", "allowCash", "bank", "clabe", "holderName"]);
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
                // Booking tab: rules and logic
                dataToSubmit = {
                    bookingConfig: {
                        allowMultipleBookingsPerDay: values.allowMultipleBookingsPerDay,
                        cancellationWindowHours: values.cancellationWindowHours,
                    }
                };
            } else if (activeTab === "payments") {
                await updatePaymentConfig(businessId, {
                    paymentPolicy: values.paymentPolicy,
                    allowTransfer: values.allowTransfer,
                    allowCash: values.allowCash,
                    method: values.allowTransfer ? 'bank_transfer' : 'none', // Backward compatibility
                    bank: values.bank,
                    clabe: values.clabe,
                    holderName: values.holderName,
                    instructions: values.instructions,
                    // paymentModel is NOT sent from frontend, strictly handled by backend logic now
                });
                toast.success(t('settings.saved'));
                setIsSaving(false);
                return;
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
                                                            <Input type="number" {...field} className="rounded-xl border-muted bg-white dark:bg-slate-950 w-24" />
                                                            <span className="text-sm text-muted-foreground">{t('common.minutes')}? No, {t('common.hours', 'horas')}</span>
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
                                                        defaultValue={field.value}
                                                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                                                    >
                                                        {['RESERVE_ONLY', 'PAY_BEFORE_BOOKING', 'PACKAGE_OR_PAY'].map((policy) => (
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
                                                                        {policy === 'PAY_BEFORE_BOOKING' && (
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
                                                        {t('settings.payments.methods.stripe', 'Tarjeta / Apple Pay / Google Pay')}
                                                        <span className="ml-2 inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                            {t('settings.payments.methods.stripe_badge', 'Recomendado')}
                                                        </span>
                                                    </FormLabel>
                                                    <p className="text-xs text-muted-foreground">
                                                        {t('settings.payments.online_desc', 'Procesado por Stripe')}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Transferencia */}
                                            <FormField
                                                control={form.control}
                                                name="allowTransfer"
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
                                                                {t('settings.payments.methods.transfer', 'Transferencia Bancaria')}
                                                            </FormLabel>
                                                            <p className="text-xs text-muted-foreground">
                                                                {t('settings.payments.methods.transfer_desc', 'Pago manual fuera de plataforma')}
                                                            </p>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />

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
                                                                {t('settings.payments.methods.cash', 'Efectivo')}
                                                            </FormLabel>
                                                            <p className="text-xs text-muted-foreground">
                                                                {t('settings.payments.methods.cash_desc', 'Pago en el establecimiento')}
                                                            </p>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </InnerCard>

                                    {/* SECTION C: BANK DETAILS (Conditional) */}
                                    {form.watch("allowTransfer") && (
                                        <InnerCard className="animate-in fade-in slide-in-from-left-4">
                                            <AdminLabel icon={Building2}>{t('settings.payments.bank_title', 'Datos Bancarios')}</AdminLabel>
                                            <div className="space-y-4 pt-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="bank"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>{t('settings.payments.bank')}</FormLabel>
                                                                <FormControl>
                                                                    <Input {...field} placeholder="Ej. BBVA" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="clabe"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>{t('settings.payments.clabe')}</FormLabel>
                                                                <FormControl>
                                                                    <Input {...field} placeholder="18 dígitos" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <FormField
                                                    control={form.control}
                                                    name="holderName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('settings.payments.holder')}</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="instructions"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('settings.payments.instructions')}</FormLabel>
                                                            <FormControl>
                                                                <Textarea {...field} placeholder="Instrucciones adicionales..." />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </InnerCard>
                                    )}
                                </ConfigPanel>

                                {/* SECTION D: INFRASTRUCTURE (Stripe) */}
                                <InnerCard className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-900/50 border-slate-200 dark:border-slate-800">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                            <Zap className="h-6 w-6 text-[#635BFF]" /> {/* Stripe Blurple */}
                                        </div>
                                        <div className="space-y-1 flex-1">
                                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                                {t('settings.payments.online_title')}
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                                    {t('settings.payments.status.active', 'Activo')}
                                                </span>
                                            </h3>
                                            <p className="text-sm text-foreground/80 max-w-2xl">
                                                {form.getValues().paymentMode === 'DIRECT_TO_BUSINESS'
                                                    ? t('settings.payments.models.connect_desc')
                                                    : t('settings.payments.models.intermediated_desc')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 pl-[4.5rem] grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="text-sm font-medium text-muted-foreground">{t('settings.payments.online_status')}</div>
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                                <span className="font-medium">
                                                    {form.getValues().paymentMode === 'DIRECT_TO_BUSINESS'
                                                        ? 'Stripe Connect (Direct)'
                                                        : 'Stripe Intermediated (Managed)'}
                                                </span>
                                            </div>
                                        </div>

                                        {form.getValues().paymentMode === 'DIRECT_TO_BUSINESS' && (
                                            <div className="space-y-1 p-3 bg-white dark:bg-slate-950 rounded-lg border text-xs font-mono text-muted-foreground">
                                                <div>ID: {form.getValues().stripeConnectAccountId}</div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs text-muted-foreground">
                                        <p>{t('settings.payments.legal_notice')}</p>
                                        <div className="font-semibold text-[#635BFF]">{t('settings.payments.powered_by')}</div>
                                    </div>
                                </InnerCard>
                            </TabsContent>
                        </Tabs>
                    </div>
                </DashboardSection>
            </form>
        </Form >
    );
}

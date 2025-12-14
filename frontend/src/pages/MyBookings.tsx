import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
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
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { getBusinessById } from "@/api/businessesApi";




const MyBookings = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    // Create schema with dynamic translations
    const lookupSchema = z.object({
        clientEmail: z.string().email({ message: t("myBookings.search_card.validation.email_invalid") }),
        accessCode: z.string().min(4, { message: t("myBookings.search_card.validation.access_code_required") }),
        businessId: z.string().optional(),
    });

    const form = useForm<z.infer<typeof lookupSchema>>({
        resolver: zodResolver(lookupSchema),
        defaultValues: {
            clientEmail: searchParams.get("email") || "",
            accessCode: searchParams.get("code") || "",
            businessId: "",
        },
    });

    // Load business language setting when accessed with businessId param
    useEffect(() => {
        const businessIdParam = searchParams.get("businessId");
        if (businessIdParam) {
            // Fetch business to get language settings
            getBusinessById(businessIdParam)
                .then((business) => {
                    if (business?.settings?.language) {
                        // Map locale to i18n language code (es_MX -> es, en_US -> en)
                        const lang = business.settings.language.startsWith('es') ? 'es' : 'en';
                        i18n.changeLanguage(lang);
                    }
                })
                .catch(() => {
                    console.log("Could not fetch business language settings");
                });
        }
    }, [searchParams, i18n]);

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
            form.setError("accessCode", { message: t("myBookings.search_card.validation.no_bookings_found") });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (bookingId: string) => {
        if (!confirm(t("myBookings.cancel_confirm"))) return;

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
            alert(t("myBookings.error_cancel"));
        }
    };

    // Determine locale for date formatting
    const dateLocale = i18n.language === 'es' ? es : enUS;



    return (
        <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 transition-colors duration-300">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 sm:space-y-8 relative">
                <div className="absolute top-4 right-4 md:top-12 md:right-8">
                    <ThemeToggle />
                </div>
                <div className="space-y-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            const businessIdParam = searchParams.get("businessId");
                            if (businessIdParam) {
                                navigate(`/business/${businessIdParam}/booking`);
                            } else {
                                navigate('/');
                            }
                        }}
                        className="mb-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {t("myBookings.results_card.actions.back_to_booking")}
                    </Button>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                        {t("myBookings.brand")}
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50">{t("myBookings.title")}</h1>
                    <p className="text-muted-foreground">
                        {t("myBookings.subtitle")}
                    </p>
                </div>


                <Card className="dark:bg-slate-900/50 dark:border-slate-800">
                    <CardHeader>
                        <CardTitle>{t("myBookings.search_card.title")}</CardTitle>
                        <CardDescription>{t("myBookings.search_card.description")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="clientEmail"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-1">
                                            <FormLabel>{t("myBookings.search_card.email_label")}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t("myBookings.search_card.email_placeholder")} {...field} className="dark:bg-slate-950" />
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
                                                {t("myBookings.search_card.access_code_label")}{" "}
                                                <span className="text-xs text-muted-foreground hidden sm:inline">{t("myBookings.search_card.access_code_hint")}</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder={t("myBookings.search_card.access_code_placeholder")} {...field} className="dark:bg-slate-950" />
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
                                            <FormLabel>{t("myBookings.search_card.business_id_label")}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t("myBookings.search_card.business_id_placeholder")} {...field} className="dark:bg-slate-950" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="md:col-span-2 flex justify-end">
                                    <Button type="submit" disabled={loading}>
                                        {loading ? t("myBookings.search_card.submit_button_loading") : t("myBookings.search_card.submit_button")}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>


                {bookings.length > 0 && (
                    <Card className="dark:bg-slate-900/50 dark:border-slate-800">
                        <CardHeader>
                            <CardTitle>{t("myBookings.results_card.title")}</CardTitle>
                            <CardDescription>{t("myBookings.results_card.description")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {bookings.map((booking) => (
                                <div key={booking._id} className="p-4 rounded-lg border bg-white dark:bg-slate-950 dark:border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="font-semibold text-slate-900 dark:text-slate-50">{booking.serviceName || t("myBookings.results_card.service_label")}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(booking.scheduledAt), "PPPp", { locale: dateLocale })}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={booking.status === 'cancelled' ? 'destructive' : 'secondary'}
                                            className="capitalize"
                                        >
                                            {booking.status === 'cancelled' ? t("myBookings.results_card.status.cancelled") : booking.status}
                                        </Badge>
                                    </div>
                                    <Separator className="dark:bg-slate-800" />
                                    <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                        <p>{t("myBookings.results_card.client_label")}: {booking.clientName}</p>
                                        {booking.businessId && <p className="break-all">{t("myBookings.results_card.business_id_label")}: {booking.businessId}</p>}
                                        {booking.accessCode && <p>{t("myBookings.results_card.access_code_label")}: {booking.accessCode}</p>}
                                        {booking.status === 'cancelled' && (
                                            <p className="text-xs text-muted-foreground">
                                                {t("myBookings.results_card.cancelled_note")}
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
                                                {t("myBookings.results_card.actions.cancel_booking")}
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
                                                    {t("myBookings.results_card.actions.book_again")}
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
                        {t("myBookings.empty_state")}
                    </p>
                )}
            </div>
        </div>
    );
};

export default MyBookings;

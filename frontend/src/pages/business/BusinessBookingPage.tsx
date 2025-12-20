import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
    Building2,
    Ticket,
    X,
    Check,
    Sparkles,
    Search,
    SlidersHorizontal,
    Zap,
    ArrowRight,
    ArrowLeft,
    ArrowDown,
    Receipt,
    Info,
    ShieldCheck,
    CreditCard,
    Star
} from "lucide-react";
import useAuth from "@/auth/useAuth";
import { getBusinessById, type Business } from "@/api/businessesApi";
import { getServicesByBusiness, type Service } from "@/api/servicesApi";
import { createBooking, getBookingsByClient, type Booking } from "@/api/bookingsApi";
import { getActiveAssets, type CustomerAsset } from "@/api/customerAssetsApi";
import { getProductsByBusiness, createProductCheckout, type Product, ProductType } from "@/api/productsApi";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useSlots } from "@/hooks/useSlots";
import { BusinessThemeToggle } from "@/components/BusinessThemeToggle";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import { ResourceSelector } from "@/components/booking/ResourceSelector";
import { BookingStepper } from "@/components/booking/BookingStepper";
import { ProductsStore } from "@/components/booking/ProductsStore";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const bookingFormSchema = z.object({
    serviceId: z.string().min(1, { message: "Selecciona un servicio" }).optional(),
    date: z.date({ required_error: "Fecha requerida" }).optional(),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Hora inválida (HH:MM)" }).optional(),
    clientName: z.string().min(3, { message: "El nombre es requerido" }),
    clientEmail: z.string().email({ message: "Email inválido" }),
    clientPhone: z.string().min(8, { message: "Teléfono inválido" }),
    notes: z.string().optional(),
    needsInvoice: z.boolean().default(false),
    rfc: z.string().optional(),
    razonSocial: z.string().optional(),
    zipCode: z.string().optional(),
    assetId: z.string().optional(),
    productId: z.string().optional(), // Added productId
});

const BusinessBookingPage = () => {
    const { businessId } = useParams<{ businessId: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    const [business, setBusiness] = useState<Business | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [availableAssets, setAvailableAssets] = useState<CustomerAsset[]>([]);
    const [myBookings, setMyBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("packages");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null); // Added selectedProduct state
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [conflictError, setConflictError] = useState<{
        message: string;
        accessCode?: string;
        clientEmail: string;
    } | null>(null);
    const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState<"all" | "presencial" | "online" | "packages">("all");
    const { theme, setTheme } = useTheme();
    const { t, i18n } = useTranslation();

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
            needsInvoice: false,
            rfc: "",
            razonSocial: "",
            zipCode: "",
            assetId: "",
        },
    });

    const selectedDate = form.watch("date");
    const selectedServiceId = form.watch("serviceId");
    const selectedTime = form.watch("time");

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

    // Change language based on business communication settings
    useEffect(() => {
        if (business?.settings?.language) {
            // Map locale to i18n language code (es_MX -> es, en_US -> en)
            const lang = business.settings.language.startsWith('es') ? 'es' : 'en';
            i18n.changeLanguage(lang);
        }
    }, [business, i18n]);

    // Watch email and phone to fetch assets automatically for guest users
    const clientEmail = form.watch("clientEmail");
    const clientPhone = form.watch("clientPhone");
    useEffect(() => {
        const fetchAssetsForContact = async () => {
            const hasValidEmail = clientEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail);
            // Minimum phone check (adjust as needed, e.g., > 8 digits)
            const hasValidPhone = clientPhone && clientPhone.length >= 8;

            if ((hasValidEmail || hasValidPhone) && businessId && !user) {
                try {
                    const assets = await getActiveAssets({
                        businessId,
                        email: clientEmail,
                        phone: clientPhone,
                    });
                    setAvailableAssets(assets);

                    if (assets.length > 0) {
                        const compatibleAssets = assets.filter(asset => {
                            if (!selectedServiceId) return true;
                            const allowed = asset.productId?.allowedServiceIds;
                            return !allowed || allowed.length === 0 || allowed.includes(selectedServiceId);
                        });

                        if (compatibleAssets.length > 0 && !form.getValues('assetId')) {
                            form.setValue('assetId', compatibleAssets[0]._id);
                            setActiveTab('credits');
                            toast.success(`¡Encontramos tus créditos! Se han aplicado automáticamente.`);
                        } else if (compatibleAssets.length > 0) {
                            setActiveTab('credits');
                        }
                    }
                } catch (e) {
                    console.error("Guest asset lookup failed", e);
                }
            }
        };

        const timer = setTimeout(fetchAssetsForContact, 1000);
        return () => clearTimeout(timer);
    }, [clientEmail, clientPhone, businessId, user, selectedServiceId]);

    const handleServiceSelect = (serviceId: string) => {
        form.setValue("serviceId", serviceId);
        // Clear product selection when selecting a service
        setSelectedProduct(null);
        form.setValue("productId", undefined);

        if (serviceId) {
            const service = services.find(s => s._id === serviceId);
            setSelectedService(service || null);
        } else {
            setSelectedService(null);
        }
    };

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

    const loadData = async (guestEmail?: string, guestPhone?: string) => {
        if (!businessId) return;

        try {
            setLoading(true);

            const businessData = await getBusinessById(businessId);
            setBusiness(businessData);

            const servicesData = await getServicesByBusiness(businessId);
            setServices(servicesData.filter(s => s.active !== false));

            try {
                const productsData = await getProductsByBusiness(businessId);
                setProducts(productsData.filter(p => p.active));
            } catch (err) {
                console.error("Error loading products", err);
            }

            const emailToFetch = guestEmail || user?.email;
            if (emailToFetch) {
                try {
                    const assets = await getActiveAssets({
                        businessId,
                        email: emailToFetch,
                        phone: (guestPhone || user?.phone) as string | undefined,
                    });
                    setAvailableAssets(assets);

                    // Auto-select asset if only one is available and it's compatible
                    if (assets.length > 0 && !form.getValues('assetId')) {
                        const compatibleAssets = assets.filter(asset => {
                            if (!selectedServiceId) return true;
                            const allowed = asset.productId?.allowedServiceIds;
                            return !allowed || allowed.length === 0 || allowed.includes(selectedServiceId);
                        });

                        if (compatibleAssets.length > 0) {
                            form.setValue('assetId', compatibleAssets[0]._id);
                            setActiveTab('credits');
                            toast.success(`¡Tienes créditos disponibles! Se han aplicado automáticamente.`);
                        }
                    }
                } catch (e) {
                    console.error("Error loading assets", e);
                }
            }

            if (user?.userId) {
                try {
                    const bookingsData = await getBookingsByClient(user.userId);
                    setMyBookings(bookingsData.filter(b => b.businessId === businessId));
                } catch {
                    console.log("Could not fetch user bookings");
                }
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || t('common.load_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleBuyPackage = (product: Product) => {
        setSelectedProduct(product);
        form.setValue('productId', product._id);
        form.setValue('assetId', undefined);
        toast.info(`Has seleccionado: ${product.name}. Procede a confirmar para realizar el pago.`);
    };

    const onSubmit = async (values: z.infer<typeof bookingFormSchema>) => {
        if (!businessId) return;

        if (selectedService?.requireResource && !selectedResourceId) {
            toast.error("Por favor selecciona un lugar en el mapa");
            return;
        }

        if (values.serviceId && (!values.date || !values.time)) {
            toast.error("Por favor selecciona fecha y hora para tu servicio");
            return;
        }

        if (!values.serviceId && !values.productId) {
            toast.error("Por favor selecciona un servicio o paquete para continuar");
            return;
        }

        try {
            let scheduledAt: string | undefined;
            if (values.date && values.time) {
                const [hours, minutes] = values.time.split(":").map(Number);
                const date = new Date(values.date);
                date.setHours(hours, minutes, 0, 0);
                scheduledAt = date.toISOString();
            }

            const bookingData = {
                businessId,
                serviceId: values.serviceId,
                clientName: values.clientName,
                clientEmail: values.clientEmail,
                clientPhone: values.clientPhone,
                scheduledAt,
                resourceId: selectedResourceId || undefined,
                status: "pending" as const,
                notes: values.notes,
                assetId: values.assetId,
            };

            // If buying a package, handle checkout
            if (values.productId && !values.assetId) {
                const checkout = await createProductCheckout({
                    productId: values.productId,
                    businessId: businessId!,
                    clientEmail: values.clientEmail,
                    clientPhone: values.clientPhone,
                    clientName: values.clientName,
                    // Pass booking info in success URL to complete reservation after payment
                    successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&type=product&booking_data=${btoa(JSON.stringify(bookingData))}`,
                    cancelUrl: window.location.href,
                });

                if (checkout.url) {
                    window.location.href = checkout.url;
                    return;
                }
            }

            const booking = await createBooking(bookingData);

            setBookingSuccess(true);
            toast.success(t('booking.form.toasts.confirmed_desc'));

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
                setConflictError({
                    message: t('booking.form.toasts.booking_conflict_error'),
                    accessCode: errData.accessCode,
                    clientEmail: values.clientEmail
                });
                return;
            }
            toast.error(errData?.message || t('booking.form.toasts.error_desc'));
        }
    };




    // Handle return from Stripe (Buy Package & Book)
    useEffect(() => {
        const success = searchParams.get("success");
        const action = searchParams.get("action");

        if (success === "true" && action === "book_after_purchase" && businessId) {
            // Wait for asset to be generated (webhook latency)
            // Ideally we retry or show a "Processing..." state.
            // For now, let's try to book immediately, but we might not have the assetId yet IF the webhook hasn't fired.
            // However, createBooking with 'PAY_AT_BOOKING' or 'PACKAGES' will look for credits.
            // If the webhook is slow, this might fail with "No credit".
            // A meaningful UX would be: "Payment successful! Completing your booking..."

            const performPostPaymentBooking = async () => {
                const sId = searchParams.get("serviceId");
                const dateStr = searchParams.get("date"); // ISO string
                const timeStr = searchParams.get("time");
                const cName = searchParams.get("clientName");
                const cEmail = searchParams.get("clientEmail");
                const cPhone = searchParams.get("clientPhone");

                if (sId && dateStr && timeStr && cEmail) {
                    try {
                        toast.info("Procesando tu reserva...");

                        // We need to wait a moment or poll for assets? 
                        // Or just submit and let backend handle "Implicit" usage if configured?
                        // If policy is PACKAGES, we need a credit.

                        // Let's assume webhook is fast or we simply submit the booking.
                        // Actually, to improve reliability, we can delay 2-3 seconds.
                        await new Promise(r => setTimeout(r, 2000));

                        const scheduledDate = new Date(dateStr);
                        // Time string might be HH:MM
                        const [hours, minutes] = timeStr.split(":").map(Number);
                        scheduledDate.setHours(hours, minutes, 0, 0);

                        const bookingData = {
                            businessId,
                            serviceId: sId,
                            clientName: cName || "",
                            clientEmail: cEmail,
                            clientPhone: cPhone || "",
                            scheduledAt: scheduledDate.toISOString(),
                            status: "pending" as const,
                            notes: "Booking after package purchase",
                            // We don't specify assetId, backend will find available one for this user?
                            // BookingsService.create doesn't auto-find asset unless we pass logic.
                            // But `customerAssetsService.findActiveAssets` logic exists.
                            // Frontend usually sends assetId? 
                            // If we don't send assetId, createBooking checks:
                            // if (service.requireProduct) fail.

                            // We need to fetch user assets first!
                        };

                        // Retry finding asset logic
                        let retries = 3;
                        let foundAssetId: string | undefined;

                        // We need user context. If user was guest, Stripe email matches.
                        // But we don't have auth token for guest?
                        // Public API for creating booking allows it.

                        // Challenge: Linking the just-bought package to this booking without login.
                        // If Intermediated, the backend Webhook links asset to User (by email).
                        // How do we grab that asset ID here?
                        // We can fetch "my-assets" by email? No, security risk.

                        // Workaround: We proceed to submit. Backend 'create' might not auto-use asset unless we modify it or 
                        // we rely on the user manually booking?
                        // The user request says: "The customer should think 'I want to reserve a class'".

                        // If we can't fully automate safely without login, we redirect to a specific "Complete Booking" state.

                        // Simplified:
                        // 1. Show "Purchase Successful".
                        // 2. Pre-fill form.
                        // 3. User clicks "Confirm".
                        // 4. Backend assigns asset if available.

                        // BUT, if we want auto-magic:
                        // We submit. If backend fails with "No asset", we say "Wait, processing payment...".

                        // Let's just restore state and show Success Message for PACKAGE, then ask to Confirm.
                        handleServiceSelect(sId);
                        form.setValue("date", new Date(dateStr));
                        form.setValue("time", timeStr);
                        if (cName) form.setValue("clientName", cName);
                        if (cEmail) form.setValue("clientEmail", cEmail);
                        if (cPhone) form.setValue("clientPhone", cPhone);

                        toast.success("¡Paquete comprado exitosamente! Ahora confirma tu reserva.");

                        // Scroll to step 3
                        setTimeout(() => {
                            document.getElementById('step3-anchor')?.scrollIntoView({ behavior: 'smooth' });
                        }, 500);

                    } catch (e) {
                        console.error(e);
                        toast.error("Error recuperando datos de la reserva.");
                    }
                }
            };

            performPostPaymentBooking();
        }
    }, [searchParams, businessId]);

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
                    <h2 className="text-2xl font-bold">{t('common.error')}</h2>
                    <Button className="mt-4" onClick={() => navigate("/")}>{t('common.cancel')}</Button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen transition-colors duration-300"
            style={theme === 'custom' && business.settings?.secondaryColor ? {
                backgroundColor: business.settings.secondaryColor + '15'
            } : {}}
        >
            <div
                className="border-b shadow-sm transition-colors duration-300"
                style={theme === 'custom' && business.settings?.primaryColor ? {
                    backgroundColor: business.settings.primaryColor,
                    color: isColorDark(business.settings.primaryColor) ? '#ffffff' : '#000000',
                    borderColor: 'transparent'
                } : {}}
            >
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
                            <p className="text-sm text-muted-foreground">{t('booking.header.system')}</p>
                        </div>
                    </div>
                    <BusinessThemeToggle hasCustomTheme={!!business.settings?.primaryColor} />
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-3 md:px-4 py-6 md:py-8 space-y-6 md:space-y-8">
                {/* Stepper */}
                <div className="mb-8">
                    <BookingStepper
                        steps={[
                            { id: 1, title: "Servicio", description: "Elige tu opción" },
                            { id: 2, title: "Fecha y Hora", description: "Selecciona el momento" },
                            { id: 3, title: "Confirma", description: "Completa tu reserva" }
                        ]}
                        currentStep={
                            !selectedServiceId && !selectedProduct ? 1 :
                                (selectedProduct && !selectedServiceId) ? 3 :
                                    (!selectedDate || !selectedTime) ? 2 : 3
                        }
                    />
                </div>
                {
                    bookingSuccess && (
                        <Card className="border-green-200 bg-green-50">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                                    <div>
                                        <h3 className="font-semibold text-green-900">{t('booking.form.confirmation_title')}</h3>
                                        <p className="text-sm text-green-700">
                                            {t('booking.form.need_code')}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                }

                <AnimatePresence mode="wait">
                    {(!selectedServiceId && !selectedProduct) && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className={cn("shadow-xl border-2 transition-all duration-500 overflow-hidden", selectedServiceId && "opacity-50 grayscale scale-[0.98]")}>
                                <CardHeader className="pb-2">
                                    <div className="text-center mb-4 md:mb-6 px-2">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-primary/10 text-primary text-xs md:text-sm font-semibold mb-3 md:mb-4">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                            </span>
                                            Paso 1 de 3
                                        </div>
                                        <CardTitle className="text-2xl md:text-3xl lg:text-4xl font-black uppercase italic tracking-tighter dark:text-white leading-tight">
                                            Nuestros <span className="text-primary italic">Servicios</span>
                                        </CardTitle>
                                        <CardDescription className="text-sm md:text-base mt-2 px-4">Encuentra la experiencia perfecta para tu transformación</CardDescription>
                                    </div>

                                    {/* Search & Filter Bar */}
                                    <div className="flex flex-col gap-3 mb-4 md:mb-6 px-2">
                                        {/* Search Input */}
                                        <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                            <div className="relative group">
                                                <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="¿Qué servicio buscas?"
                                                    className="w-full pl-8 pr-2 h-12 bg-transparent outline-none text-sm font-medium"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        {/* Filter Buttons */}
                                        <div className="grid grid-cols-2 md:flex md:items-center md:justify-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                                            <Button
                                                variant={activeFilter === 'all' ? 'default' : 'ghost'}
                                                size="sm"
                                                className="rounded-xl font-bold text-[11px] md:text-[10px] uppercase tracking-wider h-12 md:h-10 px-3 md:px-4"
                                                onClick={() => setActiveFilter('all')}
                                            >
                                                Todos
                                            </Button>
                                            <Button
                                                variant={activeFilter === 'presencial' ? 'default' : 'ghost'}
                                                size="sm"
                                                className="rounded-xl font-bold text-[11px] md:text-[10px] uppercase tracking-wider h-12 md:h-10 px-3 md:px-4"
                                                onClick={() => setActiveFilter('presencial')}
                                            >
                                                Presencial
                                            </Button>
                                            <Button
                                                variant={activeFilter === 'online' ? 'default' : 'ghost'}
                                                size="sm"
                                                className="rounded-xl font-bold text-[11px] md:text-[10px] uppercase tracking-wider h-12 md:h-10 px-3 md:px-4"
                                                onClick={() => setActiveFilter('online')}
                                            >
                                                Online
                                            </Button>
                                            {products.length > 0 && (
                                                <Button
                                                    variant={activeFilter === 'packages' ? 'default' : 'ghost'}
                                                    size="sm"
                                                    className="rounded-xl font-bold text-[11px] md:text-[10px] uppercase tracking-wider h-12 md:h-10 px-3 md:px-4 col-span-2 md:col-span-1"
                                                    onClick={() => setActiveFilter('packages')}
                                                >
                                                    Paquetes
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 md:pt-6 px-3 md:px-6 pb-4 md:pb-6">
                                    {services.length === 0 ? (
                                        <div className="text-center py-16 md:py-20 border-2 border-dashed rounded-[2rem] border-slate-200 dark:border-slate-800 mx-2">
                                            <Zap className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-slate-300" />
                                            <p className="text-muted-foreground font-medium text-sm px-4">No hay servicios disponibles en este momento</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            {(() => {
                                                if (activeFilter === 'packages') {
                                                    const filteredProducts = products.filter(p =>
                                                        (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                            p.description?.toLowerCase().includes(searchTerm.toLowerCase())) &&
                                                        (p.type === ProductType.Package || p.type === ProductType.Pass)
                                                    );

                                                    if (filteredProducts.length === 0) {
                                                        return (
                                                            <div className="text-center py-12 md:py-16 px-4">
                                                                <Zap className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-slate-300" />
                                                                <p className="text-muted-foreground font-medium text-sm">No hay paquetes disponibles con ese nombre</p>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                                            {filteredProducts.map((product, index) => (
                                                                <motion.div
                                                                    key={product._id}
                                                                    initial={{ opacity: 0, y: 20 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ duration: 0.4, delay: index * 0.05 }}
                                                                    whileHover={{ y: -8 }}
                                                                    className="h-full"
                                                                >
                                                                    <Card
                                                                        className={cn(
                                                                            "group cursor-pointer transition-all duration-500 relative overflow-hidden h-full flex flex-col",
                                                                            "border-2 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)]",
                                                                            selectedProduct?._id === product._id
                                                                                ? "border-primary shadow-2xl shadow-primary/20 bg-primary/5"
                                                                                : "border-slate-100 dark:border-slate-800/50 hover:border-primary/30 bg-card"
                                                                        )}
                                                                        onClick={() => {
                                                                            handleBuyPackage(product);
                                                                            // Clear service selection when picking a product standalone
                                                                            handleServiceSelect("");
                                                                        }}
                                                                    >
                                                                        {selectedProduct?._id === product._id && (
                                                                            <div className="absolute top-4 left-4 z-20">
                                                                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-900">
                                                                                    <Check className="h-5 w-5 text-white" strokeWidth={4} />
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        <div className="flex justify-end p-4 relative z-10">
                                                                            <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 border-0 text-[8px] font-black uppercase tracking-widest italic px-2 py-1">
                                                                                {product.type === ProductType.Package ? 'Paquete' : 'Pase'}
                                                                            </Badge>
                                                                        </div>

                                                                        <div className="px-6 py-2 flex-grow space-y-3">
                                                                            <h4 className="text-2xl font-black uppercase italic tracking-tighter leading-none group-hover:text-primary transition-colors duration-300">
                                                                                {product.name}
                                                                            </h4>
                                                                            {product.description && (
                                                                                <p className="text-[11px] text-muted-foreground font-medium line-clamp-2">
                                                                                    {product.description}
                                                                                </p>
                                                                            )}
                                                                        </div>

                                                                        <div className="mt-auto p-6 space-y-6">
                                                                            <div className="flex items-center gap-6 border-t border-slate-100 dark:border-slate-800/50 pt-4">
                                                                                <div className="flex flex-col gap-1">
                                                                                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Contenido</span>
                                                                                    <div className="font-black italic text-sm">
                                                                                        {product.isUnlimited ? 'Ilimitado' : `${product.totalUses} Clases`}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex flex-col gap-1">
                                                                                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Precio</span>
                                                                                    <div className="font-black italic text-lg text-primary">
                                                                                        ${product.price}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <Button
                                                                                variant={selectedProduct?._id === product._id ? "default" : "outline"}
                                                                                className="w-full h-12 rounded-2xl text-[10px] font-black uppercase italic tracking-widest"
                                                                            >
                                                                                {selectedProduct?._id === product._id ? "Seleccionado" : "Elegir Plan"}
                                                                            </Button>
                                                                        </div>
                                                                    </Card>
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    );
                                                }

                                                const filtered = services.filter(s => {
                                                    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                        s.description?.toLowerCase().includes(searchTerm.toLowerCase());
                                                    const matchesFilter = activeFilter === 'all' ||
                                                        (activeFilter === 'online' ? s.isOnline : !s.isOnline);
                                                    return matchesSearch && matchesFilter;
                                                });

                                                if (filtered.length === 0) {
                                                    return (
                                                        <motion.div
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            className="text-center py-12 md:py-16 px-4"
                                                        >
                                                            <div className="h-16 w-16 md:h-20 md:w-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 rotate-12">
                                                                <Search className="h-6 w-6 md:h-8 md:w-8 text-slate-400" />
                                                            </div>
                                                            <p className="text-slate-500 font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] text-[9px] md:text-[10px]">No hay coincidencias para tu búsqueda</p>
                                                        </motion.div>
                                                    );
                                                }

                                                return (
                                                    <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                                        {filtered.map((service, index) => (
                                                            <motion.div
                                                                key={service._id}
                                                                initial={{ opacity: 0, y: 20 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                                                whileHover={{ y: -8 }}
                                                                className="h-full"
                                                            >
                                                                <Card
                                                                    className={cn(
                                                                        "group cursor-pointer transition-all duration-500 relative overflow-hidden h-full flex flex-col",
                                                                        "border-2 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]",
                                                                        selectedService?._id === service._id
                                                                            ? "border-primary shadow-2xl shadow-primary/20 bg-primary/5"
                                                                            : "border-slate-100 dark:border-slate-800/50 hover:border-primary/30 bg-card"
                                                                    )}
                                                                    onClick={() => handleServiceSelect(service._id)}
                                                                >
                                                                    {/* Selection Glow */}
                                                                    {selectedService?._id === service._id && (
                                                                        <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                                                                    )}

                                                                    {/* Selected Indicator */}
                                                                    {selectedService?._id === service._id && (
                                                                        <div className="absolute top-4 left-4 z-20">
                                                                            <motion.div
                                                                                initial={{ scale: 0, rotate: -45 }}
                                                                                animate={{ scale: 1, rotate: 0 }}
                                                                                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40 border-4 border-white dark:border-slate-900"
                                                                            >
                                                                                <Check className="h-5 w-5 text-white" strokeWidth={4} />
                                                                            </motion.div>
                                                                        </div>
                                                                    )}

                                                                    <div className="flex justify-end p-4 gap-2 relative z-10">
                                                                        {service.isOnline && (
                                                                            <Badge variant="outline" className="bg-sky-500/10 text-sky-500 border-sky-500/20 text-[8px] font-black uppercase tracking-[0.2em] italic px-2 py-1">
                                                                                En Línea
                                                                            </Badge>
                                                                        )}
                                                                        {(service.requirePayment || service.requireProduct) && (
                                                                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 border-0 text-[8px] font-black uppercase tracking-[0.2em] italic shadow-lg shadow-orange-500/20 px-2 py-1">
                                                                                <Sparkles className="h-2 w-2 mr-1" />
                                                                                Premium
                                                                            </Badge>
                                                                        )}
                                                                    </div>

                                                                    <div className="px-6 py-2 flex-grow space-y-3">
                                                                        <h4 className="text-2xl font-black uppercase italic tracking-tighter leading-none group-hover:text-primary transition-colors duration-300 pt-2">
                                                                            {service.name}
                                                                        </h4>
                                                                        {service.description && (
                                                                            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed line-clamp-2">
                                                                                {service.description}
                                                                            </p>
                                                                        )}
                                                                    </div>

                                                                    <div className="mt-auto p-6 space-y-6">
                                                                        <div className="flex items-center gap-6 border-t border-slate-100 dark:border-slate-800/50 pt-6">
                                                                            <div className="flex flex-col gap-1">
                                                                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Tiempo</span>
                                                                                <div className="flex items-center gap-2 font-black italic text-base">
                                                                                    <Clock className="h-3.5 w-3.5 text-primary" />
                                                                                    {service.durationMinutes}m
                                                                                </div>
                                                                            </div>
                                                                            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 rotate-12" />
                                                                            <div className="flex flex-col gap-1">
                                                                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Valor</span>
                                                                                <div className="flex items-center gap-2 font-black italic text-base text-primary">
                                                                                    <DollarSign className="h-3.5 w-3.5" />
                                                                                    {service.price}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <Button
                                                                            variant={selectedService?._id === service._id ? "default" : "outline"}
                                                                            className={cn(
                                                                                "w-full h-12 rounded-2xl text-[10px] font-black uppercase italic tracking-[0.2em] gap-2 transition-all duration-500",
                                                                                selectedService?._id === service._id
                                                                                    ? "shadow-xl shadow-primary/30"
                                                                                    : "group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/20"
                                                                            )}
                                                                        >
                                                                            {selectedService?._id === service._id ? (
                                                                                <>Seleccionado <Check className="h-3.5 w-3.5" /></>
                                                                            ) : (
                                                                                <>Reservar Ahora <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" /></>
                                                                            )}
                                                                        </Button>
                                                                    </div>
                                                                </Card>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </CardContent>
                                {selectedServiceId && (
                                    <div className="px-6 pb-8 pt-2 flex justify-center">
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <Button
                                                onClick={() => {
                                                    const el = document.getElementById('step2-anchor');
                                                    el?.scrollIntoView({ behavior: 'smooth' });
                                                }}
                                                className="px-10 h-14 rounded-2xl font-black uppercase italic tracking-widest gap-3 shadow-xl hover:shadow-2xl transition-all"
                                            >
                                                Continuar al Paso 2 <ArrowDown className="h-4 w-4 animate-bounce" />
                                            </Button>
                                        </motion.div>
                                    </div>
                                )}
                                {selectedProduct && !selectedServiceId && (
                                    <div className="px-6 pb-8 pt-2 flex justify-center">
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <Button
                                                onClick={() => {
                                                    const el = document.getElementById('step3-anchor-direct');
                                                    el?.scrollIntoView({ behavior: 'smooth' });
                                                }}
                                                className="px-10 h-14 rounded-2xl font-black uppercase italic tracking-widest gap-3 shadow-xl hover:shadow-2xl transition-all"
                                            >
                                                Continuar al Paso Final <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </motion.div>
                                    </div>
                                )}
                            </Card>
                        </motion.div>
                    )}

                    {(selectedServiceId || selectedProduct) && (
                        <motion.div
                            key="booking-steps-2-3"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            id="step2-anchor"
                            className="space-y-8"
                        >
                            {/* Selected Item Summary (Sticky-ish) */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm"
                            >
                                <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black italic text-primary uppercase tracking-[0.2em]">
                                        {selectedService ? 'Servicio Seleccionado' : 'Paquete Seleccionado'}
                                    </p>
                                    <h4 className="text-lg font-black italic uppercase tracking-tighter leading-none pt-1">
                                        {selectedService?.name || selectedProduct?.name}
                                    </h4>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-[10px] font-black uppercase italic tracking-[0.1em] hover:bg-primary/20 hover:text-primary transition-all rounded-xl border border-transparent hover:border-primary/20"
                                    onClick={() => {
                                        if (selectedService) handleServiceSelect("");
                                        if (selectedProduct) setSelectedProduct(null);
                                    }}
                                >
                                    Cambiar
                                </Button>
                            </motion.div>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                    {/* Step 2 Card */}
                                    {selectedServiceId && (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            <Card className={cn("shadow-xl border-2 overflow-hidden transition-all duration-500", (selectedDate && selectedTime) && "opacity-70")}>
                                                <CardHeader className="bg-primary/5 border-b mb-6">
                                                    <div className="text-center">
                                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
                                                            Paso 2 de 3
                                                        </div>
                                                        <CardTitle className="text-2xl font-bold">Selecciona tu horario</CardTitle>
                                                        <CardDescription>Elige el momento perfecto para tu sesión</CardDescription>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <FormField
                                                            control={form.control}
                                                            name="date"
                                                            render={({ field }) => (
                                                                <FormItem className="flex flex-col">
                                                                    <FormLabel className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Fecha</FormLabel>
                                                                    <div className="border rounded-2xl p-2 bg-background shadow-inner">
                                                                        <Calendar
                                                                            mode="single"
                                                                            selected={field.value}
                                                                            onSelect={(date) => {
                                                                                field.onChange(date);
                                                                                form.setValue("time", "");
                                                                            }}
                                                                            disabled={isDateDisabled}
                                                                            initialFocus
                                                                            className="mx-auto"
                                                                        />
                                                                    </div>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <FormField
                                                            control={form.control}
                                                            name="time"
                                                            render={({ field }) => (
                                                                <FormItem className="flex flex-col">
                                                                    <FormLabel className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Hora Disponible</FormLabel>
                                                                    <FormControl>
                                                                        <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                                            {!selectedDate ? (
                                                                                <div className="col-span-full flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-2xl text-muted-foreground opacity-50">
                                                                                    <CalendarIcon className="h-8 w-8 mb-2" />
                                                                                    <p className="text-xs font-bold uppercase">Primero selecciona una fecha</p>
                                                                                </div>
                                                                            ) : isLoadingSlots ? (
                                                                                <div className="col-span-full py-12 flex flex-col items-center gap-2">
                                                                                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                                                                    <p className="text-xs font-bold uppercase">Buscando espacios...</p>
                                                                                </div>
                                                                            ) : slots?.length === 0 ? (
                                                                                <div className="col-span-full py-12 text-center bg-orange-50 dark:bg-orange-950/20 rounded-2xl border-2 border-orange-200 text-orange-600">
                                                                                    <X className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                                                    <p className="text-xs font-bold uppercase">No hay horarios disponibles</p>
                                                                                </div>
                                                                            ) : (
                                                                                slots?.map((slot) => (
                                                                                    <Button
                                                                                        key={slot}
                                                                                        type="button"
                                                                                        variant={field.value === slot ? "default" : "outline"}
                                                                                        className={cn(
                                                                                            "h-12 font-black italic transition-all duration-300 rounded-xl",
                                                                                            field.value === slot ? "bg-primary text-white scale-105 shadow-lg shadow-primary/20" : "hover:border-primary/50"
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

                                                    {selectedDate && selectedTime && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            className="pt-6 border-t flex justify-center"
                                                        >
                                                            <Button
                                                                type="button"
                                                                onClick={() => {
                                                                    const el = document.getElementById('step3-anchor-direct');
                                                                    el?.scrollIntoView({ behavior: 'smooth' });
                                                                }}
                                                                className="px-12 h-12 rounded-full font-black uppercase italic tracking-widest"
                                                            >
                                                                Confirmar Horario <Check className="ml-2 h-4 w-4" />
                                                            </Button>
                                                        </motion.div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    )}

                                    {/* Step 3 Card */}
                                    <div id="step3-anchor-direct" className="scroll-mt-6" />
                                    {((selectedDate && selectedTime) || (selectedProduct && !selectedServiceId)) && (
                                        <motion.div
                                            id="step3-anchor"
                                            key="step3"
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.6 }}
                                        >
                                            <Card className="shadow-2xl border-2 border-primary/20 overflow-hidden bg-gradient-to-br from-background to-primary/5">
                                                <CardHeader className="text-center pb-8 pt-10">
                                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                                        </span>
                                                        Paso 3 de 3 - ¡Estás a un paso!
                                                    </div>
                                                    <CardTitle className="text-4xl font-black uppercase italic tracking-tighter">Completa tu Reserva</CardTitle>
                                                    <CardDescription className="text-base">Necesitamos unos últimos detalles para confirmar tu lugar</CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-8 max-w-2xl mx-auto">

                                                    <div className="relative group">
                                                        <div className="grid grid-cols-2 gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border-2 border-primary/10 shadow-sm transition-all group-hover:border-primary/30">
                                                            <div className="flex items-center gap-3">
                                                                <CalendarIcon className="h-5 w-5 text-primary" />
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Fecha</p>
                                                                    <p className="text-sm font-black italic">{format(selectedDate, "PP", { locale: i18n.language === 'es' ? es : enUS })}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <Clock className="h-5 w-5 text-primary" />
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Hora</p>
                                                                    <p className="text-sm font-black italic">{selectedTime}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="sm"
                                                            className="absolute -top-3 -right-3 h-8 shadow-lg border-2 border-white dark:border-slate-800 rounded-full text-[10px] font-black uppercase italic tracking-wider px-4 hover:scale-105 active:scale-95 transition-all"
                                                            onClick={() => {
                                                                form.setValue("time", "");
                                                                const el = document.getElementById('step2-anchor');
                                                                el?.scrollIntoView({ behavior: 'smooth' });
                                                            }}
                                                        >
                                                            Cambiar Horario
                                                        </Button>
                                                    </div>


                                                    {/* Price & Fiscal Logic Breakdown */}
                                                    <div className="space-y-4">
                                                        {/* Step 3: Selection Logic */}
                                                        {form.watch('productId') ? (
                                                            /* User ALREADY selected a package in Step 1 */
                                                            <div className="space-y-4">
                                                                <div className="p-6 rounded-[2rem] bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200 dark:border-amber-800/50 relative overflow-hidden group">
                                                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                                                        <Sparkles className="w-16 h-16 text-amber-500" />
                                                                    </div>
                                                                    <div className="flex justify-between items-start mb-4">
                                                                        <div>
                                                                            <Badge className="bg-amber-500 text-white border-none mb-2">Paquete Seleccionado</Badge>
                                                                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-amber-700 dark:text-amber-400">
                                                                                {products.find(p => p._id === form.getValues('productId'))?.name}
                                                                            </h3>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-2xl font-black italic text-amber-600 dark:text-amber-500">
                                                                                ${products.find(p => p._id === form.getValues('productId'))?.price}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-4">
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="rounded-full border-amber-200 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-800/50 h-8 text-[10px] font-bold uppercase"
                                                                            onClick={() => {
                                                                                form.setValue('productId', undefined);
                                                                                setActiveTab('single');
                                                                            }}
                                                                        >
                                                                            Cambiar a Clase Suelta
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl text-[11px] text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-900/50 flex gap-3 items-center">
                                                                    <Info className="w-5 h-5 shrink-0" />
                                                                    <p>Al confirmar, comprarás el paquete y esta clase se reservará automáticamente usando tu primer crédito.</p>
                                                                </div>
                                                            </div>
                                                        ) : (business.paymentConfig?.paymentPolicy === 'PACKAGES' || products.length > 0 || availableAssets.length > 0) ? (
                                                            /* Standard Selection with Tabs */
                                                            <Tabs defaultValue={availableAssets.length > 0 ? "credits" : "single"} value={activeTab} onValueChange={(val) => {
                                                                setActiveTab(val);
                                                                if (val === 'credits' && availableAssets.length > 0) {
                                                                    form.setValue('assetId', availableAssets[0]._id);
                                                                } else if (val !== 'credits') {
                                                                    form.setValue('assetId', undefined);
                                                                }
                                                            }} className="w-full">
                                                                <TabsList className={`grid w-full ${[products.length > 0, availableAssets.length > 0, true].filter(Boolean).length === 3 ? 'grid-cols-3' : ([products.length > 0, availableAssets.length > 0, true].filter(Boolean).length === 2 ? 'grid-cols-2' : 'grid-cols-1')} mb-6 h-auto p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800`}>
                                                                    <TabsTrigger value="single" className="rounded-xl py-3 text-xs font-black uppercase tracking-wider data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg mx-1 my-1">
                                                                        <CreditCard className="w-4 h-4 mr-2" /> Pago Único
                                                                    </TabsTrigger>
                                                                    {products.length > 0 && (
                                                                        <TabsTrigger value="packages" className="rounded-xl py-3 text-xs font-black uppercase tracking-wider data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg mx-1 my-1">
                                                                            <Sparkles className="w-4 h-4 mr-2 text-amber-500" /> Ver Paquetes
                                                                        </TabsTrigger>
                                                                    )}
                                                                    {availableAssets.length > 0 && (
                                                                        <TabsTrigger value="credits" className="rounded-xl py-3 text-xs font-black uppercase tracking-wider data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg mx-1 my-1">
                                                                            <Ticket className="w-4 h-4 mr-2 text-blue-500" /> Mis Créditos
                                                                        </TabsTrigger>
                                                                    )}
                                                                </TabsList>

                                                                <TabsContent value="single" className="space-y-4 mt-0">
                                                                    <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-4">
                                                                        <div className="flex justify-between items-center text-sm">
                                                                            <span className="text-muted-foreground font-medium">Subtotal</span>
                                                                            <span className="font-bold tabular-nums">
                                                                                ${((selectedService?.price || 0) / (business?.taxConfig?.enabled ? (1 + (business?.taxConfig?.taxRate || 0.16)) : 1)).toFixed(2)}
                                                                            </span>
                                                                        </div>

                                                                        {business?.taxConfig?.enabled && (
                                                                            <div className="flex justify-between items-center text-sm">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-muted-foreground font-medium">{business.taxConfig.taxName || 'Impuesto'} ({((business.taxConfig.taxRate || 0) * 100)}%)</span>
                                                                                    <Badge variant="outline" className="text-[8px] h-4 uppercase tracking-tighter text-blue-500 border-blue-200">Fiscal</Badge>
                                                                                </div>
                                                                                <span className="font-bold tabular-nums text-blue-500">
                                                                                    +${((selectedService?.price || 0) - ((selectedService?.price || 0) / (1 + (business.taxConfig.taxRate || 0.16)))).toFixed(2)}
                                                                                </span>
                                                                            </div>
                                                                        )}

                                                                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end">
                                                                            <div className="space-y-1">
                                                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total de la Inversión</p>
                                                                                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-primary">
                                                                                    ${selectedService?.price}
                                                                                    <span className="text-xs ml-1 not-italic font-bold text-muted-foreground">{business.settings?.currency || 'MXN'}</span>
                                                                                </h3>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
                                                                                <ShieldCheck className="h-3.5 w-3.5" />
                                                                                <span className="text-[10px] font-black uppercase tracking-tight">Pago Seguro</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {products.length > 0 && (
                                                                        <div
                                                                            onClick={() => setActiveTab('packages')}
                                                                            className="cursor-pointer p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 flex items-center justify-between group"
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                                                                                    <Sparkles className="w-4 h-4 text-amber-600" />
                                                                                </div>
                                                                                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">🎁 Ahorra hasta un 25% con un paquete</span>
                                                                            </div>
                                                                            <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
                                                                        </div>
                                                                    )}
                                                                </TabsContent>

                                                                <TabsContent value="packages" className="space-y-4 mt-0">
                                                                    <div className="space-y-4">
                                                                        <div className="grid grid-cols-1 gap-4">
                                                                            {products.filter(p => (p.type === ProductType.Package || p.type === ProductType.Pass) && p.active && (!p.allowedServiceIds || p.allowedServiceIds.length === 0 || p.allowedServiceIds.includes(selectedService?._id || ""))).map(product => (
                                                                                <div key={product._id} className="flex items-center justify-between p-4 border-2 border-primary/10 hover:border-primary/30 rounded-2xl bg-white dark:bg-slate-950 transition-all cursor-pointer group shadow-sm hover:shadow-md" onClick={() => handleBuyPackage(product)}>
                                                                                    <div className="space-y-1">
                                                                                        <h4 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                                                                                            {product.name}
                                                                                            {product.price < ((selectedService?.price || 0) * (product.totalUses || 1)) && <Badge variant="destructive" className="text-[8px] h-4 px-1 rounded-sm">MEJOR PRECIO</Badge>}
                                                                                        </h4>
                                                                                        <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                                                                            <span className="bg-secondary px-2 py-0.5 rounded-md">{product.isUnlimited ? 'Ilimitado' : `${product.totalUses} Clases`}</span>
                                                                                            <span className="border px-2 py-0.5 rounded-md">{product.validityDays} Días</span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="text-right pl-4">
                                                                                        <p className="text-xl font-black italic tracking-tighter text-primary">${product.price}</p>
                                                                                        <Button size="sm" variant="default" className="mt-1 w-full rounded-full text-[10px] font-black uppercase tracking-widest h-7 px-3">
                                                                                            Seleccionar
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </TabsContent>

                                                                <TabsContent value="credits" className="space-y-4 mt-0">
                                                                    <div className="space-y-4">
                                                                        {availableAssets.filter(asset => {
                                                                            if (!selectedServiceId) return true;
                                                                            const allowed = asset.productId?.allowedServiceIds;
                                                                            return !allowed || allowed.length === 0 || allowed.includes(selectedServiceId);
                                                                        }).map(asset => {
                                                                            const isSelected = form.watch('assetId') === asset._id;
                                                                            return (
                                                                                <div key={asset._id}
                                                                                    onClick={() => {
                                                                                        form.setValue('assetId', asset._id);
                                                                                    }}
                                                                                    className={`p-4 border-2 rounded-2xl cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-primary/50'}`}>
                                                                                    <div className="flex justify-between items-center">
                                                                                        <div className="space-y-1">
                                                                                            <h4 className="font-bold text-sm uppercase tracking-wide">{asset.productId?.name || "Paquete"}</h4>
                                                                                            <div className="flex gap-2">
                                                                                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold text-slate-600 dark:text-slate-400">
                                                                                                    {asset.isUnlimited ? 'Ilimitado' : `${asset.remainingUses} usos restantes`}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                        {isSelected && <CheckCircle2 className="w-6 h-6 text-primary" />}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </TabsContent>
                                                            </Tabs>
                                                        ) : (
                                                            <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-4">
                                                                <div className="flex justify-between items-center text-sm">
                                                                    <span className="text-muted-foreground font-medium">Subtotal</span>
                                                                    <span className="font-bold tabular-nums">
                                                                        ${((selectedService?.price || 0) / (business?.taxConfig?.enabled ? (1 + (business?.taxConfig?.taxRate || 0.16)) : 1)).toFixed(2)}
                                                                    </span>
                                                                </div>

                                                                {business?.taxConfig?.enabled && (
                                                                    <div className="flex justify-between items-center text-sm">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-muted-foreground font-medium">{business.taxConfig.taxName || 'Impuesto'} ({((business.taxConfig.taxRate || 0) * 100)}%)</span>
                                                                            <Badge variant="outline" className="text-[8px] h-4 uppercase tracking-tighter text-blue-500 border-blue-200">Fiscal</Badge>
                                                                        </div>
                                                                        <span className="font-bold tabular-nums text-blue-500">
                                                                            +${((selectedService?.price || 0) - ((selectedService?.price || 0) / (1 + (business.taxConfig.taxRate || 0.16)))).toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end">
                                                                    <div className="space-y-1">
                                                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total de la Inversión</p>
                                                                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-primary">
                                                                            ${selectedService?.price}
                                                                            <span className="text-xs ml-1 not-italic font-bold text-muted-foreground">{business.settings?.currency || 'MXN'}</span>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
                                                                        <ShieldCheck className="h-3.5 w-3.5" />
                                                                        <span className="text-[10px] font-black uppercase tracking-tight">Pago Seguro</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Invoicing Selector for Fiscal Businesses */}
                                                    {business?.taxConfig?.invoicingEnabled && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            className="relative overflow-hidden p-6 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 transition-all hover:border-primary/20"
                                                        >
                                                            <div className="flex items-center justify-between gap-4">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                                        <Receipt className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-sm font-black uppercase italic tracking-tighter">¿Necesitas Factura?</h4>
                                                                        <p className="text-[10px] text-muted-foreground font-medium">Emitimos comprobantes fiscales legales</p>
                                                                    </div>
                                                                </div>
                                                                <FormField
                                                                    control={form.control}
                                                                    name="needsInvoice"
                                                                    render={({ field }) => (
                                                                        <FormItem className="flex items-center">
                                                                            <FormControl>
                                                                                <Switch
                                                                                    checked={field.value}
                                                                                    onCheckedChange={field.onChange}
                                                                                />
                                                                            </FormControl>
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </div>

                                                            <AnimatePresence>
                                                                {form.watch("needsInvoice") && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, height: 0 }}
                                                                        animate={{ opacity: 1, height: 'auto' }}
                                                                        exit={{ opacity: 0, height: 0 }}
                                                                        className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4 overflow-hidden"
                                                                    >
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            <FormField
                                                                                control={form.control}
                                                                                name="rfc"
                                                                                render={({ field }) => (
                                                                                    <FormItem>
                                                                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest">{business.taxConfig?.taxIdLabel || 'ID Fiscal'}</FormLabel>
                                                                                        <FormControl>
                                                                                            <Input {...field} placeholder="XAXX010101000" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-0" />
                                                                                        </FormControl>
                                                                                        <FormMessage />
                                                                                    </FormItem>
                                                                                )}
                                                                            />
                                                                            <FormField
                                                                                control={form.control}
                                                                                name="razonSocial"
                                                                                render={({ field }) => (
                                                                                    <FormItem>
                                                                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest">Razón Social</FormLabel>
                                                                                        <FormControl>
                                                                                            <Input {...field} placeholder="Nombre o Empresa" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-0" />
                                                                                        </FormControl>
                                                                                        <FormMessage />
                                                                                    </FormItem>
                                                                                )}
                                                                            />
                                                                        </div>
                                                                        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-700 dark:text-amber-400 leading-tight">
                                                                            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                                                            La factura se emitirá conforme a las disposiciones fiscales vigentes.
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </motion.div>
                                                    )}
                                                    {selectedService?.requireResource && (
                                                        <div className="space-y-4">
                                                            <h4 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                                                <Building2 className="h-4 w-4 text-primary" />
                                                                Selección de Lugar
                                                            </h4>
                                                            <ResourceSelector
                                                                businessId={businessId || ""}
                                                                scheduledAt={(() => {
                                                                    const [hours, minutes] = selectedTime.split(":").map(Number);
                                                                    const d = new Date(selectedDate);
                                                                    d.setHours(hours, minutes, 0, 0);
                                                                    return d.toISOString();
                                                                })()}
                                                                onResourceSelected={setSelectedResourceId}
                                                                primaryColor={business.settings?.primaryColor}
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="grid gap-6">
                                                        <FormField
                                                            control={form.control}
                                                            name="clientName"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-sm font-bold uppercase tracking-wider">Nombre Completo</FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="Tu nombre" className="h-12 rounded-xl bg-background" {...field} />
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
                                                                        <FormLabel className="text-sm font-bold uppercase tracking-wider">Email</FormLabel>
                                                                        <FormControl>
                                                                            <Input type="email" placeholder="tu@email.com" className="h-12 rounded-xl bg-background" {...field} />
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
                                                                        <FormLabel className="text-sm font-bold uppercase tracking-wider">Teléfono</FormLabel>
                                                                        <FormControl>
                                                                            <PhoneInput
                                                                                country={business?.settings?.language?.startsWith('en') ? 'us' : 'mx'}
                                                                                enableSearch
                                                                                countryCodeEditable={false}
                                                                                value={field.value}
                                                                                onChange={(value) => field.onChange(value)}
                                                                                placeholder={business?.settings?.language?.startsWith('en') ? '+1 (555) 000-0000' : '+52 55 1234 5678'}
                                                                                containerClass="w-full"
                                                                                inputClass="!w-full !h-12 !text-base !bg-background !border !border-input !rounded-xl !pl-14 !text-foreground focus:!ring-2 focus:!ring-primary/50"
                                                                                buttonClass="!h-12 !bg-background !border !border-input !rounded-l-xl !px-3"
                                                                                dropdownClass="!bg-popover !text-foreground !shadow-lg !border !rounded-xl"
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
                                                                    <FormLabel className="text-sm font-bold uppercase tracking-wider">Observaciones (Opcional)</FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="¿Algo que debamos saber?" className="h-12 rounded-xl bg-background" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    {form.watch('assetId') && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            className="p-4 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center gap-4"
                                                        >
                                                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                                                <Ticket className="h-6 w-6 text-primary" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-primary italic uppercase tracking-wider">Beneficio aplicado</p>
                                                                <p className="text-xs text-primary/80 font-medium">Se descontará 1 clase de tu paquete activo automáticamente.</p>
                                                            </div>
                                                        </motion.div>
                                                    )}

                                                    <Button
                                                        type="submit"
                                                        className="w-full font-black uppercase italic tracking-widest text-lg h-16 shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] rounded-2xl"
                                                        size="lg"
                                                        disabled={form.formState.isSubmitting}
                                                    >
                                                        {form.formState.isSubmitting ? (
                                                            <span className="flex items-center gap-3">
                                                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                                Confirmando...
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-3">
                                                                <CheckCircle2 className="h-6 w-6" />
                                                                {form.watch('assetId') ? "Confirmar (Usar Crédito)" : "¡Confirmar mi Reserva!"}
                                                            </span>
                                                        )}
                                                    </Button>

                                                    <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-tighter opacity-50">
                                                        Al confirmar aceptas nuestros términos y políticas de cancelación
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    )}
                                </form>
                            </Form>
                        </motion.div>
                    )}

                </AnimatePresence >

                {
                    myBookings.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('dashboard.bookings.title')}</CardTitle>
                                <CardDescription>{t('booking.services.subtitle')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {myBookings.map((booking) => {
                                        const service = services.find(s => s._id === booking.serviceId);
                                        return (
                                            <div key={booking._id} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div className="space-y-1">
                                                    <p className="font-semibold">{service?.name || t('booking.form.service_label')}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {format(new Date(booking.scheduledAt), "PPP 'a las' p", { locale: i18n.language === 'es' ? es : enUS })}
                                                    </p>
                                                    {booking.accessCode && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Código de acceso: <span className="font-medium text-foreground">{booking.accessCode}</span>
                                                        </p>
                                                    )}
                                                </div>
                                                <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                                                    {t(`dashboard.bookings.status.${booking.status}`)}
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
                                            {t('booking.form.check_booking')}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                }
            </div >

            {/* Social Media Footer */}
            {
                (business.settings?.facebook || business.settings?.instagram || business.settings?.twitter || business.settings?.website) && (
                    <div className="max-w-5xl mx-auto px-4 py-8 mt-8 border-t">
                        <div className="flex flex-col items-center gap-4">
                            <h3 className="text-sm font-semibold text-muted-foreground">Síguenos</h3>
                            <div className="flex gap-4">
                                {business.settings?.facebook && (
                                    <a
                                        href={business.settings.facebook}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-primary transition-colors"
                                        aria-label="Facebook"
                                    >
                                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                        </svg>
                                    </a>
                                )}
                                {business.settings?.instagram && (
                                    <a
                                        href={business.settings.instagram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-primary transition-colors"
                                        aria-label="Instagram"
                                    >
                                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                        </svg>
                                    </a>
                                )}
                                {business.settings?.twitter && (
                                    <a
                                        href={business.settings.twitter}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-primary transition-colors"
                                        aria-label="Twitter"
                                    >
                                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                    </a>
                                )}
                                {business.settings?.website && (
                                    <a
                                        href={business.settings.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-primary transition-colors"
                                        aria-label="Website"
                                    >
                                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
            <AlertDialog open={!!conflictError} onOpenChange={(open) => !open && setConflictError(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('booking.form.toasts.error_title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {conflictError?.message}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            const params = new URLSearchParams({
                                email: conflictError?.clientEmail || '',
                                ...(conflictError?.accessCode ? { code: conflictError.accessCode } : {}),
                                ...(businessId ? { businessId } : {}),
                            });
                            navigate(`/my-bookings?${params.toString()}`);
                        }}>
                            {t('booking.form.check_booking')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
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

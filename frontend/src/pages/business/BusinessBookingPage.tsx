import { useEffect, useState, useRef } from "react";
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
import AnimatedStepper, { AnimatedStep } from "@/components/booking/AnimatedStepper";
import { ServiceCard } from "@/components/booking/ServiceCard";
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
    const [step, setStep] = useState(1);
    const [bookingSuccessCode, setBookingSuccessCode] = useState<string | null>(null);
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
    const prevStepRef = useRef(step);

    // Auto-scroll to top on step change
    useEffect(() => {
        if (step !== prevStepRef.current) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            prevStepRef.current = step;
        }
    }, [step]);

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
            setStep(2); // Auto advance to calendar
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
        setStep(3); // Direct to checkout if buying package only
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

            setBookingSuccessCode(booking.accessCode || null);
            setBookingSuccess(true);
            toast.success(t('booking.form.toasts.confirmed_desc'));

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
            style={{
                ...(theme === 'custom' && business.settings?.secondaryColor ? {
                    backgroundColor: business.settings.secondaryColor + '10'
                } : {}),
                transition: 'background-color 0.5s ease-in-out'
            }}
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
                {!bookingSuccess ? (
                    <AnimatedStepper
                        currentStep={step}
                        onStepChange={(s) => setStep(s)}
                        steps={[
                            { id: 1, title: "Servicio", description: "Elige tu opción" },
                            { id: 2, title: "Horario", description: "Cuándo vienes" },
                            { id: 3, title: "Tus Datos", description: "Quién reserva" },
                            { id: 4, title: "Confirmar", description: "Paga y finaliza" }
                        ]}
                    >
                        <AnimatedStep>
                            <Card className="shadow-2xl border-2 overflow-hidden border-slate-100 dark:border-slate-800/10">
                                <CardHeader className="pb-2">
                                    <div className="text-center mb-6 px-2">
                                        <CardTitle className="text-3xl lg:text-5xl font-black uppercase italic tracking-tighter dark:text-white leading-tight">
                                            NUESTROS <span className="text-primary italic">SERVICIOS</span>
                                        </CardTitle>
                                        <CardDescription className="text-base mt-2 px-4 font-medium italic opacity-70">Encuentra la experiencia perfecta para tu transformación</CardDescription>
                                    </div>

                                    {/* Search & Filter Bar */}
                                    <div className="flex flex-col gap-4 mb-4 px-2 max-w-3xl mx-auto w-full">
                                        <div className="bg-slate-50 dark:bg-slate-900 px-4 py-1 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                            <div className="relative group">
                                                <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="¿Qué servicio buscas hoy?"
                                                    className="w-full pl-8 pr-2 h-14 bg-transparent outline-none text-base font-bold italic"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-[1.2rem] border border-slate-200 dark:border-slate-800">
                                            {[
                                                { id: 'all', label: 'Todos' },
                                                { id: 'presencial', label: 'Presencial' },
                                                { id: 'online', label: 'Online' },
                                                { id: 'packages', label: 'Ver Paquetes' }
                                            ].map((filter) => (
                                                (filter.id !== 'packages' || products.length > 0) && (
                                                    <Button
                                                        key={filter.id}
                                                        variant={activeFilter === filter.id ? 'default' : 'ghost'}
                                                        size="sm"
                                                        className={cn(
                                                            "rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.15em] h-9 px-4 flex-1 md:flex-none transition-all duration-300",
                                                            activeFilter === filter.id && "shadow-lg shadow-primary/20"
                                                        )}
                                                        onClick={() => setActiveFilter(filter.id as any)}
                                                    >
                                                        {filter.label}
                                                    </Button>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 px-3 md:px-8 pb-10">
                                    {services.length === 0 ? (
                                        <div className="text-center py-20 border-2 border-dashed rounded-[2rem] border-slate-100 dark:border-slate-800 opacity-50">
                                            <Zap className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                                            <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">No hay servicios disponibles</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                            {(() => {
                                                if (activeFilter === 'packages') {
                                                    return products
                                                        .filter(p => p.active && (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description?.toLowerCase().includes(searchTerm.toLowerCase())))
                                                        .map((product) => (
                                                            <motion.div key={product._id} whileHover={{ y: -5 }}>
                                                                <Card
                                                                    onClick={() => handleBuyPackage(product)}
                                                                    className="cursor-pointer border-2 border-slate-100 dark:border-slate-800/50 hover:border-amber-500/50 transition-all p-6 rounded-[2rem] h-full flex flex-col group"
                                                                >
                                                                    <div className="flex justify-between items-start mb-4">
                                                                        <Badge className="bg-amber-500 text-white border-0 text-[8px] font-black uppercase italic italic px-2">Paquete</Badge>
                                                                        <span className="text-2xl font-black italic text-amber-500 group-hover:scale-110 transition-transform">${product.price}</span>
                                                                    </div>
                                                                    <h4 className="text-2xl font-black uppercase italic tracking-tighter leading-none mb-2 group-hover:text-amber-500 transition-colors">{product.name}</h4>
                                                                    <p className="text-[10px] text-muted-foreground font-medium mb-6 line-clamp-2">{product.description}</p>
                                                                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                                                        <div className="flex justify-between items-center text-[10px] font-black uppercase italic tracking-widest text-slate-400">
                                                                            <span>Contenido</span>
                                                                            <span className="text-foreground">{product.isUnlimited ? 'Ilimitado' : `${product.totalUses} Usos`}</span>
                                                                        </div>
                                                                        <Button className="w-full mt-4 rounded-xl font-black uppercase italic text-[10px] bg-amber-500 hover:bg-amber-600">Elegir Plan</Button>
                                                                    </div>
                                                                </Card>
                                                            </motion.div>
                                                        ));
                                                }
                                                return services
                                                    .filter(s => {
                                                        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
                                                        const matchesFilter = activeFilter === 'all' || (activeFilter === 'online' ? s.isOnline : !s.isOnline);
                                                        return matchesSearch && matchesFilter;
                                                    })
                                                    .map(service => (
                                                        <ServiceCard
                                                            key={service._id}
                                                            service={{
                                                                id: service._id,
                                                                ...service,
                                                                duration: `${service.durationMinutes} min`,
                                                                price: `$${service.price}`
                                                            }}
                                                            onBook={() => handleServiceSelect(service._id)}
                                                            isSelected={selectedServiceId === service._id}
                                                            primaryColor={business.settings?.primaryColor}
                                                        />
                                                    ));
                                            })()}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </AnimatedStep>

                        <AnimatedStep>
                            <div className="space-y-6">
                                {/* Selected Info Summary */}
                                <div className="bg-primary/5 dark:bg-primary/10 border-2 border-primary/20 rounded-[2.5rem] p-6 flex items-center justify-between shadow-sm transition-all duration-500">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/20 transform -rotate-3 transition-transform hover:rotate-0">
                                            <Check className="w-8 h-8" strokeWidth={4} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase italic text-primary/70 tracking-widest leading-none mb-1">Has elegido</p>
                                            <h4 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{selectedService?.name}</h4>
                                        </div>
                                    </div>
                                    <Button variant="ghost" className="rounded-xl font-bold uppercase italic text-[10px] text-muted-foreground" onClick={() => setStep(1)}>Cambiar Servicio</Button>
                                </div>

                                <Card className="shadow-2xl border-2 overflow-hidden border-slate-100 dark:border-slate-800/10">
                                    <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b py-8">
                                        <div className="text-center">
                                            <CardTitle className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-2">ELIGE TU <span className="text-primary">HORARIO</span></CardTitle>
                                            <CardDescription className="font-medium italic">Selecciona el día y la hora que mejor se adapte a ti</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 md:p-8">
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                            <div className="lg:col-span-7 flex flex-col items-center">
                                                <div className="w-full max-w-[400px] border-2 border-slate-50 dark:border-slate-800 rounded-[2.5rem] p-4 bg-white dark:bg-black/20 shadow-inner">
                                                    <Calendar
                                                        mode="single"
                                                        selected={selectedDate}
                                                        onSelect={(date) => {
                                                            form.setValue("date", date);
                                                            form.setValue("time", "");
                                                        }}
                                                        disabled={isDateDisabled}
                                                        initialFocus
                                                        className="w-full"
                                                    />
                                                </div>
                                            </div>

                                            <div className="lg:col-span-5 space-y-4">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <Clock className="w-5 h-5 text-primary" />
                                                    <h5 className="font-black uppercase italic tracking-widest text-xs">Horas disponibles</h5>
                                                </div>
                                                <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                                                    {!selectedDate ? (
                                                        <div className="col-span-full py-16 text-center border-2 border-dashed rounded-[2rem] border-slate-100 dark:border-slate-800 opacity-40">
                                                            <CalendarIcon className="w-10 h-10 mx-auto mb-3" />
                                                            <p className="text-[10px] font-black uppercase italic tracking-widest">Siguiente: Elige un día</p>
                                                        </div>
                                                    ) : isLoadingSlots ? (
                                                        <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
                                                            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                                            <p className="text-[10px] font-black uppercase italic text-primary animate-pulse">Buscando espacios...</p>
                                                        </div>
                                                    ) : slots?.length === 0 ? (
                                                        <div className="col-span-full py-16 text-center bg-orange-50 dark:bg-orange-950/20 rounded-[2rem] border-2 border-orange-100 text-orange-600">
                                                            <X className="h-10 w-10 mx-auto mb-3 opacity-40" />
                                                            <p className="text-[10px] font-black uppercase italic tracking-widest px-6">Día completo. ¡Elige otra fecha!</p>
                                                        </div>
                                                    ) : (
                                                        slots?.map((slot) => (
                                                            <motion.div key={slot} whileTap={{ scale: 0.95 }}>
                                                                <Button
                                                                    type="button"
                                                                    variant={selectedTime === slot ? "default" : "outline"}
                                                                    className={cn(
                                                                        "w-full h-14 font-black italic transition-all duration-300 rounded-2xl text-base shadow-sm",
                                                                        selectedTime === slot
                                                                            ? "bg-primary text-white scale-105 shadow-xl shadow-primary/30"
                                                                            : "hover:border-primary/50 hover:bg-primary/5"
                                                                    )}
                                                                    onClick={() => {
                                                                        form.setValue("time", slot);
                                                                        // Short delay for the ripple effect then auto-advance to step 3
                                                                        setTimeout(() => setStep(3), 300);
                                                                    }}
                                                                >
                                                                    {slot}
                                                                </Button>
                                                            </motion.div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </AnimatedStep>

                        <AnimatedStep>
                            <Form {...form}>
                                <form className="space-y-6">
                                    <Card className="shadow-2xl border-2 border-primary/10 overflow-hidden bg-white dark:bg-slate-950 rounded-[2.5rem]">
                                        <CardHeader className="text-center pb-6 pt-10">
                                            <CardTitle className="text-3xl font-black uppercase italic tracking-tighter">TUS <span className="text-primary">DATOS</span></CardTitle>
                                            <CardDescription className="italic font-medium">¿A nombre de quién hacemos la reserva?</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6 max-w-2xl mx-auto pb-10">
                                            <div className="grid gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="clientName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs font-bold uppercase tracking-wider">Nombre Completo</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Tu nombre" className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-0 shadow-inner" {...field} />
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
                                                                <FormLabel className="text-xs font-bold uppercase tracking-wider">Email</FormLabel>
                                                                <FormControl>
                                                                    <Input type="email" placeholder="tu@email.com" className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-0 shadow-inner" {...field} />
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
                                                                <FormLabel className="text-xs font-bold uppercase tracking-wider">Teléfono</FormLabel>
                                                                <FormControl>
                                                                    <PhoneInput
                                                                        country={business?.settings?.language?.startsWith('en') ? 'us' : 'mx'}
                                                                        enableSearch
                                                                        countryCodeEditable={false}
                                                                        value={field.value}
                                                                        onChange={(value) => field.onChange(value)}
                                                                        placeholder={business?.settings?.language?.startsWith('en') ? '+1 (555) 000-0000' : '+52 55 1234 5678'}
                                                                        containerClass="w-full"
                                                                        inputClass="!w-full !h-12 !text-base !bg-slate-50 dark:!bg-slate-900 !border-0 !rounded-xl !pl-14 !text-foreground focus:!ring-2 focus:!ring-primary/50 shadow-inner"
                                                                        buttonClass="!h-12 !bg-transparent !border-0 !rounded-l-xl !px-3"
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
                                                            <FormLabel className="text-xs font-bold uppercase tracking-wider">¿Algo que debamos saber? (Opcional)</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Notas para tu servicio..." className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-0 shadow-inner" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* Invoicing Section inside Data Step */}
                                            {business?.taxConfig?.invoicingEnabled && (
                                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                                    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                                                        <div className="flex items-center gap-3">
                                                            <Receipt className="h-5 w-5 text-muted-foreground" />
                                                            <h4 className="text-xs font-black uppercase italic">¿Necesitas Factura?</h4>
                                                        </div>
                                                        <FormField
                                                            control={form.control}
                                                            name="needsInvoice"
                                                            render={({ field }) => (
                                                                <FormItem className="flex items-center">
                                                                    <FormControl>
                                                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                                                                className="mt-4 space-y-4 overflow-hidden"
                                                            >
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <FormField
                                                                        control={form.control}
                                                                        name="rfc"
                                                                        render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest">{business.taxConfig?.taxIdLabel || 'ID Fiscal'}</FormLabel>
                                                                                <FormControl>
                                                                                    <Input {...field} placeholder="XAXX010101000" className="h-10 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
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
                                                                                    <Input {...field} placeholder="Nombre o Empresa" className="h-10 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
                                                                                </FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            )}

                                            <Button
                                                type="button"
                                                className="w-full font-black uppercase italic tracking-widest h-14 shadow-lg hover:shadow-primary/20 transition-all rounded-2xl gap-3"
                                                onClick={async () => {
                                                    const isValid = await form.trigger(['clientName', 'clientEmail', 'clientPhone']);
                                                    if (isValid) setStep(4);
                                                }}
                                            >
                                                Siguiente Paso <ArrowRight className="h-5 w-5" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </form>
                            </Form>
                        </AnimatedStep>

                        <AnimatedStep>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                    <div id="step4-anchor" className="scroll-mt-6" />
                                    <Card className="shadow-2xl border-2 border-primary/20 overflow-hidden bg-gradient-to-br from-background to-primary/5 rounded-[2.5rem]">
                                        <CardHeader className="text-center pb-8 pt-10">
                                            <CardTitle className="text-4xl font-black uppercase italic tracking-tighter">CONFIRMA <span className="text-primary">Y PAGA</span></CardTitle>
                                            <CardDescription className="italic font-medium opacity-70">Revisa que todo esté correcto antes de finalizar</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-8 max-w-3xl mx-auto pb-12">
                                            {/* Selection Recap */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3 transform hover:scale-[1.02] transition-transform">
                                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><Zap className="w-5 h-5" /></div>
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-black uppercase text-muted-foreground opacity-60">Servicio</p>
                                                        <p className="text-xs font-black italic uppercase leading-none truncate">{selectedService?.name || selectedProduct?.name}</p>
                                                    </div>
                                                </div>
                                                {selectedDate && (
                                                    <>
                                                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3 transform hover:scale-[1.02] transition-transform">
                                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><CalendarIcon className="w-5 h-5" /></div>
                                                            <div>
                                                                <p className="text-[9px] font-black uppercase text-muted-foreground opacity-60">Fecha</p>
                                                                <p className="text-xs font-black italic uppercase leading-none">{format(selectedDate, "PP", { locale: i18n.language === 'es' ? es : enUS })}</p>
                                                            </div>
                                                        </div>
                                                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3 transform hover:scale-[1.02] transition-transform">
                                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><Clock className="w-5 h-5" /></div>
                                                            <div>
                                                                <p className="text-[9px] font-black uppercase text-muted-foreground opacity-60">Hora</p>
                                                                <p className="text-xs font-black italic uppercase leading-none">{selectedTime}</p>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Selection Recap for client */}
                                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between text-xs font-medium">
                                                <div className="flex items-center gap-3 text-muted-foreground">
                                                    <Building2 className="w-4 h-4" />
                                                    <span>{form.watch('clientName')} ({form.watch('clientEmail')})</span>
                                                </div>
                                                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase text-primary" onClick={() => setStep(3)}>Editar Datos</Button>
                                            </div>

                                            {/* Price & Payment Logic */}
                                            <div className="space-y-4">
                                                {form.watch('productId') ? (
                                                    <div className="space-y-4">
                                                        <div className="p-6 rounded-[2rem] bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200 dark:border-amber-800/50 relative overflow-hidden group transition-all">
                                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                                                <Sparkles className="w-16 h-16 text-amber-500" />
                                                            </div>
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div>
                                                                    <Badge className="bg-amber-500 text-white border-none mb-2 text-[10px] font-black uppercase italic">Paquete Premium</Badge>
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
                                                        <div className="bg-primary/5 dark:bg-primary/900/20 p-4 rounded-2xl text-[10px] text-primary font-bold uppercase tracking-wider flex gap-3 items-center">
                                                            <Info className="w-4 h-4 shrink-0" />
                                                            <p>Incluye la reserva inmediata de este servicio.</p>
                                                        </div>
                                                    </div>
                                                ) : (business.paymentConfig?.paymentPolicy === 'PACKAGES' || products.length > 0 || availableAssets.length > 0) ? (
                                                    <Tabs defaultValue={availableAssets.length > 0 ? "credits" : "single"} value={activeTab} onValueChange={(val) => {
                                                        setActiveTab(val);
                                                        if (val === 'credits' && availableAssets.length > 0) {
                                                            form.setValue('assetId', availableAssets[0]._id);
                                                        } else if (val !== 'credits') {
                                                            form.setValue('assetId', undefined);
                                                        }
                                                    }} className="w-full">
                                                        <TabsList className="grid grid-cols-3 mb-6 h-auto p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                                            <TabsTrigger value="single" className="rounded-xl py-3 text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 shadow-sm">
                                                                <CreditCard className="w-3.5 h-3.5 mr-2" /> Un Solo Pago
                                                            </TabsTrigger>
                                                            <TabsTrigger value="packages" className="rounded-xl py-3 text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 shadow-sm">
                                                                <Sparkles className="w-3.5 h-3.5 mr-2 text-amber-500" /> Paquetes
                                                            </TabsTrigger>
                                                            <TabsTrigger value="credits" disabled={availableAssets.length === 0} className="rounded-xl py-3 text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 shadow-sm">
                                                                <Ticket className="w-3.5 h-3.5 mr-2 text-primary" /> Créditos
                                                            </TabsTrigger>
                                                        </TabsList>

                                                        <TabsContent value="single" className="space-y-4 mt-0">
                                                            <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-4">
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="text-muted-foreground font-medium italic">Inversión del servicio</span>
                                                                    <span className="font-bold tabular-nums">
                                                                        ${((selectedService?.price || 0) / (business?.taxConfig?.enabled ? (1 + (business?.taxConfig?.taxRate || 0.16)) : 1)).toFixed(2)}
                                                                    </span>
                                                                </div>

                                                                {business?.taxConfig?.enabled && (
                                                                    <div className="flex justify-between items-center text-xs">
                                                                        <div className="flex items-center gap-2 italic">
                                                                            <span className="text-muted-foreground font-medium">{business.taxConfig.taxName || 'IVA'} ({((business.taxConfig.taxRate || 0.16) * 100)}%)</span>
                                                                            <Badge variant="outline" className="text-[8px] h-4 uppercase tracking-tighter text-primary border-primary/20">Fiscal</Badge>
                                                                        </div>
                                                                        <span className="font-bold tabular-nums text-primary">
                                                                            +${((selectedService?.price || 0) - ((selectedService?.price || 0) / (1 + (business.taxConfig.taxRate || 0.16)))).toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end">
                                                                    <div className="space-y-1">
                                                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total a Confirmar</p>
                                                                        <h3 className="text-4xl font-black italic uppercase tracking-tighter text-primary leading-none">
                                                                            ${selectedService?.price}
                                                                            <span className="text-xs ml-1 not-italic font-bold text-muted-foreground">{business.settings?.currency || 'MXN'}</span>
                                                                        </h3>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20 shadow-sm">
                                                                        <ShieldCheck className="h-3.5 w-3.5" />
                                                                        <span className="text-[9px] font-black uppercase tracking-tight italic">Checkout seguro</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TabsContent>

                                                        <TabsContent value="packages" className="space-y-4 mt-0">
                                                            <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                                {products.filter(p => (p.type === ProductType.Package || p.type === ProductType.Pass) && p.active && (!p.allowedServiceIds || p.allowedServiceIds.length === 0 || p.allowedServiceIds.includes(selectedService?._id || ""))).map(product => (
                                                                    <div key={product._id} className="flex items-center justify-between p-4 border-2 border-primary/5 hover:border-primary/20 rounded-2xl bg-white dark:bg-slate-900 transition-all cursor-pointer group shadow-sm" onClick={() => handleBuyPackage(product)}>
                                                                        <div className="space-y-1">
                                                                            <h4 className="font-black text-xs uppercase italic tracking-wide">{product.name}</h4>
                                                                            <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase italic">{product.isUnlimited ? 'Ilimitado' : `${product.totalUses} Usos`}</span>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-lg font-black italic tracking-tighter text-primary">${product.price}</p>
                                                                            <span className="text-[8px] font-bold text-muted-foreground uppercase">Elegir</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </TabsContent>

                                                        <TabsContent value="credits" className="space-y-4 mt-0">
                                                            <div className="space-y-3">
                                                                {availableAssets.filter(asset => {
                                                                    if (!selectedServiceId) return true;
                                                                    const allowed = asset.productId?.allowedServiceIds;
                                                                    return !allowed || allowed.length === 0 || allowed.includes(selectedServiceId);
                                                                }).map(asset => {
                                                                    const isSelected = form.watch('assetId') === asset._id;
                                                                    return (
                                                                        <div key={asset._id}
                                                                            onClick={() => form.setValue('assetId', asset._id)}
                                                                            className={`p-4 border-2 rounded-2xl cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5 shadow-inner shadow-primary/5' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary/20 shadow-sm'}`}>
                                                                            <div className="flex justify-between items-center">
                                                                                <div className="space-y-1">
                                                                                    <h4 className="font-black text-xs uppercase italic tracking-wide">{asset.productId?.name || "Paquete"}</h4>
                                                                                    <span className="text-[10px] font-bold text-primary">
                                                                                        {asset.isUnlimited ? 'Ilimitado' : `${asset.remainingUses} usos restantes`}
                                                                                    </span>
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
                                                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-primary">${selectedService?.price}</h3>
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20 italic text-[10px] font-black uppercase">
                                                            <ShieldCheck className="h-3.5 w-3.5" /> Pago Seguro
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {selectedService?.requireResource && selectedDate && selectedTime && (
                                                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                    <h4 className="text-xs font-black uppercase italic tracking-widest flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-primary" /> Selección de Lugar
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

                                            <Button
                                                type="submit"
                                                className="w-full font-black uppercase italic tracking-widest text-lg h-16 shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] rounded-2xl"
                                                size="lg"
                                                disabled={form.formState.isSubmitting}
                                            >
                                                {form.formState.isSubmitting ? (
                                                    <span className="flex items-center gap-3">
                                                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        Procesando...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-3">
                                                        <CheckCircle2 className="h-6 w-6" />
                                                        {form.watch('assetId') ? "Confirmar Reserva" : "Pagar y Confirmar"}
                                                    </span>
                                                )}
                                            </Button>

                                            <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-tighter opacity-50 px-8">
                                                Al confirmar aceptas nuestras condiciones de servicio y políticas de cancelación inmediata.
                                            </p>
                                        </CardContent>
                                    </Card>
                                </form>
                            </Form>
                        </AnimatedStep>
                    </AnimatedStepper>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Card className="border-green-200 bg-green-50 rounded-[2.5rem] shadow-xl overflow-hidden">
                            <CardContent className="pt-10 pb-10 text-center">
                                <div className="flex flex-col items-center gap-6">
                                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-3xl font-black uppercase italic tracking-tighter text-green-900 dark:text-green-400">{t('booking.form.confirmation_title')}</h3>
                                        <p className="text-base text-green-700 dark:text-green-300 font-medium italic">
                                            {t('booking.form.need_code')}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            const params = new URLSearchParams({
                                                email: form.getValues('clientEmail'),
                                                code: bookingSuccessCode || '',
                                                businessId: businessId || ''
                                            });
                                            navigate(`/my-bookings?${params.toString()}`);
                                        }}
                                        className="rounded-full font-black uppercase italic tracking-widest"
                                    >
                                        Ver mis reservas
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

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
            </div>

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
        </div>
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

import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, isToday, isTomorrow } from "date-fns";
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
    Star,
    Bell,
    User,
    UserCircle,
    Mail,
    Phone,
    LogOut,
    History,
    CalendarCheck,
    SearchX,
    MapPin,
    Tag
} from "lucide-react";
import useAuth from "@/auth/useAuth";
import { getBusinessById, type Business, type Slot } from "@/api/businessesApi";
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
import BookingResourceMapMiniPreview from "@/components/BookingResourceMapMiniPreview";
import AnimatedStepper, { AnimatedStep } from "@/components/booking/AnimatedStepper";
import { ServiceCard } from "@/components/booking/ServiceCard";
import { ProductsStore } from "@/components/booking/ProductsStore";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PackageQRModal } from "@/components/booking/PackageQRModal";
import { generateBookingSteps, StepType, BookingEngineContext } from "@/utils/bookingEngine";
import { OtpVerificationModal } from "@/components/booking/OtpVerificationModal";
import { requestOtp, verifyOtp, getDashboardData, logoutDashboard, OtpPurpose, ClientDashboardData } from "@/api/otpApi";

const bookingFormSchema = z.object({
    serviceId: z.string().optional(),
    date: z.date().optional(),
    time: z.string().optional(),
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
    paymentOption: z.string().optional(),
});

const stepInfo: Record<StepType, { title: string; description: string }> = {
    SERVICE: { title: "Servicio", description: "Elige tu opción" },
    PACKAGE: { title: "Paquete", description: "Elige tu paquete" },
    RESOURCE: { title: "Lugar", description: "Selecciona tu espacio" },
    SCHEDULE: { title: "Horario", description: "Cuándo vienes" },
    DETAILS: { title: "Tus Datos", description: "Quién reserva" },
    PAYMENT: { title: "Pago", description: "Completa el pago" },
    CONFIRMATION: { title: "Confirmar", description: "Finaliza tu reserva" }
};

// Helper to manage persistent client session
const CLIENT_SESSION_KEY = (businessId: string) => `client_session_${businessId}`;

const saveClientSession = (businessId: string, email: string, token: string) => {
    const session = {
        email,
        token,
        timestamp: Date.now(),
    };
    localStorage.setItem(CLIENT_SESSION_KEY(businessId), JSON.stringify(session));
};

const getClientSession = (businessId: string) => {
    const sessionStr = localStorage.getItem(CLIENT_SESSION_KEY(businessId));
    if (!sessionStr) return null;
    try {
        const session = JSON.parse(sessionStr);
        // 24 hours persistence as requested
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
        if (Date.now() - session.timestamp > TWENTY_FOUR_HOURS) {
            localStorage.removeItem(CLIENT_SESSION_KEY(businessId));
            return null;
        }
        return session;
    } catch {
        return null;
    }
};

const clearClientSession = (businessId: string) => {
    localStorage.removeItem(CLIENT_SESSION_KEY(businessId));
};

const groupBookingsByDate = (bookings: any[]) => {
    const groups: { [key: string]: any[] } = {};
    bookings.forEach(booking => {
        const dateKey = format(new Date(booking.scheduledAt), "yyyy-MM-dd");
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(booking);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
};

const BusinessBookingPage = () => {
    const { businessId } = useParams<{ businessId: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, logout } = useAuth();

    const [business, setBusiness] = useState<Business | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [availableAssets, setAvailableAssets] = useState<CustomerAsset[]>([]);

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
    const [paymentMethod, setPaymentMethod] = useState<'STRIPE' | 'IN_PERSON' | 'ASSET' | null>(null);
    const [selectedAsset, setSelectedAsset] = useState<CustomerAsset | null>(null);
    const [isCheckingAssets, setIsCheckingAssets] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [preSelectedPackage, setPreSelectedPackage] = useState<Product | null>(null);
    const [showPackageModal, setShowPackageModal] = useState(false);
    const { theme, setTheme } = useTheme();
    const { t, i18n } = useTranslation();
    const [bookingSteps, setBookingSteps] = useState<StepType[]>(['SERVICE', 'SCHEDULE', 'DETAILS', 'CONFIRMATION']);
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [otpPurpose, setOtpPurpose] = useState<OtpPurpose>('ASSET_USAGE');
    const [otpToken, setOtpToken] = useState<string | null>(null);
    const [otpVerifiedEmail, setOtpVerifiedEmail] = useState<string | null>(null);
    const [expiredAssetError, setExpiredAssetError] = useState(false);
    const [showDashboard, setShowDashboard] = useState(false);
    const [clientDashboardData, setClientDashboardData] = useState<ClientDashboardData | null>(null);
    const [isRequestingDashboard, setIsRequestingDashboard] = useState(false);
    const [dashboardEmail, setDashboardEmail] = useState("");
    const [dashboardSearchTerm, setDashboardSearchTerm] = useState("");
    const isFetchingDashboardRef = useRef(false);

    // Session ID for resource holds persistence
    const [bookingSessionId] = useState(() => {
        const saved = sessionStorage.getItem('booking_session_id');
        if (saved) return saved;
        const newId = `sess_${Math.random().toString(36).substring(2, 11)}`;
        sessionStorage.setItem('booking_session_id', newId);
        return newId;
    });

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
            paymentOption: "",
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

    const resources = business?.resourceConfig?.resources || [];

    useEffect(() => {
        if (businessId) {
            loadData();
        }
    }, [businessId, user]);

    // Handle deep links to dashboard (e.g. from payment success or confirmation email)
    useEffect(() => {
        if (!businessId) return;

        const view = searchParams.get('view');
        const emailFromUrl = searchParams.get('email');
        const tokenFromUrl = searchParams.get('token');

        if (view === 'dashboard') {
            const savedSession = getClientSession(businessId);

            // Priority 1: New token provided in the URL (link from email)
            if (tokenFromUrl && emailFromUrl) {
                setOtpToken(tokenFromUrl);
                setOtpVerifiedEmail(emailFromUrl);
                setOtpPurpose('CLIENT_ACCESS');
                handleFetchDashboard(emailFromUrl, tokenFromUrl);
                setIsRequestingDashboard(false);

                // Clean up URL parameters
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('token');
                navigate({ search: newParams.toString() }, { replace: true });
                return;
            }

            // Priority 2: Valid session already in localStorage
            if (savedSession) {
                // Only use it if the email in URL matches the session email, or no email in URL
                if (!emailFromUrl || emailFromUrl === savedSession.email) {
                    // Prevent loop: don't re-fetch if already showing, loading or fetching this dashboard
                    if ((showDashboard && clientDashboardData && otpVerifiedEmail === savedSession.email) || isFetchingDashboardRef.current) {
                        return;
                    }

                    setOtpToken(savedSession.token);
                    setOtpVerifiedEmail(savedSession.email);
                    setOtpPurpose('CLIENT_ACCESS');
                    handleFetchDashboard(savedSession.email, savedSession.token);
                    setIsRequestingDashboard(false);
                    return;
                }
            }

            // Priority 3: No token/session but email present, show request code modal
            if (emailFromUrl && !showDashboard) {
                setDashboardEmail(emailFromUrl);
                setIsRequestingDashboard(true);
            } else if (!emailFromUrl && !savedSession && !showDashboard) {
                // Priority 4: No info at all, show empty request modal
                setIsRequestingDashboard(true);
            }
        }
    }, [searchParams, navigate, businessId]);

    // Restore session on initial load even without view=dashboard if we want it to be automatic
    // However, user usually clicks "Ver mis reservas" first. 
    // Let's make it so when they click "Ver mis reservas", if there's a session, it uses it.
    useEffect(() => {
        if (businessId && !otpToken) {
            const savedSession = getClientSession(businessId);
            if (savedSession) {
                // Pre-fill but don't automatically show dashboard unless view=dashboard is set
                // or we are ALREADY requesting the dashboard
                setOtpToken(savedSession.token);
                setOtpVerifiedEmail(savedSession.email);
            }
        }
    }, [businessId]);

    const handleNext = () => setStep(prev => Math.min(prev + 1, bookingSteps.length));
    const handleBack = () => {
        if (step === 1) {
            setSelectedService(null);
            setSelectedProduct(null);
            setPreSelectedPackage(null);
            form.setValue('serviceId', '');
            form.setValue('productId', '');
            sessionStorage.removeItem('buyAndBookPackage');
            setSelectedResourceId(null);
            return;
        }
        setStep(prev => Math.max(prev - 1, 1));
    };
    const goToStepType = (type: StepType, overrides?: Partial<BookingEngineContext>) => {
        let currentSteps = bookingSteps;

        if (overrides && business) {
            const isBuyAndBook = overrides.isBuyAndBook ?? !!sessionStorage.getItem('buyAndBookPackage');

            // Re-calculate steps based on NEW state (before the state update actually reflects in the closure)
            currentSteps = generateBookingSteps({
                bookingConfig: business.bookingConfig,
                paymentMode: business.paymentMode,
                productType: (selectedProduct || preSelectedPackage) ? 'PACKAGE' : 'SERVICE',
                requiresResource: selectedService?.requireResource || false,
                userHasValidPackage: false,
                isBuyAndBook,
                paymentPolicy: business.paymentConfig?.paymentPolicy,
                ...overrides
            });
            setBookingSteps(currentSteps);
        }

        const index = currentSteps.indexOf(type);
        if (index !== -1) setStep(index + 1);
    };

    // Change language based on business communication settings
    useEffect(() => {
        if (business?.settings?.language) {
            // Map locale to i18n language code (es_MX -> es, en_US -> en)
            const lang = business.settings.language.startsWith('es') ? 'es' : 'en';
            i18n.changeLanguage(lang);
        }
    }, [business, i18n]);

    // Update dynamic steps when context changes
    useEffect(() => {
        if (!business) return;

        const isBuyAndBook = !!sessionStorage.getItem('buyAndBookPackage');

        const hasValidPackage = availableAssets.some(asset => {
            if (!selectedService) return false;
            const allowed = asset.productId?.allowedServiceIds;
            return !allowed || allowed.length === 0 || allowed.includes(selectedService._id);
        });

        const steps = generateBookingSteps({
            bookingConfig: business.bookingConfig,
            paymentMode: business.paymentMode,
            productType: (selectedProduct || preSelectedPackage) ? 'PACKAGE' : 'SERVICE',
            requiresResource: selectedService?.requireResource || false,
            userHasValidPackage: hasValidPackage,
            isBuyAndBook,
            paymentPolicy: business.paymentConfig?.paymentPolicy
        });

        setBookingSteps(steps);

        // Ensure current step is within bounds if steps shrink
        if (step > steps.length) {
            setStep(steps.length);
        }
    }, [business, selectedService, selectedProduct, preSelectedPackage, availableAssets, step]);

    // Watch fields to ensure whole page re-renders on change (important for summary panel)
    const clientName = form.watch("clientName");
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
        const currentStepType = bookingSteps[step - 1];
        if (currentStepType === 'PACKAGE' && activeFilter !== 'packages') {
            setActiveFilter('packages');
        } else if (currentStepType === 'SERVICE' && activeFilter === 'packages') {
            setActiveFilter('all');
        }

        // Auto-select payment method
        const hasValidPackage = availableAssets.some(asset => {
            if (!selectedServiceId) return true;
            const allowed = asset.productId?.allowedServiceIds;
            return !allowed || allowed.length === 0 || allowed.includes(selectedServiceId);
        });

        if (hasValidPackage && !paymentMethod) {
            const compatibleAssets = availableAssets.filter(asset => {
                const allowed = asset.productId?.allowedServiceIds;
                return !allowed || allowed.length === 0 || allowed.includes(selectedServiceId!);
            });
            if (compatibleAssets.length > 0) {
                const bestAsset = prioritizeAssets(compatibleAssets)[0];
                setPaymentMethod('ASSET');
                setSelectedAsset(bestAsset);
                form.setValue('assetId', bestAsset._id);
                form.setValue('paymentOption', 'ASSET');
            }
        } else if (currentStepType === 'PAYMENT' && !paymentMethod) {
            if (!business?.paymentConfig?.allowCash) {
                setPaymentMethod('STRIPE');
                form.setValue('paymentOption', 'STRIPE');
            }
        }
    }, [step, bookingSteps, availableAssets, business, paymentMethod, selectedServiceId]);

    const fetchAssetsForContact = async (email?: string, phone?: string) => {
        if (isCheckingAssets) return;

        const targetEmail = email || clientEmail;
        const targetPhone = phone || clientPhone;

        const hasValidEmail = targetEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail);
        const hasValidPhone = targetPhone && targetPhone.length >= 8;

        if ((hasValidEmail || hasValidPhone) && businessId && !user) {
            try {
                setIsCheckingAssets(true);
                const assets = await getActiveAssets({
                    businessId,
                    email: targetEmail,
                    phone: targetPhone,
                });
                setAvailableAssets(assets);

                if (assets.length > 0) {
                    const usableAssets = assets.filter(asset => {
                        const isServiceAllowed = !selectedServiceId ||
                            !asset.productId?.allowedServiceIds ||
                            asset.productId.allowedServiceIds.length === 0 ||
                            asset.productId.allowedServiceIds.includes(selectedServiceId);

                        const hasUses = asset.isUnlimited || (asset.remainingUses && asset.remainingUses > 0);
                        const isDateValid = !asset.expiresAt || !selectedDate || new Date(asset.expiresAt) >= selectedDate;

                        return isServiceAllowed && hasUses && isDateValid;
                    });

                    if (usableAssets.length > 0) {
                        const sortedAssets = prioritizeAssets(usableAssets);
                        const bestAsset = sortedAssets[0];

                        const currentAssetId = form.getValues('assetId');
                        const isCurrentStillValid = sortedAssets.some(a => a._id === currentAssetId);

                        if (!currentAssetId || !isCurrentStillValid) {
                            form.setValue('assetId', bestAsset._id);
                            form.setValue('paymentOption', 'ASSET');
                            setPaymentMethod('ASSET');
                            setSelectedAsset(bestAsset);
                            setActiveTab('credits');

                            const expiresAt = bestAsset.expiresAt ? new Date(bestAsset.expiresAt) : null;
                            const diffDays = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

                            if (diffDays !== null && diffDays <= 7) {
                                toast.success(`¡Encontramos tus créditos! Tienes un paquete que vence pronto (en ${diffDays} días).`);
                            } else {
                                toast.success(`¡Encontramos tus créditos! Se han aplicado automáticamente.`);
                            }
                        } else {
                            setActiveTab('credits');
                        }
                    }
                }
            } catch (e) {
                console.error("Guest asset lookup failed", e);
            } finally {
                setIsCheckingAssets(false);
            }
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTab !== 'credits' || !form.getValues('assetId')) {
                fetchAssetsForContact();
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [clientEmail, clientPhone, businessId, user, selectedServiceId]);

    const handleServiceSelect = (serviceId: string) => {
        form.setValue("serviceId", serviceId);

        // Only clear product selection if we are NOT in a "Buy and Book" flow
        const isBuyAndBook = !!sessionStorage.getItem('buyAndBookPackage');
        if (!isBuyAndBook) {
            setSelectedProduct(null);
            form.setValue("productId", undefined);
        }

        if (serviceId) {
            const service = services.find(s => s._id === serviceId);
            setSelectedService(service || null);
            goToStepType('SCHEDULE', { productType: 'SERVICE' }); // Auto advance to calendar
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
                            const sortedAssets = prioritizeAssets(compatibleAssets);
                            form.setValue('assetId', sortedAssets[0]._id);
                            setActiveTab('credits');
                            toast.success(`¡Tienes créditos disponibles! Se han aplicado automáticamente.`);
                        }
                    }
                } catch (e) {
                    console.error("Error loading assets", e);
                }
            }


        } catch (error: any) {
            toast.error(error?.response?.data?.message || t('common.load_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleBuyPackage = (product: Product, isBuyAndBook = false) => {
        setSelectedProduct(product);
        form.setValue('productId', product._id);
        form.setValue('assetId', undefined);

        if (isBuyAndBook) {
            sessionStorage.setItem('buyAndBookPackage', JSON.stringify({
                packageId: product._id,
                packageName: product.name
            }));
            toast.info(`¡Genial! Seleccionaste: ${product.name}. Ahora elige tu horario para reservar.`);
            goToStepType('SERVICE', { productType: 'PACKAGE', isBuyAndBook: true }); // Go to step 1 to choose service/time
            setActiveFilter('all'); // Show services
        } else {
            sessionStorage.removeItem('buyAndBookPackage');
            // Clear service selection if it's just a package purchase
            setSelectedService(null);
            form.setValue('serviceId', '');
            form.setValue('date', undefined);
            form.setValue('time', '');

            toast.info(`Has seleccionado: ${product.name}. Procede a confirmar para realizar el pago.`);
            goToStepType('DETAILS', { productType: 'PACKAGE', isBuyAndBook: false }); // Direct to checkout if buying package only
        }
    };

    const handleFetchDashboard = async (email: string, token: string) => {
        if (!businessId || isFetchingDashboardRef.current) return;
        try {
            isFetchingDashboardRef.current = true;
            setLoading(true);
            const data = await getDashboardData(email, token, businessId);
            setClientDashboardData(data);
            setShowDashboard(true);
            setBookingSuccess(false); // Clear success screen if we are entering dashboard
            // Save to localStorage for persistence
            saveClientSession(businessId, email, token);

            // Update URL to reflect dashboard state so reload works
            const params = new URLSearchParams(window.location.search);
            const currentView = params.get('view');
            const currentEmail = params.get('email');

            if (currentView !== 'dashboard' || currentEmail !== email) {
                params.set('view', 'dashboard');
                params.set('email', email);
                navigate({ search: params.toString() }, { replace: true });
            }
        } catch (error) {
            toast.error("Tu sesión ha expirado o es inválida. Por favor, solicita un nuevo acceso.");
            setOtpToken(null);
            setOtpVerifiedEmail(null);
            setShowDashboard(false);
            clearClientSession(businessId);
        } finally {
            setLoading(false);
            isFetchingDashboardRef.current = false;
        }
    };

    const handleDashboardLogout = async () => {
        if (otpToken && otpVerifiedEmail) {
            try {
                await logoutDashboard(otpVerifiedEmail, otpToken);
            } catch (error) {
                console.error("Logout failed", error);
            }
        }
        setOtpToken(null);
        setOtpVerifiedEmail(null);
        setClientDashboardData(null);
        setShowDashboard(false);
        if (businessId) clearClientSession(businessId);

        // Clear dashboard URL parameters
        const params = new URLSearchParams(window.location.search);
        params.delete('view');
        params.delete('email');
        params.delete('token');
        navigate({ search: params.toString() }, { replace: true });
    };

    const handleDashboardBookAgain = async () => {
        await handleDashboardLogout();
        setSelectedResourceId(null);
        setStep(1);
    };

    const onSubmit = async (values: z.infer<typeof bookingFormSchema>) => {
        if (!businessId) return;

        if (isSubmitting) return;
        setIsSubmitting(true);

        if (values.serviceId && selectedService?.requireResource && !selectedResourceId) {
            toast.error("Por favor selecciona un lugar en el mapa");
            setIsSubmitting(false);
            return;
        }

        if (values.serviceId && (!values.date || !values.time)) {
            toast.error("Por favor selecciona fecha y hora para tu servicio");
            setIsSubmitting(false);
            return;
        }

        if (!values.serviceId && !values.productId) {
            toast.error("Por favor selecciona un servicio o paquete para continuar");
            setIsSubmitting(false);
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

            const bookingData: any = {
                businessId,
                serviceId: values.serviceId,
                clientName: values.clientName,
                clientEmail: values.clientEmail,
                clientPhone: values.clientPhone,
                scheduledAt,
                resourceId: selectedResourceId || undefined,
                status: "pending" as const,
                notes: values.notes,
                otpToken: otpToken || undefined,
                sessionId: bookingSessionId,
            };

            // Only include assetId if it's a valid customer asset (not a resource selection)
            if (values.assetId) {
                bookingData.assetId = values.assetId;
            }

            const policy = business.paymentConfig?.paymentPolicy || 'RESERVE_ONLY';

            // Scenario 1: Buying a package (Package purchase takes priority if productId is present)
            if (values.productId && values.productId !== "") {
                const isAutoBooking = !!sessionStorage.getItem('buyAndBookPackage');

                // Trim booking data to ensure it fits in Stripe metadata (max 500 chars per value)
                const trimmedBookingData = isAutoBooking ? {
                    businessId: businessId.substring(0, 24),
                    serviceId: (values.serviceId || "").substring(0, 24),
                    clientName: values.clientName.substring(0, 50),
                    clientEmail: values.clientEmail.substring(0, 50),
                    clientPhone: (values.clientPhone || "").substring(0, 20),
                    scheduledAt: scheduledAt,
                    resourceId: (selectedResourceId || "").substring(0, 24),
                    notes: (values.notes || "").substring(0, 100),
                } : undefined;

                const checkout = await createProductCheckout({
                    productId: values.productId,
                    businessId,
                    clientEmail: values.clientEmail,
                    clientPhone: values.clientPhone,
                    clientName: values.clientName,
                    successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=${isAutoBooking ? 'product-with-booking' : 'product'}&businessId=${businessId}${isAutoBooking ? `&booking_data=${btoa(JSON.stringify(trimmedBookingData))}` : ''}${otpToken ? `&token=${otpToken}` : ''}`,
                    cancelUrl: `${window.location.origin}/payment/cancel`,
                    bookingData: trimmedBookingData,
                });

                if (isAutoBooking) {
                    sessionStorage.removeItem('buyAndBookPackage');
                }

                window.location.href = checkout.url;
                return;
            }

            // Scenario 2: Single session payment (PAY_BEFORE_BOOKING or PACKAGE_OR_PAY without credits)
            const needsDirectPayment = (policy === 'PAY_BEFORE_BOOKING' || policy === 'PACKAGE_OR_PAY') &&
                !values.assetId &&
                selectedService &&
                selectedService.price > 0;

            if (needsDirectPayment) {
                import("@/api/stripeApi").then(async ({ createBookingCheckout }) => {
                    const pendingBooking = await createBooking({
                        ...bookingData,
                        status: 'pending_payment'
                    });

                    // Extract numeric amount from price string (e.g., "$800.00 MXN" -> 800.00)
                    const priceStr = String(selectedService!.price).replace(/[^0-9.]/g, '');
                    const numericAmount = parseFloat(priceStr) || 0;
                    const amountInCents = Math.round(numericAmount * 100);

                    // Stripe requires at least ~0.50 USD (approx 10 MXN)
                    if (amountInCents < 1000) {
                        toast.error("El precio del servicio es menor al mínimo requerido para pago en línea ($10 MXN).");
                        setIsSubmitting(false);
                        return;
                    }

                    if (!pendingBooking._id) {
                        toast.error("Error al crear la reserva previa.");
                        setIsSubmitting(false);
                        return;
                    }

                    const checkout = await createBookingCheckout({
                        bookingId: String(pendingBooking._id),
                        businessId: String(businessId),
                        successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=booking&bookingId=${pendingBooking._id}&businessId=${businessId}${otpToken ? `&token=${otpToken}` : ''}`,
                        cancelUrl: `${window.location.origin}/payment/cancel`,
                    });

                    window.location.href = checkout.url;
                });
                return;
            }

            // Scenario 3: Direct reservation (RESERVE_ONLY, has assets, or free service)
            const booking = await createBooking(bookingData);

            setBookingSuccessCode(booking.accessCode || null);
            setBookingSuccess(true);
            toast.success(t('booking.form.toasts.confirmed_desc'));



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
            setSelectedResourceId(null);
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

            if (errData?.code === "SLOT_UNAVAILABLE") {
                toast.error("Este horario acaba de ser reservado. Por favor elige otro.");
                goToStepType('SCHEDULE');
                form.setValue("time", "");
                return;
            }

            if (errData?.code === "ASSET_EXPIRED_FOR_DATE") {
                setExpiredAssetError(true);
                return;
            }

            if (errData?.code === "OTP_REQUIRED") {
                setIsOtpModalOpen(true);
                setOtpPurpose(errData.reason);
                return;
            }

            toast.error(errData?.message || t('booking.form.toasts.error_desc'));
        } finally {
            setIsSubmitting(false);
        }
    };





    // Prefill from query params (coming from "Volver a reservar" or shared link)
    useEffect(() => {
        const serviceIdParam = searchParams.get("serviceId");
        const packageIdParam = searchParams.get("packageId");
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

        // Handle package selection from query params
        if (packageIdParam && products.length > 0 && !preSelectedPackage) {
            const product = products.find(p => p._id === packageIdParam);
            if (product && product.active) {
                setActiveFilter('packages');
                setPreSelectedPackage(product);
                setShowPackageModal(true);
            } else if (product && !product.active) {
                toast.error("Este paquete ya no está disponible.");
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
        // Handle slot unavailable error
        const errorParam = searchParams.get("error");
        if (errorParam === 'slot_unavailable') {
            toast.error("El horario que habías elegido ya no está disponible. Por favor elige otro para completar tu reserva.");
            goToStepType('SCHEDULE'); // Go to schedule selection
            form.setValue("time", "");

            // Clean up the URL
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('error');
            navigate({ search: newParams.toString() }, { replace: true });
        }
    }, [searchParams, services, products, navigate]);

    const getResourceLabel = (resourceId?: string) => {
        if (!resourceId || !business?.resourceConfig?.resources) return null;
        const resource = business.resourceConfig.resources.find((r: any) => r.id === resourceId);
        return resource?.label || resourceId;
    };

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

    const renderStepContent = (type: StepType) => {
        const timeSlots = slots || []; // Using slots from useSlots
        switch (type) {
            case 'SERVICE':
            case 'PACKAGE':
                return (
                    <Card className="w-full max-w-full shadow-2xl border-2 overflow-hidden border-slate-100 dark:border-slate-800/10">
                        <CardHeader className="pb-2 px-3 sm:px-6">
                            <div className="text-center mb-4 sm:mb-6 px-2">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <div className="h-1 w-4 sm:w-6 bg-primary rounded-full"></div>
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-primary">Paso 01</span>
                                </div>
                                <CardTitle className="text-2xl sm:text-3xl lg:text-5xl font-black uppercase italic tracking-tighter dark:text-white leading-tight px-2">
                                    NUESTROS <span className="text-primary italic">SERVICIOS</span>
                                </CardTitle>
                                <CardDescription className="text-sm sm:text-base mt-1 sm:mt-2 px-2 sm:px-4 font-medium italic opacity-70">Encuentra la experiencia perfecta</CardDescription>
                            </div>

                            {/* Search & Filter Bar */}
                            <div className="flex flex-col gap-3 sm:gap-4 mb-4 px-2 max-w-3xl mx-auto w-full">
                                <div className="bg-slate-50 dark:bg-slate-900 px-3 sm:px-4 py-1 rounded-xl sm:rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                    <div className="relative group">
                                        <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="¿Qué servicio buscas?"
                                            className="w-full pl-6 sm:pl-8 pr-2 h-10 sm:h-14 bg-transparent outline-none text-sm sm:text-base font-bold italic placeholder:text-sm"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg sm:rounded-[1.2rem] border border-slate-200 dark:border-slate-800">
                                    {[
                                        { id: 'all', label: 'Todos' },
                                        { id: 'presencial', label: 'Presencial' },
                                        { id: 'online', label: 'Online' },
                                        { id: 'packages', label: 'Paquetes' }
                                    ].map((filter) => (
                                        (filter.id !== 'packages' || products.length > 0) && (
                                            <Button
                                                key={filter.id}
                                                type="button"
                                                variant={activeFilter === filter.id ? 'default' : 'ghost'}
                                                size="sm"
                                                className={cn(
                                                    "rounded-lg sm:rounded-xl font-black text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-[0.10em] sm:tracking-[0.15em] h-7 sm:h-9 px-2 sm:px-4 flex-1 md:flex-none transition-all duration-300",
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
                        <CardContent className="pt-4 sm:pt-6 px-2 sm:px-3 md:px-8 pb-6 sm:pb-10">
                            {/* Selected Package/Service Banner */}
                            {selectedProduct && (
                                <div className="mb-6 sm:mb-8 animate-in fade-in slide-in-from-top-6 duration-700">
                                    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent border-2 border-amber-500/20 p-4 sm:p-6 group">
                                        {/* Background decoration */}
                                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                                        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>

                                        <div className="relative flex items-start gap-3 sm:gap-4">
                                            {/* Icon */}
                                            <div className="shrink-0 h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
                                                    <Badge className="bg-amber-500 text-white border-0 text-[8px] sm:text-[9px] font-black uppercase tracking-wider sm:tracking-widest px-1.5 sm:px-2 py-0.5">
                                                        ✓ Seleccionado
                                                    </Badge>
                                                    <div className="h-1 w-1 rounded-full bg-amber-500/50 animate-pulse hidden sm:block"></div>
                                                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider sm:tracking-widest text-amber-600 dark:text-amber-400 hidden sm:inline">Vía QR</span>
                                                </div>

                                                <h3 className="text-lg sm:text-xl md:text-2xl font-black uppercase italic tracking-tighter text-amber-700 dark:text-amber-400 mb-1 leading-tight">
                                                    {selectedProduct.name}
                                                </h3>

                                                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-2 sm:mb-3 line-clamp-2">
                                                    {selectedProduct.description || "Paquete premium seleccionado"}
                                                </p>

                                                <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                                                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-amber-500/10 rounded-full border border-amber-500/20">
                                                        <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 fill-amber-600" />
                                                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-500">
                                                            {selectedProduct.isUnlimited ? 'Ilimitado' : `${selectedProduct.totalUses} Sesiones`}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-primary/10 rounded-full border border-primary/20">
                                                        <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                                                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-primary">
                                                            ${selectedProduct.price} {business.settings?.currency || 'MXN'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action hint */}
                                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-amber-500/10 flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5 sm:gap-2 text-amber-600 dark:text-amber-500">
                                                <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 animate-bounce" />
                                                <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-wider sm:tracking-widest italic">
                                                    Elige un servicio para usar
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedProduct(null);
                                                    form.setValue('productId', undefined);
                                                    setActiveFilter('all');
                                                }}
                                                className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors px-2 sm:px-3 py-1 rounded-lg hover:bg-destructive/10 shrink-0"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {services.length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed rounded-[2rem] border-slate-100 dark:border-slate-800 opacity-50">
                                    <Zap className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">No hay servicios disponibles</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                    {(() => {
                                        if (activeFilter === 'packages') {
                                            return products
                                                .filter(p => p.active && (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description?.toLowerCase().includes(searchTerm.toLowerCase())))
                                                .map((product) => (
                                                    <motion.div key={product._id} whileHover={{ y: -5 }}>
                                                        <Card
                                                            onClick={() => handleBuyPackage(product)}
                                                            className="cursor-pointer border-2 border-slate-100 dark:border-slate-800/50 hover:border-amber-500/50 transition-all p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] h-full flex flex-col group"
                                                        >
                                                            <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
                                                                <Badge className="bg-amber-500 text-white border-0 text-[7px] sm:text-[8px] font-black uppercase italic px-1.5 sm:px-2">Paquete</Badge>
                                                                <span className="text-xl sm:text-2xl font-black italic text-amber-500 group-hover:scale-110 transition-transform">${product.price}</span>
                                                            </div>
                                                            <h4 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter leading-none mb-1.5 sm:mb-2 group-hover:text-amber-500 transition-colors">{product.name}</h4>
                                                            <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium mb-4 sm:mb-6 line-clamp-2">{product.description}</p>
                                                            <div className="mt-auto pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                                                <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-black uppercase italic tracking-wider sm:tracking-widest text-slate-400">
                                                                    <span>Contenido</span>
                                                                    <span className="text-foreground">{product.isUnlimited ? 'Ilimitado' : `${product.totalUses} Usos`}</span>
                                                                </div>
                                                                <Button className="w-full mt-3 sm:mt-4 h-9 sm:h-10 rounded-lg sm:rounded-xl font-black uppercase italic text-[9px] sm:text-[10px] bg-amber-500 hover:bg-amber-600">Elegir Plan</Button>
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
                                            .map(service => {
                                                const applicablePackages = products
                                                    // Filter for active packages/passes that include this service
                                                    .filter(p =>
                                                        p.active &&
                                                        (p.type === 'PACKAGE' || p.type === 'PASS') &&
                                                        (!p.allowedServiceIds || p.allowedServiceIds.length === 0 || p.allowedServiceIds.includes(service._id))
                                                    )
                                                    .map(p => ({ id: p._id, name: p.name }));

                                                return (
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
                                                        primaryColor={business?.settings?.primaryColor}
                                                        applicablePackages={applicablePackages}
                                                    />
                                                );
                                            });
                                    })()}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            case 'SCHEDULE':
                return (
                    <Card className="w-full max-w-full shadow-2xl border-2 overflow-hidden border-slate-100 dark:border-slate-800/10">
                        <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
                            <div className="flex flex-col gap-3 sm:gap-4 md:gap-6 mb-3 sm:mb-4">
                                <div className="space-y-1 sm:space-y-2">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <div className="h-1 sm:h-2 w-4 sm:w-8 bg-primary rounded-full"></div>
                                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-primary">Paso 02</span>
                                    </div>
                                    <CardTitle className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase italic tracking-tighter leading-tight sm:leading-none dark:text-white">
                                        ELIGE TU <span className="text-primary italic">HORARIO</span>
                                    </CardTitle>
                                    <CardDescription className="text-sm sm:text-base font-medium italic opacity-70">Selecciona fecha y hora</CardDescription>
                                </div>

                                {selectedService && (
                                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 bg-slate-50 dark:bg-slate-900 px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 rounded-xl sm:rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <div className="h-7 w-7 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg sm:rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <Zap className="h-3.5 w-3.5 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-[7px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-wider sm:tracking-widest text-muted-foreground mb-0.5 sm:mb-1">Servicio</span>
                                            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                                                <h4 className="text-xs sm:text-base md:text-lg font-black uppercase italic tracking-tighter leading-none truncate">{selectedService.name}</h4>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    type="button"
                                                    className="rounded-lg sm:rounded-xl font-black uppercase italic text-[7px] sm:text-[9px] md:text-[10px] text-primary hover:bg-primary/10 transition-colors h-5 sm:h-7 px-1.5 sm:px-3 shrink-0"
                                                    onClick={() => goToStepType('SERVICE')}
                                                >
                                                    <ArrowLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 mr-1" />
                                                    <span className="inline">Cambiar</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="px-2 sm:px-3 md:px-8 pb-6 sm:pb-10">
                            <div className="flex flex-col lg:grid lg:grid-cols-[1fr_400px] gap-4 sm:gap-6 md:gap-8 max-w-full">
                                {/* Left: Calendar */}
                                <div className="space-y-3 sm:space-y-4 md:space-y-6 w-full">
                                    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] p-3 sm:p-4 md:p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-inner w-full">
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={(date) => {
                                                if (date) {
                                                    form.setValue("date", date);
                                                    form.setValue("time", "");
                                                }
                                            }}
                                            disabled={isDateDisabled}
                                            className="rounded-2xl sm:rounded-3xl border-0 shadow-none bg-transparent w-full mx-auto p-0"
                                            classNames={{
                                                months: "flex flex-col space-y-2 sm:space-y-4 w-full",
                                                month: "space-y-3 sm:space-y-4 md:space-y-6 w-full",
                                                caption: "flex justify-center pt-1 relative items-center mb-2 sm:mb-3 md:mb-4",
                                                caption_label: "text-base sm:text-lg md:text-xl lg:text-2xl font-black uppercase italic tracking-tighter",
                                                nav: "flex items-center gap-1 sm:gap-2",
                                                nav_button: "h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-11 lg:w-11 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/50 rounded-xl sm:rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 text-sm sm:text-base",
                                                table: "w-full border-collapse space-y-1",
                                                head_row: "grid grid-cols-7 mb-2 sm:mb-3 md:mb-4 w-full",
                                                head_cell: "text-muted-foreground w-full font-black text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-wider sm:tracking-widest text-center flex items-center justify-center",
                                                row: "grid grid-cols-7 w-full mt-1 sm:mt-1.5 md:mt-2",
                                                cell: "relative p-0 text-center text-xs sm:text-sm focus-within:relative focus-within:z-20 flex items-center justify-center",
                                                day: "h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-16 lg:w-16 p-0 font-bold aria-selected:opacity-100 rounded-lg sm:rounded-xl md:rounded-2xl transition-all duration-300 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-xs sm:text-sm md:text-base",
                                                day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg sm:shadow-xl shadow-primary/20 scale-105 sm:scale-110 rotate-2 sm:rotate-3",
                                                day_today: "bg-slate-100 dark:bg-slate-800 text-primary border border-primary/20 sm:border-2",
                                                day_disabled: "text-muted-foreground/20 italic line-through cursor-not-allowed hover:bg-transparent",
                                                day_outside: "opacity-0",
                                            }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 bg-primary/5 rounded-xl sm:rounded-2xl border border-primary/10">
                                        <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                                        <p className="text-[9px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-wider sm:tracking-widest text-primary/80 leading-tight">
                                            {selectedDate ? `${format(selectedDate, "d 'de' MMM", { locale: es })}` : 'Selecciona fecha'}
                                        </p>
                                    </div>
                                </div>

                                {/* Right: Slots & Resource */}
                                <div className="space-y-3 sm:space-y-4 md:space-y-6 flex flex-col w-full">
                                    <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-1000">
                                        <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-muted-foreground mb-2 sm:mb-3 md:mb-4 pl-1">Horarios</h3>
                                        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-3 sm:p-4 md:p-6 flex-1 min-h-[300px] sm:min-h-[350px] md:min-h-[400px] w-full">
                                            {isLoadingSlots ? (
                                                <div className="h-full flex flex-col items-center justify-center gap-3 sm:gap-4 opacity-50">
                                                    <div className="h-8 w-8 sm:h-10 sm:w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest italic">Cargando...</p>
                                                </div>
                                            ) : timeSlots.length > 0 ? (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 sm:gap-3">
                                                    {(timeSlots as Slot[]).map((slot) => (
                                                        <motion.button
                                                            key={slot.time}
                                                            type="button"
                                                            whileHover={slot.isAvailable ? { scale: 1.05 } : {}}
                                                            whileTap={slot.isAvailable ? { scale: 0.95 } : {}}
                                                            disabled={!slot.isAvailable}
                                                            onClick={() => {
                                                                form.setValue("time", slot.time);
                                                                setTimeout(() => handleNext(), 300);
                                                            }}
                                                            className={cn(
                                                                "h-10 sm:h-12 md:h-14 rounded-xl sm:rounded-2xl border-2 font-black transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 group relative overflow-hidden",
                                                                selectedTime === slot.time
                                                                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                                                    : !slot.isAvailable
                                                                        ? "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed opacity-70"
                                                                        : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/50 hover:border-primary/50"
                                                            )}
                                                        >
                                                            {slot.isAvailable && (
                                                                <div className={cn(
                                                                    "h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full transition-all duration-300",
                                                                    selectedTime === slot.time ? "bg-white scale-150 animate-pulse" : "bg-slate-300 dark:bg-slate-600 group-hover:bg-primary"
                                                                )}></div>
                                                            )}
                                                            <span className="text-sm sm:text-base italic">
                                                                {slot.time}
                                                            </span>
                                                            {!slot.isAvailable && (
                                                                <span className="absolute -right-2 top-0 bg-slate-200 dark:bg-slate-700 text-[6px] sm:text-[8px] px-2 py-0.5 rounded-bl-lg font-black uppercase tracking-tighter opacity-50">
                                                                    LLENO
                                                                </span>
                                                            )}
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 text-center bg-white/50 dark:bg-slate-800/50 rounded-2xl sm:rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                                    <div className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-3 sm:mb-4 md:mb-6">
                                                        <Clock className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-slate-300" />
                                                    </div>
                                                    <p className="text-sm sm:text-base font-bold italic text-muted-foreground mb-1 sm:mb-2">No disponible</p>
                                                    <p className="text-[9px] sm:text-[10px] uppercase font-black tracking-wider sm:tracking-widest text-slate-400">Prueba otra fecha</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'RESOURCE':
                return (
                    <Card className="w-full max-w-full shadow-2xl border-2 overflow-hidden border-slate-100 dark:border-slate-800/10">
                        <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
                            <div className="flex flex-col gap-3 sm:gap-4 md:gap-6 mb-3 sm:mb-4">
                                <div className="space-y-1 sm:space-y-2">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <div className="h-1 sm:h-2 w-4 sm:w-8 bg-primary rounded-full"></div>
                                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-primary">Paso 03</span>
                                    </div>
                                    <CardTitle className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase italic tracking-tighter leading-tight sm:leading-none dark:text-white">
                                        ELIGE TU <span className="text-primary italic">{
                                            business?.resourceConfig?.resourceLabel?.toUpperCase() === 'B'
                                                ? 'BICI'
                                                : (business?.resourceConfig?.resourceLabel || 'LUGAR')
                                        }</span>
                                    </CardTitle>
                                    <CardDescription className="text-sm sm:text-base font-medium italic opacity-70">Selecciona profesional o espacio</CardDescription>
                                </div>
                                {selectedDate && selectedTime && (
                                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 bg-slate-50 dark:bg-slate-900 px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 rounded-xl sm:rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider sm:tracking-widest text-muted-foreground">Fecha</p>
                                            <p className="text-xs sm:text-sm font-bold italic">{format(selectedDate, "d 'de' MMM")} - {selectedTime}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="px-3 md:px-8 pb-10">
                            <div className="w-full max-w-full sm:max-w-4xl mx-auto py-8">
                                {businessId && selectedDate && selectedTime && (() => {
                                    const [hours, minutes] = selectedTime.split(":").map(Number);
                                    const scheduledDate = new Date(selectedDate);
                                    scheduledDate.setHours(hours, minutes, 0, 0);
                                    const scheduledAt = scheduledDate.toISOString();

                                    return (
                                        <ResourceSelector
                                            businessId={businessId!}
                                            scheduledAt={scheduledAt}
                                            selectedId={selectedResourceId}
                                            sessionId={bookingSessionId}
                                            onResourceSelected={(id) => {
                                                setSelectedResourceId(id);
                                                // Auto advance after short delay
                                                setTimeout(() => handleNext(), 500);
                                            }}
                                            primaryColor={business?.settings?.primaryColor}
                                        />
                                    );
                                })()}
                                <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleBack}
                                        className="h-10 sm:h-12 md:h-14 px-4 sm:px-6 md:px-8 rounded-xl sm:rounded-2xl font-black uppercase italic tracking-widest text-[10px] sm:text-xs text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 order-2 sm:order-1"
                                    >
                                        <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> Volver
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => handleNext()}
                                        disabled={!selectedResourceId}
                                        className="h-12 sm:h-14 md:h-16 px-6 sm:px-10 md:px-12 rounded-xl sm:rounded-2xl font-black uppercase italic tracking-tighter text-sm sm:text-lg md:text-xl shadow-lg sm:shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all order-1 sm:order-2"
                                    >
                                        Continuar <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'DETAILS':
                return (
                    <Card className="w-full max-w-full shadow-2xl border-2 overflow-hidden border-slate-100 dark:border-slate-800/10">
                        <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
                            <div className="flex flex-col gap-3 sm:gap-4 md:gap-6 mb-3 sm:mb-4">
                                <div className="space-y-1 sm:space-y-2">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <div className="h-1 sm:h-2 w-4 sm:w-8 bg-primary rounded-full"></div>
                                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-primary">Paso {(bookingSteps.indexOf('DETAILS') + 1).toString().padStart(2, '0')}</span>
                                    </div>
                                    <CardTitle className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase italic tracking-tighter leading-tight sm:leading-none dark:text-white">
                                        TUS <span className="text-primary italic">DATOS</span>
                                    </CardTitle>
                                    <CardDescription className="text-sm sm:text-base font-medium italic opacity-70">Completa tus datos</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-2 sm:px-4 md:px-8 pb-10">
                            <div className="grid lg:grid-cols-[1fr_400px] gap-8">
                                {/* Left: Form Fields */}
                                <div className="space-y-6">
                                    <div className="bg-slate-50 dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-8 md:p-10 border border-slate-200 dark:border-slate-800 shadow-inner">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="clientName"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-3">
                                                        <div className="flex items-center gap-2 ml-1">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('booking.form.name_label')}</FormLabel>
                                                        </div>
                                                        <FormControl>
                                                            <div className="relative group">
                                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                                <Input {...field} placeholder="Escribe tu nombre completo" className="h-14 pl-12 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold italic focus:ring-primary/20 transition-all" />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage className="text-[10px] font-bold italic" />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="clientEmail"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-3">
                                                        <div className="flex items-center gap-2 ml-1">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('booking.form.email_label')}</FormLabel>
                                                        </div>
                                                        <FormControl>
                                                            <div className="relative group">
                                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                                <Input
                                                                    {...field}
                                                                    placeholder="tu@email.com"
                                                                    className="h-14 pl-12 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold italic focus:ring-primary/20 transition-all"
                                                                    onChange={(e) => {
                                                                        field.onChange(e);
                                                                        if (otpToken) setOtpToken(null);
                                                                        if (otpVerifiedEmail) setOtpVerifiedEmail(null);
                                                                    }}
                                                                    onBlur={() => fetchAssetsForContact()}
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage className="text-[10px] font-bold italic" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="mt-6">
                                            <FormField
                                                control={form.control}
                                                name="clientPhone"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-3">
                                                        <div className="flex items-center gap-2 ml-1">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('booking.form.phone_label')}</FormLabel>
                                                        </div>
                                                        <FormControl>
                                                            <PhoneInput
                                                                country={'mx'}
                                                                value={field.value}
                                                                onChange={(phone) => field.onChange(phone)}
                                                                onBlur={() => fetchAssetsForContact()}
                                                                specialLabel=""
                                                                inputProps={{
                                                                    name: 'clientPhone',
                                                                    required: true,
                                                                    autoFocus: false
                                                                }}
                                                                inputStyle={{
                                                                    width: '100%',
                                                                    height: '3.5rem',
                                                                    borderRadius: '1.2rem',
                                                                    border: '2px solid #e2e8f0',
                                                                    fontSize: '1.1rem',
                                                                    fontWeight: '700',
                                                                    fontStyle: 'italic',
                                                                    paddingLeft: '3.5rem',
                                                                    color: '#0f172a', // Navy dark color for text visibility
                                                                    backgroundColor: '#ffffff'
                                                                }}
                                                                buttonStyle={{
                                                                    border: 'none',
                                                                    backgroundColor: 'transparent',
                                                                    paddingLeft: '0.8rem',
                                                                    borderRadius: '1.2rem 0 0 1.2rem'
                                                                }}
                                                                containerStyle={{
                                                                    borderRadius: '1.2rem'
                                                                }}
                                                                dropdownStyle={{
                                                                    borderRadius: '1.2rem',
                                                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                                    color: '#0f172a',
                                                                    backgroundColor: '#ffffff'
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-[10px] font-bold italic" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Booking Highlights/Security */}
                                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 grid md:grid-cols-2 gap-8">
                                            <div className="flex items-start gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                                                    <ShieldCheck className="w-5 h-5 text-green-500" />
                                                </div>
                                                <div>
                                                    <h4 className="text-[11px] font-black uppercase tracking-widest mb-1">Privacidad Asegurada</h4>
                                                    <p className="text-[10px] text-muted-foreground font-medium italic">Tus datos están protegidos y solo se usarán para gestionar tu reserva.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                    <Bell className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <h4 className="text-[11px] font-black uppercase tracking-widest mb-1">Recordatorios Gratis</h4>
                                                    <p className="text-[10px] text-muted-foreground font-medium italic">Te enviaremos un correo de confirmación y recordatorios de tu cita.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-3 sm:pt-4">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={handleBack}
                                            className="h-10 sm:h-12 md:h-14 px-4 sm:px-6 md:px-8 rounded-xl sm:rounded-2xl font-black uppercase italic tracking-wider sm:tracking-widest text-[10px] sm:text-xs text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 order-2 sm:order-1"
                                        >
                                            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> Volver
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={async () => {
                                                const isValid = await form.trigger(['clientName', 'clientEmail', 'clientPhone']);
                                                if (isValid) {
                                                    // If user is logged in, skip OTP
                                                    if (user) {
                                                        handleNext();
                                                        return;
                                                    }

                                                    const email = form.getValues('clientEmail');
                                                    const assetId = form.getValues('assetId');
                                                    const policy = business?.paymentConfig?.paymentPolicy || 'RESERVE_ONLY';

                                                    // Determine if OTP is needed based on assets or online payment
                                                    const usableAssetsForBooking = availableAssets.filter(asset => {
                                                        const isSAllowed = !asset.productId?.allowedServiceIds ||
                                                            asset.productId.allowedServiceIds.length === 0 ||
                                                            asset.productId.allowedServiceIds.includes(selectedServiceId!);
                                                        const isDValid = !asset.expiresAt || !selectedDate || new Date(asset.expiresAt) >= selectedDate;
                                                        const hasU = asset.isUnlimited || (asset.remainingUses && asset.remainingUses > 0);
                                                        return isSAllowed && isDValid && hasU;
                                                    });

                                                    const hasUsableAssets = usableAssetsForBooking.length > 0;

                                                    if (assetId && !usableAssetsForBooking.some(a => a._id === assetId)) {
                                                        form.setValue('assetId', '');
                                                        setSelectedAsset(null);
                                                    }

                                                    const updatedAssetId = form.getValues('assetId');
                                                    const isOnlinePayment = (policy === 'PAY_BEFORE_BOOKING' || policy === 'PACKAGE_OR_PAY') &&
                                                        !updatedAssetId &&
                                                        selectedService &&
                                                        selectedService.price > 0;

                                                    const isAlreadyVerified = otpToken && otpVerifiedEmail === email;

                                                    if (hasUsableAssets && !isAlreadyVerified) {
                                                        try {
                                                            const purpose = 'ASSET_USAGE';
                                                            const res = await requestOtp(email, businessId!, purpose);
                                                            if (res.requiresOtp) {
                                                                setOtpPurpose(purpose);
                                                                setIsOtpModalOpen(true);
                                                                return;
                                                            }
                                                        } catch (err) {
                                                            console.error("OTP request failed", err);
                                                        }
                                                    }

                                                    handleNext();
                                                }
                                            }}
                                            className="h-12 sm:h-14 md:h-16 px-6 sm:px-10 md:px-12 rounded-xl sm:rounded-2xl font-black uppercase italic tracking-tighter text-sm sm:text-lg md:text-xl shadow-lg sm:shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all order-1 sm:order-2"
                                        >
                                            Continuar <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Right: Summary */}
                                <div className="space-y-6">
                                    <div className="bg-slate-900 dark:bg-slate-950 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] p-5 sm:p-8 text-white shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/30 transition-colors duration-500"></div>

                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
                                            <Search className="w-3.5 h-3.5" /> Tu Selección
                                        </h3>

                                        {selectedProduct && (
                                            <div className="mb-6 pb-6 border-b border-white/10">
                                                <Badge className="bg-amber-500 text-white border-0 text-[8px] font-black uppercase italic mb-2">Paquete</Badge>
                                                <h4 className="text-xl font-black uppercase italic tracking-tighter leading-none mb-1 text-amber-500">{selectedProduct.name}</h4>
                                                <p className="text-2xl font-black italic">${selectedProduct.price}</p>
                                            </div>
                                        )}

                                        {selectedService && !selectedProduct && (
                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="text-2xl font-black uppercase italic tracking-tighter leading-none mb-2">{selectedService.name}</h4>
                                                    <div className="flex items-center gap-3 opacity-60">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span className="text-[11px] font-bold uppercase tracking-widest">{selectedService.durationMinutes} min</span>
                                                    </div>
                                                </div>

                                                <div className="pt-6 mt-6 border-t border-white/5 space-y-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
                                                            <CalendarIcon className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Fecha Reserva</p>
                                                            <p className="text-sm font-bold italic">{selectedDate ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es }) : '---'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
                                                            <Clock className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Horario</p>
                                                            <p className="text-sm font-bold italic">{selectedTime || '---'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-10 bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total a pagar</span>
                                            <span className="text-3xl font-black italic text-primary">${selectedProduct ? selectedProduct.price : (selectedService?.price || 0)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'PAYMENT':
                return (
                    <Card className="w-full max-w-full shadow-2xl border-2 overflow-hidden border-slate-100 dark:border-slate-800/10">
                        <CardHeader className="pb-2 sm:pb-4 px-4 sm:px-6">
                            <div className="flex flex-col gap-2 sm:gap-4 md:gap-6 mb-2 sm:mb-4">
                                <div className="space-y-1 sm:space-y-2">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <div className="h-1 sm:h-2 w-4 sm:w-8 bg-primary rounded-full"></div>
                                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-primary">Paso {(bookingSteps.indexOf('PAYMENT') + 1).toString().padStart(2, '0')}</span>
                                    </div>
                                    <CardTitle className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase italic tracking-tighter leading-tight sm:leading-none dark:text-white">
                                        MÉTODO DE <span className="text-primary italic">PAGO</span>
                                    </CardTitle>
                                    <CardDescription className="text-xs sm:text-base font-medium italic opacity-70">Elige cómo pagar</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 md:px-8 pb-6 sm:pb-10">
                            <div className="grid lg:grid-cols-[1fr_400px] gap-4 sm:gap-6 md:gap-8">
                                <div className="space-y-4 sm:space-y-6">
                                    <div className="grid gap-3 sm:gap-4">
                                        {/* Stripe Payment */}
                                        {((!selectedProduct && business?.paymentConfig?.paymentPolicy !== 'RESERVE_ONLY') || (selectedProduct)) && (
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => {
                                                    setPaymentMethod('STRIPE');
                                                    form.setValue('paymentOption', 'STRIPE');
                                                }}
                                                className={cn(
                                                    "p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl md:rounded-[2rem] border-2 transition-all duration-300 flex items-center justify-between group min-w-0",
                                                    paymentMethod === 'STRIPE'
                                                        ? "bg-primary border-primary text-white shadow-lg sm:shadow-xl shadow-primary/20"
                                                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary/50"
                                                )}
                                            >
                                                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                                    <div className={cn(
                                                        "h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-colors shrink-0",
                                                        paymentMethod === 'STRIPE' ? "bg-white/20" : "bg-primary/10 text-primary"
                                                    )}>
                                                        <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
                                                    </div>
                                                    <div className="text-left min-w-0 flex-1">
                                                        <p className="text-sm sm:text-base font-black uppercase italic tracking-tighter truncate">Tarjeta Crédito/Débito</p>
                                                        <p className={cn(
                                                            "text-[9px] sm:text-[10px] font-bold uppercase tracking-wider sm:tracking-widest",
                                                            paymentMethod === 'STRIPE' ? "text-white/60" : "text-muted-foreground"
                                                        )}>Vía Stripe</p>
                                                    </div>
                                                </div>
                                                {paymentMethod === 'STRIPE' && <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />}
                                            </motion.button>
                                        )}

                                        {/* Packages Wallet (If available) */}
                                        {selectedService && (availableAssets.length > 0) && (
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Tus paquetes disponibles</p>
                                                <div className="grid gap-3">
                                                    {prioritizeAssets(availableAssets).map((asset) => {
                                                        const isServiceAllowed = !asset.productId?.allowedServiceIds ||
                                                            asset.productId.allowedServiceIds.length === 0 ||
                                                            asset.productId.allowedServiceIds.includes(selectedServiceId!);

                                                        const isDateValid = !asset.expiresAt || !selectedDate || new Date(asset.expiresAt) >= selectedDate;
                                                        const isCompatible = isServiceAllowed && isDateValid;

                                                        return (
                                                            <motion.button
                                                                key={asset._id}
                                                                type="button"
                                                                disabled={!isCompatible}
                                                                whileHover={isCompatible ? { scale: 1.01 } : {}}
                                                                onClick={() => {
                                                                    if (isCompatible) {
                                                                        setPaymentMethod('ASSET');
                                                                        setSelectedAsset(asset);
                                                                        form.setValue('assetId', asset._id);
                                                                        form.setValue('paymentOption', 'ASSET');
                                                                    }
                                                                }}
                                                                className={cn(
                                                                    "p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 flex items-center justify-between gap-4",
                                                                    !isCompatible ? "opacity-40 grayscale cursor-not-allowed" : "cursor-pointer",
                                                                    paymentMethod === 'ASSET' && selectedAsset?._id === asset._id
                                                                        ? "bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-500/20"
                                                                        : "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 hover:border-amber-500/50"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn(
                                                                        "h-10 w-10 rounded-xl flex items-center justify-center",
                                                                        paymentMethod === 'ASSET' && selectedAsset?._id === asset._id ? "bg-white/20" : "bg-amber-500/10 text-amber-600"
                                                                    )}>
                                                                        <Ticket className="w-5 h-5" />
                                                                    </div>
                                                                    <div className="text-left">
                                                                        <p className="text-sm font-black uppercase italic tracking-tighter">{asset.productId?.name || 'Paquete'}</p>
                                                                        <p className={cn(
                                                                            "text-[9px] font-bold uppercase tracking-widest",
                                                                            paymentMethod === 'ASSET' && selectedAsset?._id === asset._id ? "text-white/70" : "text-amber-600/70"
                                                                        )}>
                                                                            {asset.isUnlimited ? 'Uso Ilimitado' : `${asset.remainingUses} usos restantes`}
                                                                            {!isCompatible && !isDateValid && (
                                                                                <span className="block text-red-500 font-black mt-0.5">Vencido para esta fecha</span>
                                                                            )}
                                                                            {!isCompatible && !isServiceAllowed && (
                                                                                <span className="block text-red-500 font-black mt-0.5">No válido para este servicio</span>
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {isCompatible && paymentMethod === 'ASSET' && selectedAsset?._id === asset._id && <CheckCircle2 className="w-5 h-5" />}
                                                                {!isCompatible && <X className="w-5 h-5 text-red-500/50" />}
                                                            </motion.button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* In-Person / Cash */}
                                        {selectedService && !selectedProduct && business?.paymentConfig?.allowCash && (
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => {
                                                    setPaymentMethod('IN_PERSON');
                                                    form.setValue('paymentOption', 'IN_PERSON');
                                                    form.setValue('assetId', undefined);
                                                }}
                                                className={cn(
                                                    "p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl md:rounded-[2rem] border-2 transition-all duration-300 flex items-center justify-between group min-w-0",
                                                    paymentMethod === 'IN_PERSON'
                                                        ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20"
                                                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-900/50"
                                                )}
                                            >
                                                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                                    <div className={cn(
                                                        "h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-colors shrink-0",
                                                        paymentMethod === 'IN_PERSON' ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                                    )}>
                                                        <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
                                                    </div>
                                                    <div className="text-left min-w-0">
                                                        <p className="text-sm sm:text-base font-black uppercase italic tracking-tighter truncate">Pago en Establecimiento</p>
                                                        <p className={cn(
                                                            "text-[9px] sm:text-[10px] font-bold uppercase tracking-wider sm:tracking-widest truncate",
                                                            paymentMethod === 'IN_PERSON' ? "text-white/60" : "text-muted-foreground"
                                                        )}>Reserva ahora, paga al llegar</p>
                                                    </div>
                                                </div>
                                                {paymentMethod === 'IN_PERSON' && <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />}
                                            </motion.button>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-3 sm:pt-4">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={handleBack}
                                            className="h-10 sm:h-12 md:h-14 px-4 sm:px-6 md:px-8 rounded-xl sm:rounded-2xl font-black uppercase italic tracking-wider sm:tracking-widest text-[10px] sm:text-xs text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 order-2 sm:order-1"
                                        >
                                            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> Volver
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => handleNext()}
                                            disabled={!paymentMethod}
                                            className="h-12 sm:h-14 md:h-16 px-6 sm:px-10 md:px-12 rounded-xl sm:rounded-2xl font-black uppercase italic tracking-tighter text-base sm:text-lg md:text-xl shadow-lg sm:shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all order-1 sm:order-2"
                                        >
                                            Continuar <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-4 sm:space-y-6">
                                    <div className="bg-slate-900 dark:bg-slate-950 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] p-5 sm:p-6 md:p-8 text-white shadow-xl sm:shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/30 transition-colors duration-500"></div>

                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-3">
                                            <Search className="w-3.5 h-3.5" /> Tu Selección
                                        </h3>

                                        {selectedProduct && (
                                            <div className="mb-6 pb-6 border-b border-white/10">
                                                <Badge className="bg-amber-500 text-white border-0 text-[8px] font-black uppercase italic mb-2">Paquete</Badge>
                                                <h4 className="text-xl font-black uppercase italic tracking-tighter leading-none mb-1 text-amber-500">{selectedProduct.name}</h4>
                                                <p className="text-2xl font-black italic">${selectedProduct.price}</p>
                                            </div>
                                        )}

                                        {selectedService && !selectedProduct && (
                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="text-2xl font-black uppercase italic tracking-tighter leading-none mb-2">{selectedService.name}</h4>
                                                    <div className="flex items-center gap-3 opacity-60">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span className="text-[11px] font-bold uppercase tracking-widest">{selectedService.durationMinutes} min</span>
                                                    </div>
                                                </div>

                                                <div className="pt-6 mt-6 border-t border-white/5 space-y-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
                                                            <CalendarIcon className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Fecha Reserva</p>
                                                            <p className="text-sm font-bold italic">{selectedDate ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es }) : '---'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
                                                            <Clock className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Horario</p>
                                                            <p className="text-sm font-bold italic">{selectedTime || '---'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-10 bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total a pagar</span>
                                            <span className="text-3xl font-black italic text-primary">${selectedProduct ? selectedProduct.price : (selectedService?.price || 0)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'CONFIRMATION':
                return (
                    <Card className="w-full max-w-full shadow-2xl border-2 overflow-hidden border-slate-100 dark:border-slate-800/10">
                        <CardHeader className="pb-2 sm:pb-4 px-3 sm:px-6">
                            <div className="flex flex-col gap-2 sm:gap-4 md:gap-6 mb-2 sm:mb-4">
                                <div className="space-y-1 sm:space-y-2">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <div className="h-1 sm:h-2 w-4 sm:w-8 bg-primary rounded-full"></div>
                                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-primary">Paso {(bookingSteps.indexOf('CONFIRMATION') + 1).toString().padStart(2, '0')}</span>
                                    </div>
                                    <CardTitle className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase italic tracking-tighter leading-tight sm:leading-none dark:text-white">
                                        REVISA Y <span className="text-primary italic">CONFIRMA</span>
                                    </CardTitle>
                                    <CardDescription className="text-xs sm:text-base font-medium italic opacity-70">Verifica los datos</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-3 sm:px-6 md:px-8 pb-6 sm:pb-10">
                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 sm:gap-6 md:gap-8">
                                {/* Left: Review & Payment Selection */}
                                <div className="space-y-3 sm:space-y-6 md:space-y-8">
                                    {/* Item summary for mobile (cleaner) */}
                                    <div className="lg:hidden bg-slate-50 dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-slate-200 dark:border-slate-800">
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                {selectedProduct ? <Ticket className="w-5 h-5 sm:w-6 sm:h-6" /> : <Zap className="w-5 h-5 sm:w-6 sm:h-6" />}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-black uppercase italic tracking-tighter text-sm sm:text-base truncate">{selectedProduct?.name || selectedService?.name}</h4>
                                                <p className="text-xs sm:text-sm font-bold text-primary">${selectedProduct?.price || selectedService?.price}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 border border-slate-200 dark:border-slate-800 space-y-4 sm:space-y-6 md:space-y-8">
                                        <div>
                                            <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 sm:mb-6 pl-1">Resumen de Pago</h3>
                                            <div className="p-3 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                                                <div className="flex items-center gap-3 sm:gap-4 min-w-[200px]">
                                                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                        {paymentMethod === 'STRIPE' ? <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" /> :
                                                            paymentMethod === 'ASSET' ? <Ticket className="w-5 h-5 sm:w-6 sm:h-6" /> : <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs sm:text-base font-black uppercase italic tracking-tighter truncate">
                                                            {paymentMethod === 'STRIPE' ? 'Tarjeta Crédito/Débito' :
                                                                paymentMethod === 'ASSET' ? (selectedAsset?.productId?.name || 'Paquete Seleccionado') :
                                                                    paymentMethod === 'IN_PERSON' ? 'Pago en Sitio' :
                                                                        (!bookingSteps.includes('PAYMENT') ? (selectedService?.price === 0 ? 'Sin Costo' : 'Reserva Directa') : 'Pendiente')}
                                                        </p>
                                                        <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">
                                                            {!bookingSteps.includes('PAYMENT') && !paymentMethod ? 'Reserva Garantizada' : 'Método Seleccionado'}
                                                        </p>
                                                        {paymentMethod === 'ASSET' && otpToken && (
                                                            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-green-500 bg-green-500/10 px-2 py-0.5 rounded-md w-fit">
                                                                <ShieldCheck className="w-3 h-3" />
                                                                Crédito protegido ✔️
                                                            </div>
                                                        )}
                                                        {paymentMethod === 'ASSET' && selectedAsset && (
                                                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in slide-in-from-top-2 duration-500 w-full">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-1">
                                                                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Balance Actual</p>
                                                                        <p className="text-[11px] font-black italic">{selectedAsset.isUnlimited ? '∞' : selectedAsset.remainingUses} créds</p>
                                                                    </div>
                                                                    <div className="space-y-1 text-right">
                                                                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Esta Reserva</p>
                                                                        <p className="text-[11px] font-black italic text-amber-500">-1 créd</p>
                                                                    </div>
                                                                </div>
                                                                <div className="bg-primary/5 rounded-xl p-2 sm:p-3 flex items-center justify-between border border-primary/10">
                                                                    <div className="flex items-center gap-1">
                                                                        <Ticket className="w-3 h-3 text-primary/60 hidden sm:block" />
                                                                        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-primary/80">Final</span>
                                                                    </div>
                                                                    <span className="text-xs sm:text-sm font-black italic text-primary">{selectedAsset.isUnlimited ? '∞' : (selectedAsset.remainingUses! - 1)}</span>
                                                                </div>
                                                                {selectedAsset.expiresAt && (
                                                                    <div className="flex items-center gap-1.5 pt-1 px-1">
                                                                        <Clock className="w-3 h-3 text-muted-foreground/60" />
                                                                        <p className="text-[9px] text-muted-foreground font-medium italic">
                                                                            Vence {format(new Date(selectedAsset.expiresAt), "d MMM", { locale: es })}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    className="w-full sm:w-auto mt-2 sm:mt-0 font-black uppercase italic text-[9px] sm:text-[10px] px-3 h-8 sm:h-9 shadow-sm"
                                                    onClick={() => goToStepType('PAYMENT')}
                                                >
                                                    Cambiar Método
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Final Action */}
                                        <div className="flex flex-col gap-3 sm:gap-4">
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting || (bookingSteps.includes('PAYMENT') && !paymentMethod)}
                                                className="h-12 sm:h-16 md:h-20 w-full rounded-xl sm:rounded-2xl md:rounded-[2rem] font-black uppercase italic tracking-tighter text-base sm:text-xl md:text-2xl shadow-xl sm:shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden group"
                                            >
                                                {isSubmitting ? (
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        <span>Procesando...</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                                                        <span>Confirmar {selectedProduct ? 'Compra' : 'Reserva'}</span>
                                                        <ArrowRight className="w-4 h-4 sm:w-6 sm:h-6 group-hover:translate-x-2 transition-transform" />
                                                    </div>
                                                )}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={handleBack}
                                                className="h-9 sm:h-12 font-black uppercase italic tracking-widest text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] sm:text-sm"
                                            >
                                                Corregir datos
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Detailed Summary Panel */}
                                <div className="hidden lg:block">
                                    <div className="sticky top-8 space-y-6">
                                        <div className="bg-slate-900 dark:bg-slate-950 rounded-[2.5rem] p-8 text-white shadow-2xl border border-white/5 relative overflow-hidden h-full">
                                            {/* Background glow */}
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>

                                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-8 ml-1">Resumen de Orden</h3>

                                            <div className="space-y-8">
                                                {/* The Primary Item */}
                                                <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="px-2 py-0.5 bg-primary/20 rounded-md">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-primary italic">
                                                                {selectedProduct ? 'Paquete' : 'Servicio'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <h4 className="text-2xl font-black uppercase italic tracking-tighter leading-none mb-4">
                                                        {selectedProduct?.name || selectedService?.name}
                                                    </h4>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 opacity-60">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                                                {selectedProduct ? (selectedProduct.isUnlimited ? 'Ilimitado' : `${selectedProduct.totalUses} Usos`) : `${selectedService?.durationMinutes} Minutos`}
                                                            </span>
                                                        </div>
                                                        <p className="text-xl font-black italic text-primary">${selectedProduct?.price || selectedService?.price}</p>
                                                    </div>
                                                </div>

                                                {/* Date & Time (only for services) */}
                                                {selectedService && !selectedProduct && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-2">Fecha</p>
                                                            <p className="text-sm font-bold italic">{selectedDate ? format(selectedDate, "d MMM", { locale: es }) : '---'}</p>
                                                        </div>
                                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-2">Hora</p>
                                                            <p className="text-sm font-bold italic">{selectedTime || '--:--'}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Client info preview */}
                                                <div className="bg-white/5 rounded-3xl p-6 border border-white/10 relative overflow-hidden">
                                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-4">Datos de Contacto</p>
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-3">
                                                            <User className="w-3.5 h-3.5 text-primary" />
                                                            <span className="text-xs font-bold truncate opacity-80">{clientName || '---'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <Mail className="w-3.5 h-3.5 text-primary" />
                                                            <span className="text-xs font-bold truncate opacity-80">{clientEmail || '---'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <Phone className="w-3.5 h-3.5 text-primary" />
                                                            <span className="text-xs font-bold truncate opacity-80">{clientPhone || '---'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Total amount big */}
                                                <div className="pt-8 border-t border-white/10">
                                                    <div className="flex items-end justify-between mb-4">
                                                        <p className="text-xs font-black uppercase tracking-widest opacity-60">Total Final</p>
                                                        <p className="text-5xl font-black italic text-primary tracking-tighter">
                                                            {paymentMethod === 'ASSET' ? '$0' : `$${selectedProduct ? selectedProduct.price : (selectedService?.price || 0)}`}
                                                        </p>
                                                    </div>
                                                    <p className="text-[9px] font-bold text-center opacity-30 uppercase tracking-widest">
                                                        {paymentMethod === 'ASSET' ? 'Cubierto por tu paquete' : 'Incluye todos los impuestos y cargos'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                <Info className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground font-medium italic leading-relaxed">
                                                Al confirmar, aceptas nuestras políticas de cancelación y términos de servicio.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            default:
                return null;
        }
    };


    if (!business) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">{t('common.error')}</h2>
                    <Button
                        className="mt-4 shadow-xl shadow-primary/20"
                        onClick={() => window.location.reload()}
                    >
                        {t('common.retry')}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="booking-root min-h-screen transition-colors duration-300 max-w-full overflow-x-hidden"
            style={{
                ...(theme === 'custom' && business.settings?.secondaryColor ? {
                    backgroundColor: business.settings.secondaryColor + '10'
                } : {}),
                transition: 'background-color 0.5s ease-in-out'
            }}
        >
            <div
                className="w-full border-b shadow-sm transition-colors duration-300 overflow-x-hidden"
                style={theme === 'custom' && business.settings?.primaryColor ? {
                    backgroundColor: business.settings.primaryColor,
                    color: isColorDark(business.settings.primaryColor) ? '#ffffff' : '#000000',
                    borderColor: 'transparent'
                } : {}}
            >
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 sm:py-6 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
                        {business.logoUrl ? (
                            <div className="h-9 w-9 sm:h-16 sm:w-16 rounded-lg sm:rounded-xl overflow-hidden flex items-center justify-center bg-muted shrink-0">
                                <img
                                    src={business.logoUrl}
                                    alt={`${business.businessName} logo`}
                                    className="h-full w-full object-contain"
                                    onError={(e) => {
                                        // Fallback to icon if image fails to load
                                        e.currentTarget.style.display = 'none';
                                        const parent = e.currentTarget.parentElement;
                                        if (parent) {
                                            parent.innerHTML = '<div class="h-9 w-9 sm:h-16 sm:w-16 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center"><svg class="h-4 w-4 sm:h-8 sm:w-8 text-primary" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M9 8h1"/><path d="M14 8h1"/><path d="M6 21V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17"/></svg></div>';
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="h-9 w-9 sm:h-16 sm:w-16 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Building2
                                    className="h-4 w-4 sm:h-8 sm:w-8"
                                    style={theme === 'custom' && business.settings?.primaryColor ? {
                                        color: isColorDark(business.settings.primaryColor) ? '#ffffff' : '#000000'
                                    } : {}}
                                />
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <h1
                                className="text-xs sm:text-2xl font-bold truncate leading-tight"
                                style={theme === 'custom' && business.settings?.primaryColor ? {
                                    color: isColorDark(business.settings.primaryColor) ? '#ffffff' : '#000000'
                                } : {}}
                            >
                                {business.businessName}
                            </h1>
                            <p
                                className="text-[9px] sm:text-sm truncate opacity-70 hidden sm:block"
                                style={theme === 'custom' && business.settings?.primaryColor ? {
                                    color: isColorDark(business.settings.primaryColor) ? '#ffffff' : '#000000'
                                } : {}}
                            >
                                {t('booking.header.system')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
                        {user && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                    logout();
                                    toast.success(t('auth.logout_success') || 'Sesión cerrada exitosamente');
                                    navigate('/');
                                }}
                                className="ios-btn h-8 w-8 sm:h-10 sm:w-10"
                                title={t('auth.logout') || 'Cerrar sesión'}
                                style={theme === 'custom' && business.settings?.primaryColor ? {
                                    borderColor: isColorDark(business.settings.primaryColor) ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                                    color: isColorDark(business.settings.primaryColor) ? '#ffffff' : '#000000'
                                } : {}}
                            >
                                <LogOut className="h-4 w-4 sm:h-[1.2rem] sm:w-[1.2rem]" />
                                <span className="sr-only">{t('auth.logout') || 'Cerrar sesión'}</span>
                            </Button>
                        )}
                        {!showDashboard && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="hidden sm:flex items-center gap-2 font-black uppercase italic tracking-widest text-[10px] hover:bg-primary/10 rounded-xl px-4 py-2 border-2 transition-all duration-300 group"
                                onClick={() => {
                                    if (otpToken && otpVerifiedEmail) {
                                        handleFetchDashboard(otpVerifiedEmail, otpToken);
                                    } else {
                                        setIsRequestingDashboard(true);
                                    }
                                }}
                                style={theme === 'custom' && business.settings?.primaryColor ? {
                                    borderColor: isColorDark(business.settings.primaryColor) ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                                    color: isColorDark(business.settings.primaryColor) ? '#ffffff' : '#000000'
                                } : {}}
                            >
                                <UserCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                Ver mis reservas
                            </Button>
                        )}

                        {!showDashboard && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="sm:hidden h-8 w-8 border rounded-lg"
                                onClick={() => {
                                    if (otpToken && otpVerifiedEmail) {
                                        handleFetchDashboard(otpVerifiedEmail, otpToken);
                                    } else {
                                        setIsRequestingDashboard(true);
                                    }
                                }}
                                title="Mis Reservas"
                                style={theme === 'custom' && business.settings?.primaryColor ? {
                                    borderColor: isColorDark(business.settings.primaryColor) ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                                    color: isColorDark(business.settings.primaryColor) ? '#ffffff' : '#000000'
                                } : {}}
                            >
                                <UserCircle className="h-5 w-5" />
                            </Button>
                        )}

                        <BusinessThemeToggle hasCustomTheme={!!business.settings?.primaryColor} />
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-8">
                {/* Stepper */}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        {showDashboard && clientDashboardData ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6 sm:space-y-8"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-2xl sm:text-4xl font-black uppercase italic tracking-tighter dark:text-white">
                                            Hola, <span className="text-primary">{clientDashboardData.clientName}</span>
                                        </h2>
                                        <p className="text-sm sm:text-base text-muted-foreground font-medium italic">Bienvenido a tu panel de control</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            onClick={handleDashboardBookAgain}
                                            className="flex-1 sm:flex-none h-12 px-6 rounded-xl font-black uppercase italic tracking-wider shadow-lg shadow-primary/20"
                                        >
                                            <Zap className="w-4 h-4 mr-2" /> Reservar Ahora
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleDashboardLogout}
                                            className="h-12 w-12 rounded-xl flex items-center justify-center p-0 border-2"
                                            title="Cerrar Sesión"
                                        >
                                            <LogOut className="w-5 h-5 text-muted-foreground" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Dashboard KPIs */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card className="p-4 border-2 border-slate-100 dark:border-slate-800 bg-background flex flex-col items-center justify-center text-center">
                                        <CalendarCheck className="w-5 h-5 mb-2 text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Próximas</span>
                                        <span className="text-2xl font-black italic">{clientDashboardData.bookings.length}</span>
                                    </Card>
                                    <Card className="p-4 border-2 border-slate-100 dark:border-slate-800 bg-background flex flex-col items-center justify-center text-center">
                                        <Ticket className="w-5 h-5 mb-2 text-amber-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Paquetes</span>
                                        <span className="text-2xl font-black italic">{clientDashboardData.assets.length}</span>
                                    </Card>
                                    <Card className="p-4 border-2 border-slate-100 dark:border-slate-800 bg-background flex flex-col items-center justify-center text-center">
                                        <Clock className="w-5 h-5 mb-2 text-emerald-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Créditos</span>
                                        <span className="text-2xl font-black italic">
                                            {clientDashboardData.assets.reduce((acc, curr) => acc + (curr.isUnlimited ? 0 : (curr.remainingUses || 0)), 0)}
                                        </span>
                                    </Card>
                                    <Card className="p-4 border-2 border-slate-100 dark:border-slate-800 bg-background flex flex-col items-center justify-center text-center">
                                        <History className="w-5 h-5 mb-2 text-blue-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Historial</span>
                                        <span className="text-2xl font-black italic">{clientDashboardData.pastBookings?.length || 0}</span>
                                    </Card>
                                </div>

                                <div className="grid gap-6 md:grid-cols-[1fr_350px]">
                                    {/* Main Content: Bookings */}
                                    <div className="space-y-6">
                                        <Tabs defaultValue="upcoming" className="w-full">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                                <TabsList className="bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shrink-0">
                                                    <TabsTrigger value="upcoming" className="font-black uppercase italic tracking-widest text-[10px] px-6 py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
                                                        Citas Próximas
                                                    </TabsTrigger>
                                                    <TabsTrigger value="history" className="font-black uppercase italic tracking-widest text-[10px] px-6 py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
                                                        Historial
                                                    </TabsTrigger>
                                                </TabsList>

                                                <div className="relative flex-1 max-w-sm">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <Input
                                                        value={dashboardSearchTerm}
                                                        onChange={(e) => setDashboardSearchTerm(e.target.value)}
                                                        placeholder="Buscar por servicio, fecha o código..."
                                                        className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-none focus-visible:ring-primary shadow-inner"
                                                    />
                                                    {dashboardSearchTerm && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setDashboardSearchTerm("")}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent"
                                                        >
                                                            <SearchX className="w-4 h-4 text-muted-foreground" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            <TabsContent value="upcoming" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                {(() => {
                                                    const filtered = clientDashboardData.bookings.filter(b => {
                                                        const service = services.find(s => s._id === b.serviceId);
                                                        const serviceName = (service?.name || "Servicio").toLowerCase();
                                                        const searchTerm = dashboardSearchTerm.toLowerCase();
                                                        const accessCode = (b.accessCode || "").toLowerCase();

                                                        const date = new Date(b.scheduledAt);
                                                        const day = format(date, "d");
                                                        const month = format(date, "MMMM", { locale: es }).toLowerCase();
                                                        const monthEn = format(date, "MMMM", { locale: enUS }).toLowerCase();

                                                        return serviceName.includes(searchTerm) ||
                                                            accessCode.includes(searchTerm) ||
                                                            day === searchTerm ||
                                                            month.includes(searchTerm) ||
                                                            monthEn.includes(searchTerm);
                                                    });

                                                    if (filtered.length === 0) {
                                                        return (
                                                            <Card className="border-2 border-dashed border-slate-200 dark:border-slate-800 bg-transparent">
                                                                <CardContent className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                                                                    <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-6">
                                                                        <CalendarIcon className="w-10 h-10 text-slate-300" />
                                                                    </div>
                                                                    <p className="text-base font-bold italic text-muted-foreground">
                                                                        {dashboardSearchTerm ? `No se encontraron resultados para "${dashboardSearchTerm}"` : "No tienes reservas programadas"}
                                                                    </p>
                                                                    {!dashboardSearchTerm && (
                                                                        <Button variant="link" onClick={handleDashboardBookAgain} className="mt-4 text-primary font-black uppercase tracking-widest text-xs">Reservar una cita ahora</Button>
                                                                    )}
                                                                </CardContent>
                                                            </Card>
                                                        );
                                                    }

                                                    return (
                                                        <div className="space-y-8">
                                                            {groupBookingsByDate(filtered).map(([dateKey, dayBookings]) => {
                                                                const date = new Date(dateKey + 'T12:00:00'); // set local noon to avoid TZ shift
                                                                let label = format(date, "EEEE d 'de' MMMM", { locale: es });
                                                                if (isToday(date)) label = "HOY, " + label;
                                                                else if (isTomorrow(date)) label = "MAÑANA, " + label;

                                                                return (
                                                                    <div key={dateKey} className="space-y-4">
                                                                        <div className="flex items-center gap-4 px-1">
                                                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary shrink-0">{label}</h4>
                                                                            <div className="h-px w-full bg-slate-100 dark:bg-slate-800/50"></div>
                                                                        </div>
                                                                        <div className="grid gap-3">
                                                                            {dayBookings.map((booking: any) => {
                                                                                const service = services.find(s => s._id === booking.serviceId);
                                                                                return (
                                                                                    <Card key={booking._id} className="overflow-hidden border border-slate-100 dark:border-slate-800/50 hover:border-primary/30 transition-all group bg-white dark:bg-slate-950 shadow-sm hover:shadow-md">
                                                                                        <div className="flex">
                                                                                            <div className="w-1.5 bg-primary"></div>
                                                                                            <div className="flex-1 p-3 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                                                                                                <div className="flex flex-1 gap-4 items-start">
                                                                                                    <div className="space-y-2 flex-1">
                                                                                                        <div className="flex items-center justify-between gap-2">
                                                                                                            <h4 className="text-base sm:text-lg font-black uppercase italic tracking-tighter leading-none group-hover:text-primary transition-colors">
                                                                                                                {service?.name || booking.serviceName || "Servicio"}
                                                                                                            </h4>
                                                                                                            <span className="text-sm font-black italic text-primary shrink-0">${service?.price || 0}</span>
                                                                                                        </div>

                                                                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] sm:text-xs text-muted-foreground font-medium italic">
                                                                                                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                                                                                                                <Clock className="w-3 h-3 text-primary" />
                                                                                                                <span>{format(new Date(booking.scheduledAt), "HH:mm")} ({service?.durationMinutes || 0} min)</span>
                                                                                                            </div>

                                                                                                            {booking.resourceId && (
                                                                                                                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                                                                                                                    <MapPin className="w-3 h-3 text-primary" />
                                                                                                                    <span className="font-black uppercase tracking-widest">{getResourceLabel(booking.resourceId)}</span>
                                                                                                                </div>
                                                                                                            )}

                                                                                                            {booking.accessCode && (
                                                                                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/5 dark:bg-primary/10 rounded-lg text-[9px] uppercase font-black tracking-widest text-primary border border-primary/10">
                                                                                                                    <Tag className="w-3 h-3" />
                                                                                                                    ID: {booking.accessCode}
                                                                                                                </div>
                                                                                                            )}
                                                                                                        </div>

                                                                                                        {booking.resourceId && booking.resourceMapSnapshot && (
                                                                                                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                                                                                                <BookingResourceMapMiniPreview
                                                                                                                    resourceMapSnapshot={booking.resourceMapSnapshot}
                                                                                                                    reservedResourceId={booking.resourceId}
                                                                                                                    size="xs"
                                                                                                                />
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
                                                                                                    <Badge className={cn(
                                                                                                        "font-black uppercase italic tracking-widest text-[9px] px-3 py-1",
                                                                                                        booking.status === 'confirmed' ? "bg-green-500 hover:bg-green-600" :
                                                                                                            booking.status === 'pending_payment' ? "bg-amber-500 hover:bg-amber-600" :
                                                                                                                "bg-slate-400"
                                                                                                    )}>
                                                                                                        {t(`dashboard.bookings.status.${booking.status}`) || booking.status}
                                                                                                    </Badge>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </Card>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })()}
                                            </TabsContent>

                                            <TabsContent value="history" className="mt-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                {(() => {
                                                    const filtered = (clientDashboardData.pastBookings || []).filter(b => {
                                                        const service = services.find(s => s._id === b.serviceId);
                                                        const serviceName = (service?.name || "Servicio").toLowerCase();
                                                        const searchTerm = dashboardSearchTerm.toLowerCase();
                                                        const accessCode = (b.accessCode || "").toLowerCase();

                                                        const date = new Date(b.scheduledAt);
                                                        const day = format(date, "d");
                                                        const month = format(date, "MMMM", { locale: es }).toLowerCase();
                                                        const monthEn = format(date, "MMMM", { locale: enUS }).toLowerCase();

                                                        return serviceName.includes(searchTerm) ||
                                                            accessCode.includes(searchTerm) ||
                                                            day === searchTerm ||
                                                            month.includes(searchTerm) ||
                                                            monthEn.includes(searchTerm);
                                                    });

                                                    if (filtered.length === 0) {
                                                        return (
                                                            <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                                                                <History className="w-12 h-12 mb-4" />
                                                                <p className="text-sm font-bold italic">
                                                                    {dashboardSearchTerm ? `No se encontraron resultados para "${dashboardSearchTerm}"` : "No hay historial de reservas"}
                                                                </p>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div className="grid gap-3">
                                                            {filtered.map((booking: any) => {
                                                                const service = services.find(s => s._id === booking.serviceId);
                                                                const isCancelled = booking.status === 'cancelled';
                                                                return (
                                                                    <Card key={booking._id} className={cn(
                                                                        "overflow-hidden border border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-all grayscale-[0.8] hover:grayscale-0",
                                                                        isCancelled && "opacity-60"
                                                                    )}>
                                                                        <div className="flex">
                                                                            <div className={cn("w-1.5", isCancelled ? "bg-red-400" : "bg-slate-300")}></div>
                                                                            <div className="flex-1 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                                                                                <div className="flex flex-1 gap-4 items-start text-left">
                                                                                    <div className="space-y-2 flex-1">
                                                                                        <div className="flex items-center justify-between gap-2">
                                                                                            <h4 className="text-base font-bold uppercase italic tracking-tighter leading-none">
                                                                                                {service?.name || booking.serviceName || "Servicio"}
                                                                                            </h4>
                                                                                            <span className="text-xs font-black italic text-muted-foreground shrink-0">${service?.price || 0}</span>
                                                                                        </div>

                                                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-muted-foreground font-medium italic">
                                                                                            <div className="flex items-center gap-1.5">
                                                                                                <Clock className="w-3 h-3" />
                                                                                                <span>{format(new Date(booking.scheduledAt), "d MMM, HH:mm", { locale: es })}</span>
                                                                                            </div>

                                                                                            {booking.resourceId && (
                                                                                                <div className="flex items-center gap-1.5">
                                                                                                    <MapPin className="w-3 h-3" />
                                                                                                    <span className="font-black uppercase tracking-widest">{getResourceLabel(booking.resourceId)}</span>
                                                                                                </div>
                                                                                            )}

                                                                                            <div className="flex items-center gap-1.5">
                                                                                                <Tag className="w-3 h-3" />
                                                                                                <span className="font-black">#{booking.accessCode}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                    {booking.resourceId && booking.resourceMapSnapshot && (
                                                                                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                                                                                            <BookingResourceMapMiniPreview
                                                                                                resourceMapSnapshot={booking.resourceMapSnapshot}
                                                                                                reservedResourceId={booking.resourceId}
                                                                                                size="xs"
                                                                                            />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <Badge variant="outline" className={cn(
                                                                                    "w-fit font-black uppercase italic tracking-widest text-[8px] px-2 py-0.5",
                                                                                    booking.status === 'completed' ? "border-green-500 text-green-500" :
                                                                                        booking.status === 'cancelled' ? "border-red-500 text-red-500" :
                                                                                            "border-slate-400 text-slate-400"
                                                                                )}>
                                                                                    {t(`dashboard.bookings.status.${booking.status}`) || booking.status}
                                                                                </Badge>
                                                                            </div>
                                                                        </div>
                                                                    </Card>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })()}
                                            </TabsContent>
                                        </Tabs>
                                    </div>

                                    {/* Sidebar: Assets */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 px-1">
                                            <div className="h-1.5 w-6 bg-amber-500 rounded-full"></div>
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Mis Paquetes / Saldo</h3>
                                        </div>

                                        {clientDashboardData.assets.length > 0 ? (
                                            <div className="grid gap-4">
                                                {clientDashboardData.assets.map((asset: any) => (
                                                    <Card key={asset._id} className="p-4 bg-gradient-to-br from-amber-500/5 to-transparent border-2 border-amber-500/10 hover:border-amber-500/30 transition-all shadow-sm">
                                                        <div className="flex items-start gap-3 mb-3">
                                                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                                                <Ticket className="w-5 h-5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h5 className="text-sm font-black uppercase italic tracking-tighter truncate">{asset.productId?.name || "Paquete"}</h5>
                                                                <p className="text-[10px] text-muted-foreground font-medium italic">
                                                                    {asset.expiresAt ? `Expira el ${format(new Date(asset.expiresAt), "d MMM yyyy", { locale: es })}` : "Sin expiración"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between pt-3 border-t border-amber-500/10">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-amber-600">Disponibles:</span>
                                                            <span className="text-lg font-black italic text-amber-600">
                                                                {asset.isUnlimited ? "∞" : `${asset.remainingUses} Usos`}
                                                            </span>
                                                        </div>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {clientDashboardData.consumedAssets && clientDashboardData.consumedAssets.length > 0 ? (
                                                    <Card className="p-6 border-2 border-primary/20 bg-primary/5 rounded-[1.5rem] relative overflow-hidden group hover:border-primary/40 transition-all">
                                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                                            <Zap className="w-12 h-12 text-primary" />
                                                        </div>
                                                        <div className="flex flex-col gap-4 relative z-10">
                                                            <div className="flex items-start gap-3">
                                                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                                    <History className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <h5 className="text-sm font-black uppercase italic tracking-tighter">{t('dashboard.v2.assets.consumed_title')}</h5>
                                                                    <p className="text-[10px] text-muted-foreground font-medium italic">{clientDashboardData.consumedAssets[0].productId?.name}</p>
                                                                </div>
                                                            </div>
                                                            <p className="text-[11px] font-medium leading-relaxed italic text-muted-foreground">
                                                                {t('dashboard.v2.assets.consumed_desc')}
                                                            </p>
                                                            <Button
                                                                onClick={() => { setShowDashboard(false); setStep(1); setActiveFilter('packages'); }}
                                                                className="w-full h-11 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-primary/20"
                                                                style={{ backgroundColor: business?.settings?.primaryColor }}
                                                            >
                                                                <Zap className="w-3 h-3 mr-2" /> {t('dashboard.v2.assets.renew_button')}
                                                            </Button>
                                                        </div>
                                                    </Card>
                                                ) : (
                                                    <Card className="p-6 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 text-center opacity-60 rounded-[1.5rem]">
                                                        <p className="text-xs font-bold italic text-muted-foreground mb-4">No tienes paquetes o créditos activos</p>
                                                        <Button variant="outline" size="sm" onClick={() => { setShowDashboard(false); setStep(1); setActiveFilter('packages'); }} className="w-full h-10 rounded-xl font-black uppercase tracking-widest text-[9px]">Ver Paquetes</Button>
                                                    </Card>
                                                )}
                                            </div>
                                        )}

                                        {/* Help Card */}
                                        <Card className="p-6 bg-primary/5 border-2 border-primary/10 rounded-[2rem]">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                    <Info className="w-5 h-5" />
                                                </div>
                                                <h4 className="text-xs font-black uppercase tracking-widest">¿Necesitas Ayuda?</h4>
                                            </div>
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-medium italic text-muted-foreground leading-relaxed">
                                                    Si tienes problemas con alguna reserva o paquete, por favor contacta al negocio directamente:
                                                </p>
                                                <div className="space-y-2">
                                                    {business?.phone && (
                                                        <a
                                                            href={`tel:${business.phone}`}
                                                            className="flex items-center gap-3 text-[11px] font-bold text-primary hover:opacity-80 transition-opacity group/link"
                                                        >
                                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover/link:bg-primary/20 transition-colors">
                                                                <Phone className="w-4 h-4" />
                                                            </div>
                                                            <span>{business.phone}</span>
                                                        </a>
                                                    )}
                                                    {business?.email && (
                                                        <a
                                                            href={`mailto:${business.email}`}
                                                            className="flex items-center gap-3 text-[11px] font-bold text-primary hover:opacity-80 transition-opacity group/link"
                                                        >
                                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover/link:bg-primary/20 transition-colors">
                                                                <Mail className="w-4 h-4" />
                                                            </div>
                                                            <span className="truncate">{business.email}</span>
                                                        </a>
                                                    )}
                                                </div>
                                                <p className="text-[9px] font-medium italic text-muted-foreground opacity-70">
                                                    También puedes usar los enlaces de redes sociales al final de la página.
                                                </p>
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            </motion.div>
                        ) : !bookingSuccess ? (
                            <div className="stepper-wrapper">
                                <AnimatedStepper
                                    currentStep={step}
                                    onStepChange={(s) => setStep(s)}
                                    disableStepIndicators={true}
                                    steps={bookingSteps.map((type, idx) => ({
                                        id: idx + 1,
                                        ...stepInfo[type]
                                    }))}
                                >
                                    {bookingSteps.map((type, idx) => (
                                        <AnimatedStep key={`${type}-${idx}`}>
                                            {renderStepContent(type)}
                                        </AnimatedStep>
                                    ))}
                                </AnimatedStepper>
                            </div>
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
                                                    {t('booking.form.confirmation_desc')}
                                                </p>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    const email = form.getValues('clientEmail') || otpVerifiedEmail || "";

                                                    if (businessId) {
                                                        const session = getClientSession(businessId);
                                                        // 1. Try saved session
                                                        if (session && session.email === (email || session.email)) {
                                                            handleFetchDashboard(session.email, session.token);
                                                            return;
                                                        }

                                                        // 2. Try current OTP token if available
                                                        if (otpToken && otpVerifiedEmail && (email === otpVerifiedEmail)) {
                                                            handleFetchDashboard(otpVerifiedEmail, otpToken);
                                                            return;
                                                        }
                                                    }

                                                    setDashboardEmail(email);
                                                    setIsRequestingDashboard(true);
                                                }}
                                                className="rounded-full font-black uppercase italic tracking-widest text-white shadow-lg shadow-green-500/20"
                                                style={{ backgroundColor: business?.settings?.primaryColor }}
                                            >
                                                Ver mis reservas
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </form>
                </Form>


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
            <OtpVerificationModal
                isOpen={isOtpModalOpen}
                onClose={() => setIsOtpModalOpen(false)}
                onSuccess={(token) => {
                    setOtpToken(token);
                    const email = isRequestingDashboard ? dashboardEmail : form.getValues('clientEmail');
                    setOtpVerifiedEmail(email);

                    if (otpPurpose === 'CLIENT_ACCESS') {
                        setIsRequestingDashboard(false);
                        handleFetchDashboard(email, token);
                        toast.success("¡Identidad verificada! Cargando tus datos...");
                    } else {
                        toast.success("Tus créditos han sido verificados. Se descontarán automáticamente al confirmar la reserva.");
                        handleNext();
                    }
                }}
                email={isRequestingDashboard ? dashboardEmail : form.getValues('clientEmail')}
                businessId={businessId!}
                purpose={otpPurpose}
            />

            <AlertDialog open={isRequestingDashboard} onOpenChange={setIsRequestingDashboard}>
                <AlertDialogContent className="rounded-[1.5rem] sm:rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden p-0 max-w-[95%] sm:max-w-[400px] mx-4">
                    <div className="bg-primary/5 p-4 sm:p-6 md:p-8 border-b border-primary/10 relative">
                        <div className="absolute top-4 right-4 h-8 w-8 sm:h-12 sm:w-12 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
                        <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 rounded-xl sm:rounded-2xl bg-primary flex items-center justify-center text-white mb-3 sm:mb-4 shadow-lg shadow-primary/20">
                            <Receipt className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                        </div>
                        <AlertDialogHeader className="text-left space-y-1 sm:space-y-2">
                            <AlertDialogTitle className="text-xl sm:text-2xl md:text-3xl font-black uppercase italic tracking-tighter leading-none">
                                Mis <span className="text-primary italic">Reservas</span>
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-xs sm:text-sm font-medium italic opacity-70 leading-relaxed">
                                Ingresa tu correo para ver tus citas y paquetes. Te enviaremos un código de seguridad.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>

                    <div className="p-4 sm:p-6 md:p-8 space-y-3 sm:space-y-4">
                        <div className="space-y-2">
                            <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tu Correo Electrónico</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    value={dashboardEmail}
                                    onChange={(e) => setDashboardEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    className="h-12 sm:h-14 pl-10 sm:pl-12 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold italic focus:ring-primary/20 transition-all text-sm"
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter' && dashboardEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dashboardEmail)) {
                                            try {
                                                const purpose = 'CLIENT_ACCESS';
                                                const res = await requestOtp(dashboardEmail, businessId!, purpose);
                                                if (res.requiresOtp) {
                                                    setOtpPurpose(purpose);
                                                    setIsOtpModalOpen(true);
                                                }
                                            } catch (err) {
                                                toast.error("Error al solicitar el código. Por favor intenta de nuevo.");
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-1 sm:pt-2">
                            <Button
                                disabled={!dashboardEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dashboardEmail)}
                                onClick={async () => {
                                    try {
                                        const purpose = 'CLIENT_ACCESS';
                                        const res = await requestOtp(dashboardEmail, businessId!, purpose);
                                        if (res.requiresOtp) {
                                            setOtpPurpose(purpose);
                                            setIsOtpModalOpen(true);
                                        }
                                    } catch (err) {
                                        toast.error("Error al solicitar el código. Por favor intenta de nuevo.");
                                    }
                                }}
                                className="h-12 sm:h-14 rounded-xl font-black uppercase italic tracking-widest text-[10px] sm:text-[11px] shadow-xl shadow-primary/20"
                            >
                                Enviar Código <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-2" />
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setIsRequestingDashboard(false)}
                                className="h-10 rounded-xl font-black uppercase italic tracking-widest text-[9px] text-muted-foreground"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!conflictError} onOpenChange={(open) => !open && setConflictError(null)}>
                <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('booking.form.toasts.error_title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {conflictError?.message}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            if (conflictError?.clientEmail) {
                                setDashboardEmail(conflictError.clientEmail);
                                setIsRequestingDashboard(true);
                                setConflictError(null);
                            }
                        }}>
                            Ver mis citas
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {
                preSelectedPackage && (
                    <PackageQRModal
                        product={preSelectedPackage}
                        open={showPackageModal}
                        existingAssets={availableAssets}
                        onClose={() => {
                            setShowPackageModal(false);
                            setPreSelectedPackage(null);
                            const newParams = new URLSearchParams(searchParams);
                            newParams.delete('packageId');
                            navigate({ search: newParams.toString() }, { replace: true });
                        }}
                        onBuyOnly={() => {
                            setShowPackageModal(false);
                            handleBuyPackage(preSelectedPackage, false);
                        }}
                        onBuyAndBook={() => {
                            setShowPackageModal(false);
                            handleBuyPackage(preSelectedPackage, true);
                        }}
                    />
                )
            }

            <AlertDialog open={expiredAssetError} onOpenChange={setExpiredAssetError}>
                <AlertDialogContent className="rounded-[2rem] border-2 border-amber-500/20 shadow-2xl">
                    <AlertDialogHeader>
                        <div className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4 mx-auto">
                            <CalendarIcon className="w-8 h-8" />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-center">
                            Paquete <span className="text-amber-500">Expirado</span>
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-base font-medium italic opacity-70">
                            Lo sentimos, tu paquete no será válido para la fecha seleccionada ({selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: es }) : '---'}).
                            {selectedAsset?.expiresAt && (
                                <span className="block mt-2 font-black text-amber-500">
                                    Tu paquete vence el {format(new Date(selectedAsset.expiresAt), "d 'de' MMMM, yyyy", { locale: es })}
                                </span>
                            )}
                            <span className="block mt-2">
                                Por favor, elige una fecha anterior al vencimiento o usa otro método de pago.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="sm:justify-center mt-6">
                        <AlertDialogAction
                            onClick={() => {
                                setExpiredAssetError(false);
                                goToStepType('SCHEDULE');
                            }}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-black uppercase italic tracking-widest px-8 h-12 rounded-xl shadow-xl shadow-amber-500/20"
                        >
                            Cambiar Fecha
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

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    // W3C Relative Luminance Formula
    // Apply gamma correction
    r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    // Calculate relative luminance
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    // If luminance is less than 0.5, the color is dark
    return luminance < 0.5;
}

const prioritizeAssets = (assets: CustomerAsset[]): CustomerAsset[] => {
    const now = new Date();
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

    return [...assets].sort((a, b) => {
        // 1. Priority: Assets que expiran en menos de 7 días
        const aExpiresSoon = a.expiresAt && (new Date(a.expiresAt).getTime() - now.getTime() < WEEK_MS);
        const bExpiresSoon = b.expiresAt && (new Date(b.expiresAt).getTime() - now.getTime() < WEEK_MS);

        if (aExpiresSoon && !bExpiresSoon) return -1;
        if (!aExpiresSoon && bExpiresSoon) return 1;

        // 2. Priority: Limitados sobre ilimitados (para consumir recursos limitados primero)
        if (!a.isUnlimited && b.isUnlimited) return -1;
        if (a.isUnlimited && !b.isUnlimited) return 1;

        // 3. Por fecha de expiración (más próximo primero)
        if (a.expiresAt && b.expiresAt) {
            return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
        }

        // Si uno tiene expiración y otro no, priorizar el que expira
        if (a.expiresAt && !b.expiresAt) return -1;
        if (!a.expiresAt && b.expiresAt) return 1;

        return 0;
    });
};

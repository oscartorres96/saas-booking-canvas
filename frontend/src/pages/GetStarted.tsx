import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, CreditCard, Rocket, Sparkles, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/auth/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';
import { getBusinessById, Business } from '@/api/businessesApi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function GetStarted() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const [loadingSubscribe, setLoadingSubscribe] = useState(false);
    const [business, setBusiness] = useState<Business | null>(null);
    const [loadingBusiness, setLoadingBusiness] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchBusiness = async () => {
            try {
                // Assuming user has businessId or we can get it via user
                const businessId = user.businessId;
                if (!businessId) {
                    toast.error("No se encontró información del negocio.");
                    return;
                }
                const data = await getBusinessById(businessId);
                setBusiness(data);

                // Auto redirect if already active
                if (data.subscriptionStatus === 'active') {
                    navigate('/admin');
                }
            } catch (error) {
                console.error("Error fetching business:", error);
                toast.error("Error cargando información.");
            } finally {
                setLoadingBusiness(false);
            }
        };

        fetchBusiness();
    }, [user, navigate]);

    const handleGoToAdmin = () => {
        navigate('/admin');
    };

    const handleSubscribe = async () => {
        if (!user || !business) return;

        try {
            setLoadingSubscribe(true);
            const response = await axios.post(
                `${API_URL}/api/stripe/checkout/subscription`,
                {
                    userId: user._id || user.userId,
                    businessId: business._id,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (response.data?.data?.url) {
                window.location.href = response.data.data.url;
            } else {
                throw new Error('No checkout URL received');
            }
        } catch (error) {
            console.error('Error creating checkout session:', error);
            toast.error(t('get_started.error_subscribe'));
            setLoadingSubscribe(false);
        }
    };

    if (loadingBusiness) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!business) {
        return <div>Error loading business data.</div>;
    }

    const showTrial = business.subscriptionStatus === 'trial';
    const showPay = business.subscriptionStatus === 'pending_payment' || business.subscriptionStatus === 'expired';

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background flex items-center justify-center p-6">
            <div className="max-w-5xl w-full space-y-8">
                {/* Welcome Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold">
                        {t('get_started.title')}
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Estas a un paso de comenzar.
                        {showTrial && " Tu cuenta tiene un periodo de prueba habilitado."}
                        {showPay && " Tu cuenta requiere una suscripción activa."}
                    </p>
                </div>

                <div className="grid md:grid-cols-1 gap-6 mt-12 max-w-2xl mx-auto">
                    {/* Trial / Active Option */}
                    {showTrial && (
                        <Card className="relative border-2 border-green-500 hover:border-green-600 transition-all duration-300 shadow-xl">
                            <CardHeader className="pb-4 text-center">
                                <div className="mx-auto w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-2">
                                    <Rocket className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <CardTitle className="text-2xl">Prueba Gratuita Activa</CardTitle>
                                <CardDescription className="text-base">
                                    ¡Tienes acceso completo por 14 días!
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <Button
                                    onClick={handleGoToAdmin}
                                    className="w-full text-lg py-6 bg-green-600 hover:bg-green-700"
                                    size="lg"
                                >
                                    Ir al Panel de Administración
                                </Button>
                                <p className="text-xs text-center text-muted-foreground">
                                    Puedes suscribirte en cualquier momento para mantener tu acceso.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Subscribe Option */}
                    {showPay && (
                        <Card className="relative border-2 border-primary hover:border-primary/80 transition-all duration-300 shadow-lg hover:shadow-2xl bg-gradient-to-br from-primary/5 to-background">
                            {/* ... (Existing subscription card content, simplified) ... */}
                            <div className="absolute -top-3 right-4">
                                <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    {t('get_started.subscribe.badge')}
                                </div>
                            </div>

                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <CreditCard className="h-6 w-6 text-primary" />
                                    </div>
                                    <CardTitle className="text-2xl">{t('get_started.subscribe.title')}</CardTitle>
                                </div>
                                <CardDescription className="text-base">
                                    {t('get_started.subscribe.subtitle')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="bg-muted/50 rounded-lg p-4 text-center">
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-4xl font-bold">$299</span>
                                        <span className="text-lg text-muted-foreground">MXN</span>
                                        <span className="text-muted-foreground">/ {t('get_started.subscribe.period')}</span>
                                    </div>
                                </div>

                                <ul className="space-y-2">
                                    {['feature1', 'feature2', 'feature3', 'feature4'].map((key) => (
                                        <li key={key} className="flex items-start gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                            <span className="text-sm font-medium">{t(`get_started.subscribe.${key}`)}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    onClick={handleSubscribe}
                                    disabled={loadingSubscribe}
                                    className="w-full text-lg py-6"
                                    size="lg"
                                >
                                    {loadingSubscribe ? t('payment.processing') : t('get_started.subscribe.cta')}
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { DirectPurchaseDialog } from './landing/DirectPurchaseDialog';
import useAuth from '@/auth/useAuth';
import { createCheckoutSession } from '@/api/stripeApi';
import { toast } from 'sonner';

export function PricingSection() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
    const [isAnnual, setIsAnnual] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

    const monthlyPrice = 349;
    const annualPrice = monthlyPrice * 10; // 10 meses (2 meses gratis)
    const displayPrice = isAnnual ? annualPrice : monthlyPrice;

    const handleGetStarted = async (planType: 'monthly' | 'annual' = isAnnual ? 'annual' : 'monthly') => {
        // Get user ID from available properties
        const userId = user?.userId || (user as any)?._id || (user as any)?.id;

        console.log("Pricing Click Debug:", {
            loggedIn: !!user,
            businessId: user?.businessId,
            userId: userId,
            fullUser: user,
            planType
        });

        if (user && user.businessId && userId) {
            setLoading(true);
            try {
                // Autenticado: Ir directo a checkout de Stripe
                const response = await createCheckoutSession({
                    userId: userId,
                    businessId: user.businessId,
                    billingPeriod: planType,
                });

                console.log("Checkout response:", response);

                if (response && response.url) {
                    window.location.href = response.url;
                } else {
                    console.error("Invalid response structure:", response);
                    toast.error("Error: Respuesta inválida del servidor de pagos");
                }
            } catch (error) {
                console.error("Error creating checkout", error);
                toast.error("Error al iniciar el pago");
            } finally {
                setLoading(false);
            }
        } else {
            console.log("User missing required fields for auto-checkout");
            // Guardar el plan seleccionado antes de abrir el diálogo
            setSelectedBillingPeriod(planType);
            // No autenticado: Mostrar diálogo de registro rápido
            setPurchaseDialogOpen(true);
        }
    };

    const features = [
        t('pricing.plan.features.feature1'),
        t('pricing.plan.features.feature2'),
        t('pricing.plan.features.feature3'),
        t('pricing.plan.features.feature4'),
        t('pricing.plan.features.feature5'),
        t('pricing.plan.features.feature6'),
        t('pricing.plan.features.feature7'),
        t('pricing.plan.features.feature8'),
    ];

    return (
        <section id="pricing" className="py-20 px-6 bg-gradient-to-b from-background to-muted/20">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12 space-y-4">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                        {t('pricing.title')}
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        {t('pricing.subtitle')}
                    </p>

                    {/* Billing Period Toggle */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <div className="inline-flex items-center gap-3 bg-muted/50 p-1.5 rounded-lg">
                            <button
                                onClick={() => setIsAnnual(false)}
                                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${!isAnnual
                                    ? 'bg-background shadow-sm text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {t('pricing.billing.monthly')}
                            </button>
                            <button
                                onClick={() => setIsAnnual(true)}
                                className={`px-6 py-2 rounded-md text-sm font-medium transition-all relative ${isAnnual
                                    ? 'bg-background shadow-sm text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {t('pricing.billing.annual')}
                                {isAnnual && (
                                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                                        {t('pricing.billing.save_badge')}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pricing Cards Grid */}
                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Regular Plan - Centered */}
                    <Card className="relative border-2 border-primary shadow-xl hover:shadow-2xl transition-all duration-300 md:col-span-2 md:w-2/3 md:mx-auto">
                        {/* Badge */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                            <Badge className="bg-primary text-primary-foreground px-4 py-1 text-sm font-semibold">
                                {t('pricing.plan.badge')}
                            </Badge>
                        </div>

                        <CardHeader className="text-center pt-8 pb-4">
                            <CardTitle className="text-2xl font-bold">
                                {isAnnual ? t('pricing.plan.name_annual') : t('pricing.plan.name')}
                            </CardTitle>
                            <CardDescription className="mt-4 space-y-2">
                                <span className="flex items-baseline justify-center gap-1">
                                    <span className="text-5xl font-bold text-foreground">
                                        ${displayPrice.toLocaleString()}
                                    </span>
                                    <span className="text-xl text-muted-foreground ml-1">
                                        {t('pricing.plan.currency')}
                                    </span>
                                    <span className="text-muted-foreground">
                                        / {isAnnual ? t('pricing.plan.period_annual') : t('pricing.plan.period')}
                                    </span>
                                </span>
                                {isAnnual && (
                                    <span className="block text-sm text-primary mt-2 font-medium">
                                        {t('pricing.plan.annual_savings')}
                                    </span>
                                )}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <p className="font-semibold text-sm text-muted-foreground text-center">
                                    {t('pricing.plan.features.title')}
                                </p>
                                <ul className="space-y-3 max-w-sm mx-auto">
                                    {features.map((feature, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                            <span className="text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>

                        <CardFooter className="pt-6">
                            <Button
                                onClick={() => handleGetStarted()}
                                className="w-full text-lg py-6 font-semibold max-w-md mx-auto block"
                                size="lg"
                                disabled={loading}
                            >
                                {loading ? (t('common.loading') || "Cargando...") : t('pricing.plan.cta')}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* FAQ Section */}
                <div className="mt-16 max-w-3xl mx-auto">
                    <h3 className="text-2xl font-bold text-center mb-8">
                        {t('pricing.faq.title')}
                    </h3>
                    <div className="grid gap-6 md:grid-cols-3">
                        {['q1', 'q2', 'q3'].map((key) => (
                            <Card key={key} className="bg-card/50">
                                <CardHeader>
                                    <CardTitle className="text-base">
                                        {t(`pricing.faq.${key}.q`)}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        {t(`pricing.faq.${key}.a`)}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            <DirectPurchaseDialog
                open={purchaseDialogOpen}
                onOpenChange={setPurchaseDialogOpen}
                billingPeriod={selectedBillingPeriod}
            />
        </section>
    );
}

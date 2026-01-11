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
                    <Card className="relative border-none shadow-[0_30px_100px_rgba(0,0,0,0.1)] bg-background/60 backdrop-blur-xl hover:shadow-[0_40px_120px_rgba(0,0,0,0.15)] transition-all duration-500 md:col-span-2 md:w-2/3 md:mx-auto overflow-hidden before:absolute before:inset-0 before:p-[2px] before:bg-gradient-to-b before:from-primary/50 before:to-transparent before:rounded-3xl before:-z-10">
                        {/* Badge */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                            <Badge className="bg-primary hover:bg-primary text-primary-foreground px-6 py-1.5 text-sm font-bold shadow-lg shadow-primary/30 rounded-full border-none">
                                {t('pricing.plan.badge')}
                            </Badge>
                        </div>

                        <CardHeader className="text-center pt-12 pb-4 relative z-10">
                            <CardTitle className="text-3xl font-black tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                                {isAnnual ? t('pricing.plan.name_annual') : t('pricing.plan.name')}
                            </CardTitle>
                            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-6xl font-black text-foreground tracking-tighter italic">
                                        ${displayPrice.toLocaleString()}
                                    </span>
                                    <div className="flex flex-col items-start leading-none ml-2">
                                        <span className="text-xl font-bold text-primary">
                                            {t('pricing.plan.currency')}
                                        </span>
                                        <span className="text-muted-foreground font-medium">
                                            / {isAnnual ? t('pricing.plan.period_annual') : t('pricing.plan.period')}
                                        </span>
                                    </div>
                                </div>
                                {isAnnual && (
                                    <span className="inline-block text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full mt-2 uppercase tracking-widest text-center w-full">
                                        {t('pricing.plan.annual_savings')}
                                    </span>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="pt-6 relative z-10">
                            <div className="space-y-8">
                                {/* Value Anchors */}
                                <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 rounded-3xl p-6 text-center shadow-inner">
                                    <p className="font-extrabold text-primary text-lg tracking-tight">
                                        {t('pricing.plan.value_anchor')}
                                    </p>
                                    <p className="text-sm text-muted-foreground/80 mt-1 font-medium italic">
                                        {t('pricing.plan.value_anchor_2')}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <p className="font-bold text-xs text-muted-foreground/60 text-center uppercase tracking-[0.2em]">
                                        {t('pricing.plan.features.title')}
                                    </p>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 max-w-2xl mx-auto px-4">
                                        {features.map((feature, index) => (
                                            <li key={index} className="flex items-center gap-3 group/item">
                                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover/item:bg-primary/20 transition-colors">
                                                    <Check className="h-4 w-4 text-primary" strokeWidth={3} />
                                                </div>
                                                <span className="text-sm font-medium text-foreground/80 group-hover/item:text-foreground transition-colors">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="pt-8 pb-12 relative z-10">
                            <div className="w-full flex flex-col items-center gap-6">
                                <Button
                                    onClick={() => handleGetStarted()}
                                    className="w-full text-xl py-9 font-black max-w-md mx-auto relative overflow-hidden group bg-gradient-to-br from-primary via-primary to-blue-700 hover:to-blue-600 shadow-[0_20px_50px_rgba(59,130,246,0.4)] hover:shadow-[0_25px_60px_rgba(59,130,246,0.6)] rounded-2xl transition-all duration-500 hover:scale-[1.03] active:scale-95 disabled:opacity-70 border-t border-white/20"
                                    size="lg"
                                    disabled={loading}
                                >
                                    {/* Shine effect on hover */}
                                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shine pointer-events-none" />

                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        {loading ? (
                                            <>
                                                <div className="h-6 w-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span className="animate-pulse">{t('common.loading') || "Cargando..."}</span>
                                            </>
                                        ) : (
                                            <>
                                                {t('pricing.plan.cta')}
                                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                                            </>
                                        )}
                                    </span>
                                </Button>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground font-semibold bg-muted/30 px-6 py-2.5 rounded-full border border-foreground/5 transition-all hover:bg-muted/50 hover:border-foreground/10 cursor-default">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    Sin compromiso • Cancela cuando quieras
                                </div>
                            </div>
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

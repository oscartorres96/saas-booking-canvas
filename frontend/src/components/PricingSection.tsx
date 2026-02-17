import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
        const userId = user?.userId || (user as any)?._id || (user as any)?.id;

        if (user && user.businessId && userId) {
            setLoading(true);
            try {
                const response = await createCheckoutSession({
                    userId: userId,
                    businessId: user.businessId,
                    billingPeriod: planType,
                });

                if (response && response.url) {
                    window.location.href = response.url;
                } else {
                    toast.error("Error: Respuesta inválida del servidor de pagos");
                }
            } catch (error) {
                toast.error("Error al iniciar el pago");
            } finally {
                setLoading(false);
            }
        } else {
            setSelectedBillingPeriod(planType);
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
        <section id="pricing" className="py-24 px-6 bg-[#FAFAFA] dark:bg-slate-950">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
                        {t('pricing.title')}
                    </h2>
                    <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        {t('pricing.subtitle')}
                    </p>

                    {/* Billing Period Toggle */}
                    <div className="flex items-center justify-center mt-10">
                        <div className="inline-flex p-1 bg-slate-200/50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setIsAnnual(false)}
                                className={`px-8 py-2 rounded-lg text-sm font-semibold transition-all ${!isAnnual
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                            >
                                {t('pricing.billing.monthly')}
                            </button>
                            <button
                                onClick={() => setIsAnnual(true)}
                                className={`px-8 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${isAnnual
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                            >
                                {t('pricing.billing.annual')}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isAnnual
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                    }`}>
                                    {t('pricing.billing.save_badge')}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pricing Card */}
                <div className="max-w-3xl mx-auto">
                    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[32px] overflow-hidden">
                        <CardHeader className="text-center pt-16 pb-12">
                            <div className="flex justify-center mb-6">
                                <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                                    {t('pricing.plan.badge')}
                                </span>
                            </div>

                            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
                                {isAnnual ? t('pricing.plan.name_annual') : t('pricing.plan.name')}
                            </CardTitle>

                            <div className="flex flex-col items-center">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-7xl font-bold tracking-tight text-slate-900 dark:text-white">
                                        ${displayPrice.toLocaleString()}
                                    </span>
                                    <div className="text-left flex flex-col">
                                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                            {t('pricing.plan.currency')}
                                        </span>
                                        <span className="text-xl text-slate-500 dark:text-slate-400 font-medium lowercase">
                                            / {isAnnual ? t('pricing.plan.period_annual') : t('pricing.plan.period')}
                                        </span>
                                    </div>
                                </div>

                                {isAnnual && (
                                    <p className="mt-4 text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-1.5">
                                        <Check className="h-4 w-4" />
                                        {t('pricing.plan.annual_savings')}
                                    </p>
                                )}
                            </div>

                            <div className="mt-10 px-6">
                                <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
                                    {t('pricing.plan.value_anchor')}
                                    <span className="block text-slate-400 dark:text-slate-500 text-sm mt-1">
                                        {t('pricing.plan.value_anchor_2')}
                                    </span>
                                </p>
                            </div>
                        </CardHeader>

                        <CardContent className="px-8 md:px-16 pb-12">
                            <div className="w-full h-px bg-slate-100 dark:bg-slate-800 mb-12" />

                            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-6">
                                {features.map((feature, index) => (
                                    <div key={index} className="flex items-start gap-3.5">
                                        <div className="mt-1 flex-shrink-0 bg-blue-50 dark:bg-blue-900/20 p-0.5 rounded-full">
                                            <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" strokeWidth={3} />
                                        </div>
                                        <span className="text-[15px] text-slate-600 dark:text-slate-300 leading-snug">
                                            {feature}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>

                        <CardFooter className="bg-slate-50/50 dark:bg-slate-800/30 px-8 md:px-16 py-12 flex flex-col items-center border-t border-slate-100 dark:border-slate-800">
                            <Button
                                onClick={() => handleGetStarted()}
                                className="w-full h-16 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-[0_8px_25px_rgba(37,99,235,0.25)] transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-70"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-3">
                                        <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>{t('common.loading')}</span>
                                    </div>
                                ) : (
                                    t('pricing.plan.cta')
                                )}
                            </Button>

                            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-sm font-medium text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    <span>Prueba gratuita de 14 días</span>
                                </div>
                                <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                <span>Cancela cuando quieras</span>
                            </div>
                        </CardFooter>
                    </Card>
                </div>

                {/* FAQ Section */}
                <div className="mt-32 max-w-4xl mx-auto">
                    <h3 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-16">
                        {t('pricing.faq.title')}
                    </h3>
                    <div className="grid md:grid-cols-3 gap-12">
                        {['q1', 'q2', 'q3'].map((key) => (
                            <div key={key} className="flex flex-col gap-4">
                                <h4 className="font-bold text-slate-900 dark:text-white leading-tight">
                                    {t(`pricing.faq.${key}.q`)}
                                </h4>
                                <p className="text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                    {t(`pricing.faq.${key}.a`)}
                                </p>
                            </div>
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

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuthContext } from '@/auth/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function PricingSection() {
    const { t } = useTranslation();
    const { user } = useAuthContext();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        if (!user) {
            toast.error('Debes iniciar sesión para suscribirte');
            navigate('/login');
            return;
        }

        try {
            setLoading(true);

            // Get the user's first business (or let them select if they have multiple)
            // For now, we'll assume they need to have a business or we redirect to onboarding
            const response = await axios.post(
                `${API_URL}/api/stripe/checkout/subscription`,
                {
                    userId: user._id,
                    businessId: user.businessId || user._id, // Adjust based on your user structure
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (response.data?.data?.url) {
                // Redirect to Stripe Checkout
                window.location.href = response.data.data.url;
            } else {
                throw new Error('No checkout URL received');
            }
        } catch (error) {
            console.error('Error creating checkout session:', error);
            toast.error('Error al iniciar el proceso de pago. Por favor intenta de nuevo.');
            setLoading(false);
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
                </div>

                {/* Pricing Card */}
                <div className="max-w-md mx-auto">
                    <Card className="relative border-2 border-primary shadow-xl hover:shadow-2xl transition-all duration-300">
                        {/* Badge */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                            <Badge className="bg-primary text-primary-foreground px-4 py-1 text-sm font-semibold">
                                {t('pricing.plan.badge')}
                            </Badge>
                        </div>

                        <CardHeader className="text-center pt-8 pb-4">
                            <CardTitle className="text-2xl font-bold">
                                {t('pricing.plan.name')}
                            </CardTitle>
                            <CardDescription className="mt-4">
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-5xl font-bold text-foreground">
                                        {t('pricing.plan.price')}
                                    </span>
                                    <span className="text-xl text-muted-foreground ml-1">
                                        {t('pricing.plan.currency')}
                                    </span>
                                    <span className="text-muted-foreground">
                                        / {t('pricing.plan.period')}
                                    </span>
                                </div>
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <p className="font-semibold text-sm text-muted-foreground">
                                    {t('pricing.plan.features.title')}
                                </p>
                                <ul className="space-y-3">
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
                                onClick={handleSubscribe}
                                disabled={loading}
                                className="w-full text-lg py-6 font-semibold"
                                size="lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        {t('payment.processing')}
                                    </>
                                ) : (
                                    t('pricing.plan.cta')
                                )}
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
        </section>
    );
}

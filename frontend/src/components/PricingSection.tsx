import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

export function PricingSection() {
    const { t } = useTranslation();

    const handleGetStarted = () => {
        document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
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
                                onClick={handleGetStarted}
                                className="w-full text-lg py-6 font-semibold"
                                size="lg"
                            >
                                {t('pricing.plan.cta')}
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

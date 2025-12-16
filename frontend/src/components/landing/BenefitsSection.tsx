import { useTranslation } from 'react-i18next';
import { Clock, Users, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/card';

const benefitIcons = {
    time: Clock,
    clients: Users,
    errors: ShieldCheck,
    professional: Sparkles,
};

export const BenefitsSection = () => {
    const { t } = useTranslation();

    const benefits = ['time', 'clients', 'errors', 'professional'];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
            },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
    };

    return (
        <section id="benefits" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
            <div className="container mx-auto max-w-6xl">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-10 sm:mb-12 md:mb-16"
                >
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
                        {t('landing.benefits.title')}
                    </h2>
                    <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                        {t('landing.benefits.subtitle')}
                    </p>
                </motion.div>

                {/* Benefits Grid */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
                >
                    {benefits.map((benefit) => {
                        const Icon = benefitIcons[benefit as keyof typeof benefitIcons];
                        return (
                            <motion.div key={benefit} variants={item}>
                                <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group">
                                    <CardContent className="p-4 sm:p-6">
                                        <div className="mb-3 sm:mb-4 inline-flex p-2 sm:p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                            <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                                        </div>
                                        <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
                                            {t(`landing.benefits.items.${benefit}.title`)}
                                        </h3>
                                        <p className="text-sm sm:text-base text-muted-foreground">
                                            {t(`landing.benefits.items.${benefit}.description`)}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
};

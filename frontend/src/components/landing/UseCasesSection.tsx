import { useTranslation } from 'react-i18next';
import { Dumbbell, Stethoscope, Scissors, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/card';

const useCaseIcons = {
    gym: Dumbbell,
    medical: Stethoscope,
    beauty: Scissors,
    wellness: Briefcase,
};

export const UseCasesSection = () => {
    const { t } = useTranslation();

    const useCases = ['gym', 'medical', 'beauty', 'wellness'];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
            },
        },
    };

    const item = {
        hidden: { opacity: 0, scale: 0.9 },
        show: { opacity: 1, scale: 1 },
    };

    return (
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
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
                        {t('landing.use_cases.title')}
                    </h2>
                    <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                        {t('landing.use_cases.subtitle')}
                    </p>
                </motion.div>

                {/* Use Cases Grid */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
                >
                    {useCases.map((useCase) => {
                        const Icon = useCaseIcons[useCase as keyof typeof useCaseIcons];
                        return (
                            <motion.div key={useCase} variants={item}>
                                <Card className="h-full border-2 hover:border-primary transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group">
                                    <CardContent className="p-4 sm:p-6 text-center">
                                        <div className="mb-3 sm:mb-4 inline-flex p-3 sm:p-4 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all">
                                            <Icon className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                                        </div>
                                        <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
                                            {t(`landing.use_cases.items.${useCase}.title`)}
                                        </h3>
                                        <p className="text-muted-foreground text-sm">
                                            {t(`landing.use_cases.items.${useCase}.description`)}
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

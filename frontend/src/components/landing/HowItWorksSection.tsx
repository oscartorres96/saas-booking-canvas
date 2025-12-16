import { useTranslation } from 'react-i18next';
import { UserPlus, Settings, Palette, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

const stepIcons = {
    step1: UserPlus,
    step2: Settings,
    step3: Palette,
    step4: Share2,
};

export const HowItWorksSection = () => {
    const { t } = useTranslation();

    const steps = ['step1', 'step2', 'step3', 'step4'];

    return (
        <section id="how-it-works" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
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
                        {t('landing.how_it_works.title')}
                    </h2>
                    <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                        {t('landing.how_it_works.subtitle')}
                    </p>
                </motion.div>

                {/* Steps */}
                <div className="relative">
                    {/* Connection Line (Desktop) */}
                    <div className="hidden lg:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20" />

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative">
                        {steps.map((step, index) => {
                            const Icon = stepIcons[step as keyof typeof stepIcons];
                            return (
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="relative"
                                >
                                    {/* Step Number */}
                                    <div className="flex flex-col items-center text-center">
                                        <div className="relative mb-4 sm:mb-6">
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full blur-lg opacity-30" />
                                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                                                <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-gray-900 border-2 border-primary flex items-center justify-center font-bold text-sm">
                                                {index + 1}
                                            </div>
                                        </div>

                                        <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
                                            {t(`landing.how_it_works.steps.${step}.title`)}
                                        </h3>
                                        <p className="text-sm sm:text-base text-muted-foreground">
                                            {t(`landing.how_it_works.steps.${step}.description`)}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

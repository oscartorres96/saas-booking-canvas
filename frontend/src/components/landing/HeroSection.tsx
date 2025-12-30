import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowRight, Calendar, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const HeroSection = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const scrollToHowItWorks = () => {
        const element = document.getElementById('how-it-works');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section className="pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 -z-10 pointer-events-none" />

            {/* Decorative Elements */}
            <div className="absolute top-20 right-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none" />
            <div className="absolute top-40 left-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none" />

            <div className="container mx-auto max-w-6xl relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Column - Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center lg:text-left"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
                        >
                            <Badge variant="secondary" className="bg-primary text-primary-foreground animate-pulse">NUEVO</Badge>
                            <span className="text-sm font-medium text-primary">{t('landing.hero.badge')}</span>
                        </motion.div>


                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                {t('landing.hero.headline')}
                            </span>
                        </h1>

                        <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto lg:mx-0">
                            {t('landing.hero.subheadline')}
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-8 sm:mb-12">
                            <Button
                                size="lg"
                                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                                className="group text-sm sm:text-base px-8 sm:px-8 py-6 sm:py-6 min-h-[52px] sm:min-h-[56px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 touch-manipulation"
                            >
                                {t('landing.hero.cta_primary')}
                                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={scrollToHowItWorks}
                                className="text-sm sm:text-base px-8 sm:px-8 py-6 sm:py-6 min-h-[52px] sm:min-h-[56px] touch-manipulation"
                            >
                                {t('landing.hero.cta_secondary')}
                            </Button>
                        </div>

                        {/* Trust Indicators */}
                        <div className="flex flex-wrap gap-4 sm:gap-6 justify-center lg:justify-start text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                                <span>{t('landing.hero.trust_indicator_1')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                                <span>{t('landing.hero.trust_indicator_2')}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column - Visual - Hidden on Mobile */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative hidden lg:block"
                    >
                        <div className="relative bg-gradient-to-br from-white to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl p-8 border">
                            {/* Mock Dashboard Preview */}
                            <div className="space-y-4">
                                {/* Header */}
                                <div className="flex items-center justify-between pb-4 border-b">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                                        <div>
                                            <div className="h-3 w-24 bg-gray-300 dark:bg-gray-700 rounded" />
                                            <div className="h-2 w-16 bg-gray-200 dark:bg-gray-600 rounded mt-1" />
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Cards */}
                                <div className="grid grid-cols-3 gap-4">
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="bg-white dark:bg-gray-900 rounded-lg p-4 border"
                                        >
                                            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                                            <div className="h-4 w-12 bg-blue-500 rounded" />
                                        </div>
                                    ))}
                                </div>

                                {/* Booking Cards */}
                                <div className="space-y-3 pt-4">
                                    {[1, 2, 3].map((i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 + i * 0.1 }}
                                            className="flex items-center gap-4 bg-white dark:bg-gray-900 rounded-lg p-4 border"
                                        >
                                            <div className="flex-shrink-0">
                                                <Calendar className="h-8 w-8 text-blue-500" />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                                                <div className="flex gap-2">
                                                    <Clock className="h-4 w-4 text-gray-400" />
                                                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-20" />
                                                </div>
                                            </div>
                                            <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Floating Badge */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.8, type: 'spring' }}
                                className="absolute -top-4 -right-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full p-4 shadow-lg"
                            >
                                <CheckCircle className="h-8 w-8" />
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

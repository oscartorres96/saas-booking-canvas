import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const CTASection = () => {
    const { t } = useTranslation();

    return (
        <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Vibrant Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600" />

            {/* Animated Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-transparent to-purple-500/20 animate-pulse" />

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40" />

            {/* Floating Elements */}
            <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-2xl animate-blob" />
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-pink-300/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
            <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-purple-300/10 rounded-full blur-2xl animate-blob animation-delay-4000" />

            <div className="container mx-auto max-w-4xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center"
                >
                    {/* Main Title */}
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-white drop-shadow-lg">
                        {t('landing.cta.title')}
                    </h2>

                    {/* Subtitle */}
                    <p className="text-lg sm:text-xl md:text-2xl text-white/95 mb-8 sm:mb-10 max-w-2xl mx-auto font-medium drop-shadow">
                        {t('landing.cta.subtitle')}
                    </p>

                    {/* CTA Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="mb-8 sm:mb-10"
                    >
                        <Button
                            size="lg"
                            onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                            className="group text-base sm:text-lg px-8 sm:px-12 py-6 sm:py-8 bg-white text-blue-600 hover:bg-gray-50 shadow-2xl hover:shadow-white/50 transition-all duration-300 hover:scale-105 font-bold rounded-xl"
                        >
                            {t('landing.cta.button')}
                            <ArrowRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </motion.div>

                    {/* Trust Indicators usando las traducciones existentes del hero */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-white/90">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-300 flex-shrink-0" />
                            <span className="text-sm sm:text-base font-medium">
                                {t('landing.hero.trust_indicator_1')}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-300 flex-shrink-0" />
                            <span className="text-sm sm:text-base font-medium">
                                {t('landing.hero.trust_indicator_2')}
                            </span>
                        </div>
                    </div>

                    {/* Note */}
                    <p className="mt-6 sm:mt-8 text-sm sm:text-base text-white/90 font-medium drop-shadow">
                        {t('landing.cta.note')}
                    </p>
                </motion.div>
            </div>
        </section>
    );
};

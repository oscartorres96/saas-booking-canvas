import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Calendar, Users, Settings, BarChart } from 'lucide-react';

export const WhatIsSection = () => {
    const { t } = useTranslation();

    const features = [
        { icon: Calendar, label: 'Gestión de Citas' },
        { icon: Users, label: 'Clientes' },
        { icon: Settings, label: 'Servicios' },
        { icon: BarChart, label: 'Analíticas' },
    ];

    return (
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
            <div className="container mx-auto max-w-6xl">
                <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
                    {/* Left Column - Text */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                            {t('landing.what_is.title')}
                        </h2>
                        <p className="text-lg sm:text-xl text-muted-foreground mb-4 sm:mb-6">
                            {t('landing.what_is.subtitle')}
                        </p>
                        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                            {t('landing.what_is.description')}
                        </p>

                        {/* Mini Features */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-8">
                            {features.map((feature, index) => {
                                const Icon = feature.icon;
                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-background border"
                                    >
                                        <div className="p-1.5 sm:p-2 rounded-md bg-primary/10">
                                            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                        </div>
                                        <span className="font-medium text-xs sm:text-sm">{feature.label}</span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Right Column - Visual - Hidden on Mobile */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative hidden lg:block"
                    >
                        <div className="relative aspect-square bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 shadow-2xl">
                            {/* Simulated Browser Window */}
                            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden h-full">
                                {/* Browser Header */}
                                <div className="bg-gray-200 dark:bg-gray-800 px-4 py-3 flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                        <div className="w-3 h-3 rounded-full bg-green-500" />
                                    </div>
                                    <div className="flex-1 ml-4 bg-gray-100 dark:bg-gray-700 rounded px-3 py-1">
                                        <div className="h-2 w-32 bg-gray-300 dark:bg-gray-600 rounded" />
                                    </div>
                                </div>

                                {/* Browser Content */}
                                <div className="p-6 space-y-4">
                                    {/* Header */}
                                    <div className="flex items-center gap-3 pb-4 border-b">
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                                        <div className="flex-1">
                                            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                                            <div className="h-2 w-16 bg-gray-100 dark:bg-gray-600 rounded" />
                                        </div>
                                    </div>

                                    {/* Cards */}
                                    {[1, 2, 3].map((i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.5 + i * 0.1 }}
                                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                        >
                                            <Calendar className="h-6 w-6 text-blue-500 flex-shrink-0" />
                                            <div className="flex-1">
                                                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                                                <div className="h-2 w-2/3 bg-gray-100 dark:bg-gray-600 rounded" />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Floating Elements */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.8, type: 'spring' }}
                                className="absolute -top-4 -right-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl p-4 shadow-lg"
                            >
                                <BarChart className="h-6 w-6" />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 1, type: 'spring' }}
                                className="absolute -bottom-4 -left-4 bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-2xl p-4 shadow-lg"
                            >
                                <Users className="h-6 w-6" />
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

import { useTranslation } from 'react-i18next';
import {
    Globe,
    LayoutDashboard,
    Palette,
    Bell,
    Languages,
    Moon,
    QrCode,
    Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/card';

const featureIcons = {
    booking_page: Globe,
    dashboard: LayoutDashboard,
    customization: Palette,
    notifications: Bell,
    multilingual: Languages,
    dark_mode: Moon,
    qr_code: QrCode,
    realtime: Zap,
};

// Colores vibrantes para cada característica destacada
const featureColors = {
    multilingual: { from: 'from-blue-500', to: 'to-cyan-500', icon: 'text-blue-500' },
    dark_mode: { from: 'from-purple-500', to: 'to-pink-500', icon: 'text-purple-500' },
    qr_code: { from: 'from-green-500', to: 'to-emerald-500', icon: 'text-green-500' },
    realtime: { from: 'from-orange-500', to: 'to-red-500', icon: 'text-orange-500' },
};

export const FeaturesSection = () => {
    const { t } = useTranslation();

    // Las 4 características principales que van arriba
    const topFeatures = ['multilingual', 'dark_mode', 'qr_code', 'realtime'];

    // Las otras características que van abajo
    const allFeatures = [
        'booking_page',
        'dashboard',
        'customization',
        'notifications',
        'multilingual',
        'dark_mode',
        'qr_code',
        'realtime',
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
    };

    return (
        <section id="features" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-background">
            <div className="container mx-auto max-w-6xl">
                {/* Top Highlighted Features - CON DISEÑO PREMIUM */}
                <div className="mb-16 sm:mb-20">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {topFeatures.map((feature, index) => {
                            const Icon = featureIcons[feature as keyof typeof featureIcons];
                            const colors = featureColors[feature as keyof typeof featureColors];

                            return (
                                <motion.div
                                    key={feature}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1, duration: 0.4 }}
                                    className="group"
                                >
                                    <div className={`relative h-full p-6 sm:p-8 rounded-2xl border-2 border-transparent hover:border-${colors.icon.replace('text-', '')}/20 transition-all duration-300 bg-card hover:shadow-2xl`}>
                                        {/* Gradient Background */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${colors.from} ${colors.to} opacity-5 rounded-2xl group-hover:opacity-10 transition-opacity`} />

                                        {/* Content */}
                                        <div className="relative z-10 flex flex-col items-center text-center">
                                            {/* Icon Circle */}
                                            <div className={`mb-4 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${colors.from} ${colors.to} p-0.5 group-hover:scale-110 transition-transform duration-300`}>
                                                <div className="w-full h-full bg-card rounded-2xl flex items-center justify-center">
                                                    <Icon className={`h-8 w-8 sm:h-10 sm:w-10 ${colors.icon}`} />
                                                </div>
                                            </div>

                                            {/* Title */}
                                            <h3 className="text-lg sm:text-xl font-bold mb-2 text-foreground">
                                                {t(`landing.features.items.${feature}.title`)}
                                            </h3>

                                            {/* Description */}
                                            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                                                {t(`landing.features.items.${feature}.description`)}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-10 sm:mb-12 md:mb-16"
                >
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
                        {t('landing.features.title')}
                    </h2>
                    <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                        {t('landing.features.subtitle')}
                    </p>
                </motion.div>

                {/* All Features Grid */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
                >
                    {allFeatures.map((feature) => {
                        const Icon = featureIcons[feature as keyof typeof featureIcons];
                        return (
                            <motion.div key={feature} variants={item}>
                                <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30 group">
                                    <CardContent className="p-4 sm:p-6">
                                        <div className="mb-3 sm:mb-4 inline-flex p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-colors">
                                            <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                                        </div>
                                        <h3 className="text-base sm:text-lg font-semibold mb-2 text-foreground">
                                            {t(`landing.features.items.${feature}.title`)}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                            {t(`landing.features.items.${feature}.description`)}
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

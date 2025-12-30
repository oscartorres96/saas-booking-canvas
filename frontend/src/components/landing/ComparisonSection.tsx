import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { XCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

export const ComparisonSection = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const beforeItems = t('landing.comparison.before.items', { returnObjects: true }) as string[];
    const afterItems = t('landing.comparison.after.items', { returnObjects: true }) as string[];

    return (
        <section id="comparison" className="py-20 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
            <div className="container mx-auto max-w-6xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                        {t('landing.comparison.title')}
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        {t('landing.comparison.subtitle')}
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Before - Pain Points */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-3xl p-8 sm:p-10"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                                <XCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-red-900 dark:text-red-400">
                                {t('landing.comparison.before.title')}
                            </h3>
                        </div>

                        <ul className="space-y-5">
                            {beforeItems.map((item, index) => (
                                <li key={index} className="flex gap-4">
                                    <XCircle className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
                                    <span className="text-red-800/80 dark:text-red-300/80 font-medium">
                                        {item}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* After - Solution */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-green-50/50 dark:bg-green-950/10 border-2 border-green-500/30 rounded-3xl p-8 sm:p-10 relative overflow-hidden shadow-xl"
                    >
                        {/* Featured Badge */}
                        <div className="absolute top-0 right-0 p-4">
                            <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                Recomendado
                            </span>
                        </div>

                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-green-900 dark:text-green-400">
                                {t('landing.comparison.after.title')}
                            </h3>
                        </div>

                        <ul className="space-y-5">
                            {afterItems.map((item, index) => (
                                <li key={index} className="flex gap-4">
                                    <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                                    <span className="text-green-800 dark:text-green-200 font-bold">
                                        {item}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-10">
                            <Button
                                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                                className="w-full sm:w-auto px-8 py-6 text-lg bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl group shadow-lg shadow-green-600/20"
                            >
                                {t('landing.comparison.cta')}
                                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

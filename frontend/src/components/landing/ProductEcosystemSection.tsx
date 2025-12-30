import { useTranslation } from 'react-i18next';
import { Calendar, CreditCard, Users, Bell, Grid3x3 } from 'lucide-react';

/**
 * ProductEcosystemSection - TRUE EVENT-DRIVEN SYSTEM
 * 
 * CRITICAL: NO decorative animations. NO continuous loops.
 * Only discrete events where BookPro coordinates everything.
 * 
 * Each module is PASSIVE until its event occurs.
 * Maximum 1 visible event at a time.
 */

export const ProductEcosystemSection = () => {
    const { t } = useTranslation();

    // Discrete events - NO overlap - Unified 12s duration cycle
    const CYCLE_DURATION = 12; // seconds
    const events = [
        { id: 'booking', label: 'Nueva reserva', color: '#2563eb', delay: 0 },
        { id: 'payment', label: 'Procesa pago', color: '#9333ea', delay: 3 },
        { id: 'notifications', label: 'Notifica cliente', color: '#4f46e5', delay: 6 },
        { id: 'clients', label: 'Registra cliente', color: '#db2777', delay: 9 },
    ];

    const nodes = [
        {
            id: 'booking',
            icon: Calendar, label: 'Reservas',
            position: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
            gradient: 'from-blue-500 to-blue-600',
        },
        {
            id: 'payment',
            icon: CreditCard, label: 'Pagos',
            position: 'top-1/4 right-0 translate-x-1/2',
            gradient: 'from-purple-500 to-purple-600',
        },
        {
            id: 'notifications',
            icon: Bell, label: 'Notificaciones',
            position: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
            gradient: 'from-indigo-500 to-indigo-600',
        },
        {
            id: 'clients',
            icon: Users, label: 'Clientes',
            position: 'top-1/4 left-0 -translate-x-1/2',
            gradient: 'from-pink-500 to-pink-600',
        },
    ];

    return (
        <section className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-background via-blue-50/30 to-background dark:via-blue-950/10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-pink-950/20 pointer-events-none" />

            <div className="container mx-auto max-w-7xl relative z-10">
                {/* Header */}
                <div className="text-center mb-12 sm:mb-16 md:mb-20 lg:mb-24">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
                        <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Cada acción fluye por BookPro
                        </span>
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                        No hay procesos automáticos sin control. BookPro coordina cada evento.
                        <br className="hidden sm:block" />
                        Observa cómo cada paso pasa por el motor central.
                    </p>
                </div>

                {/* Ecosystem */}
                <div className="relative max-w-4xl mx-auto">
                    <div className="relative w-full aspect-square max-w-2xl mx-auto min-h-[400px] sm:min-h-[500px] md:min-h-[600px]">

                        {/* Connection Lines - SVG layer */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                                {nodes.map((node) => (
                                    <filter key={`glow-${node.id}`} id={`glow-${node.id}`}>
                                        <feGaussianBlur stdDeviation="1" result="coloredBlur" />
                                        <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                ))}
                            </defs>

                            {/* Paths */}
                            {nodes.map((node) => {
                                const event = events.find(e => e.id === node.id);
                                let x2 = 50, y2 = 50;
                                if (node.id === 'booking') { x2 = 50; y2 = 0; }
                                else if (node.id === 'payment') { x2 = 100; y2 = 25; }
                                else if (node.id === 'notifications') { x2 = 50; y2 = 100; }
                                else if (node.id === 'clients') { x2 = 0; y2 = 25; }

                                return (
                                    <g key={`path-${node.id}`}>
                                        <line
                                            x1="50" y1="50" x2={x2} y2={y2}
                                            stroke="currentColor" strokeWidth="0.5"
                                            className="text-blue-200/20 dark:text-blue-800/20"
                                        />
                                        <line
                                            x1={x2} y1={y2} x2="50" y2="50"
                                            stroke={event?.color} strokeWidth="1.5" strokeLinecap="round"
                                            className="flow-line"
                                            style={{
                                                animationDelay: `${event?.delay}s`,
                                                animationDuration: `${CYCLE_DURATION}s`,
                                                filter: `url(#glow-${node.id})`,
                                            }}
                                        />
                                    </g>
                                );
                            })}
                        </svg>

                        {/* CORE - BookPro */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                            <div className="relative">
                                {/* core-breathing effect */}
                                <div className="core-breathing absolute -inset-8 bg-blue-500/10 dark:bg-blue-400/5 rounded-full blur-2xl pointer-events-none" />

                                {/* Core reactions */}
                                {events.map((event, idx) => (
                                    <div
                                        key={`core-${idx}`}
                                        className="core-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220%] h-[220%] rounded-full blur-3xl pointer-events-none"
                                        style={{
                                            background: `radial-gradient(circle, ${event.color}50 0%, transparent 70%)`,
                                            animationDelay: `${event.delay}s`,
                                            animationDuration: `${CYCLE_DURATION}s`
                                        }}
                                    />
                                ))}

                                {/* Core card */}
                                <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl border-2 border-blue-200/40 dark:border-blue-700/40 p-6 sm:p-8 md:p-10 w-32 sm:w-40 md:w-48 aspect-square flex flex-col items-center justify-center">
                                    <div className="mb-3 sm:mb-4 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                                        <Grid3x3 className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-sm sm:text-base md:text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                            BookPro
                                        </div>
                                        <div className="text-[10px] text-muted-foreground mt-1">
                                            Motor Central
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* NODOS */}
                        {nodes.map((node) => {
                            const Icon = node.icon;
                            const nodeEvent = events.find(e => e.id === node.id);

                            return (
                                <div key={node.id} className={`absolute ${node.position} z-10`}>
                                    {nodeEvent && (
                                        <div
                                            className="node-pulse absolute -inset-4 z-0 rounded-full pointer-events-none"
                                            style={{
                                                background: `radial-gradient(circle, ${nodeEvent.color}40 0%, transparent 70%)`,
                                                boxShadow: `0 0 50px ${nodeEvent.color}60`,
                                                animationDelay: `${nodeEvent.delay}s`,
                                                animationDuration: `${CYCLE_DURATION}s`
                                            }}
                                        />
                                    )}

                                    <div className="relative z-10 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 md:p-5 w-20 sm:w-24 md:w-28 aspect-square flex flex-col items-center justify-center gap-2">
                                        <div className={`p-2 sm:p-2.5 rounded-lg bg-gradient-to-br ${node.gradient}`}>
                                            <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                                        </div>
                                        <div className="text-[10px] sm:text-xs font-medium text-center leading-tight hidden sm:block text-foreground">
                                            {node.label}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="text-center mt-12 sm:mt-16 md:mt-20">
                        <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                            <div className="w-2 h-2 rounded-full bg-blue-500 flow-pulse"></div>
                            <span className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">
                                Motor en operación
                            </span>
                        </div>

                        <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
                            Cada evento pasa por BookPro: <strong className="text-foreground">Módulo → BookPro → Siguiente Módulo</strong>.
                            <br className="hidden sm:block" />
                            Ningún módulo funciona de forma independiente. Todo es orquestado.
                        </p>

                        {/* Event sequence */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
                            {events.map((event, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/30 border border-border/50"
                                >
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">
                                        {idx + 1}
                                    </span>
                                    <div className="text-xs text-left leading-tight">
                                        {event.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

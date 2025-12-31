import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Info, MapPin, RefreshCw, Search, Sparkles, Circle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResourceIcon } from './ResourceIconRegistry';
import { Button } from '@/components/ui/button';
import { getResourceAvailability, createResourceHold } from '@/api/resourceMapApi';

interface ResourceSelectorProps {
    businessId: string;
    serviceId?: string;
    scheduledAt: string;
    selectedId: string | null;
    sessionId: string;
    onResourceSelected: (resourceId: string) => void;
    primaryColor?: string;
}

export const ResourceSelector: React.FC<ResourceSelectorProps> = ({
    businessId,
    serviceId,
    scheduledAt,
    selectedId,
    sessionId,
    onResourceSelected,
    primaryColor
}) => {
    const { t } = useTranslation();
    const [availability, setAvailability] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
    const [isHolding, setIsHolding] = useState(false);

    useEffect(() => {
        loadAvailability();
    }, [businessId, scheduledAt]);

    useEffect(() => {
        setLocalSelectedId(selectedId);
    }, [selectedId]);

    const loadAvailability = async () => {
        try {
            setLoading(true);
            const data = await getResourceAvailability(businessId, serviceId!, scheduledAt, sessionId);
            setAvailability(data);

            if (data.userHoldResourceId && !selectedId) {
                setLocalSelectedId(data.userHoldResourceId);
                onResourceSelected(data.userHoldResourceId);
            }
        } catch (error) {
            console.error("Error loading availability:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (resourceId: string) => {
        if (availability.occupiedResourceIds.includes(resourceId)) return;

        try {
            setIsHolding(true);
            await createResourceHold(businessId, serviceId!, resourceId, scheduledAt, sessionId);
            setLocalSelectedId(resourceId);
            onResourceSelected(resourceId);
        } catch (error) {
            console.error("Error creating hold:", error);
            loadAvailability();
        } finally {
            setIsHolding(false);
        }
    };

    if (loading && !availability) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <RefreshCw className="h-10 w-10 text-primary animate-spin" />
                <p className="text-sm font-black uppercase italic tracking-widest text-muted-foreground animate-pulse">Cargando disponibilidad...</p>
            </div>
        );
    }

    if (!availability) return null;

    const { resourceConfig, occupiedResourceIds } = availability;
    const isSpecialType = resourceConfig.layoutType && resourceConfig.layoutType !== 'default';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6 sm:gap-10 w-full"
        >
            {/* Header Content */}
            <div className="flex items-center justify-between px-1">
                <div className="space-y-1 sm:space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center">
                            <Search className="h-2.5 w-2.5 text-primary" />
                        </div>
                        <h3 className="text-sm sm:text-base font-black uppercase italic tracking-widest text-primary">
                            Selecciona tu {resourceConfig.resourceLabel || 'Lugar'}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 opacity-40">
                        <MapPin className="h-2.5 w-2.5" />
                        <span className="text-[9px] font-black uppercase tracking-widest">
                            {t('booking.resource.layout_label') || 'Distribución real de la sala'}
                        </span>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={loadAvailability}
                    className="h-10 w-10 rounded-full bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-all"
                >
                    <RefreshCw className={cn("h-4 w-4 text-primary", loading && "animate-spin")} />
                </Button>
            </div>

            {/* Premium Grid Container with Horizontal Scroll Support */}
            <div className="relative w-full overflow-x-auto pb-6 scrollbar-hide">
                <div className="flex min-w-full justify-center px-4">
                    <div className="relative w-fit shrink-0">
                        {/* Decorative background elements */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-primary/[0.05] rounded-[1.5rem] sm:rounded-[2rem] pointer-events-none" />

                        <div
                            className="relative grid gap-2 sm:gap-3 md:gap-4 p-3 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-br from-slate-50/90 via-white/50 to-slate-50/90 dark:from-slate-900/60 dark:via-slate-900/40 dark:to-slate-900/60 border-2 border-slate-200/60 dark:border-slate-800/50 shadow-xl dark:shadow-black/30 backdrop-blur-md"
                            style={{
                                gridTemplateColumns: `repeat(${resourceConfig.cols}, minmax(${isSpecialType ? '56px' : '44px'}, 1fr))`,
                            }}
                        >
                            <AnimatePresence mode="popLayout">
                                {resourceConfig.resources.map((res: any, index: number) => {
                                    const isOccupied = occupiedResourceIds.includes(res.id);
                                    const isSelected = localSelectedId === res.id;

                                    if (!res.isActive) return <div key={res.id} className={cn(isSpecialType ? "h-20 w-14" : "h-14 w-12")} />;

                                    return (
                                        <motion.button
                                            key={res.id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.02, duration: 0.3 }}
                                            whileHover={!isOccupied && !isHolding ? {
                                                scale: 1.1,
                                                y: -4,
                                                transition: { type: "spring", stiffness: 400, damping: 10 }
                                            } : {}}
                                            whileTap={!isOccupied && !isHolding ? { scale: 0.92 } : {}}
                                            disabled={isOccupied || isHolding}
                                            onClick={() => handleSelect(res.id)}
                                            className={cn(
                                                "group relative flex flex-col items-center justify-center transition-all duration-300 rounded-xl sm:rounded-2xl overflow-hidden",
                                                isSpecialType ? "h-20 w-14" : "h-14 w-11 sm:w-12",
                                                isSelected
                                                    ? "shadow-xl shadow-primary/30 dark:shadow-primary/20 z-20"
                                                    : "hover:shadow-lg hover:shadow-slate-400/20 dark:hover:shadow-black/40",
                                                isOccupied
                                                    ? "cursor-not-allowed opacity-50"
                                                    : "cursor-pointer"
                                            )}
                                        >
                                            {/* Glow effect for selected */}
                                            {isSelected && (
                                                <motion.div
                                                    className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent"
                                                    animate={{
                                                        opacity: [0.5, 0.8, 0.5],
                                                    }}
                                                    transition={{
                                                        duration: 2,
                                                        repeat: Infinity,
                                                        ease: "easeInOut"
                                                    }}
                                                />
                                            )}

                                            {/* Background Layer */}
                                            <motion.div
                                                className={cn(
                                                    "absolute inset-0 transition-all duration-300",
                                                    isSelected
                                                        ? "bg-gradient-to-br from-primary to-primary/90"
                                                        : isOccupied
                                                            ? "bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900"
                                                            : "bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border-2 border-slate-200/80 dark:border-slate-700/50 group-hover:border-primary/40 group-hover:from-primary/5 group-hover:to-primary/10"
                                                )}
                                                style={isSelected && primaryColor ? {
                                                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`
                                                } : {}}
                                            />

                                            {/* Sparkle effect on hover (only for available) */}
                                            {!isOccupied && !isSelected && (
                                                <motion.div
                                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                >
                                                    <Sparkles className="h-3 w-3 text-primary" />
                                                </motion.div>
                                            )}

                                            {/* Content */}
                                            <div className="relative z-10 flex flex-col items-center gap-1.5">
                                                <ResourceIcon
                                                    type={resourceConfig.layoutType}
                                                    isSelected={isSelected}
                                                    isOccupied={isOccupied}
                                                />
                                                <span className={cn(
                                                    "text-[9px] sm:text-[10px] font-black tracking-wider leading-none",
                                                    isSelected
                                                        ? "text-white"
                                                        : isOccupied
                                                            ? "text-slate-400 dark:text-slate-600"
                                                            : "text-slate-700 dark:text-slate-300 group-hover:text-primary"
                                                )}>
                                                    {res.label}
                                                </span>
                                            </div>

                                            {/* Occupied Overlay */}
                                            {isOccupied && (
                                                <div className="absolute inset-0 bg-slate-900/10 dark:bg-black/30 flex items-center justify-center backdrop-blur-[2px]">
                                                    <div className="relative">
                                                        <Circle className="h-8 w-8 text-slate-400/40 dark:text-slate-600/40" />
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="h-0.5 w-5 bg-slate-400 dark:bg-slate-600 rotate-45 rounded-full" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Selection pulse effect */}
                                            {isSelected && (
                                                <motion.div
                                                    className="absolute inset-0 rounded-xl sm:rounded-2xl border-2 border-white/30"
                                                    animate={{
                                                        scale: [1, 1.05, 1],
                                                        opacity: [0.5, 0.8, 0.5],
                                                    }}
                                                    transition={{
                                                        duration: 2,
                                                        repeat: Infinity,
                                                        ease: "easeInOut"
                                                    }}
                                                />
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Legend */}
            <div className="flex justify-center items-center gap-4 sm:gap-8 px-4 sm:px-6 py-4 bg-gradient-to-r from-slate-50/50 via-white/50 to-slate-50/50 dark:from-slate-900/30 dark:via-slate-900/50 dark:to-slate-900/30 rounded-2xl border border-slate-200/50 dark:border-slate-700/30 shadow-lg mx-auto w-fit">
                <div className="flex items-center gap-2.5">
                    <div className="relative">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-white to-slate-100 border-2 border-slate-300 shadow-sm" />
                        <div className="absolute inset-0 rounded-full bg-white/40 blur-sm" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Libre</span>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="relative">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800 shadow-sm" />
                        <div className="absolute inset-0 rounded-full bg-slate-400/20 blur-sm" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Ocupado</span>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="relative">
                        <motion.div
                            className="w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/50"
                            style={primaryColor ? { backgroundColor: primaryColor } : {}}
                            animate={{
                                boxShadow: [
                                    `0 0 8px ${primaryColor || 'rgb(var(--primary))'}40`,
                                    `0 0 12px ${primaryColor || 'rgb(var(--primary))'}60`,
                                    `0 0 8px ${primaryColor || 'rgb(var(--primary))'}40`,
                                ],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                        <div className="absolute inset-0 rounded-full bg-primary/40 blur-sm" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Tu Sitio</span>
                </div>
            </div>
        </motion.div>
    );
};

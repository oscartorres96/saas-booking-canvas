import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Calendar as CalendarIcon,
    Zap,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { availabilityApi } from '@/api/availabilityApi';
import { motion, AnimatePresence } from 'framer-motion';

interface BookingWeekViewProps {
    businessId: string;
    serviceId: string;
    onSlotSelect: (date: string, time: string) => void;
    selectedSlot?: { date: string; time: string };
    horizonDays?: number;
}

export const BookingWeekView: React.FC<BookingWeekViewProps> = ({
    businessId,
    serviceId,
    onSlotSelect,
    selectedSlot,
    horizonDays = 14
}) => {
    const { t } = useTranslation();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [availableData, setAvailableData] = useState<{ date: string; slots: { time: string; isAvailable: boolean }[] }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSlots();
    }, [currentDate, businessId, serviceId]);

    const fetchSlots = async () => {
        setLoading(true);
        try {
            const start = format(currentDate, 'yyyy-MM-dd');
            const end = format(addDays(currentDate, 6), 'yyyy-MM-dd');
            const response = await availabilityApi.getAvailableSlots(businessId, start, end, serviceId);
            setAvailableData(response.data);
        } catch (error) {
            console.error('Error fetching slots:', error);
        } finally {
            setLoading(false);
        }
    };

    const navigate = (days: number) => {
        setCurrentDate(prev => addDays(prev, days));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1 flex items-center gap-2">
                        <Zap className="h-3 w-3 fill-primary" />
                        Agenda rápida
                    </span>
                    <h3 className="text-xl font-black italic tracking-tighter uppercase leading-none">
                        {format(currentDate, 'MMMM yyyy', { locale: es })}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => navigate(-7)} className="rounded-full h-10 w-10 border-2 transition-transform hover:scale-105">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => navigate(7)} className="rounded-full h-10 w-10 border-2 transition-transform hover:scale-105">
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <ScrollArea className="w-full whitespace-nowrap pb-4">
                <div className="flex gap-4 min-p-1">
                    {availableData.map((day, idx) => {
                        const date = new Date(day.date + 'T00:00:00');
                        const isToday = isSameDay(date, new Date());

                        return (
                            <div key={day.date} className="flex-shrink-0 w-[140px] flex flex-col gap-3">
                                <div className={`p-4 rounded-3xl border text-center space-y-1 transition-all flex flex-col items-center justify-center ${isToday ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105' : 'bg-white dark:bg-slate-900'}`}>
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                                        {format(date, 'EEE', { locale: es })}
                                    </span>
                                    <span className="text-2xl font-black italic tracking-tighter leading-none">
                                        {format(date, 'dd')}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <AnimatePresence mode="wait">
                                        {loading ? (
                                            [1, 2, 3].map(i => (
                                                <div key={i} className="h-10 w-full animate-pulse bg-slate-100 dark:bg-slate-800 rounded-2xl" />
                                            ))
                                        ) : day.slots.length > 0 ? (
                                            day.slots.map(slot => {
                                                const isSelected = selectedSlot?.date === day.date && selectedSlot?.time === slot.time;
                                                return (
                                                    <motion.button
                                                        key={slot.time}
                                                        onClick={() => slot.isAvailable && onSlotSelect(day.date, slot.time)}
                                                        whileHover={slot.isAvailable ? { scale: 1.05 } : {}}
                                                        whileTap={slot.isAvailable ? { scale: 0.95 } : {}}
                                                        className={`w-full group relative h-12 flex items-center justify-center rounded-2xl font-bold text-sm transition-all border-2 overflow-hidden
                              ${!slot.isAvailable
                                                                ? 'bg-slate-50 dark:bg-slate-950/20 text-slate-300 dark:text-slate-800 border-transparent cursor-not-allowed line-through'
                                                                : isSelected
                                                                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 z-10'
                                                                    : 'bg-white dark:bg-slate-900 text-foreground border-slate-100 dark:border-slate-800 hover:border-primary/50'
                                                            }
                            `}
                                                    >
                                                        <span className="relative z-10">{slot.time}</span>
                                                        {isSelected && (
                                                            <motion.div
                                                                layoutId="check-icon"
                                                                className="absolute right-2"
                                                            >
                                                                <Check className="h-3 w-3" strokeWidth={4} />
                                                            </motion.div>
                                                        )}
                                                    </motion.button>
                                                );
                                            })
                                        ) : (
                                            <div className="h-12 flex items-center justify-center text-[10px] font-black uppercase tracking-widest opacity-30 italic">
                                                Sin citas
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <ScrollBar orientation="horizontal" className="hidden" />
            </ScrollArea>
        </div>
    );
};

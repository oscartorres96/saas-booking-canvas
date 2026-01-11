import { useState, useEffect } from "react";
import { format, addDays, startOfToday, isSameDay, parseISO } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, Loader2, Calendar as CalendarIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getAvailableSlots } from "@/api/availabilityApi";
import { Slot } from "@/api/businessesApi";
import { useTranslation } from "react-i18next";

interface BookingWeekViewProps {
    businessId: string;
    serviceId: string;
    onSelect: (date: Date, time: string) => void;
    selectedDate?: Date;
    selectedTime?: string;
    weekHorizonDays?: number;
    weekStartType?: 'CURRENT' | 'NEXT';
    primaryColor?: string;
}

export function BookingWeekView({
    businessId,
    serviceId,
    onSelect,
    selectedDate,
    selectedTime,
    weekHorizonDays = 14,
    weekStartType = 'CURRENT',
    primaryColor
}: BookingWeekViewProps) {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [daysData, setDaysData] = useState<Array<{ date: string, slots: Slot[] }>>([]);
    const [startDate, setStartDate] = useState(() => {
        let date = startOfToday();
        if (weekStartType === 'NEXT') {
            // Find next Monday
            const day = date.getDay();
            const diff = (day === 0 ? 1 : 8 - day);
            date = addDays(date, diff);
        }
        return date;
    });

    const locale = i18n.language === 'en' ? enUS : es;

    useEffect(() => {
        loadSlots();
    }, [startDate, serviceId]);

    const loadSlots = async () => {
        setLoading(true);
        try {
            const endDate = addDays(startDate, weekHorizonDays - 1);
            const data = await getAvailableSlots({
                businessId,
                serviceId,
                startDate: format(startDate, 'yyyy-MM-dd'),
                endDate: format(endDate, 'yyyy-MM-dd')
            });
            setDaysData(data);
        } catch (error) {
            console.error("Error loading slots:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrev = () => {
        const newStart = addDays(startDate, -7);
        if (newStart < startOfToday()) {
            setStartDate(startOfToday());
        } else {
            setStartDate(newStart);
        }
    };

    const handleNext = () => setStartDate(addDays(startDate, 7));

    if (loading && daysData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium">{t('common.loading', 'Buscando horarios disponibles...')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePrev}
                        disabled={startDate <= startOfToday()}
                        className="rounded-xl h-10 w-10 border-2"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        <span className="text-xs font-black uppercase italic tracking-tighter">
                            {format(startDate, "d MMM", { locale })} - {format(addDays(startDate, weekHorizonDays - 1), "d MMM", { locale })}
                        </span>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNext}
                        className="rounded-xl h-10 w-10 border-2"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>

                <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <Sparkles className="h-3 w-3 text-primary" />
                    {t('booking.week_view.best_times', 'Tus mejores opciones')}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
                {daysData.map((day) => {
                    const dateObj = parseISO(day.date);
                    const isSelectedDay = selectedDate && isSameDay(dateObj, selectedDate);
                    const availableSlots = day.slots.filter(s => s.isAvailable);

                    return (
                        <div key={day.date} className={cn(
                            "flex flex-col rounded-[1.5rem] border-2 transition-all duration-300 overflow-hidden bg-white dark:bg-slate-900/50",
                            isSelectedDay ? "border-primary ring-2 ring-primary/10 bg-primary/5" : "border-slate-100 dark:border-slate-800/50",
                            availableSlots.length === 0 && "opacity-60 grayscale-[0.5]"
                        )}>
                            {/* Day Header */}
                            <div className={cn(
                                "p-3 text-center border-b-2 flex flex-col items-center",
                                isSelectedDay ? "bg-primary text-white border-primary" : "bg-slate-50 dark:bg-slate-800/80 border-transparent"
                            )}>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-0.5">
                                    {format(dateObj, "EEE", { locale })}
                                </span>
                                <span className="text-lg font-black tracking-tighter uppercase italic leading-none">
                                    {format(dateObj, "d MMM", { locale })}
                                </span>
                            </div>

                            {/* Slots Container */}
                            <div className="p-2 gap-1.5 flex flex-col max-h-[300px] overflow-y-auto premium-scrollbar">
                                {availableSlots.length === 0 ? (
                                    <div className="py-8 flex flex-col items-center justify-center text-center px-4">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                                            <Clock className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Sin Horarios</p>
                                    </div>
                                ) : (
                                    availableSlots.map(slot => {
                                        const isSelected = isSelectedDay && selectedTime === slot.time;
                                        return (
                                            <button
                                                key={slot.time}
                                                onClick={() => onSelect(dateObj, slot.time)}
                                                className={cn(
                                                    "w-full py-2 px-3 rounded-xl text-[11px] font-black uppercase italic tracking-tighter transition-all duration-200 text-center",
                                                    isSelected
                                                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                                                        : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary/50 hover:bg-primary/5"
                                                )}
                                            >
                                                {slot.time}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {loading && daysData.length > 0 && (
                <div className="flex items-center justify-center gap-2 text-primary font-bold animate-pulse text-xs uppercase tracking-widest">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {t('common.updating', 'Actualizando...')}
                </div>
            )}
        </div>
    );
}

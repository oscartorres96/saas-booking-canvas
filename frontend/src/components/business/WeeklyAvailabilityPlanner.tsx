import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { format, startOfWeek, addDays, parse, isBefore, isSameDay } from "date-fns";
import { es, enUS } from "date-fns/locale";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Copy,
    Trash2,
    Plus,
    Clock,
    Ban,
    Save,
    Loader2,
    AlertCircle,
    Info,
    Settings,
    Layout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    getAvailabilityTemplate,
    getWeekOverride,
    updateWeekOverride,
    copyWeekOverride,
    AvailabilityTemplate,
    AvailabilityWeekOverride,
    DayOverride
} from "@/api/availabilityApi";
import {
    AdminLabel,
    InnerCard
} from "@/components/dashboard/DashboardBase";
import { cn } from "@/lib/utils";

interface WeeklyAvailabilityPlannerProps {
    businessId: string;
    entityType?: 'BUSINESS' | 'RESOURCE' | 'PROVIDER';
    entityId?: string;
}

export function WeeklyAvailabilityPlanner({ businessId, entityType = 'BUSINESS', entityId }: WeeklyAvailabilityPlannerProps) {
    const { t, i18n } = useTranslation();
    const [currentWeekDates, setCurrentWeekDates] = useState<Date[]>([]);
    const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [template, setTemplate] = useState<AvailabilityTemplate | null>(null);
    const [override, setOverride] = useState<AvailabilityWeekOverride | null>(null);
    const [localDays, setLocalDays] = useState<DayOverride[]>([]);

    const locale = i18n.language === 'en' ? enUS : es;

    useEffect(() => {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            dates.push(addDays(weekStart, i));
        }
        setCurrentWeekDates(dates);
        loadAvailability(weekStart);
    }, [weekStart]);

    const loadAvailability = async (monday: Date) => {
        setLoading(true);
        try {
            const dateStr = format(monday, 'yyyy-MM-dd');
            const [tmpl, week] = await Promise.all([
                getAvailabilityTemplate(businessId, entityType, entityId),
                getWeekOverride(businessId, dateStr, entityType, entityId)
            ]);

            setTemplate(tmpl);
            setOverride(week);

            // Initialize local state
            const days: DayOverride[] = [];
            for (let i = 0; i < 7; i++) {
                const date = addDays(monday, i);
                const dateStr = format(date, 'yyyy-MM-dd');
                const existing = week?.days.find(d => d.date === dateStr);

                if (existing) {
                    days.push({ ...existing });
                } else {
                    // Fallback to template or closed
                    const dayOfWeek = (date.getDay() + 6) % 7;
                    const rule = tmpl?.weeklyRules.find(r => r.dayOfWeek === dayOfWeek);
                    days.push({
                        date: dateStr,
                        enabled: rule?.enabled ?? false,
                        blocks: rule?.blocks ? rule.blocks.map(b => ({ ...b })) : [],
                        blockedRanges: []
                    });
                }
            }
            setLocalDays(days);
        } catch (error) {
            console.error(error);
            toast.error(t('availability.error_loading', 'Error al cargar disponibilidad'));
        } finally {
            setLoading(false);
        }
    };

    const handleNextWeek = () => setWeekStart(addDays(weekStart, 7));
    const handlePrevWeek = () => setWeekStart(addDays(weekStart, -7));

    const toggleDay = (index: number) => {
        const newDays = [...localDays];
        newDays[index].enabled = !newDays[index].enabled;
        setLocalDays(newDays);
    };

    const addBlock = (dayIndex: number) => {
        const newDays = [...localDays];
        newDays[dayIndex].blocks.push({ start: "09:00", end: "18:00" });
        setLocalDays(newDays);
    };

    const removeBlock = (dayIndex: number, blockIndex: number) => {
        const newDays = [...localDays];
        newDays[dayIndex].blocks.splice(blockIndex, 1);
        setLocalDays(newDays);
    };

    const updateBlock = (dayIndex: number, blockIndex: number, field: 'start' | 'end', value: string) => {
        const newDays = [...localDays];
        newDays[dayIndex].blocks[blockIndex][field] = value;
        setLocalDays(newDays);
    };

    const addBlockedRange = (dayIndex: number) => {
        const newDays = [...localDays];
        newDays[dayIndex].blockedRanges.push({ start: "14:00", end: "15:00" });
        setLocalDays(newDays);
    };

    const removeBlockedRange = (dayIndex: number, rangeIndex: number) => {
        const newDays = [...localDays];
        newDays[dayIndex].blockedRanges.splice(rangeIndex, 1);
        setLocalDays(newDays);
    };

    const updateBlockedRange = (dayIndex: number, rangeIndex: number, field: 'start' | 'end', value: string) => {
        const newDays = [...localDays];
        newDays[dayIndex].blockedRanges[rangeIndex][field] = value;
        setLocalDays(newDays);
    };

    const saveChanges = async () => {
        setSaving(true);
        try {
            await updateWeekOverride({
                businessId,
                entityType,
                entityId,
                weekStartDate: format(weekStart, 'yyyy-MM-dd'),
                days: localDays
            });
            toast.success(t('availability.saved', 'Cambios guardados correctamente'));
        } catch (error) {
            toast.error(t('availability.error_saving', 'Error al guardar cambios'));
        } finally {
            setSaving(false);
        }
    };

    const handleCopyPrevious = async () => {
        const prevMonday = addDays(weekStart, -7);
        const prevMondayStr = format(prevMonday, 'yyyy-MM-dd');
        const currentMondayStr = format(weekStart, 'yyyy-MM-dd');

        const toastId = toast.loading(t('availability.copying', 'Copiando semana anterior...'));
        try {
            await copyWeekOverride({
                businessId,
                fromWeekStartDate: prevMondayStr,
                toWeekStartDate: currentMondayStr,
                entityType,
                entityId
            });
            toast.success(t('availability.copied', 'Copiado exitosamente'), { id: toastId });
            loadAvailability(weekStart);
        } catch (error) {
            toast.error(t('availability.copy_error', 'No se encontró configuración en la semana anterior'), { id: toastId });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium">{t('common.loading')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-none">
                            {format(weekStart, "d 'de' MMMM", { locale })} - {format(addDays(weekStart, 6), "d 'de' MMMM", { locale })}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">{t('availability.planning_desc', 'Planifica tus horarios específicos para esta semana.')}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrevWeek} className="rounded-xl h-10 w-10">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="rounded-xl px-4 h-10">
                        {t('availability.today', 'Hoy')}
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleNextWeek} className="rounded-xl h-10 w-10">
                        <ChevronRight className="h-5 w-5" />
                    </Button>

                    <div className="w-px h-8 bg-border mx-2 hidden md:block" />

                    <Button variant="default" onClick={saveChanges} disabled={saving} className="rounded-xl px-6 h-10 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        {t('common.save')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
                        <Info className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                            {override?.source === 'COPY_PREV' ? t('availability.source_copy', 'Copiado de semana anterior') : (override ? t('availability.source_manual', 'Editado manualmente') : t('availability.source_template', 'Usando plantilla base'))}
                        </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleCopyPrevious} className="text-xs font-semibold text-primary hover:bg-primary/5">
                        <Copy className="h-3.5 w-3.5 mr-2" />
                        {t('availability.copy_prev', 'Copiar de semana anterior')}
                    </Button>
                </div>

                {currentWeekDates.map((date, idx) => {
                    const day = localDays[idx];
                    const isToday = isSameDay(date, new Date());

                    return (
                        <InnerCard key={date.toISOString()} className={cn(
                            "p-0 overflow-hidden transition-all duration-300",
                            !day.enabled && "opacity-70 grayscale-[0.5]",
                            isToday && "ring-2 ring-primary ring-offset-2 dark:ring-offset-black"
                        )}>
                            <div className={cn(
                                "flex flex-col md:flex-row md:items-center p-4 gap-4",
                                day.enabled ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-950"
                            )}>
                                {/* Date Header */}
                                <div className="flex items-center gap-4 min-w-[200px]">
                                    <div className={cn(
                                        "h-12 w-12 rounded-2xl flex flex-col items-center justify-center shrink-0 border",
                                        isToday ? "bg-primary border-primary text-white" : "bg-slate-50 dark:bg-slate-800"
                                    )}>
                                        <span className="text-[10px] font-bold uppercase leading-tight">{format(date, "EEE", { locale })}</span>
                                        <span className="text-lg font-black leading-tight">{format(date, "d")}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-900 dark:text-slate-100">{format(date, "EEEE, d 'de' MMMM", { locale })}</h4>
                                            {isToday && <Badge className="bg-primary hover:bg-primary h-4 px-1.5 text-[8px] font-bold uppercase">Hoy</Badge>}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {day.enabled ? t('availability.open', 'Abierto para reservas') : t('availability.closed', 'Cerrado / Blopeado')}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={day.enabled}
                                        onCheckedChange={() => toggleDay(idx)}
                                        className="data-[state=checked]:bg-green-500"
                                    />
                                </div>

                                <div className="h-px md:h-12 w-full md:w-px bg-slate-100 dark:bg-slate-800" />

                                {/* Intervals / Blocks */}
                                <div className="flex-1 space-y-3">
                                    {!day.enabled ? (
                                        <div className="flex items-center gap-2 text-muted-foreground italic text-sm py-2">
                                            <Ban className="h-4 w-4" />
                                            {t('availability.day_blocked', 'Día bloqueado por completo')}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Disfrutando blocks */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                                        <Clock className="h-3 w-3 text-green-500" />
                                                        {t('availability.opening_hours', 'Horarios de apertura')}
                                                    </span>
                                                    <Button variant="ghost" size="sm" onClick={() => addBlock(idx)} className="h-6 text-[10px] font-bold px-2 py-0 hover:bg-green-50 text-green-600 hover:text-green-700">
                                                        <Plus className="h-3 w-3 mr-1" />
                                                        {t('availability.add_interval', 'Añadir Turno')}
                                                    </Button>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {day.blocks.length === 0 && (
                                                        <p className="text-xs text-amber-600 italic font-medium">{t('availability.no_intervals', 'Sin horarios configurados (estará cerrado)')}</p>
                                                    )}
                                                    {day.blocks.map((block, bIdx) => (
                                                        <div key={bIdx} className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-primary/30">
                                                            <Input
                                                                type="time"
                                                                value={block.start}
                                                                onChange={(e) => updateBlock(idx, bIdx, 'start', e.target.value)}
                                                                className="h-7 w-[95px] text-xs border-none bg-transparent focus-visible:ring-0 p-1 font-bold"
                                                            />
                                                            <span className="text-[10px] font-bold text-slate-400">-{">"}</span>
                                                            <Input
                                                                type="time"
                                                                value={block.end}
                                                                onChange={(e) => updateBlock(idx, bIdx, 'end', e.target.value)}
                                                                className="h-7 w-[95px] text-xs border-none bg-transparent focus-visible:ring-0 p-1 font-bold"
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeBlock(idx, bIdx)}
                                                                className="h-6 w-6 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Blocked Ranges (Exceptions) */}
                                            <div className="space-y-2 pt-2 border-t border-slate-50 dark:border-slate-800">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                                        <Ban className="h-3 w-3 text-red-500" />
                                                        {t('availability.blocked_ranges', 'Excepciones / Bloqueos')}
                                                    </span>
                                                    <Button variant="ghost" size="sm" onClick={() => addBlockedRange(idx)} className="h-6 text-[10px] font-bold px-2 py-0 hover:bg-red-50 text-red-600 hover:text-red-700">
                                                        <Plus className="h-3 w-3 mr-1" />
                                                        {t('availability.add_exception', 'Bloquear Rango')}
                                                    </Button>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {day.blockedRanges.map((range, rIdx) => (
                                                        <div key={rIdx} className="flex items-center gap-1 bg-red-50/50 dark:bg-red-900/10 p-1.5 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm">
                                                            <Input
                                                                type="time"
                                                                value={range.start}
                                                                onChange={(e) => updateBlockedRange(idx, rIdx, 'start', e.target.value)}
                                                                className="h-7 w-[95px] text-xs border-none bg-transparent focus-visible:ring-0 p-1 font-bold text-red-700 dark:text-red-400"
                                                            />
                                                            <span className="text-[10px] font-bold text-red-300">-{">"}</span>
                                                            <Input
                                                                type="time"
                                                                value={range.end}
                                                                onChange={(e) => updateBlockedRange(idx, rIdx, 'end', e.target.value)}
                                                                className="h-7 w-[95px] text-xs border-none bg-transparent focus-visible:ring-0 p-1 font-bold text-red-700 dark:text-red-400"
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeBlockedRange(idx, rIdx)}
                                                                className="h-6 w-6 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-100"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    {day.blockedRanges.length === 0 && (
                                                        <span className="text-[10px] text-slate-400 italic font-medium">{t('availability.no_exceptions', 'Sin bloqueos adicionales')}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </InnerCard>
                    );
                })}
            </div>

            <div className="flex justify-center p-8 border-t border-dashed">
                <Button variant="outline" size="lg" className="rounded-2xl gap-2 h-14 px-8 font-bold border-2" onClick={() => navigateToTemplateEditor()}>
                    <Settings className="h-5 w-5" />
                    {t('availability.edit_base_template', 'Configurar Plantilla Semanal Base')}
                </Button>
            </div>
        </div>
    );

    function navigateToTemplateEditor() {
        // This will open a dialog or navigate to a specialized editor
        toast.info(t('availability.template_coming_soon', 'Función de edición de plantilla próximamente'));
    }
}

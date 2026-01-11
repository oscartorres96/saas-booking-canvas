import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format, addDays, startOfWeek, isSameDay, parse } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    Trash2,
    Copy,
    RotateCcw,
    Save,
    Clock,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { availabilityApi, DayAvailability } from '@/api/availabilityApi';
import { toast } from 'sonner';

interface WeeklyAvailabilityPlannerProps {
    businessId: string;
    businessHours?: any[];
}

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const WeeklyAvailabilityPlanner: React.FC<WeeklyAvailabilityPlannerProps> = ({ businessId, businessHours }) => {
    const { t, i18n } = useTranslation();
    const currentLocale = i18n.language === 'en' ? enUS : es;
    const dateFormat = i18n.language === 'en' ? "MMMM do" : "d 'de' MMMM";
    const dayDateFormat = i18n.language === 'en' ? "MMM do" : "d 'de' MMM";
    const [currentDate, setCurrentDate] = useState(new Date());
    const [weekStartDate, setWeekStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [overrides, setOverrides] = useState<Record<string, DayAvailability>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [mode, setMode] = useState<'template' | 'override'>('override'); // 'template' for base, 'override' for specific weeks

    useEffect(() => {
        if (mode === 'override') {
            loadWeekData();
        } else {
            loadTemplateData();
        }
    }, [weekStartDate, mode]);

    const loadTemplateData = async () => {
        setLoading(true);
        try {
            const templateRes = await availabilityApi.getTemplate(businessId);
            const initialOverrides: Record<string, DayAvailability> = {};
            // Init with empty structure if new
            daysOfWeek.forEach(d => {
                initialOverrides[d] = { enabled: false, intervals: [] };
            });

            if (templateRes.data?.weeklyRules) {
                templateRes.data.weeklyRules.forEach(rule => {
                    if (rule && rule.day) {
                        initialOverrides[rule.day] = {
                            enabled: rule.enabled,
                            intervals: rule.intervals || []
                        };
                    }
                });
            } else if (businessHours) {
                // Fallback to business hours for initial template
                businessHours.forEach((h: any) => {
                    initialOverrides[h.day] = {
                        enabled: h.isOpen,
                        intervals: h.intervals || (h.startTime && h.endTime ? [{ startTime: h.startTime, endTime: h.endTime }] : [])
                    };
                });
            }
            setOverrides(initialOverrides);
        } catch (error) {
            console.error(error);
            toast.error(t('dashboard.availability.toasts.error_load', 'Error al cargar plantilla'));
        } finally {
            setLoading(false);
        }
    };

    const loadWeekData = async () => {
        setLoading(true);
        try {
            const response = await availabilityApi.getOverride(businessId, format(weekStartDate, 'yyyy-MM-dd'));
            if (response.data?.dailyOverrides) {
                setOverrides(response.data.dailyOverrides);
            } else {
                // Load from template as initial state
                const templateRes = await availabilityApi.getTemplate(businessId);
                if (templateRes.data?.weeklyRules) {
                    const initialOverrides: Record<string, DayAvailability> = {};
                    templateRes.data.weeklyRules.forEach(rule => {
                        if (rule && rule.day) {
                            initialOverrides[rule.day] = {
                                enabled: rule.enabled ?? false,
                                intervals: rule.intervals ?? []
                            };
                        }
                    });
                    setOverrides(initialOverrides);
                } else if (businessHours && businessHours.length > 0) {
                    // Fallback to legacy business hours
                    const initialOverrides: Record<string, DayAvailability> = {};
                    daysOfWeek.forEach(day => {
                        const legacyDay = businessHours.find(h => h.day?.toLowerCase() === day);
                        if (legacyDay) {
                            initialOverrides[day] = {
                                enabled: legacyDay.isOpen ?? false,
                                intervals: legacyDay.intervals || (legacyDay.startTime && legacyDay.endTime ? [{ startTime: legacyDay.startTime, endTime: legacyDay.endTime }] : [])
                            };
                        } else {
                            initialOverrides[day] = { enabled: false, intervals: [] };
                        }
                    });
                    setOverrides(initialOverrides);
                } else {
                    // Empty state
                    const empty: Record<string, DayAvailability> = {};
                    daysOfWeek.forEach(d => empty[d] = { enabled: false, intervals: [] });
                    setOverrides(empty);
                }
            }
        } catch (error) {
            console.error('Error loading availability:', error);
            toast.error('Error al cargar la disponibilidad');
        } finally {
            setLoading(false);
        }
    };

    const handleDayToggle = (day: string, enabled: boolean) => {
        setOverrides(prev => {
            const currentDay = prev[day] || { enabled: false, intervals: [] };
            return {
                ...prev,
                [day]: {
                    ...currentDay,
                    enabled,
                    intervals: currentDay.intervals.length > 0 ? currentDay.intervals : [{ startTime: '09:00', endTime: '17:00' }]
                }
            };
        });
    };

    const addInterval = (day: string) => {
        setOverrides(prev => {
            const currentDay = prev[day] || { enabled: true, intervals: [] };
            return {
                ...prev,
                [day]: {
                    ...currentDay,
                    intervals: [...currentDay.intervals, { startTime: '09:00', endTime: '17:00' }]
                }
            };
        });
    };

    const removeInterval = (day: string, index: number) => {
        setOverrides(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                intervals: prev[day].intervals.filter((_, i) => i !== index)
            }
        }));
    };

    const updateInterval = (day: string, index: number, field: 'startTime' | 'endTime', value: string) => {
        setOverrides(prev => {
            const currentDay = prev[day];
            if (!currentDay) return prev;

            const newIntervals = [...currentDay.intervals];
            if (!newIntervals[index]) return prev;

            newIntervals[index] = { ...newIntervals[index], [field]: value };
            return {
                ...prev,
                [day]: { ...currentDay, intervals: newIntervals }
            };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (mode === 'override') {
                await availabilityApi.upsertOverride(businessId, format(weekStartDate, 'yyyy-MM-dd'), { dailyOverrides: overrides });
                toast.success(t('dashboard.availability.toasts.saved', 'Disponibilidad guardada correctamente'));
            } else {
                // Convert override map back to array for template
                const weeklyRules = Object.entries(overrides).map(([day, data]) => ({
                    day,
                    enabled: data.enabled,
                    intervals: data.intervals
                }));
                await availabilityApi.upsertTemplate(businessId, { weeklyRules });
                toast.success(t('dashboard.availability.toasts.template_saved', 'Plantilla base guardada'));
            }
        } catch (error) {
            toast.error(t('dashboard.availability.toasts.error', 'Error al guardar la disponibilidad'));
        } finally {
            setSaving(false);
        }
    };

    const navigateWeek = (direction: number) => {
        setWeekStartDate(prev => addDays(prev, direction * 7));
    };

    const copyPrevious = async () => {
        try {
            const res = await availabilityApi.copyPreviousWeek(businessId, format(weekStartDate, 'yyyy-MM-dd'));
            if (res.data) {
                setOverrides(res.data.dailyOverrides);
                toast.success(t('dashboard.availability.toasts.week_copied', 'Semana anterior copiada'));
            } else {
                toast.info(t('dashboard.availability.toasts.no_previous_data', 'No hay datos de la semana anterior'));
            }
        } catch (error) {
            toast.error(t('dashboard.availability.toasts.copy_error', 'Error al copiar semana'));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-4">
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-full w-fit">
                    <button
                        onClick={() => setMode('override')}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${mode === 'override' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {t('dashboard.availability.planner_tab', 'Planificador Semanal')}
                    </button>
                    <button
                        onClick={() => setMode('template')}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${mode === 'template' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {t('dashboard.availability.template_tab', 'Horario Base')}
                    </button>
                </div>

                {mode === 'override' ? (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border shadow-sm animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)} className="rounded-full">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex flex-col items-center min-w-[200px]">
                                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">{t('dashboard.availability.week_of', 'Semana del')}</span>
                                <span className="text-lg font-black italic tracking-tighter uppercase">
                                    {format(weekStartDate, dateFormat, { locale: currentLocale })}
                                </span>
                            </div>
                            <Button variant="outline" size="icon" onClick={() => navigateWeek(1)} className="rounded-full">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setWeekStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="text-xs font-bold rounded-full">
                                {t('common.today', 'Hoy')}
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={copyPrevious} className="rounded-full font-bold gap-2">
                                <Copy className="h-3.5 w-3.5" />
                                {t('dashboard.availability.copy_previous', 'Copiar anterior')}
                            </Button>
                            <Button onClick={handleSave} disabled={saving} className="rounded-full font-bold gap-2 bg-primary px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                                <Save className="h-4 w-4" />
                                {saving ? t('common.saving', 'Guardando...') : t('dashboard.availability.save', 'Guardar Agenda')}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border shadow-sm animate-in fade-in slide-in-from-top-4">
                        <div className="flex flex-col">
                            <h3 className="text-lg font-black italic tracking-tighter uppercase">{t('dashboard.availability.template_title', 'Horario Base')}</h3>
                            <p className="text-sm text-muted-foreground">{t('dashboard.availability.template_desc', 'Este horario se aplicará automáticamente a todas las semanas futuras.')}</p>
                        </div>
                        <Button onClick={handleSave} disabled={saving} className="rounded-full font-bold gap-2 bg-primary px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                            <Save className="h-4 w-4" />
                            {saving ? t('common.saving', 'Guardando...') : t('dashboard.availability.save_template', 'Guardar Base')}
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4">
                {daysOfWeek.map((dayKey, index) => {
                    const dateForThisDay = addDays(weekStartDate, index);
                    // Only show date if in override mode
                    const dateString = mode === 'override' ? format(dateForThisDay, dayDateFormat, { locale: currentLocale }) : '';
                    const dayData = overrides[dayKey] || { enabled: false, intervals: [] };

                    return (
                        <Card key={dayKey} className={`rounded-[2rem] overflow-hidden border transition-all duration-300 ${dayData.enabled ? 'border-primary/20 shadow-md ring-1 ring-primary/5' : 'opacity-60 grayscale-[0.5]'}`}>
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center gap-6">
                                    <div className="flex items-center gap-4 min-w-[180px]">
                                        <Switch
                                            checked={dayData.enabled}
                                            onCheckedChange={(val) => handleDayToggle(dayKey, val)}
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-black italic uppercase tracking-tighter text-lg">
                                                {t(`days.${dayKey}`)}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] flex items-center gap-1.5">
                                                {mode === 'override' && <CalendarIcon className="h-2.5 w-2.5" />}
                                                {dateString}
                                            </span>
                                        </div>
                                    </div>

                                    {dayData.enabled ? (
                                        <div className="flex-1 space-y-3">
                                            {dayData.intervals.length > 0 ? (
                                                dayData.intervals.map((interval, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 group">
                                                        <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border transition-colors hover:border-primary/30">
                                                            <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                                                            <Input
                                                                type="time"
                                                                value={interval.startTime}
                                                                onChange={(e) => updateInterval(dayKey, idx, 'startTime', e.target.value)}
                                                                className="border-none bg-transparent h-8 focus-visible:ring-0 text-sm font-bold p-0"
                                                            />
                                                            <span className="text-muted-foreground font-black text-[10px] uppercase">{t('common.to', 'a')}</span>
                                                            <Input
                                                                type="time"
                                                                value={interval.endTime}
                                                                onChange={(e) => updateInterval(dayKey, idx, 'endTime', e.target.value)}
                                                                className="border-none bg-transparent h-8 focus-visible:ring-0 text-sm font-bold p-0"
                                                            />
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeInterval(dayKey, idx)}
                                                            className="rounded-xl hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/5 text-amber-600 border border-amber-500/10">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <span className="text-xs font-bold">{t('dashboard.availability.no_intervals', 'No hay horarios definidos')}</span>
                                                </div>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => addInterval(dayKey)}
                                                className="text-primary font-black uppercase italic tracking-tighter text-[10px] hover:bg-primary/5 rounded-xl gap-2 h-8"
                                            >
                                                <Plus className="h-3 w-3" />
                                                {t('settings.hours.add_interval', 'Agregar intervalo')}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex items-center h-12 text-muted-foreground font-black italic uppercase tracking-tighter text-sm">
                                            {t('common.closed', 'Cerrado')}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

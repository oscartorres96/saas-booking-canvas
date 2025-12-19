import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, ChevronLeft, ChevronRight, Sparkles, MapPin, Zap, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface BookingCalendarProps {
  primaryColor?: string;
  selectedDate: string | null;
  setSelectedDate: (date: string | null) => void;
  selectedTime: string | null;
  setSelectedTime: (time: string | null) => void;
  isEnabled?: boolean;
}

export const BookingCalendar = ({
  primaryColor,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  isEnabled = true
}: BookingCalendarProps) => {
  const { t, i18n } = useTranslation();

  // Mock dates for the next 7 days
  const mockDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    return {
      day: date.toLocaleDateString(i18n.language, { weekday: 'short' }),
      dayFull: date.toLocaleDateString(i18n.language, { weekday: 'long' }),
      date: date.getDate(),
      month: date.toLocaleDateString(i18n.language, { month: 'short' }),
      fullDate: `${year}-${month}-${dayStr}`
    };
  });

  // Mock available hours
  const mockHours = [
    { time: "07:00", available: true, label: "Sesión AM" },
    { time: "08:00", available: true, label: "Morning Flow" },
    { time: "09:00", available: true, label: "Power Workout" },
    { time: "10:00", available: true, label: "Intensity" },
    { time: "17:00", available: true, label: "After Work" },
    { time: "18:00", available: true, label: "Evening Hit" },
    { time: "19:00", available: true, label: "Night Ride" },
    { time: "20:00", available: false, label: "Late Session" }
  ];

  return (
    <section id="reservar" className="py-24 md:py-32 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {!isEnabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto text-center mb-12 p-8 rounded-[2rem] bg-white dark:bg-slate-900 shadow-2xl shadow-primary/5 border border-primary/10"
          >
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xl font-black uppercase italic tracking-tighter dark:text-white mb-2">
              Tú eliges el reto, nosotros el espacio
            </p>
            <p className="text-sm text-muted-foreground font-medium">
              Selecciona un servicio arriba para desbloquear los horarios disponibles.
            </p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-4 mb-20"
        >
          <div className="flex flex-col items-center gap-3 mb-6">
            <span className="text-[12px] font-black tracking-[0.4em] text-primary uppercase italic">
              Paso 02
            </span>
            <div className="h-1 w-12 bg-primary/20 rounded-full" />
          </div>

          <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase italic leading-[0.9] dark:text-white">
            Define tu <br />
            <span className="text-slate-200 dark:text-slate-800 outline-text">Momento</span>
          </h2>
        </motion.div>

        <div className={cn(
          "grid lg:grid-cols-12 gap-12 max-w-7xl mx-auto transition-all duration-700",
          !isEnabled && "opacity-20 blur-sm pointer-events-none grayscale"
        )}>
          {/* Date Selection - Horizontal Slider Style */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-black uppercase italic tracking-tight dark:text-white">Calendario</h3>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-4 gap-3">
                {mockDates.map((day, index) => (
                  <motion.button
                    key={day.fullDate}
                    onClick={() => {
                      setSelectedDate(day.fullDate);
                      setSelectedTime(null);
                    }}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-500 border-2",
                      selectedDate === day.fullDate
                        ? 'bg-primary border-primary text-white shadow-2xl shadow-primary/30'
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary/50'
                    )}
                    style={selectedDate === day.fullDate && primaryColor
                      ? { backgroundColor: primaryColor, borderColor: primaryColor }
                      : {}
                    }
                  >
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest leading-none mb-2",
                      selectedDate === day.fullDate ? 'text-white/80' : 'text-muted-foreground'
                    )}>
                      {day.day}
                    </span>
                    <span className="text-2xl font-black italic tracking-tighter leading-none">{day.date}</span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase mt-1",
                      selectedDate === day.fullDate ? 'text-white/80' : 'text-muted-foreground/60'
                    )}>
                      {day.month}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-primary via-primary/80 to-primary/60 text-white shadow-2xl shadow-primary/20 relative overflow-hidden hidden lg:block">
              <Zap className="absolute -bottom-4 -right-4 h-32 w-32 text-white/10 rotate-12" />
              <h4 className="text-2xl font-black uppercase italic leading-tight mb-4">
                ¿Sabías que entrenar <br /> por la mañana mejora <br /> tu metabolismo?
              </h4>
              <p className="text-xs font-medium text-white/80 leading-relaxed uppercase tracking-wider">
                Consistencia es la clave del éxito. <br /> Reserva tus sesiones de la semana hoy.
              </p>
            </div>
          </div>

          {/* Time Selection - High Contrast List */}
          <div className="lg:col-span-7 space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-black uppercase italic tracking-tight dark:text-white">Horarios</h3>
              </div>
              {selectedDate && (
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1 rounded-full">
                  {mockDates.find(d => d.fullDate === selectedDate)?.dayFull}
                </span>
              )}
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {selectedDate ? (
                  mockHours.map((slot, index) => {
                    const isSelected = selectedTime === slot.time;
                    const isAvailable = slot.available;

                    return (
                      <motion.button
                        key={slot.time}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => isAvailable && setSelectedTime(slot.time)}
                        disabled={!isAvailable}
                        className={cn(
                          "w-full group relative flex items-center justify-between p-6 rounded-2xl transition-all duration-500 border-2 overflow-hidden",
                          isSelected && isAvailable
                            ? "bg-slate-900 dark:bg-white border-primary shadow-2xl"
                            : isAvailable
                              ? "bg-white dark:bg-slate-900 border-transparent hover:border-primary/30"
                              : "bg-slate-100 dark:bg-slate-900/50 border-transparent opacity-40 grayscale pointer-events-none"
                        )}
                      >
                        <div className="flex items-center gap-6 relative z-10">
                          <div className={cn(
                            "flex flex-col items-center justify-center w-20 h-20 rounded-xl transition-colors duration-500",
                            isSelected
                              ? "bg-primary text-white"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white group-hover:bg-primary/10 group-hover:text-primary"
                          )}>
                            <span className="text-xl font-black italic tracking-tighter leading-none">{slot.time}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest mt-1">PM</span>
                          </div>
                          <div className="text-left">
                            <h4 className={cn(
                              "text-lg font-black uppercase italic tracking-tight leading-none mb-1",
                              isSelected ? "text-white dark:text-slate-900" : "dark:text-white"
                            )}>{slot.label}</h4>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Main Studio</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end relative z-10">
                          {isAvailable ? (
                            isSelected ? (
                              <Check className="h-6 w-6 text-primary" strokeWidth={4} />
                            ) : (
                              <div className="h-10 w-10 rounded-full border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center group-hover:border-primary group-hover:bg-primary transition-all duration-500">
                                <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-white" />
                              </div>
                            )
                          ) : (
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sold Out</span>
                          )}
                        </div>

                        {/* Hover Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                      </motion.button>
                    );
                  })
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800"
                  >
                    <Calendar className="h-16 w-16 mx-auto mb-6 text-slate-200 dark:text-slate-800" />
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] italic text-sm">
                      Selecciona una fecha <br /> para ver horarios
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .outline-text {
            -webkit-text-stroke: 1px currentColor;
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.05);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: var(--primary);
            border-radius: 10px;
        }
      `}} />
    </section>
  );
};

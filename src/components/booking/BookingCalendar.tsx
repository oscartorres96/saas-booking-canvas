import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface BookingCalendarProps {
  primaryColor?: string;
  selectedDate: string | null;
  setSelectedDate: (date: string | null) => void;
  selectedTime: string | null;
  setSelectedTime: (time: string | null) => void;
}

export const BookingCalendar = ({
  primaryColor,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime
}: BookingCalendarProps) => {

  // Mock dates for the next 7 days
  const mockDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    return {
      day: date.toLocaleDateString('es-ES', { weekday: 'short' }),
      date: date.getDate(),
      fullDate: `${year}-${month}-${dayStr}`
    };
  });

  // Mock available hours
  const mockHours = [
    "09:00", "10:00", "11:00", "12:00",
    "14:00", "15:00", "16:00", "17:00", "18:00"
  ];

  return (
    <section id="reservar" className="py-20 md:py-28 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            Selecciona Fecha y Hora
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Elige el día y horario que mejor se adapte a tu agenda
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Date Selection */}
          <Card className="shadow-elevated">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Selecciona un día
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Horarios disponibles actualizados en tiempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {mockDates.map((day) => (
                  <button
                    key={day.fullDate}
                    onClick={() => setSelectedDate(day.fullDate)}
                    className={`
                      flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl border-2 transition-all
                      ${selectedDate === day.fullDate
                        ? 'border-primary bg-primary text-primary-foreground shadow-md scale-105'
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                      }
                    `}
                    style={selectedDate === day.fullDate && primaryColor
                      ? { backgroundColor: primaryColor, borderColor: primaryColor }
                      : {}
                    }
                  >
                    <span className="text-[10px] sm:text-xs font-medium opacity-70">{day.day}</span>
                    <span className="text-base sm:text-lg font-bold">{day.date}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Time Selection */}
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle className="text-xl">Horarios disponibles</CardTitle>
              <CardDescription>
                {selectedDate
                  ? `Horarios para el ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`
                  : 'Selecciona primero una fecha'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                <div className="grid grid-cols-3 gap-3">
                  {mockHours.map((hour) => (
                    <button
                      key={hour}
                      onClick={() => setSelectedTime(hour)}
                      className={`
                        py-3 px-4 rounded-lg border-2 font-medium transition-all text-sm
                        ${selectedTime === hour
                          ? 'border-primary bg-primary text-primary-foreground shadow-md'
                          : 'border-border hover:border-primary/50 hover:bg-accent'
                        }
                      `}
                      style={selectedTime === hour && primaryColor
                        ? { backgroundColor: primaryColor, borderColor: primaryColor }
                        : {}
                      }
                    >
                      {hour}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecciona una fecha para ver los horarios disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

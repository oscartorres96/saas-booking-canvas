import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

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
            {t('booking.calendar.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('booking.calendar.subtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Date Selection */}
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t('booking.calendar.date_title')}
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                {t('booking.calendar.date_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {mockDates.map((day) => (
                  <button
                    key={day.fullDate}
                    onClick={() => setSelectedDate(day.fullDate)}
                    className={`
                      flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 active:scale-95
                      ${selectedDate === day.fullDate
                        ? 'bg-primary text-primary-foreground shadow-md scale-105'
                        : 'bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700'
                      }
                    `}
                    style={selectedDate === day.fullDate && primaryColor
                      ? { backgroundColor: primaryColor }
                      : {}
                    }
                  >
                    <span className="text-xs font-medium opacity-80">{day.day}</span>
                    <span className="text-lg font-semibold">{day.date}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Time Selection */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">{t('booking.calendar.time_title')}</CardTitle>
              <CardDescription>
                {selectedDate
                  ? t('booking.calendar.time_desc_selected', { date: new Date(selectedDate + 'T00:00:00').toLocaleDateString(i18n.language, { day: 'numeric', month: 'long' }) })
                  : t('booking.calendar.time_desc_empty')
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                <div className="grid grid-cols-3 gap-2.5">
                  {mockHours.map((hour) => (
                    <button
                      key={hour}
                      onClick={() => setSelectedTime(hour)}
                      className={`
                        py-3 px-4 rounded-2xl font-semibold transition-all duration-200 text-sm active:scale-95
                        ${selectedTime === hour
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700'
                        }
                      `}
                      style={selectedTime === hour && primaryColor
                        ? { backgroundColor: primaryColor }
                        : {}
                      }
                    >
                      {hour}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-40" />
                  <p>{t('booking.calendar.empty_state')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

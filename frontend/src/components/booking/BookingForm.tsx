import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { createBooking } from "@/api/bookingsApi";

interface BookingFormProps {
  primaryColor?: string;
  selectedDate: string | null;
  selectedTime: string | null;
  businessName: string;
  businessId?: string;
  services?: Array<{ id: string; name: string; }>;
}

export const BookingForm = ({ primaryColor, selectedDate, selectedTime, businessName, businessId, services }: BookingFormProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    serviceId: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      toast({
        title: t('booking.form.warnings.select_date_time'),
        description: t('booking.form.warnings.select_date_time_desc'),
        variant: "destructive",
      });
      return;
    }

    // Basic validation
    if (!formData.name || !formData.phone || !formData.email) {
      toast({
        title: t('booking.form.warnings.incomplete_fields'),
        description: t('booking.form.warnings.incomplete_fields_desc'),
        variant: "destructive",
      });
      return;
    }

    if (services && services.length > 0 && !formData.serviceId) {
      toast({
        title: t('booking.form.warnings.select_service'),
        description: t('booking.form.warnings.select_service_desc'),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Create booking in database
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}`);
      const selectedService = services?.find(s => s.id === formData.serviceId);

      const booking = await createBooking({
        clientName: formData.name,
        clientEmail: formData.email,
        clientPhone: formData.phone,
        businessId: businessId || "default-business-id",
        serviceId: formData.serviceId || "general",
        serviceName: selectedService?.name || "Servicio General",
        scheduledAt: scheduledAt.toISOString(),
        status: "pending"
      });

      setAccessCode(booking.accessCode || "");

      // Create Google Calendar Event URL
      const startTime = scheduledAt;
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

      const formatGoogleDate = (date: Date) => {
        return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
      };

      const eventTitle = `Cita en ${businessName}`;
      const eventDetails = `Cita reservada con ${formData.name}. Tel: ${formData.phone}, Email: ${formData.email}`;
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${formatGoogleDate(startTime)}/${formatGoogleDate(endTime)}&details=${encodeURIComponent(eventDetails)}`;

      // Open Google Calendar in new tab
      window.open(googleCalendarUrl, '_blank');

      toast({
        title: t('booking.form.toasts.confirmed_title'),
        description: t('booking.form.toasts.confirmed_desc'),
      });

      // Redirect to My Bookings after a short delay
      setTimeout(() => {
        navigate(`/my-bookings?email=${encodeURIComponent(formData.email)}&code=${encodeURIComponent(booking.accessCode || "")}`);
      }, 2000);

    } catch (error) {
      console.error("Error creating booking:", error);
      toast({
        title: t('booking.form.toasts.error_title'),
        description: t('booking.form.toasts.error_desc'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-6">
              <div
                className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center"
                style={primaryColor ? { backgroundColor: `${primaryColor}15` } : {}}
              >
                <CheckCircle2
                  className="h-7 w-7 text-primary"
                  style={primaryColor ? { color: primaryColor } : {}}
                />
              </div>
              <CardTitle className="text-2xl">{t('booking.form.title')}</CardTitle>
              <CardDescription className="text-base">
                {t('booking.form.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accessCode ? (
                <div className="text-center space-y-6 py-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">{t('booking.form.confirmation_title')}</h3>
                    <p className="text-muted-foreground">{t('booking.form.confirmation_desc')}</p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-xl">
                    <p className="text-sm text-muted-foreground mb-2">{t('booking.form.save_code')}</p>
                    <p className="text-4xl font-bold text-primary" style={primaryColor ? { color: primaryColor } : {}}>{accessCode}</p>
                    <p className="text-xs text-muted-foreground mt-4">{t('booking.form.need_code')}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">{t('booking.form.check_booking')}</p>
                    <a href="/my-bookings" className="text-primary hover:underline" style={primaryColor ? { color: primaryColor } : {}}>
                      /my-bookings
                    </a>
                  </div>
                  <Button
                    onClick={() => {
                      setAccessCode(null);
                      setFormData({ name: "", phone: "", email: "", serviceId: "" });
                    }}
                    variant="outline"
                  >
                    {t('booking.form.new_booking')}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">{t('booking.form.name_label')}</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder={t('booking.form.name_placeholder')}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">{t('booking.form.phone_label')}</Label>
                    <PhoneInput
                      country="mx"
                      enableSearch
                      countryCodeEditable={false}
                      value={formData.phone}
                      onChange={(_, __, ___, formattedValue) =>
                        setFormData({ ...formData, phone: formattedValue || "" })
                      }
                      placeholder="+52 55 1234 5678"
                      inputProps={{
                        id: "phone",
                        name: "phone",
                        required: true,
                      }}
                      containerClass="w-full"
                      inputClass="!w-full !h-11 !text-base !bg-gray-100 dark:!bg-zinc-800 !border-0 !rounded-r-xl !rounded-l-none !pl-14 !placeholder:text-muted-foreground focus:!ring-2 focus:!ring-primary/50 focus:!outline-none focus:!bg-white dark:focus:!bg-zinc-900"
                      buttonClass="!h-11 !bg-gray-100 dark:!bg-zinc-800 !border-0 !rounded-l-xl !rounded-r-none !px-3"
                      dropdownClass="!bg-popover !text-foreground !shadow-lg !border !rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">{t('booking.form.email_label')}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('booking.form.email_placeholder')}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  {services && services.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="service" className="text-sm font-medium">{t('booking.form.service_label')}</Label>
                      <select
                        id="service"
                        value={formData.serviceId}
                        onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                        className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        required
                      >
                        <option value="">{t('booking.form.service_placeholder')}</option>
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full font-semibold shadow-md mt-6"
                    style={primaryColor ? { backgroundColor: primaryColor } : {}}
                    disabled={isLoading}
                  >
                    {isLoading ? t('booking.form.btn_processing') : t('booking.form.btn_confirm')}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center pt-1">
                    {t('booking.form.privacy_notice')}
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

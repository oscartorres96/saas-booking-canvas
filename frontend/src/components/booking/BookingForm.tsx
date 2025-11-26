import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

interface BookingFormProps {
  primaryColor?: string;
  selectedDate: string | null;
  selectedTime: string | null;
  businessName: string;
}

export const BookingForm = ({ primaryColor, selectedDate, selectedTime, businessName }: BookingFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      toast({
        title: "Selecciona fecha y hora",
        description: "Por favor selecciona una fecha y hora en el calendario antes de continuar",
        variant: "destructive",
      });
      return;
    }

    // Basic validation
    if (!formData.name || !formData.phone || !formData.email) {
      toast({
        title: "Campos incompletos",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    // Create Google Calendar Event URL
    const startTime = new Date(`${selectedDate}T${selectedTime}`);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    const formatGoogleDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    };

    const eventTitle = `Cita en ${businessName}`;
    const eventDetails = `Cita reservada con ${formData.name}. Tel: ${formData.phone}, Email: ${formData.email}`;
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${formatGoogleDate(startTime)}/${formatGoogleDate(endTime)}&details=${encodeURIComponent(eventDetails)}`;

    // Open Google Calendar in new tab
    window.open(googleCalendarUrl, '_blank');

    toast({
      title: "Reserva confirmada",
      description: "Se ha abierto tu calendario para agendar la cita. Recibirás un correo de confirmación en breve.",
    });

    // Reset form
    setFormData({ name: "", phone: "", email: "" });
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
              <CardTitle className="text-2xl">Confirma tu reserva</CardTitle>
              <CardDescription className="text-base">
                Completa tus datos para confirmar la cita
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Nombre completo</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Juan Perez"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Telefono</Label>
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
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="juan@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-semibold shadow-md mt-6"
                  style={primaryColor ? { backgroundColor: primaryColor } : {}}
                >
                  Confirmar reserva
                </Button>

                <p className="text-xs text-muted-foreground text-center pt-1">
                  Al confirmar, aceptas recibir notificaciones sobre tu reserva
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

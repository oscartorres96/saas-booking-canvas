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
}

export const BookingForm = ({ primaryColor }: BookingFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name || !formData.phone || !formData.email) {
      toast({
        title: "Campos incompletos",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Reserva confirmada",
      description: "Recibiras un correo de confirmacion en breve",
    });

    // Reset form
    setFormData({ name: "", phone: "", email: "" });
  };

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-elevated border-2">
            <CardHeader className="text-center pb-8">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center"
                style={primaryColor ? { backgroundColor: `${primaryColor}20` } : {}}
              >
                <CheckCircle2
                  className="h-8 w-8 text-primary"
                  style={primaryColor ? { color: primaryColor } : {}}
                />
              </div>
              <CardTitle className="text-3xl">Confirma tu reserva</CardTitle>
              <CardDescription className="text-base">
                Completa tus datos para confirmar la cita
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base">Nombre completo</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Juan Perez"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-12 text-base"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-base">Telefono</Label>
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
                    inputClass="!w-full !h-12 !text-base !bg-background !border !border-input !rounded-r-md !rounded-l-none !pl-14 !placeholder:text-muted-foreground focus:!border-ring focus:!shadow-[0_0_0_1px] focus:!shadow-ring focus:!outline-none"
                    buttonClass="!h-12 !bg-muted/40 !border !border-input !border-r-0 !rounded-l-md !rounded-r-none !px-3 focus:!border-ring focus:!shadow-[0_0_0_1px] focus:!shadow-ring"
                    dropdownClass="!bg-popover !text-foreground !shadow-lg !border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="juan@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-12 text-base"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-14 text-base font-semibold shadow-elevated"
                  style={primaryColor ? { backgroundColor: primaryColor } : {}}
                >
                  Confirmar reserva
                </Button>

                <p className="text-xs text-muted-foreground text-center pt-2">
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

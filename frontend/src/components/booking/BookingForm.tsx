import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { createBooking, confirmTransfer } from "@/api/bookingsApi";
import { createBookingCheckout } from "@/api/stripeApi";
import { ResourceSelector } from "./ResourceSelector";
import { getActiveAssets, CustomerAsset } from "@/api/customerAssetsApi";

interface BookingFormProps {
  primaryColor?: string;
  selectedDate: string | null;
  selectedTime: string | null;
  businessName: string;
  businessId?: string;
  services?: Array<{ id: string; name: string; price?: string; requirePayment?: boolean; requireResource?: boolean; requireProduct?: boolean; }>;
  paymentConfig?: {
    method: string;
    bank?: string;
    clabe?: string;
    holderName?: string;
    instructions?: string;
  };
  paymentModel?: 'INTERMEDIATED' | 'STRIPE_CONNECT';
}

export const BookingForm = ({ primaryColor, selectedDate, selectedTime, businessName, businessId, services, paymentConfig, paymentModel }: BookingFormProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    serviceId: ""
  });
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [availableAssets, setAvailableAssets] = useState<CustomerAsset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isCheckingAssets, setIsCheckingAssets] = useState(false);

  const selectedService = services?.find(s => s.id === formData.serviceId);

  // Fetch assets when email or service changes
  React.useEffect(() => {
    const fetchAssets = async () => {
      if (formData.email && formData.serviceId && businessId) {
        setIsCheckingAssets(true);
        try {
          const assets = await getActiveAssets({
            businessId,
            email: formData.email,
            serviceId: formData.serviceId,
          });
          setAvailableAssets(assets);
          // Preseleccionar el activo más cercano a vencer (best UX)
          if (assets.length > 0) {
            const sortedByExpiry = [...assets].sort((a, b) => {
              if (!a.expiresAt) return 1;
              if (!b.expiresAt) return -1;
              return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
            });
            setSelectedAssetId(sortedByExpiry[0]._id);
          } else {
            setSelectedAssetId(null);
          }
        } catch (error) {
          console.error("Error fetching assets", error);
        } finally {
          setIsCheckingAssets(false);
        }
      }
    };

    // Debounce or wait for full email
    if (formData.email.includes("@") && formData.email.includes(".")) {
      fetchAssets();
    } else {
      setAvailableAssets([]);
      setSelectedAssetId(null);
    }
  }, [formData.email, formData.serviceId, businessId]);

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

    if (selectedService?.requireResource && !selectedResourceId) {
      toast({
        title: "Selecciona un recurso",
        description: "Por favor selecciona un lugar disponible en el mapa.",
        variant: "destructive",
      });
      return;
    }

    if (selectedService?.requireProduct && !selectedAssetId) {
      toast({
        title: t('booking.assets.required_title'),
        description: t('booking.assets.required_message'),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const scheduledAt = new Date(`${selectedDate}T${selectedTime}`);
      const selectedService = services?.find(s => s.id === formData.serviceId);

      const booking = await createBooking({
        clientName: formData.name,
        clientEmail: formData.email,
        clientPhone: formData.phone,
        businessId: businessId || "default-business-id",
        serviceId: formData.serviceId,
        serviceName: selectedService?.name,
        scheduledAt: scheduledAt.toISOString(),
        resourceId: selectedResourceId || undefined,
        assetId: selectedAssetId || undefined,
        status: "pending"
      });

      setAccessCode(booking.accessCode || "");
      setCreatedBookingId(booking._id);

      // If paid via asset, we are done
      if (selectedAssetId) {
        toast({
          title: t('booking.form.confirmation_title'),
          description: t('booking.assets.confirmation_asset_used'),
          variant: "default",
        });
        setIsLoading(false);
        return;
      }

      const requiresDirectPayment = selectedService?.requirePayment;
      if (requiresDirectPayment) {
        // If bank transfer is configured, show bank info
        if (paymentConfig?.method === 'bank_transfer') {
          setShowPaymentInfo(true);
          return;
        }

        // If online payment is configured (Hybrid model)
        if (paymentModel && booking._id) {
          try {
            // Extract numeric amount from price string (e.g., "$800 MXN" -> 800)
            const numericAmount = parseInt(selectedService?.price?.replace(/[^0-9]/g, '') || "0");

            if (numericAmount > 0) {
              const checkoutData = await createBookingCheckout({
                bookingId: booking._id,
                businessId: businessId || "",
                amount: numericAmount * 100,
                serviceName: selectedService?.name || "Service",
                successUrl: `${window.location.origin}/payment-success?bookingId=${booking._id}&type=booking`,
                cancelUrl: `${window.location.origin}/payment-cancel?type=booking`,
              });

              if (checkoutData?.data?.url) {
                window.location.href = checkoutData.data.url;
                return;
              }
            }
          } catch (stripeError) {
            console.error("Error creating stripe checkout:", stripeError);
            toast({
              title: t('booking.payment.stripe_error_title', 'Error al iniciar pago'),
              description: t('booking.payment.stripe_error_desc', 'No pudimos conectar con Stripe. Por favor contacta al negocio.'),
              variant: "destructive",
            });
          }
        }
      }

      // Traditional flow if no payment or no specific payment method handled above
      completeFlow(booking);

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

  const handleConfirmTransfer = async () => {
    if (!createdBookingId) return;

    try {
      setIsLoading(true);
      await confirmTransfer(createdBookingId, {
        bank: paymentConfig?.bank,
        clabe: paymentConfig?.clabe,
        holderName: paymentConfig?.holderName,
      });

      toast({
        title: "¡Transferencia confirmada!",
        description: "Tu pago está en revisión. El negocio confirmará tu reserva en breve.",
      });

      setShowPaymentInfo(false);
      // Traditional flow completion
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}`);
      completeFlow({ accessCode, scheduledAt });

    } catch (error) {
      console.error("Error confirming transfer:", error);
      toast({
        title: "Error al confirmar",
        description: "Hubo un problema al registrar tu transferencia.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const completeFlow = (booking: any) => {
    const scheduledAt = booking.scheduledAt ? new Date(booking.scheduledAt) : new Date();

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
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Step indicator */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Paso 3 de 3 - ¡Estás a un paso!
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Confirma tu cita
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Solo faltan tus datos para que tu reserva quede confirmada
            </p>
          </div>

          <Card className="shadow-2xl border-2 hover:shadow-3xl transition-all duration-300">
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
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Tu cita quedará confirmada al finalizar</p>
              </div>
            </CardHeader>
            <CardContent>
              {showPaymentInfo ? (
                <div className="space-y-6 py-4">
                  <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      {t('booking.payment.title', 'Pago por transferencia')}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{t('booking.payment.bank', 'Banco')}</p>
                        <p className="font-semibold text-lg">{paymentConfig?.bank}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t('booking.payment.clabe', 'CLABE')}</p>
                        <p className="font-mono font-bold text-xl tracking-wider select-all">{paymentConfig?.clabe}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t('booking.payment.holder', 'Titular')}</p>
                        <p className="font-semibold text-lg">{paymentConfig?.holderName}</p>
                      </div>
                      <div className="pt-2 border-t border-primary/10">
                        <p className="text-sm text-muted-foreground">{t('booking.payment.concept', 'Concepto sugerido')}</p>
                        <p className="font-medium italic">"{formData.serviceId} - {formData.name}"</p>
                      </div>
                    </div>
                  </div>

                  {paymentConfig?.instructions && (
                    <div className="bg-muted p-4 rounded-xl text-sm">
                      <p className="font-medium mb-1">{t('booking.payment.instructions', 'Instrucciones adicionales')}:</p>
                      <p>{paymentConfig.instructions}</p>
                    </div>
                  )}

                  <div className="space-y-3 pt-4">
                    <Button
                      onClick={handleConfirmTransfer}
                      className="w-full text-lg h-14 font-bold shadow-lg"
                      style={primaryColor ? { backgroundColor: primaryColor } : {}}
                      disabled={isLoading}
                    >
                      {isLoading ? t('booking.payment.btn_processing', 'Procesando...') : t('booking.payment.btn_done', 'Ya realicé la transferencia')}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      {t('booking.payment.disclaimer', 'El pago se realiza directamente con el negocio. BookPro no procesa pagos.')}
                    </p>
                  </div>
                </div>
              ) : accessCode ? (
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

                  {availableAssets.length > 0 ? (
                    <div className="space-y-3 p-4 bg-primary/5 rounded-[20px] border border-primary/20 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-2 text-primary font-bold">
                        <Package className="h-5 w-5" />
                        <span>{t('booking.assets.detected_title')}</span>
                      </div>
                      <p className="text-[13px] text-muted-foreground leading-snug">
                        {t('booking.assets.detected_subtitle')}
                      </p>
                      <div className="space-y-2">
                        {availableAssets.map((asset) => (
                          <div
                            key={asset._id}
                            className={`p-3 rounded-xl cursor-pointer border-2 transition-all flex flex-col gap-1 ${selectedAssetId === asset._id ? 'border-primary bg-primary/10' : 'border-transparent bg-background hover:border-muted-foreground/10'}`}
                            onClick={() => setSelectedAssetId(asset._id)}
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-[15px]">{(asset.productId as any).name || 'Paquete'}</span>
                              <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-[10px] uppercase tracking-wider font-bold">
                                {asset.isUnlimited
                                  ? t('booking.assets.unlimited_uses')
                                  : t('booking.assets.uses_remaining', { count: asset.remainingUses })}
                              </Badge>
                            </div>
                            {asset.expiresAt && (
                              <span className="text-[11px] text-muted-foreground">
                                {t('booking.assets.expires_on', { date: new Date(asset.expiresAt).toLocaleDateString() })}
                              </span>
                            )}
                          </div>
                        ))}

                        {!selectedService?.requireProduct && (
                          <div
                            className={`p-3 rounded-xl cursor-pointer border-2 transition-all flex items-center gap-2 ${selectedAssetId === null ? 'border-primary bg-primary/10' : 'border-transparent bg-background hover:border-muted-foreground/10'}`}
                            onClick={() => setSelectedAssetId(null)}
                          >
                            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${selectedAssetId === null ? 'border-primary' : 'border-muted-foreground/30'}`}>
                              {selectedAssetId === null && <div className="h-2 w-2 rounded-full bg-primary" />}
                            </div>
                            <span className="text-[14px] font-medium italic">{t('booking.assets.pay_individual')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : selectedService?.requireProduct && formData.email.includes('@') && !isCheckingAssets && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-[20px] border border-amber-200 dark:border-amber-800/50 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-full mt-0.5 text-amber-600 dark:text-amber-400">
                          <Package className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-amber-900 dark:text-amber-200 text-sm">{t('booking.assets.required_title')}</p>
                          <p className="text-[13px] text-amber-800/80 dark:text-amber-300/80 leading-snug">
                            {t('booking.assets.required_message')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

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

                  {selectedService?.requireResource && selectedDate && selectedTime && (
                    <ResourceSelector
                      businessId={businessId || ""}
                      scheduledAt={`${selectedDate}T${selectedTime}`}
                      onResourceSelected={setSelectedResourceId}
                      primaryColor={primaryColor}
                    />
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full font-bold text-lg h-14 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] mt-6"
                    style={primaryColor ? { backgroundColor: primaryColor } : {}}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Procesando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Confirmar mi cita
                      </span>
                    )}
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
    </section >
  );
};

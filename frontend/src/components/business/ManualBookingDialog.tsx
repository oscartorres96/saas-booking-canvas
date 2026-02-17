import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Clock, Loader2, Ticket, Receipt, AlertCircle, Check, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSlots } from "@/hooks/useSlots";
import { Service } from "@/api/servicesApi";
import { createBooking } from "@/api/bookingsApi";
import { getActiveAssets, CustomerAsset } from "@/api/customerAssetsApi";
import { toast } from "sonner";
import { fromZonedTime } from "date-fns-tz";
import { Badge } from "@/components/ui/badge";

import { ResourceSelector } from "@/components/booking/ResourceSelector";

const manualBookingFormSchema = z.object({
    clientName: z.string().min(2, { message: "Name is required" }),
    clientEmail: z.string().email({ message: "Invalid email" }).optional().or(z.literal("")),
    clientPhone: z.string().optional(),
    serviceId: z.string().min(1, { message: "Select a service" }),
    date: z.date({ required_error: "Select a date" }),
    time: z.string().min(1, { message: "Select a time" }),
    notes: z.string().optional(),
    assetId: z.string().optional(),
    resourceId: z.string().optional(),
});

interface ManualBookingDialogProps {
    isOpen: boolean;
    onClose: () => void;
    businessId: string;
    services: Service[];
    onSuccess: () => void;
    timezone?: string;
}

export const ManualBookingDialog = ({
    isOpen,
    onClose,
    businessId,
    services,
    onSuccess,
    timezone = 'America/Mexico_City'
}: ManualBookingDialogProps) => {
    const { t, i18n } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availableAssets, setAvailableAssets] = useState<CustomerAsset[]>([]);
    const [isCheckingAssets, setIsCheckingAssets] = useState(false);
    const locale = i18n.language === 'en' ? enUS : es;

    const [bookingSessionId] = useState(() => `admin_${Math.random().toString(36).substring(2, 11)}`);

    const form = useForm<z.infer<typeof manualBookingFormSchema>>({
        resolver: zodResolver(manualBookingFormSchema),
        defaultValues: {
            clientName: "",
            clientEmail: "",
            clientPhone: "",
            serviceId: "",
            date: undefined,
            time: "",
            notes: "",
            assetId: "",
            resourceId: "",
        },
    });

    const selectedDate = form.watch("date");
    const selectedServiceId = form.watch("serviceId");
    const clientEmail = form.watch("clientEmail");
    const clientPhone = form.watch("clientPhone");
    const selectedTime = form.watch("time");
    const selectedResourceId = form.watch("resourceId");

    const selectedService = services.find(s => s._id === selectedServiceId);

    const { data: slots, isLoading: isLoadingSlots } = useSlots(
        isOpen ? businessId : undefined,
        selectedDate,
        selectedServiceId
    );

    // Clear resourceId if service or time changes
    useEffect(() => {
        if (selectedResourceId) {
            form.setValue('resourceId', '');
        }
    }, [selectedServiceId, selectedTime, form]);

    // Fetch assets for the client when email or phone changes
    useEffect(() => {
        const fetchAssets = async () => {
            const trimmedEmail = clientEmail?.trim() || "";
            const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
            // Phone validation: check for more than just the country code (+52 is 3 chars)
            const hasValidPhone = clientPhone && clientPhone.length >= 10;

            if (!hasValidEmail && !hasValidPhone) {
                // If inputs are too short/invalid, only clear if we had nothing or if they are truly empty
                if (!trimmedEmail && !clientPhone) {
                    setAvailableAssets([]);
                }
                return;
            }

            try {
                // We keep the old assets visible while searching to prevent flickering
                setIsCheckingAssets(true);
                const assets = await getActiveAssets({
                    businessId,
                    email: trimmedEmail,
                    phone: clientPhone,
                    serviceId: selectedServiceId || undefined,
                });

                setAvailableAssets(assets);

                // Auto-select if nothing is selected yet
                const currentAssetId = form.getValues('assetId');
                if (assets.length > 0 && !currentAssetId) {
                    form.setValue('assetId', assets[0]._id);
                }
            } catch (error) {
                console.error("Error fetching client assets:", error);
            } finally {
                setIsCheckingAssets(false);
            }
        };

        const timer = setTimeout(fetchAssets, 800);
        return () => clearTimeout(timer);
    }, [clientEmail, clientPhone, businessId, selectedServiceId]);

    const onSubmit = async (values: z.infer<typeof manualBookingFormSchema>) => {
        try {
            setIsSubmitting(true);
            const dateStr = format(values.date, "yyyy-MM-dd");
            const scheduledAtDate = fromZonedTime(`${dateStr} ${values.time}`, timezone);

            const selectedService = services.find(s => s._id === values.serviceId);
            const requiresProduct = selectedService?.requireProduct;

            // Warning if service requires product but no asset is selected
            if (requiresProduct && !values.assetId) {
                const confirmed = window.confirm("Este servicio normalmente requiere un paquete y no has seleccionado ninguno. ¿Deseas continuar con una reserva manual sin paquete?");
                if (!confirmed) {
                    setIsSubmitting(false);
                    return;
                }
            }

            await createBooking({
                clientName: values.clientName,
                clientEmail: values.clientEmail || undefined,
                clientPhone: values.clientPhone || undefined,
                serviceId: values.serviceId,
                scheduledAt: scheduledAtDate.toISOString(),
                notes: values.notes,
                businessId,
                assetId: values.assetId || undefined,
                resourceId: values.resourceId || undefined,
                sessionId: bookingSessionId,
                source: 'DASHBOARD_MANUAL'
            });

            toast.success(t('dashboard.manualBooking.success'));
            form.reset();
            setAvailableAssets([]);
            onSuccess();
            onClose();
        } catch (error: any) {
            const errorData = error.response?.data;
            const detailedMessage = Array.isArray(errorData?.message)
                ? errorData.message.join(", ")
                : errorData?.message;
            toast.error(detailedMessage || t('dashboard.manualBooking.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('dashboard.manualBooking.title')}</DialogTitle>
                    <DialogDescription>
                        {t('dashboard.manualBooking.description')}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold border-b pb-2">
                                {t('dashboard.manualBooking.client_section')}
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                <FormField
                                    control={form.control}
                                    name="clientName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('dashboard.manualBooking.name')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="clientEmail"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('dashboard.manualBooking.email')}</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="john@example.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="clientPhone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('dashboard.manualBooking.phone')}</FormLabel>
                                                <FormControl>
                                                    <PhoneInput
                                                        country={'mx'}
                                                        value={field.value}
                                                        onChange={(phone) => field.onChange(phone)}
                                                        specialLabel=""
                                                        inputProps={{
                                                            name: 'clientPhone',
                                                            required: false,
                                                            autoFocus: false
                                                        }}
                                                        inputStyle={{
                                                            width: '100%',
                                                            height: '2.5rem',
                                                            borderRadius: '0.5rem',
                                                            border: '1px solid hsl(var(--input))',
                                                            paddingLeft: '3rem',
                                                            backgroundColor: 'hsl(var(--background))',
                                                            color: 'inherit',
                                                            fontSize: '0.875rem',
                                                        }}
                                                        buttonStyle={{
                                                            border: 'none',
                                                            backgroundColor: 'transparent',
                                                            borderRadius: '0.5rem 0 0 0.5rem'
                                                        }}
                                                        containerStyle={{
                                                            borderRadius: '0.5rem'
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Asset/Package Selection Section - Improved for Dark Mode & Transitions */}
                            {(availableAssets.length > 0 || isCheckingAssets || (clientEmail && clientEmail.includes('@') && clientEmail.includes('.')) || (clientPhone && clientPhone.length > 10)) && (
                                <div className="space-y-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800/60 transition-all duration-300 ease-in-out min-h-[60px]">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                            <Ticket className="h-3.5 w-3.5 text-primary" />
                                            {isCheckingAssets ? "Buscando créditos..." : "Créditos Disponibles"}
                                        </h3>
                                        {isCheckingAssets && (
                                            <div className="flex items-center gap-1.5 text-[10px] text-primary animate-pulse">
                                                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                            </div>
                                        )}
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="assetId"
                                        render={({ field }) => (
                                            <FormItem className="space-y-0">
                                                <div className="grid grid-cols-1 gap-2">
                                                    {availableAssets.length === 0 && isCheckingAssets ? (
                                                        <div className="py-2 flex items-center justify-center">
                                                            <Loader2 className="h-5 w-5 animate-spin text-primary/30" />
                                                        </div>
                                                    ) : availableAssets.length > 0 ? (
                                                        availableAssets.map((asset) => (
                                                            <div
                                                                key={asset._id}
                                                                onClick={() => field.onChange(asset._id)}
                                                                className={cn(
                                                                    "flex flex-col gap-1.5 p-2.5 rounded-md border text-sm cursor-pointer transition-all duration-200",
                                                                    field.value === asset._id
                                                                        ? "bg-primary/10 border-primary shadow-sm ring-1 ring-primary/20"
                                                                        : "bg-background border-input hover:border-slate-400 dark:hover:border-slate-600 shadow-sm"
                                                                )}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className={cn(
                                                                        "font-semibold line-clamp-1",
                                                                        field.value === asset._id ? "text-primary" : "text-foreground"
                                                                    )}>
                                                                        {asset.productId?.name || "Paquete"}
                                                                    </span>
                                                                    {field.value === asset._id ? (
                                                                        <div className="bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm">
                                                                            <Check className="h-3 w-3" />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-700" />
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    {asset.isUnlimited ? (
                                                                        <Badge variant="secondary" className="text-[10px] h-4 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-800/50 hover:bg-purple-500/10">
                                                                            Ilimitado
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge variant="secondary" className="text-[10px] h-4 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/50 hover:bg-blue-500/10">
                                                                            {asset.remainingUses} / {asset.totalUses} usos
                                                                        </Badge>
                                                                    )}
                                                                    {asset.expiresAt && (
                                                                        <span className="text-[10px] text-slate-500 dark:text-slate-500 flex items-center gap-1 italic">
                                                                            Vence {format(new Date(asset.expiresAt), "dd MMM")}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="py-3 px-2 text-center border border-dashed rounded-md bg-background/50">
                                                            <p className="text-[11px] text-muted-foreground italic">No se encontraron paquetes para este cliente</p>
                                                        </div>
                                                    )}

                                                    <div
                                                        onClick={() => field.onChange("")}
                                                        className={cn(
                                                            "p-2 rounded-md border text-xs cursor-pointer transition-all flex items-center gap-2 mt-1",
                                                            !field.value
                                                                ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 font-bold text-foreground"
                                                                : "bg-background border-input hover:bg-slate-50 dark:hover:bg-slate-800/50 text-muted-foreground"
                                                        )}
                                                    >
                                                        <Receipt className="h-3.5 w-3.5" />
                                                        Pago en sitio / Cortesía (No usar paquete)
                                                    </div>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            <h3 className="text-sm font-semibold border-b pb-2 pt-2">
                                {t('dashboard.manualBooking.service_section')}
                            </h3>
                            <FormField
                                control={form.control}
                                name="serviceId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('dashboard.manualBooking.service')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('dashboard.manualBooking.service')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {services.map((service) => (
                                                    <SelectItem key={service._id} value={service._id}>
                                                        {service.name} ({service.durationMinutes} min)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>{t('dashboard.manualBooking.date')}</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP", { locale })
                                                            ) : (
                                                                <span>{t('dashboard.manualBooking.date')}</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date) =>
                                                            date < new Date(new Date().setHours(0, 0, 0, 0))
                                                        }
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="time"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('dashboard.manualBooking.time')}</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={!selectedDate || !selectedServiceId || isLoadingSlots}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={
                                                            isLoadingSlots ? t('common.loading') :
                                                                !selectedDate ? t('dashboard.manualBooking.time') :
                                                                    t('dashboard.manualBooking.time')
                                                        } />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {isLoadingSlots ? (
                                                        <div className="flex items-center justify-center p-4">
                                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                            <span>{t('common.loading')}</span>
                                                        </div>
                                                    ) : slots && slots.length > 0 ? (
                                                        slots.map((slot: any) => (
                                                            <SelectItem key={slot.time} value={slot.time}>
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="h-3 w-3" />
                                                                    {slot.time}
                                                                </div>
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <div className="p-4 text-center text-xs text-muted-foreground">
                                                            No hay horarios disponibles
                                                        </div>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Resource Selection Section - Mini Map */}
                            {selectedService?.requireResource && selectedDate && selectedTime && (
                                <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <h3 className="text-sm font-semibold border-b pb-2 flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        Selección de Lugar
                                    </h3>
                                    <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
                                        <ResourceSelector
                                            businessId={businessId}
                                            serviceId={selectedServiceId}
                                            scheduledAt={format(selectedDate!, "yyyy-MM-dd") + " " + selectedTime}
                                            selectedId={selectedResourceId || null}
                                            sessionId={bookingSessionId}
                                            onResourceSelected={(id) => form.setValue('resourceId', id)}
                                        />
                                    </div>
                                    {form.formState.errors.resourceId && (
                                        <p className="text-xs text-destructive font-medium mt-1">Debes seleccionar un lugar para este servicio</p>
                                    )}
                                </div>
                            )}

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('dashboard.manualBooking.notes')} ({t('common.optional')})</FormLabel>
                                        <FormControl>
                                            <Input placeholder="..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                                {t('common.cancel')}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('dashboard.manualBooking.submit')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

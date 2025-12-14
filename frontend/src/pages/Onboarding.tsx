import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import useAuth from '../auth/useAuth';
import { updateOnboarding, getBusinessById, updateBusinessSettings, Business } from '../api/businessesApi';
import { createService, getServicesByBusiness } from '../api/servicesApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Check, ChevronRight, ChevronLeft, Clock, Store, Scissors, Rocket, Loader2 } from 'lucide-react';
import { BusinessHoursForm, daysOfWeek } from '@/components/business/BusinessHoursForm';
import { ThemeToggle } from "@/components/ThemeToggle";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

const STEPS = [
    { id: 1, title: 'Información Básica', icon: Store },
    { id: 2, title: 'Horarios', icon: Clock },
    { id: 3, title: 'Servicios', icon: Scissors },
    { id: 4, title: 'Activar', icon: Rocket },
];

const intervalSchema = z.object({
    startTime: z.string(),
    endTime: z.string(),
});

// Schema for step 1
const basicInfoSchema = z.object({
    businessName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    language: z.enum(["es", "en"]).default("es"),
    phone: z.string().optional(),
    address: z.string().optional(),
    description: z.string().optional(),
});

// Schema for step 2
const hoursSchema = z.object({
    businessHours: z.array(z.object({
        day: z.string(),
        isOpen: z.boolean(),
        intervals: z.array(intervalSchema).min(1, 'Agrega al menos un intervalo'),
    }))
});

// Schema for step 3
const serviceSchema = z.object({
    name: z.string().min(1, 'El nombre del servicio es requerido'),
    durationMinutes: z.number().min(1, 'La duración debe ser mayor a 0'),
    price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
    isOnline: z.boolean().default(false),
});

export default function Onboarding() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [business, setBusiness] = useState<Business | null>(null);

    // Form for step 1
    const formBasicInfo = useForm<z.infer<typeof basicInfoSchema>>({
        resolver: zodResolver(basicInfoSchema),
        defaultValues: {
            businessName: '',
            language: 'es',
            phone: '',
            address: '',
            description: '',
        },
    });

    // Form for step 2
    const formHours = useForm<z.infer<typeof hoursSchema>>({
        resolver: zodResolver(hoursSchema),
        defaultValues: {
            businessHours: daysOfWeek.map(d => ({
                day: d.label,
                isOpen: d.key !== 'sunday',
                intervals: [{ startTime: '09:00', endTime: '18:00' }],
            }))
        },
    });

    // Form for step 3
    const formService = useForm<z.infer<typeof serviceSchema>>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            name: '',
            durationMinutes: 30,
            price: 0,
            isOnline: false,
        },
    });

    useEffect(() => {
        const loadData = async () => {
            if (!user?.businessId) return;
            try {
                const data = await getBusinessById(user.businessId);
                setBusiness(data);

                // Restore state if exists
                if (data.onboardingStep) {
                    setCurrentStep(data.onboardingStep);
                }

                formBasicInfo.reset({
                    businessName: data.businessName || data.name || '',
                    language: (data.language as "es" | "en") || 'es',
                    phone: data.phone || '',
                    address: data.address || '',
                    description: data.settings?.description || '',
                });

                if (data.settings?.businessHours && data.settings.businessHours.length > 0) {
                    formHours.reset({
                        businessHours: data.settings.businessHours.map((bh) => ({
                            day: bh.day,
                            isOpen: bh.isOpen ?? true,
                            intervals: bh.intervals && bh.intervals.length > 0
                                ? bh.intervals
                                : [{ startTime: '09:00', endTime: '18:00' }],
                        }))
                    });
                }

            } catch (error) {
                console.error('Error loading business:', error);
                toast({ title: 'Error', description: 'No se pudo cargar la información del negocio', variant: 'destructive' });
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user, toast]);

    const handleNext = async () => {
        if (!user?.businessId) return;
        setSaving(true);
        try {
            let nextStep = currentStep + 1;
            let isCompleted = false;

            // Save logic based on step
            if (currentStep === 1) {
                const isValid = await formBasicInfo.trigger();
                if (!isValid) {
                    setSaving(false);
                    return;
                }
                const values = formBasicInfo.getValues();
                await updateBusinessSettings(user.businessId, {
                    businessName: values.businessName,
                    language: values.language,
                    description: values.description,
                    phone: values.phone,
                    address: values.address,
                });
            } else if (currentStep === 2) {
                const isValid = await formHours.trigger();
                if (!isValid) {
                    setSaving(false);
                    return;
                }
                const values = formHours.getValues();
                await updateBusinessSettings(user.businessId, {
                    businessHours: values.businessHours.map(h => ({
                        day: h.day,
                        isOpen: h.isOpen,
                        intervals: h.intervals
                    }))
                });
            } else if (currentStep === 3) {
                const isValid = await formService.trigger();
                if (!isValid) {
                    setSaving(false);
                    return;
                }
                const values = formService.getValues();
                if (values.name) {
                    await createService({
                        businessId: user.businessId,
                        name: values.name,
                        durationMinutes: Number(values.durationMinutes),
                        price: Number(values.price),
                        isOnline: values.isOnline,
                        active: true
                    });
                } else {
                    // Check if services exist
                    const services = await getServicesByBusiness(user.businessId);
                    if (services.length === 0) {
                        toast({ title: "Requerido", description: "Debes crear al menos un servicio", variant: "destructive" });
                        setSaving(false);
                        return;
                    }
                }
            } else if (currentStep === 4) {
                isCompleted = true;
            }

            await updateOnboarding(user.businessId, nextStep > 4 ? 4 : nextStep, isCompleted);

            if (isCompleted) {
                toast({ title: "¡Felicidades!", description: "Tu negocio está listo." });

                // Redirect based on user role
                if (user.role === 'owner') {
                    navigate('/admin');
                } else if (user.businessId) {
                    navigate(`/business/${user.businessId}/dashboard`);
                } else {
                    // Fallback to admin
                    navigate('/admin');
                }
            } else {
                setCurrentStep(nextStep);
            }

        } catch (error) {
            console.error('Error saving step:', error);
            toast({ title: 'Error', description: 'No se pudo guardar el progreso', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleBack = async () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            if (user?.businessId) {
                await updateOnboarding(user.businessId, currentStep - 1, false);
            }
        }
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    const progress = (currentStep / STEPS.length) * 100;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center pt-10 px-4 relative">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <div className="w-full max-w-3xl mb-8">
                <div className="flex justify-between mb-2">
                    {STEPS.map((step) => (
                        <div key={step.id} className={`flex flex-col items-center ${step.id <= currentStep ? 'text-primary' : 'text-gray-400 dark:text-gray-600'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 border-2 ${step.id <= currentStep ? 'border-primary bg-primary/10' : 'border-gray-300 bg-white dark:border-slate-800 dark:bg-slate-900'}`}>
                                <step.icon className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-medium hidden sm:block">{step.title}</span>
                        </div>
                    ))}
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            <Card className="w-full max-w-2xl shadow-lg">
                <CardHeader>
                    <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
                    <CardDescription>Paso {currentStep} de {STEPS.length}</CardDescription>
                </CardHeader>
                <CardContent>
                    {currentStep === 1 && (
                        <Form {...formBasicInfo}>
                            <div className="space-y-4">
                                <FormField
                                    control={formBasicInfo.control}
                                    name="businessName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre del Negocio</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Ej. Barbería El Bigote" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={formBasicInfo.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descripción Corta</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Los mejores cortes de la ciudad" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={formBasicInfo.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Teléfono</FormLabel>
                                            <FormControl>
                                                <PhoneInput
                                                    country="mx"
                                                    enableSearch
                                                    countryCodeEditable={false}
                                                    value={field.value}
                                                    onChange={(phone) => field.onChange(phone)}
                                                    placeholder="+52 55 1234 5678"
                                                    containerClass="w-full"
                                                    inputClass="!w-full !h-10 !text-base !bg-background !border !border-input !rounded-md !pl-14 !text-foreground focus:!ring-2 focus:!ring-ring focus:!ring-offset-2"
                                                    buttonClass="!h-10 !bg-background !border !border-input !rounded-l-md !px-3"
                                                    dropdownClass="!bg-popover !text-foreground !shadow-lg !border !rounded-md"
                                                    inputStyle={{ paddingLeft: "3.5rem" }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={formBasicInfo.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Dirección</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Av. Reforma 123, CDMX" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={formBasicInfo.control}
                                    name="language"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Idioma de Comunicación</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona un idioma" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="es">Español</SelectItem>
                                                    <SelectItem value="en">English</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">Los correos a tus clientes se enviarán en este idioma.</p>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </Form>
                    )}

                    {currentStep === 2 && (
                        <Form {...formHours}>
                            <div className="space-y-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Define tus horarios de apertura. Desmarca los días que cierras.</p>
                                <BusinessHoursForm form={formHours} />
                            </div>
                        </Form>
                    )}

                    {currentStep === 3 && (
                        <Form {...formService}>
                            <div className="space-y-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-4">
                                    <p className="text-sm text-blue-700 dark:text-blue-300">Agrega tu primer servicio para que los clientes puedan reservar.</p>
                                </div>
                                <FormField
                                    control={formService.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre del Servicio</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Ej. Corte de Cabello" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={formService.control}
                                        name="durationMinutes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Duración (min)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={formService.control}
                                        name="price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Precio ($)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        inputMode="numeric"
                                                        {...field}
                                                        value={field.value === 0 ? '' : field.value}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            // Solo permitir números
                                                            if (value === '' || /^\d+$/.test(value)) {
                                                                field.onChange(value === '' ? 0 : Number(value));
                                                            }
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={formService.control}
                                    name="isOnline"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center gap-2">
                                            <FormControl>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={field.value}
                                                    onChange={(e) => field.onChange(e.target.checked)}
                                                />
                                            </FormControl>
                                            <div>
                                                <FormLabel>Servicio en línea</FormLabel>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Desmarca para que sea solo presencial.</p>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </Form>
                    )}

                    {currentStep === 4 && (
                        <div className="text-center py-8 space-y-4">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Rocket className="w-10 h-10 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">¡Todo listo!</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                Has configurado la información básica de tu negocio. Ahora puedes acceder a tu panel de administración y empezar a recibir reservas.
                            </p>
                            <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg text-left max-w-sm mx-auto mt-6">
                                <h4 className="font-semibold mb-2">Resumen:</h4>
                                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500" /> Información del negocio</li>
                                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500" /> Horarios configurados</li>
                                    <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500" /> Servicios creados</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={handleBack} disabled={currentStep === 1 || saving}>
                        <ChevronLeft className="w-4 h-4 mr-2" /> Atrás
                    </Button>
                    <Button onClick={handleNext} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {currentStep === 4 ? 'Finalizar y Activar' : 'Siguiente'}
                        {currentStep !== 4 && <ChevronRight className="w-4 h-4 ml-2" />}
                    </Button>
                </CardFooter>
            </Card>
        </div >
    );
}

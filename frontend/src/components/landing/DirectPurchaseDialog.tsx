import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const purchaseSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    phone: z.string().min(10, 'Teléfono inválido'),
    company: z.string().optional(),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

interface DirectPurchaseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    billingPeriod?: 'monthly' | 'annual' | 'trial';
}

export function DirectPurchaseDialog({ open, onOpenChange, billingPeriod = 'monthly' }: DirectPurchaseDialogProps) {
    const { t, i18n } = useTranslation();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
        reset,
    } = useForm<PurchaseFormData>({
        resolver: zodResolver(purchaseSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            company: '',
        },
    });

    const phoneValue = watch('phone');

    const onSubmit = async (data: PurchaseFormData) => {
        setLoading(true);
        try {
            // Create direct purchase checkout session
            const response = await axios.post(`${API_URL}/stripe/direct-purchase/checkout`, {
                name: data.name,
                email: data.email,
                phone: data.phone,
                company: data.company || '',
                language: i18n.language,
                billingPeriod, // Pass the selected billing period
            });

            if (response.data.success && response.data.data?.url) {
                // Redirect to Stripe Checkout
                window.location.href = response.data.data.url;
            } else {
                throw new Error('No se recibió la URL de checkout');
            }
        } catch (error: any) {
            console.error('Error creating checkout:', error);

            // Get error message from server response if available
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                'No se pudo iniciar el proceso de compra. Intenta nuevamente.';

            toast({
                title: t('common.error') || 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            reset();
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        {t('pricing.purchase.title') || 'Comenzar con BookPro'}
                    </DialogTitle>
                    <DialogDescription>
                        {t('pricing.purchase.subtitle') || 'Completa tus datos para proceder al pago'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            {t('demo.form.name') || 'Nombre completo'} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            {...register('name')}
                            placeholder={t('demo.form.name_placeholder') || 'Juan Pérez'}
                            disabled={loading}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">
                            {t('demo.form.email') || 'Email'} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            {...register('email')}
                            placeholder={t('demo.form.email_placeholder') || 'juan@ejemplo.com'}
                            disabled={loading}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">
                            {t('demo.form.phone') || 'Teléfono'} <span className="text-red-500">*</span>
                        </Label>
                        <PhoneInput
                            country={i18n.language === 'es' ? 'mx' : 'us'}
                            value={phoneValue}
                            onChange={(phone) => setValue('phone', phone)}
                            placeholder={t('demo.form.phone_placeholder') || '+52 55 1234 5678'}
                            disabled={loading}
                            enableSearch
                            countryCodeEditable={false}
                            containerClass="w-full"
                            inputClass="!w-full !h-10 !text-base !bg-background !border !border-input !rounded-md !pl-14 !text-foreground focus:!ring-2 focus:!ring-ring focus:!ring-offset-2"
                            buttonClass="!h-10 !bg-background !border !border-input !rounded-l-md !px-3"
                            dropdownClass="!bg-popover !text-foreground !shadow-lg !border !rounded-md"
                        />
                        {errors.phone && (
                            <p className="text-sm text-red-500">{errors.phone.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="company">
                            {t('demo.form.company') || 'Nombre del negocio'} {t('common.optional') || '(Opcional)'}
                        </Label>
                        <Input
                            id="company"
                            {...register('company')}
                            placeholder={t('demo.form.company_placeholder') || 'Mi Negocio'}
                            disabled={loading}
                        />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                            ✓ Serás redirigido a Stripe para completar el pago de forma segura
                        </p>
                        <p className="text-sm text-blue-900 dark:text-blue-100 mt-1">
                            ✓ Después del pago, recibirás un email para activar tu cuenta
                        </p>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            {t('common.cancel') || 'Cancelar'}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? 'Procesando...' : (t('pricing.purchase.cta') || 'Proceder al pago')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

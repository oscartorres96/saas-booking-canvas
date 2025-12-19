import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function PaymentSuccess() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [countdown, setCountdown] = useState(10);
    const sessionId = searchParams.get('session_id');
    const purchaseType = searchParams.get('type'); // Check if it's a direct purchase

    const isDirectPurchase = purchaseType === 'direct_purchase';
    const bookingId = searchParams.get('bookingId');
    const isBooking = !!bookingId || purchaseType === 'booking';

    useEffect(() => {
        // Only auto-redirect for regular purchases (logged in users)
        if (!isDirectPurchase && !isBooking) {
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        navigate('/admin');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [navigate, isDirectPurchase]);

    // Auto-trigger account creation for direct purchases (for testing when webhooks don't work)
    useEffect(() => {
        if (isDirectPurchase && sessionId) {
            const triggerAccountCreation = async () => {
                try {
                    const response = await fetch('http://localhost:3000/api/stripe/direct-purchase/complete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId }),
                    });
                    const data = await response.json();
                    if (data.success) {
                        console.log('Account creation triggered successfully');
                    }
                } catch (error) {
                    console.error('Error triggering account creation:', error);
                }
            };
            triggerAccountCreation();
        }
    }, [isDirectPurchase, sessionId]);

    const handleGoToDashboard = () => {
        if (isDirectPurchase) {
            navigate('/'); // Go to landing page
        } else {
            navigate('/admin');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-6">
            <Card className="max-w-2xl w-full shadow-2xl">
                <CardHeader className="text-center space-y-4 pb-8">
                    <div className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                        <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {t('payment.success.title')}
                        </CardTitle>
                        <CardDescription className="text-lg mt-2">
                            {isDirectPurchase
                                ? '¡Tu cuenta ha sido creada exitosamente!'
                                : t('payment.success.subtitle')}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {isDirectPurchase ? (
                        // Direct Purchase Flow - Need to activate account
                        <>
                            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 dark:border-blue-600 rounded-lg p-6">
                                <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-lg mb-2 flex items-center gap-2">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    📧 Revisa tu correo electrónico
                                </h3>
                                <p className="text-blue-800 dark:text-blue-200">
                                    Te hemos enviado un email con un <strong>link de activación</strong> y tus <strong>credenciales temporales</strong>.
                                </p>
                            </div>

                            <p className="text-center text-muted-foreground">
                                Tu pago ha sido procesado exitosamente y tu suscripción está activa.
                                Para acceder a tu panel, necesitas activar tu cuenta.
                            </p>

                            <div className="border-t pt-6">
                                <h3 className="font-semibold mb-4">Próximos pasos:</h3>
                                <ol className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
                                            1
                                        </span>
                                        <span className="text-sm pt-0.5">
                                            <strong>Revisa tu correo</strong> (incluyendo spam/promociones)
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
                                            2
                                        </span>
                                        <span className="text-sm pt-0.5">
                                            <strong>Haz clic en el link</strong> de activación del email
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
                                            3
                                        </span>
                                        <span className="text-sm pt-0.5">
                                            <strong>Establece tu contraseña</strong> personal
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
                                            4
                                        </span>
                                        <span className="text-sm pt-0.5">
                                            <strong>Completa el onboarding</strong> de tu negocio
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
                                            5
                                        </span>
                                        <span className="text-sm pt-0.5">
                                            <strong>¡Comienza a recibir clientes!</strong> 🎉
                                        </span>
                                    </li>
                                </ol>
                            </div>
                        </>
                    ) : isBooking ? (
                        // Booking Payment Flow
                        <>
                            <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-6 text-center animate-in zoom-in-95 duration-500">
                                <h3 className="font-bold text-xl mb-2">{t('payment.success.booking_confirmed', '¡Cita Confirmada y Pagada!')}</h3>
                                <p className="text-muted-foreground">
                                    {t('payment.success.booking_desc', 'Tu pago ha sido procesado correctamente y tu cita está agendada.')}
                                </p>
                                {bookingId && (
                                    <div className="mt-4 p-3 bg-background rounded-lg border border-dashed font-mono font-bold text-primary">
                                        ID: {bookingId}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 mt-6">
                                <Button onClick={() => navigate('/my-bookings')} variant="default" className="h-12 text-lg">
                                    {t('payment.success.view_my_bookings', 'Ver mis citas')}
                                </Button>
                                <Button onClick={() => navigate('/')} variant="outline" className="h-12">
                                    {t('payment.success.back_home', 'Volver al Inicio')}
                                </Button>
                            </div>
                        </>
                    ) : (
                        // Regular Flow - Already logged in
                        <>
                            <p className="text-center text-muted-foreground">
                                {t('payment.success.message')}
                            </p>

                            {sessionId && (
                                <div className="bg-muted/50 rounded-lg p-4">
                                    <p className="text-sm font-medium mb-1">{t('payment.success.session_id')}:</p>
                                    <p className="text-xs text-muted-foreground font-mono break-all">
                                        {sessionId}
                                    </p>
                                </div>
                            )}

                            <div className="border-t pt-6">
                                <h3 className="font-semibold mb-4">{t('payment.success.next_steps')}</h3>
                                <ol className="space-y-3">
                                    {['step1', 'step2', 'step3', 'step4'].map((step, index) => (
                                        <li key={step} className="flex items-start gap-3">
                                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
                                                {index + 1}
                                            </span>
                                            <span className="text-sm pt-0.5">{t(`payment.success.${step}`)}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center gap-3">
                                <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                                <p className="text-sm text-blue-900 dark:text-blue-100">
                                    Redirigiendo al panel en <span className="font-bold">{countdown}</span> segundos...
                                </p>
                            </div>
                        </>
                    )}
                </CardContent>

                {!isBooking && (
                    <CardFooter className="flex justify-center pb-8">
                        <Button onClick={handleGoToDashboard} size="lg" className="w-full sm:w-auto">
                            {isDirectPurchase ? '🏠 Volver al Inicio' : t('payment.success.cta')}
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}

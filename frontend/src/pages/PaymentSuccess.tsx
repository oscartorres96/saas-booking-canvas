import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { createBooking, getBookingsByClient, getBookingById } from '@/api/bookingsApi';
import { getActiveAssets } from '@/api/customerAssetsApi';
import { toast } from 'sonner';

export default function PaymentSuccess() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [countdown, setCountdown] = useState(10);
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const sessionId = searchParams.get('session_id');
    const purchaseType = searchParams.get('type');
    const bookingDataRaw = searchParams.get('booking_data');

    const isDirectPurchase = purchaseType === 'direct_purchase';
    const bookingId = searchParams.get('bookingId');
    const isBooking = !!bookingId || purchaseType === 'booking' || purchaseType === 'product-with-booking';
    const businessId = searchParams.get('businessId'); // Extract businessId from URL
    const [bookingInfo, setBookingInfo] = useState<any>(null);

    useEffect(() => {
        if (bookingId) {
            getBookingById(bookingId)
                .then(setBookingInfo)
                .catch(console.error);
        }
    }, [bookingId]);
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

    // Auto-trigger account creation for direct purchases
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

    // Manual completion trigger for development (Webhooks fallback)
    useEffect(() => {
        // Trigger manual completion for product or booking purchases in DEV mode
        const isDev = window.location.hostname === 'localhost';
        const isProduct = purchaseType === 'product' || purchaseType === 'product-with-booking';
        const isBookingType = purchaseType === 'booking' || !!bookingId;

        if (isDev && sessionId && (isProduct || isBookingType)) {
            const triggerManualCompletion = async () => {
                const endpoint = isProduct ? 'product-purchase/complete' : 'booking-purchase/complete';
                try {
                    await fetch(`http://localhost:3000/api/stripe/${endpoint}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId }),
                    });
                } catch (error) {
                    console.error(`Error triggering manual completion for ${endpoint}:`, error);
                }
            };
            triggerManualCompletion();
        }
    }, [sessionId, purchaseType, bookingId]);

    // Handle Product Purchase Booking Completion (Fix #5)
    useEffect(() => {
        const isAutoBooking = purchaseType === 'product-with-booking';

        if ((purchaseType === 'product' || isAutoBooking) && sessionId && bookingDataRaw) {
            const completeProductBooking = async () => {
                setStatus('processing');
                let bookingData: any = null;
                try {
                    // 1. Parse booking data
                    bookingData = JSON.parse(atob(bookingDataRaw));
                    const extractedBusinessId = bookingData.businessId; // Extract from booking data

                    // 2. Wait/Retry for the asset to be ready (Backend should have created it)
                    let userAsset = null;
                    for (let i = 0; i < 6; i++) {
                        const assets = await getActiveAssets({
                            businessId: bookingData.businessId,
                            email: bookingData.clientEmail,
                            phone: bookingData.clientPhone,
                        });

                        userAsset = assets.find(a => {
                            const allowed = a.productId?.allowedServiceIds;
                            return !allowed || allowed.length === 0 || allowed.includes(bookingData.serviceId);
                        });

                        if (userAsset) break;
                        await new Promise(r => setTimeout(r, 2000));
                    }

                    if (!userAsset) {
                        throw new Error("No available assets found after purchase");
                    }

                    // 3. Wait for the booking to be created by the backend (Fix #5)
                    let confirmedBooking = null;
                    for (let i = 0; i < 5; i++) {
                        const bookings = await getBookingsByClient(bookingData.clientEmail);
                        confirmedBooking = bookings.find(b =>
                            b.businessId === bookingData.businessId &&
                            b.serviceId === bookingData.serviceId &&
                            Math.abs(new Date(b.scheduledAt).getTime() - new Date(bookingData.scheduledAt).getTime()) < 60000 // Within 1 minute
                        );
                        if (confirmedBooking) break;
                        await new Promise(r => setTimeout(r, 2000));
                    }

                    // 4. Fallback: If backend hasn't created it yet, try to create it from frontend
                    if (!confirmedBooking) {
                        console.log("Auto-booking not found yet, attempting manual creation as fallback...");
                        await createBooking({
                            ...bookingData,
                            assetId: userAsset._id,
                        });
                    }

                    if (confirmedBooking) {
                        setBookingInfo(confirmedBooking);
                    }

                    setStatus('success');
                    toast.success("¡Reserva confirmada exitosamente!");
                } catch (error: any) {
                    console.error("Failed to complete product booking:", error);
                    setStatus('error');
                    toast.error("Tu paquete está listo, pero no pudimos confirmar la reserva automáticamente.");
                }
            };

            completeProductBooking();
        }
    }, [purchaseType, sessionId, bookingDataRaw, navigate]);

    const handleGoToDashboard = () => {
        if (businessId) {
            navigate(`/business/${businessId}/booking`);
        } else if (isDirectPurchase) {
            navigate('/'); // Go to landing page
        } else {
            navigate('/admin');
        }
    };

    const handleViewMyBookings = () => {
        const params = new URLSearchParams();
        if (businessId) params.set('businessId', businessId);

        // Prioritize actual booking info if fetched
        if (bookingInfo?.clientEmail) params.set('email', bookingInfo.clientEmail);
        if (bookingInfo?.accessCode) params.set('code', bookingInfo.accessCode);

        // Pass along the token if it exists in the URL
        const tokenFromUrl = searchParams.get('token');
        if (tokenFromUrl) params.set('token', tokenFromUrl);

        // Fallback for email from bookingDataRaw if it was a product-with-booking
        if (!params.get('email') && bookingDataRaw) {
            try {
                const data = JSON.parse(atob(bookingDataRaw));
                if (data.clientEmail) params.set('email', data.clientEmail);
            } catch (e) { /* ignore */ }
        }

        if (businessId) {
            params.set('view', 'dashboard');
            navigate(`/business/${businessId}/booking?${params.toString()}`);
        } else {
            // Fallback to home if no businessId, but usually we have it
            navigate(`/?${params.toString()}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-3 sm:p-6">
            <Card className="max-w-2xl w-full shadow-2xl">
                <CardHeader className="text-center space-y-3 sm:space-y-4 pb-4 sm:pb-6 md:pb-8 px-3 sm:px-6">
                    <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">
                            {t('payment.success.title')}
                        </CardTitle>
                        <CardDescription className="text-sm sm:text-base md:text-lg mt-2">
                            {isDirectPurchase
                                ? '¡Tu cuenta ha sido creada exitosamente!'
                                : t('payment.success.subtitle')}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
                    {isDirectPurchase ? (
                        // Direct Purchase Flow - Need to activate account
                        <>
                            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 dark:border-blue-600 rounded-lg p-4 sm:p-6">
                                <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm sm:text-base md:text-lg mb-2 flex items-center gap-2">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-xs sm:text-sm md:text-base">📧 Revisa tu correo electrónico</span>
                                </h3>
                                <p className="text-xs sm:text-sm md:text-base text-blue-800 dark:text-blue-200">
                                    Te hemos enviado un email con un <strong>link de activación</strong> y tus <strong>credenciales temporales</strong>.
                                </p>
                            </div>

                            <p className="text-center text-xs sm:text-sm md:text-base text-muted-foreground">
                                Tu pago ha sido procesado exitosamente y tu suscripción está activa.
                                Para acceder a tu panel, necesitas activar tu cuenta.
                            </p>

                            <div className="border-t pt-4 sm:pt-6">
                                <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Próximos pasos:</h3>
                                <ol className="space-y-2 sm:space-y-3">
                                    <li className="flex items-start gap-2 sm:gap-3">
                                        <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-semibold shrink-0">
                                            1
                                        </span>
                                        <span className="text-xs sm:text-sm pt-0.5">
                                            <strong>Revisa tu correo</strong> (incluyendo spam/promociones)
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2 sm:gap-3">
                                        <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-semibold shrink-0">
                                            2
                                        </span>
                                        <span className="text-xs sm:text-sm pt-0.5">
                                            <strong>Haz clic en el link</strong> de activación del email
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2 sm:gap-3">
                                        <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-semibold shrink-0">
                                            3
                                        </span>
                                        <span className="text-xs sm:text-sm pt-0.5">
                                            <strong>Establece tu contraseña</strong> personal
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2 sm:gap-3">
                                        <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-semibold shrink-0">
                                            4
                                        </span>
                                        <span className="text-xs sm:text-sm pt-0.5">
                                            <strong>Completa el onboarding</strong> de tu negocio
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2 sm:gap-3">
                                        <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-semibold shrink-0">
                                            5
                                        </span>
                                        <span className="text-xs sm:text-sm pt-0.5">
                                            <strong>¡Comienza a recibir clientes!</strong> 🎉
                                        </span>
                                    </li>
                                </ol>
                            </div>
                        </>
                    ) : (purchaseType === 'product' || purchaseType === 'product-with-booking') ? (
                        // Product Purchase Flow (Packages/Passes)
                        <div className="space-y-4 sm:space-y-6">
                            <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-4 sm:p-6 text-center animate-in zoom-in-95 duration-500">
                                <h3 className="font-bold text-base sm:text-lg md:text-xl mb-2">¡Paquete Adquirido!</h3>
                                <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                                    Tu compra ha sido procesada con éxito y tus créditos están listos para usar.
                                </p>
                            </div>

                            {(purchaseType === 'product-with-booking' || status === 'success') && (
                                status === 'processing' ? (
                                    <div className="flex flex-col items-center gap-3 sm:gap-4 py-6 sm:py-8">
                                        <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
                                        <p className="text-sm sm:text-base font-medium animate-pulse">Confirmando tu reserva...</p>
                                    </div>
                                ) : status === 'error' ? (
                                    <div className="p-3 sm:p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs sm:text-sm">
                                        <p>Hubo un problema al confirmar tu reserva, pero tu paquete ya está activo. Por favor contacta al negocio.</p>
                                    </div>
                                ) : (
                                    <div className="bg-green-50 border border-green-100 rounded-xl p-4 sm:p-6 text-center">
                                        <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-green-600 mx-auto mb-2 sm:mb-3" />
                                        <h4 className="font-bold text-sm sm:text-base text-green-800">¡Reserva Confirmada!</h4>
                                        <p className="text-green-700 text-xs sm:text-sm mt-1">Hemos usado uno de tus nuevos créditos para confirmar tu cita.</p>
                                    </div>
                                )
                            )}

                            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                                <Button onClick={handleViewMyBookings} variant="default" className="h-10 sm:h-12 text-sm sm:text-base md:text-lg">
                                    Ver mis citas y créditos
                                </Button>
                                <Button onClick={() => navigate(businessId ? `/business/${businessId}/booking` : '/')} variant="outline" className="h-10 sm:h-12 text-sm sm:text-base">
                                    {t('payment.success.book_now', 'Reservar')}
                                </Button>
                            </div>
                        </div>
                    ) : isBooking ? (
                        // Booking Payment Flow
                        <>
                            <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-4 sm:p-6 text-center animate-in zoom-in-95 duration-500">
                                <h3 className="font-bold text-base sm:text-lg md:text-xl mb-2">{t('payment.success.booking_confirmed', '¡Cita Confirmada y Pagada!')}</h3>
                                <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                                    {t('payment.success.booking_desc', 'Tu pago ha sido procesado correctamente y tu cita está agendada.')}
                                </p>
                                {bookingId && (
                                    <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-background rounded-lg border border-dashed">
                                        <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">ID:</p>
                                        <p className="font-mono text-xs sm:text-sm md:text-base font-bold text-primary break-all">{bookingId}</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:gap-4 mt-4 sm:mt-6">
                                <Button onClick={handleViewMyBookings} variant="default" className="h-10 sm:h-12 text-sm sm:text-base md:text-lg">
                                    {t('payment.success.view_my_bookings', 'Ver mis citas')}
                                </Button>
                                <Button onClick={() => navigate(businessId ? `/business/${businessId}/booking` : '/')} variant="outline" className="h-10 sm:h-12 text-sm sm:text-base">
                                    {t('payment.success.book_now', 'Reservar')}
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

                {isDirectPurchase && (
                    <CardFooter className="flex justify-center pb-4 sm:pb-6 md:pb-8 px-3 sm:px-6">
                        <Button onClick={handleGoToDashboard} size="lg" className="w-full sm:w-auto text-sm sm:text-base">
                            {isDirectPurchase ? `🏠 ${t('common.back_to_home')}` : t('payment.success.cta')}
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}

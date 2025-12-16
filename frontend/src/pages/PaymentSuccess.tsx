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

    useEffect(() => {
        // Auto-redirect countdown
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
    }, [navigate]);

    const handleGoToDashboard = () => {
        navigate('/admin');
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
                            {t('payment.success.subtitle')}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
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
                </CardContent>

                <CardFooter className="flex justify-center pb-8">
                    <Button onClick={handleGoToDashboard} size="lg" className="w-full sm:w-auto">
                        {t('payment.success.cta')}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, HelpCircle, Home, RotateCcw } from 'lucide-react';

export default function PaymentCancel() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isBooking = searchParams.get('type') === 'booking';

    const handleRetry = () => {
        if (isBooking) {
            navigate(-1); // Go back to booking form
        } else {
            navigate('/#pricing');
        }
    };

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-6">
            <Card className="max-w-2xl w-full shadow-2xl">
                <CardHeader className="text-center space-y-4 pb-8">
                    <div className="mx-auto w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                        <XCircle className="h-12 w-12 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                            {t('payment.cancel.title')}
                        </CardTitle>
                        <CardDescription className="text-lg mt-2">
                            {t('payment.cancel.subtitle')}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    <p className="text-center text-muted-foreground">
                        {t('payment.cancel.message')}
                    </p>

                    <div className="border rounded-lg p-6 bg-muted/30">
                        <div className="flex items-start gap-3">
                            <HelpCircle className="h-6 w-6 text-primary mt-0.5 shrink-0" />
                            <div>
                                <h3 className="font-semibold mb-2">{t('payment.cancel.help')}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {t('payment.cancel.contact')}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row gap-3 pb-8">
                    <Button
                        onClick={handleRetry}
                        size="lg"
                        className="w-full sm:w-auto"
                    >
                        <RotateCcw className="mr-2 h-5 w-5" />
                        {t('payment.cancel.retry')}
                    </Button>
                    <Button
                        onClick={handleGoHome}
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto"
                    >
                        <Home className="mr-2 h-5 w-5" />
                        {t('payment.cancel.back')}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

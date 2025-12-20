import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    CreditCard,
    Calendar,
    DollarSign,
    AlertCircle,
    CheckCircle,
    Download,
    RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/axiosConfig';

import {
    DashboardSection,
    SectionHeader,
    ConfigPanel,
    AdminLabel,
    InnerCard
} from "@/components/dashboard/DashboardBase";

interface Subscription {
    _id: string;
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
    priceId: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAt?: Date;
    canceledAt?: Date;
}

interface Payment {
    _id: string;
    amount: number;
    currency: string;
    status: string;
    description: string;
    createdAt: Date;
    stripeInvoiceId?: string;
}

interface BillingProps {
    businessId: string;
}

export function Billing({ businessId }: BillingProps) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [isChangePlanDialogOpen, setIsChangePlanDialogOpen] = useState(false);

    useEffect(() => {
        loadBillingData();
    }, [businessId]);

    const loadBillingData = async () => {
        if (!businessId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        // Fetch subscription
        try {
            // Using apiClient automatically handles Auth headers
            const subResponse = await apiClient.get(`/stripe/subscription/${businessId}`);
            if (subResponse.data?.data) {
                setSubscription(subResponse.data.data);
            } else {
                setSubscription(null);
            }
        } catch (subError: any) {
            console.log('No subscription found or error:', subError.message);
            setSubscription(null);
        }

        // Fetch payments
        try {
            const paymentsResponse = await apiClient.get(`/stripe/payments/${businessId}`);
            if (paymentsResponse.data?.data && Array.isArray(paymentsResponse.data.data)) {
                setPayments(paymentsResponse.data.data);
            } else {
                setPayments([]);
            }
        } catch (payError: any) {
            console.log('No payments found or error:', payError.message);
            setPayments([]);
        }

        setLoading(false);
    };

    const handleCancelSubscription = async () => {
        // TODO: Implement cancel subscription API call
        toast.info(t('common.coming_soon') || "Esta funcionalidad estará disponible próximamente.");
        setIsCancelDialogOpen(false);
    };

    const handleUpdatePaymentMethod = () => {
        // TODO: Open Stripe customer portal or payment method update flow
        toast.info(t('common.coming_soon') || "Esta funcionalidad estará disponible próximamente.");
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-100">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t('billing.status.active')}
                    </Badge>
                );
            case 'trialing':
                return (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100">
                        {t('billing.status.trialing')}
                    </Badge>
                );
            case 'past_due':
                return (
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 hover:bg-yellow-100">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {t('billing.status.past_due')}
                    </Badge>
                );
            case 'canceled':
                return (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-100">
                        {t('billing.status.canceled')}
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getPlanName = (priceId: string) => {
        // Detect legacy/grandfathered subscriptions
        if (priceId === 'legacy_grandfathered' || !priceId) {
            return t('billing.plan.legacy') || 'Plan Legacy';
        }
        // Paquete de prueba / Una vez (1 peso)
        if (priceId.includes('trial') || priceId === 'price_1SfCuCLTjo7hhl0NqCZMtoSR' || priceId === 'price_1QPQCzQ12nTJiBYkCz7nnDsR') {
            return t('billing.plan.trial');
        }
        // Map price IDs to plan names
        if (priceId.includes('annual') || priceId === 'price_1Sf5dUQ12BYwu1Gtc44DvB2d') {
            return t('billing.plan.annual');
        }
        return t('billing.plan.monthly');
    };

    const getPlanPrice = (priceId: string) => {
        if (priceId.includes('trial') || priceId === 'price_1SfCuCLTjo7hhl0NqCZMtoSR' || priceId === 'price_1QPQCzQ12nTJiBYkCz7nnDsR') {
            return '$1 MXN';
        }
        if (priceId.includes('annual') || priceId === 'price_1Sf5dUQ12BYwu1Gtc44DvB2d') {
            return '$3,490 MXN';
        }
        return '$349 MXN';
    };

    const getPlanCycle = (priceId: string) => {
        if (priceId.includes('trial') || priceId === 'price_1SfCuCLTjo7hhl0NqCZMtoSR' || priceId === 'price_1QPQCzQ12nTJiBYkCz7nnDsR') {
            return 'pago único';
        }
        if (priceId.includes('annual') || priceId === 'price_1Sf5dUQ12BYwu1Gtc44DvB2d') {
            return t('billing.plan.cycle.annual');
        }
        return t('billing.plan.cycle.monthly');
    };

    const formatDate = (date: Date | undefined) => {
        if (!date) return '-';
        return format(new Date(date), 'PPP', {
            locale: i18n.language === 'es' ? es : enUS,
        });
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-40 bg-muted rounded-lg" />
                <div className="h-64 bg-muted rounded-lg" />
            </div>
        );
    }

    if (!subscription) {
        return (
            <Card className="border-dashed">
                <CardContent className="pt-6 text-center">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">{t('billing.no_subscription.title')}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        {t('billing.no_subscription.description')}
                    </p>
                    <Button onClick={() => navigate('/#pricing')}>
                        {t('billing.no_subscription.action')}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-8">
            {/* Subscription Overview */}
            <DashboardSection>
                <SectionHeader
                    title={t('billing.overview.title')}
                    description={t('billing.overview.subtitle')}
                    icon={CreditCard}
                    rightElement={getStatusBadge(subscription.status)}
                />
                <CardContent className="p-6 md:p-8 space-y-8">

                    {/* Plan Details Grid */}
                    <div className="grid md:grid-cols-3 gap-6">
                        <InnerCard>
                            <AdminLabel icon={DollarSign}>{t('billing.overview.plan')}</AdminLabel>
                            <p className="text-xl font-bold tracking-tight">{getPlanName(subscription.priceId)}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {getPlanPrice(subscription.priceId)} / {getPlanCycle(subscription.priceId)}
                            </p>
                        </InnerCard>

                        <InnerCard>
                            <AdminLabel icon={Calendar}>{t('billing.overview.renewal_date')}</AdminLabel>
                            <p className="text-xl font-bold tracking-tight">{formatDate(subscription.currentPeriodEnd)}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {subscription.status === 'active' ? t('billing.overview.auto_renews') : t('billing.overview.canceled_at_period_end')}
                            </p>
                        </InnerCard>

                        <InnerCard>
                            <AdminLabel icon={CreditCard}>{t('billing.overview.payment_method')}</AdminLabel>
                            <p className="text-xl font-bold tracking-tight">{t('billing.payment_method.card')}</p>
                            <Button
                                variant="link"
                                size="sm"
                                className="p-0 h-auto text-xs mt-1 text-primary hover:text-primary/80"
                                onClick={handleUpdatePaymentMethod}
                            >
                                {t('billing.actions.update_payment')}
                            </Button>
                        </InnerCard>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-6 border-t">
                        <Button
                            variant="outline"
                            className="rounded-xl px-6"
                            onClick={() => setIsChangePlanDialogOpen(true)}
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            {t('billing.actions.change_plan')}
                        </Button>
                        <Button
                            variant="outline"
                            className="rounded-xl px-6"
                            onClick={handleUpdatePaymentMethod}
                        >
                            <CreditCard className="w-4 h-4 mr-2" />
                            {t('billing.actions.update_payment')}
                        </Button>
                        {subscription.status === 'active' && (
                            <Button
                                variant="destructive"
                                className="rounded-xl px-6"
                                onClick={() => setIsCancelDialogOpen(true)}
                            >
                                {t('billing.actions.cancel_subscription')}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </DashboardSection>

            {/* Payment History */}
            <DashboardSection>
                <SectionHeader
                    title={t('billing.history.title')}
                    description={t('billing.history.subtitle')}
                    icon={RefreshCw}
                />
                <CardContent>
                    {payments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>{t('billing.history.empty')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('billing.history.table.date')}</TableHead>
                                        <TableHead>{t('billing.history.table.description')}</TableHead>
                                        <TableHead>{t('billing.history.table.amount')}</TableHead>
                                        <TableHead>{t('billing.history.table.status')}</TableHead>
                                        <TableHead className="text-right">{t('billing.history.table.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((payment) => (
                                        <TableRow key={payment._id}>
                                            <TableCell className="font-medium">
                                                {formatDate(payment.createdAt)}
                                            </TableCell>
                                            <TableCell>{payment.description}</TableCell>
                                            <TableCell>
                                                {(payment.amount / 100).toLocaleString('es-MX', {
                                                    style: 'currency',
                                                    currency: payment.currency.toUpperCase(),
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={payment.status === 'paid' ? 'default' : 'destructive'}
                                                    className={payment.status === 'paid' ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300' : ''}
                                                >
                                                    {payment.status === 'paid' ? t('billing.history.status.paid') : t('billing.history.status.failed')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" disabled>
                                                    <Download className="w-4 h-4 mr-2" />
                                                    {t('billing.history.download')}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </DashboardSection>

            {/* Cancel Subscription Dialog */}
            <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('billing.cancel.title')}</DialogTitle>
                        <DialogDescription>
                            {t('billing.cancel.description')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                                        {t('billing.cancel.warning')}
                                    </p>
                                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                        {t('billing.cancel.info', { date: formatDate(subscription.currentPeriodEnd) })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button variant="destructive" onClick={handleCancelSubscription}>
                            {t('billing.cancel.confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Plan Dialog */}
            <Dialog open={isChangePlanDialogOpen} onOpenChange={setIsChangePlanDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('billing.change_plan.title')}</DialogTitle>
                        <DialogDescription>
                            {t('billing.change_plan.description')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-3">
                        <Card
                            className="cursor-pointer hover:border-primary transition-colors"
                            onClick={() => toast.info(t('common.coming_soon') || "Esta funcionalidad estará disponible próximamente.")}
                        >
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold">{t('billing.plan.monthly')}</h4>
                                        <p className="text-2xl font-bold mt-1">$349 <span className="text-sm text-muted-foreground">MXN/mes</span></p>
                                    </div>
                                    <Button variant="outline">{t('billing.change_plan.select')}</Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card
                            className="cursor-pointer hover:border-primary transition-colors"
                            onClick={() => toast.info(t('common.coming_soon') || "Esta funcionalidad estará disponible próximamente.")}
                        >
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold">{t('billing.plan.annual')}</h4>
                                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                {t('billing.plan.save_badge')}
                                            </Badge>
                                        </div>
                                        <p className="text-2xl font-bold mt-1">$3,490 <span className="text-sm text-muted-foreground">MXN/año</span></p>
                                        <p className="text-xs text-muted-foreground mt-1">{t('billing.plan.annual_savings')}</p>
                                    </div>
                                    <Button variant="outline">{t('billing.change_plan.select')}</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsChangePlanDialogOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

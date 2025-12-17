import { useTranslation } from 'react-i18next';
import { AlertCircle, Clock, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import useAuth from '@/auth/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortalSession } from '@/api/stripeApi';
import { toast } from 'sonner';

export function ExpirationBanner() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();

    if (!user) return null;

    const now = new Date();

    // Check for Past Due Subscription (Critical)
    const isPastDue = user.subscriptionPastDue;

    // Check for Trial expiring soon (Warning)
    // Only show if in trial and less than 3 days remaining
    let isTrialExpiringSoon = false;
    let daysRemaining = 0;

    if (user.trialEndsAt && !user.subscriptionExpired && !user.subscriptionPastDue) {
        const trialEndDate = new Date(user.trialEndsAt);
        const diffTime = trialEndDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Show if 3 days or less (but not expired)
        if (diffDays <= 3 && diffDays >= 0) {
            isTrialExpiringSoon = true;
            daysRemaining = diffDays;
        }
    }

    if (!isPastDue && !isTrialExpiringSoon) return null;

    const handleAction = async () => {
        if (isPastDue && user.businessId) {
            try {
                // Redirect to Billing Portal for past_due subscriptions
                const response = await createPortalSession(user.businessId);
                if (response.success && response.data.url) {
                    window.location.href = response.data.url;
                    return;
                }
            } catch (error) {
                console.error("Failed to create portal session", error);
                toast.error(t('errors.stripe_portal_failed') || "Error connecting to Stripe Portal");
            }
        }
        // Default action: Go to pricing (for trial users or errors)
        navigate('/#pricing');
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="w-full relative z-50"
            >
                {isPastDue ? (
                    // Red Banner - Past Due
                    <div className="bg-red-600 text-white px-4 py-3 shadow-md">
                        <div className="container mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-full">
                                    <AlertCircle className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm sm:text-base">
                                        {t('banners.past_due.title')}
                                    </p>
                                    <p className="text-xs sm:text-sm text-red-100 hidden sm:block">
                                        {t('banners.past_due.message')}
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={handleAction}
                                size="sm"
                                variant="secondary"
                                className="bg-white text-red-600 hover:bg-red-50 font-semibold whitespace-nowrap w-full sm:w-auto"
                            >
                                <CreditCard className="w-4 h-4 mr-2" />
                                {t('banners.past_due.action')}
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Yellow/Orange Banner - Trial Ending
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-3 shadow-md">
                        <div className="container mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-full">
                                    <Clock className="w-5 h-5 text-white animate-pulse" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm sm:text-base">
                                        {t('banners.trial_ending.title', { days: daysRemaining })}
                                    </p>
                                    <p className="text-xs sm:text-sm text-orange-100 hidden sm:block">
                                        {t('banners.trial_ending.message')}
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={handleAction}
                                size="sm"
                                variant="secondary"
                                className="bg-white text-orange-600 hover:bg-orange-50 font-semibold whitespace-nowrap w-full sm:w-auto"
                            >
                                {t('banners.trial_ending.action')}
                            </Button>
                        </div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}

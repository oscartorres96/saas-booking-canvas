import { useNavigate } from 'react-router-dom';
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
import { AlertCircle, Clock, CreditCard, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ExpiredModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    endsAt?: Date;
    isTrial?: boolean;
}

export function TrialExpiredModal({ open, onOpenChange, endsAt, isTrial = true }: ExpiredModalProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleRenewNow = () => {
        onOpenChange(false);
        navigate('/#pricing');
    };

    const handleContactSupport = () => {
        onOpenChange(false);
        navigate('/#demo');
    };

    const contentKey = isTrial ? 'trial_expired' : 'subscription_expired';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md overflow-hidden p-0 gap-0">
                {/* Header with Gradient Background */}
                <div className="relative bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-orange-950/30 dark:via-red-950/30 dark:to-pink-950/30 p-6 pb-8">
                    {/* Animated Background Blobs */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />

                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', duration: 0.5 }}
                        className="relative z-10"
                    >
                        <DialogHeader className="relative">
                            {/* Icon with Animation */}
                            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                                <motion.div
                                    animate={{
                                        rotate: [0, -10, 10, -10, 0],
                                        scale: [1, 1.1, 1, 1.1, 1]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatDelay: 1
                                    }}
                                >
                                    <Clock className="w-8 h-8 text-white" />
                                </motion.div>
                            </div>

                            <DialogTitle className="text-2xl text-center font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                                {t(`${contentKey}.title`)}
                            </DialogTitle>
                            <DialogDescription className="text-center text-base mt-2">
                                {t(`${contentKey}.subtitle`)}
                            </DialogDescription>
                        </DialogHeader>
                    </motion.div>
                </div>

                {/* Content Area */}
                <div className="p-6 space-y-4">
                    {/* End Date Info */}
                    {endsAt && (
                        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-500 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-medium text-orange-900 dark:text-orange-200">
                                        {t(`${contentKey}.expired_on`)}
                                    </p>
                                    <p className="text-orange-800 dark:text-orange-300 mt-1">
                                        {new Date(endsAt).toLocaleDateString('es-MX', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Benefits Message */}
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            {t(`${contentKey}.message`)}
                        </p>

                        {/* Features List */}
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                                    {t(`${contentKey}.benefits_title`)}
                                </p>
                            </div>
                            <ul className="space-y-2 text-xs text-blue-800 dark:text-blue-300">
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                    {t(`${contentKey}.benefit_1`)}
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                    {t(`${contentKey}.benefit_2`)}
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                    {t(`${contentKey}.benefit_3`)}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer with Actions */}
                <DialogFooter className="p-6 pt-0 flex-col sm:flex-col gap-2">
                    <Button
                        onClick={handleRenewNow}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                        size="lg"
                    >
                        <CreditCard className="w-4 h-4 mr-2" />
                        {t(`${contentKey}.renew_now`)}
                    </Button>

                    <Button
                        onClick={handleContactSupport}
                        variant="outline"
                        className="w-full"
                        size="lg"
                    >
                        {t(`${contentKey}.contact_support`)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

import React, { useState, useMemo } from 'react';
import {
    AlertCircle,
    ArrowRight,
    MessageCircle,
    Mail,
    Bell,
    CheckCircle,
    ChevronRight,
    RefreshCw,
    X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, differenceInDays } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { AdminLabel, InnerCard } from './DashboardBase';
import { Booking } from '@/api/bookingsApi';
import { CustomerAsset } from '@/api/customerAssetsApi';
import { notificationsApi } from '@/api/notificationsApi';

export type AttentionType = 'pending_booking' | 'pending_payment' | 'expiring_package';

export interface AttentionItem {
    id: string;
    type: AttentionType;
    data: Booking | CustomerAsset;
    status: 'OPEN' | 'REMINDER_SENT' | 'HANDLED';
    expiresAt?: Date;
    client: {
        id?: string;
        name?: string;
        email: string;
        phone?: string;
    };
    revenueAtRisk?: number;
    lastReminderSentAt?: Date;
}

interface AttentionItemCardProps {
    item: AttentionItem;
    onViewBooking: (booking: Booking) => void;
    onViewCustomer: (email: string) => void;
    onHandle: (id: string) => void;
    onRenew?: (asset: CustomerAsset) => void;
}

export const AttentionItemCard = ({
    item,
    onViewBooking,
    onViewCustomer,
    onHandle,
    onRenew
}: AttentionItemCardProps) => {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'en' ? enUS : es;
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [lastRemindTime, setLastRemindTime] = useState<Date | undefined>(item.lastReminderSentAt);
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    const isPackage = item.type === 'expiring_package';
    const clientName = item.client.name || item.client.email;

    const timeLabel = useMemo(() => {
        if (!item.expiresAt) return null;
        const days = differenceInDays(item.expiresAt, new Date());
        if (days > 0) {
            return t('dashboard.bookings.attention.expires_in', { days });
        } else {
            return t('dashboard.bookings.attention.expired_days_ago', { days: Math.abs(days) });
        }
    }, [item.expiresAt, t]);

    const handleAction = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (item.type === 'pending_booking' || item.type === 'pending_payment') {
            onViewBooking(item.data as Booking);
        } else {
            setIsContactModalOpen(true);
        }
    };

    const handleRemind = (e: React.MouseEvent) => {
        e.stopPropagation();
        const now = new Date();
        if (lastRemindTime && (now.getTime() - lastRemindTime.getTime()) < 24 * 60 * 60 * 1000) {
            toast.error(t('dashboard.bookings.attention.remind.cooldown'));
            return;
        }
        // Mock send
        setLastRemindTime(now);
        toast.success(t('dashboard.bookings.attention.remind.sent'));
    };

    const handleMarkHandled = (e: React.MouseEvent) => {
        e.stopPropagation();
        onHandle(item.id);
        toast(t('common.saved'), {
            action: {
                label: t('dashboard.bookings.attention.actions.undo'),
                onClick: () => {
                    // This is handled in the parent via state
                }
            }
        });
    };

    const whatsappTemplate = t('dashboard.bookings.attention.contact.template', {
        name: clientName,
        when: timeLabel?.toLowerCase() || ''
    });

    const handleWhatsApp = () => {
        if (!item.client.phone) {
            toast.error(t('dashboard.bookings.attention.contact.phone_missing'));
            return;
        }
        const cleanPhone = item.client.phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappTemplate)}`, '_blank');
    };

    const handleEmail = async () => {
        try {
            setIsSendingEmail(true);
            const subject = t('dashboard.bookings.attention.expiring_package');
            const message = t('dashboard.bookings.attention.contact.template', {
                name: clientName,
                when: timeLabel?.toLowerCase() || ''
            });

            await notificationsApi.sendReminder({
                to: item.client.email,
                clientName: clientName,
                message: message,
                subject: subject
            });

            toast.success(t('dashboard.bookings.attention.contact.email_sent'));
            setIsContactModalOpen(false);
        } catch (error) {
            console.error('Error sending email:', error);
            toast.error(t('dashboard.bookings.attention.contact.email_error'));
        } finally {
            setIsSendingEmail(false);
        }
    };

    return (
        <>
            <div
                className="bg-white/5 hover:bg-white/10 transition-all rounded-2xl p-4 cursor-pointer group border border-white/5 hover:border-white/20 relative"
                onClick={handleAction}
            >
                <div className="flex items-start gap-3">
                    <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border",
                        isPackage ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-primary/10 border-primary/20 text-primary"
                    )}>
                        <AlertCircle className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-white truncate pr-2">
                                {t(`dashboard.bookings.attention.${item.type}`)}
                            </h4>
                            <Badge variant="outline" className="text-[9px] font-black uppercase bg-white/5 border-white/10 text-white/70">
                                {isPackage ? t('dashboard.tabs.catalog') : t('dashboard.tabs.dashboard')}
                            </Badge>
                        </div>

                        <div className="mt-1 flex flex-col gap-0.5">
                            <p className="text-xs font-medium text-slate-100 truncate">
                                {clientName}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                                {timeLabel || item.client.email}
                                {item.revenueAtRisk && (
                                    <span className="ml-2 text-amber-400/80">
                                        • {t('dashboard.bookings.attention.revenue_at_risk', {
                                            amount: new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'MXN' }).format(item.revenueAtRisk)
                                        })}
                                    </span>
                                )}
                            </p>
                        </div>

                        {/* Actions Row */}
                        <div className="mt-4 flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isPackage ? (
                                <>
                                    <Button
                                        size="sm"
                                        className="h-7 text-[10px] font-bold px-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                                        onClick={(e) => { e.stopPropagation(); setIsContactModalOpen(true); }}
                                    >
                                        <MessageCircle className="h-3 w-3 mr-1.5" />
                                        {t('dashboard.bookings.attention.actions.contact')}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-[10px] font-bold px-2 rounded-lg bg-white/5 border-white/10 hover:bg-white/10 text-white"
                                        onClick={(e) => { e.stopPropagation(); onRenew?.(item.data as CustomerAsset); }}
                                    >
                                        <RefreshCw className="h-3 w-3 mr-1.5" />
                                        {t('dashboard.bookings.attention.actions.renew')}
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    size="sm"
                                    className="h-7 text-[10px] font-bold px-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                                    onClick={handleAction}
                                >
                                    <ChevronRight className="h-3 w-3 mr-1.5" />
                                    {t('common.details')}
                                </Button>
                            )}

                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-[10px] font-bold px-2 rounded-lg text-slate-400 hover:text-white"
                                onClick={handleRemind}
                            >
                                <Bell className="h-3 w-3 mr-1.5" />
                                {t('dashboard.bookings.attention.actions.remind')}
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-[10px] font-bold px-2 rounded-lg text-slate-500 hover:text-red-400"
                                onClick={handleMarkHandled}
                            >
                                <CheckCircle className="h-3 w-3 mr-1.5" />
                                {t('dashboard.bookings.attention.actions.handle')}
                            </Button>
                        </div>
                    </div>

                    <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                </div>
            </div>

            {/* Contact Modal */}
            <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-slate-950 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-primary" />
                            {t('dashboard.bookings.attention.contact.title', { name: clientName })}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {t('dashboard.bookings.attention.contact.template', { name: clientName, when: timeLabel?.toLowerCase() || '' })}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 gap-3 py-4">
                        <Button
                            variant="outline"
                            className="bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20 justify-start h-12 rounded-xl"
                            onClick={handleWhatsApp}
                        >
                            <MessageCircle className="h-5 w-5 mr-3" />
                            <div className="text-left">
                                <p className="font-bold text-sm">{t('dashboard.bookings.attention.contact.whatsapp')}</p>
                                <p className="text-[10px] opacity-70">{item.client.phone || t('dashboard.bookings.attention.contact.phone_missing')}</p>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 justify-start h-12 rounded-xl"
                            onClick={handleEmail}
                            disabled={isSendingEmail}
                        >
                            {isSendingEmail ? (
                                <RefreshCw className="h-5 w-5 mr-3 animate-spin" />
                            ) : (
                                <Mail className="h-5 w-5 mr-3" />
                            )}
                            <div className="text-left">
                                <p className="font-bold text-sm">{t('dashboard.bookings.attention.contact.email')}</p>
                                <p className="text-[10px] opacity-70">
                                    {isSendingEmail ? t('common.sending') || 'Enviando...' : item.client.email}
                                </p>
                            </div>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

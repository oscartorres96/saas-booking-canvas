import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { leadsApi } from '../../api/leadsApi';
import { useToast } from '../ui/use-toast';
import { Loader2 } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface DemoRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const DemoRequestDialog = ({ open, onOpenChange }: DemoRequestDialogProps) => {
    const { t, i18n } = useTranslation();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await leadsApi.requestDemo({
                ...formData,
                language: i18n.language
            });

            toast({
                title: t('landing.demo_modal.success_title'),
                description: t('landing.demo_modal.success_desc'),
            });
            onOpenChange(false);
            setFormData({ name: '', email: '', phone: '', company: '', message: '' });
        } catch (error) {
            console.error(error);
            toast({
                title: t('landing.demo_modal.error_title'),
                description: t('landing.demo_modal.error_desc'),
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('landing.demo_modal.title')}</DialogTitle>
                    <DialogDescription>
                        {t('landing.demo_modal.subtitle')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t('landing.demo_modal.name_label')}</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder={t('landing.demo_modal.name_placeholder')}
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">{t('landing.demo_modal.email_label')}</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder={t('landing.demo_modal.email_placeholder')}
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">{t('landing.demo_modal.phone_label')}</Label>
                        <PhoneInput
                            country={i18n.language === 'es' ? 'mx' : 'us'}
                            enableSearch
                            countryCodeEditable={false}
                            value={formData.phone}
                            onChange={(phone) => setFormData(prev => ({ ...prev, phone }))}
                            placeholder={t('landing.demo_modal.phone_placeholder')}
                            containerClass="w-full"
                            inputClass="!w-full !h-10 !bg-background !border !border-input !rounded-md !pl-14 !text-foreground focus:!border-primary focus:!ring-2 focus:!ring-primary/20 transition-colors"
                            buttonClass="!h-10 !bg-background !border !border-input !rounded-l-md !px-3"
                            dropdownClass="!bg-popover !text-foreground !shadow-lg !border !rounded-md !z-50"
                            inputStyle={{ paddingLeft: "3.5rem" }}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="company">{t('landing.demo_modal.company_label')}</Label>
                        <Input
                            id="company"
                            name="company"
                            placeholder={t('landing.demo_modal.company_placeholder')}
                            value={formData.company}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="message">{t('landing.demo_modal.message_label')}</Label>
                        <Textarea
                            id="message"
                            name="message"
                            placeholder={t('landing.demo_modal.message_placeholder')}
                            value={formData.message}
                            onChange={handleChange}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('landing.demo_modal.submit_btn')}
                            </>
                        ) : (
                            t('landing.demo_modal.submit_btn')
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

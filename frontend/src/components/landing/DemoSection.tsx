import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useState } from 'react';
import { toast } from 'sonner';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

export const DemoSection = ({ id }: { id?: string }) => {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [phone, setPhone] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const form = e.target as HTMLFormElement;
        const name = (form.elements.namedItem('name') as HTMLInputElement).value;
        const email = (form.elements.namedItem('email') as HTMLInputElement).value;
        const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value;

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/leads/demo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    message,
                    language: i18n.language,
                    source: 'landing_page_demo_section'
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error submitting form');
            }

            toast.success(t('landing.demo.success'));
            form.reset();
            setPhone('');
        } catch (error: any) {
            console.error('Error submitting demo request:', error);
            toast.error(error.message || t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id={id} className="py-12 sm:py-16 md:py-20 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-xl mx-auto">
                    <div className="text-center mb-6 sm:mb-8 md:mb-10">
                        <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">{t('landing.demo.title')}</h2>
                        <p className="text-sm sm:text-base text-muted-foreground">{t('landing.demo.subtitle')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 bg-background p-4 sm:p-6 md:p-8 rounded-xl border shadow-sm">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('landing.demo.name_label')}</Label>
                            <Input id="name" required placeholder={t('landing.demo.name_placeholder')} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">{t('landing.demo.email_label')}</Label>
                            <Input id="email" type="email" required placeholder={t('landing.demo.email_placeholder')} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">{t('landing.demo.phone_label')}</Label>
                            <PhoneInput
                                country={i18n.language === 'es' ? 'mx' : 'us'}
                                enableSearch
                                countryCodeEditable={false}
                                value={phone}
                                onChange={(phone) => setPhone(phone)}
                                placeholder={t('landing.demo.phone_placeholder')}
                                containerClass="w-full"
                                inputClass="!w-full !h-10 !bg-background !border !border-input !rounded-md !pl-14 !text-foreground focus:!border-primary focus:!ring-2 focus:!ring-primary/20 transition-colors"
                                buttonClass="!h-10 !bg-background !border !border-input !rounded-l-md !px-3"
                                dropdownClass="!bg-popover !text-foreground !shadow-lg !border !rounded-md !z-50"
                                inputStyle={{ paddingLeft: "3.5rem" }}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">{t('landing.demo.message_label')}</Label>
                            <Textarea id="message" placeholder={t('landing.demo.message_placeholder')} />
                        </div>

                        <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" size="lg" disabled={loading}>
                            {loading ? t('common.loading') : t('landing.demo.submit_btn')}
                        </Button>
                    </form>
                </div>
            </div>
        </section>
    );
};

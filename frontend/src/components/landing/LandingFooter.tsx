import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';

export const LandingFooter = () => {
    const { t } = useTranslation();

    const footerSections = [
        {
            title: t('landing.footer.product.title'),
            links: [
                { label: t('landing.footer.product.features'), href: '#features' },
                { label: t('landing.footer.product.pricing'), href: '#pricing' },
                { label: t('landing.footer.product.demo'), href: '/login' },
            ],
        },
        {
            title: t('landing.footer.company.title'),
            links: [
                { label: t('landing.footer.company.about'), href: '#about' },
                { label: t('landing.footer.company.contact'), href: '#contact' },
                { label: t('landing.footer.company.blog'), href: '#blog' },
            ],
        },
        {
            title: t('landing.footer.legal.title'),
            links: [
                { label: t('landing.footer.legal.privacy'), href: '#privacy' },
                { label: t('landing.footer.legal.terms'), href: '#terms' },
                { label: t('landing.footer.legal.cookies'), href: '#cookies' },
            ],
        },
    ];

    return (
        <footer className="bg-muted/30 border-t">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand Column */}
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center mb-4">
                            <img
                                src="/brand-icon.png"
                                alt="BookPro"
                                className="h-8 w-8 mr-2"
                            />
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                BookPro
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            {t('landing.footer.tagline')}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <a
                                href="mailto:oscartorres0396@gmail.com"
                                className="hover:text-foreground transition-colors"
                            >
                                {t('landing.footer.contact.email')}
                            </a>
                        </div>
                    </div>

                    {/* Footer Links */}
                    {footerSections.map((section) => (
                        <div key={section.title}>
                            <h3 className="font-semibold mb-4">{section.title}</h3>
                            <ul className="space-y-2">
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        <a
                                            href={link.href}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Copyright */}
                <div className="pt-8 border-t text-center">
                    <p className="text-sm text-muted-foreground">
                        {t('landing.footer.copyright')}
                    </p>
                </div>
            </div>
        </footer>
    );
};

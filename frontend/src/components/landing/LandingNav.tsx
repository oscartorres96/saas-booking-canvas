import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { DemoRequestDialog } from './DemoRequestDialog';
import { ThemeToggle } from '../ThemeToggle';

export const LandingNav = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [isDemoOpen, setIsDemoOpen] = useState(false);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b"
        >
            <div className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 gap-2">
                    {/* Logo */}
                    <div className="flex items-center">
                        <img
                            src="/brand-icon.png"
                            alt="BookPro"
                            className="h-8 w-8 mr-2"
                        />
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            BookPro
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        <button
                            onClick={() => scrollToSection('benefits')}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {t('landing.nav.benefits')}
                        </button>
                        <button
                            onClick={() => scrollToSection('how-it-works')}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {t('landing.nav.how_it_works')}
                        </button>
                        <button
                            onClick={() => scrollToSection('features')}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {t('landing.nav.features')}
                        </button>
                    </div>

                    {/* CTA + Language Selector */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Language Selector */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
                                    <Globe className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => changeLanguage('es')}>
                                    🇪🇸 Español
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => changeLanguage('en')}>
                                    🇺🇸 English
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Login - Hidden on mobile */}
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/login')}
                            className="hidden sm:flex text-sm px-3 md:px-4 h-9 md:h-10"
                        >
                            {t('landing.nav.login')}
                        </Button>

                        {/* Demo Button */}
                        <Button
                            onClick={() => setIsDemoOpen(true)}
                            className="text-xs sm:text-sm px-3 md:px-4 h-9 md:h-10 whitespace-nowrap"
                        >
                            Demo
                        </Button>
                    </div>
                </div>
            </div>
            <DemoRequestDialog open={isDemoOpen} onOpenChange={setIsDemoOpen} />
        </motion.nav>
    );
};

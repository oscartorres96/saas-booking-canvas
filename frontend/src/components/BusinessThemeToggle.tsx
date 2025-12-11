
import { Moon, Sun, Monitor, Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { Button } from './ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface BusinessThemeToggleProps {
    hasCustomTheme?: boolean;
}

export function BusinessThemeToggle({ hasCustomTheme = false }: BusinessThemeToggleProps) {
    const { theme, setTheme } = useTheme();
    const { t } = useTranslation();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="ios-btn"
                >
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <Palette className="absolute h-[1.2rem] w-[1.2rem] rotate-0 scale-0 transition-all custom:rotate-0 custom:scale-100" />
                    <span className="sr-only">{t('theme.toggle')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card">
                <DropdownMenuItem
                    onClick={() => setTheme('light')}
                    className={theme === 'light' ? 'bg-primary/10' : ''}
                >
                    <Sun className="mr-2 h-4 w-4" />
                    <span>{t('theme.light')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme('dark')}
                    className={theme === 'dark' ? 'bg-primary/10' : ''}
                >
                    <Moon className="mr-2 h-4 w-4" />
                    <span>{t('theme.dark')}</span>
                </DropdownMenuItem>
                {hasCustomTheme && (
                    <DropdownMenuItem
                        onClick={() => setTheme('custom')}
                        className={theme === 'custom' ? 'bg-primary/10' : ''}
                    >
                        <Palette className="mr-2 h-4 w-4" />
                        <span>{t('theme.custom')}</span>
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem
                    onClick={() => setTheme('system')}
                    className={theme === 'system' ? 'bg-primary/10' : ''}
                >
                    <Monitor className="mr-2 h-4 w-4" />
                    <span>{t('theme.system')}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

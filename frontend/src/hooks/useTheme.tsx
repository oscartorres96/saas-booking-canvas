import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    actualTheme: 'light' | 'dark'; // El tema que realmente se está aplicando
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        // Intentar obtener el tema guardado en localStorage
        const stored = localStorage.getItem('theme') as Theme;
        return stored || 'system';
    });

    const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const root = window.document.documentElement;

        // Remover clases anteriores
        root.classList.remove('light', 'dark');

        let resolvedTheme: 'light' | 'dark';

        if (theme === 'system') {
            // Detectar preferencia del sistema
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
            resolvedTheme = systemTheme;
        } else {
            resolvedTheme = theme;
        }

        // Aplicar la clase del tema
        root.classList.add(resolvedTheme);
        setActualTheme(resolvedTheme);

        // Guardar en localStorage
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Escuchar cambios en la preferencia del sistema
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            const root = window.document.documentElement;
            root.classList.remove('light', 'dark');
            const newTheme = e.matches ? 'dark' : 'light';
            root.classList.add(newTheme);
            setActualTheme(newTheme);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

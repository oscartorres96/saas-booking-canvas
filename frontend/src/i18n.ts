
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import es from './locales/es.json';
import en from './locales/en.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            es: {
                translation: es,
            },
            en: {
                translation: en,
            },
        },
        fallbackLng: 'es',
        supportedLngs: ['es', 'en'],
        // Load language variants like en-US or es-MX and map them to base language
        load: 'languageOnly', // Will convert 'en-US' to 'en', 'es-MX' to 'es'
        interpolation: {
            escapeValue: false, // react already safes from xss
        },
        detection: {
            // Order of detection: 
            // 1. localStorage - if user manually selected a language
            // 2. navigator - browser language preference
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng', // Key to store language in localStorage
        },
    });

export default i18n;

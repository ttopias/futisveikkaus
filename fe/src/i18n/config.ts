import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import ns1 from './en/namespace.json';

export const defaultNS = 'ns1';

i18next.use(initReactI18next).init({
    lng: 'en', // if you're using a language detector, do not define the lng option
    debug: true,
    resources: {
        en: {
            ns1,
        },
    },
    defaultNS,
});
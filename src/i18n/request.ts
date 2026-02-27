import { getRequestConfig } from 'next-intl/server';
import { getUserLocale } from '../services/locale';

export default getRequestConfig(async () => {
    const locale = await getUserLocale();
    const messages = (await import(`../../translations/${locale}.json`)).default;
    // Load English as fallback for missing keys
    const enMessages = locale !== 'en'
        ? (await import(`../../translations/en.json`)).default
        : messages;

    return {
        locale,
        timeZone: 'Asia/Muscat',
        messages,
        onError(error) {
            // Silently handle missing messages in production
            if (process.env.NODE_ENV === 'development') {
                console.warn('Server translation error:', error);
            }
        },
        getMessageFallback({ key, namespace }) {
            const fullKey = namespace ? `${namespace}.${key}` : key;
            // Try English fallback
            const enValue = fullKey.split('.').reduce((obj: any, k: string) => obj?.[k], enMessages);
            return typeof enValue === 'string' ? enValue : fullKey;
        }
    };
});

"use client";
import { NextIntlClientProvider } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import { loadZodLocale } from '@/lib/zod-locale';

// Static imports for all 20 locales - required for Next.js build
import enMessages from '@/translations/en.json';
import arMessages from '@/translations/ar.json';
import zhMessages from '@/translations/zh.json';
import esMessages from '@/translations/es.json';
import frMessages from '@/translations/fr.json';
import deMessages from '@/translations/de.json';
import ptMessages from '@/translations/pt.json';
import ruMessages from '@/translations/ru.json';
import jaMessages from '@/translations/ja.json';
import koMessages from '@/translations/ko.json';
import hiMessages from '@/translations/hi.json';
import trMessages from '@/translations/tr.json';
import itMessages from '@/translations/it.json';
import nlMessages from '@/translations/nl.json';
import plMessages from '@/translations/pl.json';
import thMessages from '@/translations/th.json';
import viMessages from '@/translations/vi.json';
import idMessages from '@/translations/id.json';
import msMessages from '@/translations/ms.json';
import urMessages from '@/translations/ur.json';

// Map of all available translations (20 languages)
const translationMap: Record<string, any> = {
  en: enMessages,
  ar: arMessages,
  zh: zhMessages,
  es: esMessages,
  fr: frMessages,
  de: deMessages,
  pt: ptMessages,
  ru: ruMessages,
  ja: jaMessages,
  ko: koMessages,
  hi: hiMessages,
  tr: trMessages,
  it: itMessages,
  nl: nlMessages,
  pl: plMessages,
  th: thMessages,
  vi: viMessages,
  id: idMessages,
  ms: msMessages,
  ur: urMessages,
};

interface LocaleProviderProps {
  children: React.ReactNode;
  initialMessages: any;
  initialLocale: string;
}

export default function LocaleProvider({
  children,
  initialMessages,
  initialLocale
}: LocaleProviderProps) {
  // Get auth context safely - it should be available since LocaleProvider is inside AuthProvider
  const auth = useAuth();
  const selectedLocale = auth?.selectedLocale || initialLocale;

  // Initialize with initialMessages, fallback to translation map if needed
  const getInitialMessages = () => {
    if (initialMessages && typeof initialMessages === 'object' && Object.keys(initialMessages).length > 0) {
      return initialMessages;
    }
    return translationMap[initialLocale] || translationMap['en'] || {};
  };

  // Initialize messages with proper validation - ensure we always have valid messages
  const initialMessagesValue = getInitialMessages();

  // Ensure initialMessagesValue is never empty
  const validatedInitialMessages = (initialMessagesValue && Object.keys(initialMessagesValue).length > 0)
    ? initialMessagesValue
    : (translationMap['ar'] || {});

  const [messages, setMessages] = useState(validatedInitialMessages);
  const [locale, setLocale] = useState(initialLocale);

  // Set Zod locale on initial load
  useEffect(() => {
    loadZodLocale(initialLocale);
  }, [initialLocale]);

  useEffect(() => {
    if (selectedLocale && selectedLocale !== locale && typeof window !== 'undefined') {
      // Get messages from static import map
      const newMessages = translationMap[selectedLocale];
      if (newMessages && Object.keys(newMessages).length > 0) {
        setMessages(newMessages);
        setLocale(selectedLocale);
        // Update Zod locale when language changes
        loadZodLocale(selectedLocale);
      } else {
        console.warn(`Translation file for locale "${selectedLocale}" not found. Falling back to current locale.`);
      }
    }
  }, [selectedLocale, locale]);

  // Compute current messages - always guaranteed to have valid messages
  const currentMessages = useMemo(() => {
    // First try current messages state
    if (messages && typeof messages === 'object' && Object.keys(messages).length > 0) {
      return messages;
    }
    // Then try translation map for current locale
    if (locale && translationMap[locale] && Object.keys(translationMap[locale]).length > 0) {
      return translationMap[locale];
    }
    // Finally fallback to Arabic (default language)
    return translationMap['ar'] || {};
  }, [messages, locale]);

  const currentLocale = locale || 'ar';

  // Fallback: when a message key is missing, try English before returning the key
  const getMessageFallback = useMemo(() => {
    return ({ key, namespace }: { key: string; namespace?: string; error: Error }) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      // Try to find the key in English messages as fallback
      const enValue = fullKey.split('.').reduce((obj: any, k: string) => obj?.[k], translationMap['en']);
      return typeof enValue === 'string' ? enValue : fullKey;
    };
  }, []);

  // Ensure messages object is not empty - render children without provider as last resort
  if (!currentMessages || typeof currentMessages !== 'object' || Object.keys(currentMessages).length === 0) {
    console.error('LocaleProvider: No valid messages found. This is a critical error.');
    return <>{children}</>;
  }

  return (
    <NextIntlClientProvider
      messages={currentMessages}
      locale={currentLocale}
      timeZone="Asia/Muscat"
      onError={(error) => {
        // Silently handle missing messages - fallback will provide English text
        if (process.env.NODE_ENV === 'development') {
          console.warn('Translation error:', error);
        }
      }}
      getMessageFallback={getMessageFallback}
    >
      {children}
    </NextIntlClientProvider>
  );
}

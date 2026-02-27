'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

const translationCache = new Map<string, string>();
const pendingRequests = new Map<string, Promise<string>>();

export function useAsyncDynamicTranslation() {
  const { selectedLocale } = useAuth();
  const [translations, setTranslations] = useState<Map<string, string>>(new Map());

  // Translate for any non-English locale
  const shouldTranslate = selectedLocale !== 'en' && !!selectedLocale;
  const activeLocale = selectedLocale || 'ar';

  const translate = useCallback(async (text: string | null | undefined): Promise<string> => {
    if (!text || !text.trim()) return text || '';
    if (!shouldTranslate) return text;

    const cacheKey = `${activeLocale}_${text.trim()}`;

    // Return cached translation
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }

    // Return existing pending request
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey)!;
    }

    // Create new translation request
    const translationPromise = fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim(),
        to: activeLocale,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // Check if translation was successful
        if (!data.success && data.error) {
          // Cache original text to avoid retrying
          translationCache.set(cacheKey, text);
          pendingRequests.delete(cacheKey);
          return text;
        }

        const translated = data.translatedText || text;
        translationCache.set(cacheKey, translated);
        setTranslations((prev) => {
          const newMap = new Map(prev);
          newMap.set(cacheKey, translated);
          return newMap;
        });
        pendingRequests.delete(cacheKey);
        return translated;
      })
      .catch((error) => {
        console.error('Translation error:', error);
        translationCache.set(cacheKey, text); // Cache original to avoid retrying
        pendingRequests.delete(cacheKey);
        return text;
      });

    pendingRequests.set(cacheKey, translationPromise);
    return translationPromise;
  }, [shouldTranslate, activeLocale]);

  const translateBatch = useCallback(async (texts: (string | null | undefined)[]): Promise<string[]> => {
    if (!shouldTranslate) {
      return texts.map((t) => t || '');
    }

    const uniqueTexts = Array.from(new Set(texts.filter(Boolean) as string[]));
    const results = await Promise.all(uniqueTexts.map(translate));

    // Create a map for quick lookup
    const resultMap = new Map<string, string>();
    uniqueTexts.forEach((text, index) => {
      resultMap.set(text, results[index]);
    });

    return texts.map((text) => resultMap.get(text || '') || text || '');
  }, [shouldTranslate, translate]);

  return {
    translate,
    translateBatch,
    translations,
  };
}

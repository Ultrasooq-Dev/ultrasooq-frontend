'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

// Global cache and pending translations (shared across all instances)
// Cache key format: `${locale}_${text}` to support multiple languages
const clientCache = new Map<string, string>();
const pendingTranslations = new Map<string, Promise<string>>();

// Load cache from localStorage on initialization
const CACHE_KEY_PREFIX = 'translation_cache_';
const MAX_CACHE_SIZE = 1000; // Limit cache size per language

let currentCacheLocale = '';

function loadCacheForLocale(locale: string) {
  if (typeof window === 'undefined' || locale === currentCacheLocale) return;

  currentCacheLocale = locale;

  try {
    const storedCache = localStorage.getItem(`${CACHE_KEY_PREFIX}${locale}`);
    if (storedCache) {
      const parsed = JSON.parse(storedCache);
      Object.entries(parsed).forEach(([key, value]) => {
        if (typeof value === 'string') {
          clientCache.set(key, value);
        }
      });
    }
  } catch (error) {
    console.warn('Failed to load translation cache from localStorage:', error);
  }
}

// Save cache to localStorage periodically
const saveCacheToStorage = (locale: string) => {
  if (typeof window === 'undefined') return;

  try {
    const prefix = `${locale}_`;
    const cacheObject: Record<string, string> = {};
    let count = 0;
    for (const [key, value] of clientCache.entries()) {
      if (count >= MAX_CACHE_SIZE) break;
      if (key.startsWith(prefix)) {
        cacheObject[key] = value;
        count++;
      }
    }
    localStorage.setItem(`${CACHE_KEY_PREFIX}${locale}`, JSON.stringify(cacheObject));
  } catch (error) {
    console.warn('Failed to save translation cache to localStorage:', error);
  }
};

// Save cache every 30 seconds or when cache size changes significantly
let lastSaveTime = Date.now();
const SAVE_INTERVAL = 30000; // 30 seconds

// Debounce timer for batching requests
let debounceTimer: NodeJS.Timeout | null = null;
let globalQueue = new Set<string>();
let isProcessing = false;
let currentQueueLocale = 'en';

interface UseDynamicTranslationReturn {
  translate: (text: string | null | undefined) => string;
  isTranslating: boolean;
}

// Process translation queue with debouncing and batching
const processTranslationQueue = async (
  locale: string,
  setTranslatedTexts: React.Dispatch<React.SetStateAction<Map<string, string>>>,
  setIsTranslating: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (isProcessing || globalQueue.size === 0) {
    return;
  }

  isProcessing = true;
  setIsTranslating(true);

  // Get unique texts from queue
  const queue = Array.from(globalQueue);
  globalQueue.clear();

  // Filter out already cached or pending translations
  const textsToTranslate = queue.filter((text) => {
    const cacheKey = `${locale}_${text.trim()}`;
    return !clientCache.has(cacheKey) && !pendingTranslations.has(cacheKey);
  });

  if (textsToTranslate.length === 0) {
    isProcessing = false;
    setIsTranslating(false);
    return;
  }

  try {
    const cachedResults: Array<{ text: string; translated: string }> = [];
    const uncachedTexts: string[] = [];

    textsToTranslate.forEach((text) => {
      const cacheKey = `${locale}_${text.trim()}`;

      if (clientCache.has(cacheKey)) {
        cachedResults.push({ text, translated: clientCache.get(cacheKey)! });
        return;
      }

      if (pendingTranslations.has(cacheKey)) {
        return;
      }

      uncachedTexts.push(text);
    });

    // Handle pending translations
    const pendingResults = await Promise.all(
      textsToTranslate
        .filter((text) => {
          const cacheKey = `${locale}_${text.trim()}`;
          return pendingTranslations.has(cacheKey) && !clientCache.has(cacheKey);
        })
        .map(async (text) => {
          const cacheKey = `${locale}_${text.trim()}`;
          const translated = await pendingTranslations.get(cacheKey)!;
          return { text, translated };
        })
    );

    // Batch translate uncached texts in a single API call
    let batchResults: Array<{ text: string; translated: string }> = [];

    if (uncachedTexts.length > 0) {
      const batchPromise = fetch('/api/translate/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: uncachedTexts,
          to: locale,
        }),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Translation failed: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (!data.success && data.error) {
            return uncachedTexts.map((t) => ({ originalText: t, translatedText: t }));
          }
          return data.translations || [];
        })
        .catch((error) => {
          console.error('Batch translation error:', error);
          return uncachedTexts.map((t) => ({ originalText: t, translatedText: t }));
        });

      // Store promise for each text to prevent duplicate requests
      uncachedTexts.forEach((text) => {
        const cacheKey = `${locale}_${text.trim()}`;
        const textPromise = batchPromise.then((results) => {
          const result = results.find((r: any) => r.originalText === text.trim());
          return result?.translatedText || text;
        });
        pendingTranslations.set(cacheKey, textPromise);
      });

      // Wait for batch translation
      const batchTranslations = await batchPromise;

      // Process results
      batchResults = uncachedTexts.map((text) => {
        const cacheKey = `${locale}_${text.trim()}`;
        const result = batchTranslations.find((r: any) => r.originalText === text.trim());
        const translated = result?.translatedText || text;

        clientCache.set(cacheKey, translated);

        const now = Date.now();
        if (now - lastSaveTime > SAVE_INTERVAL) {
          saveCacheToStorage(locale);
          lastSaveTime = now;
        }

        pendingTranslations.delete(cacheKey);

        return { text, translated };
      });
    }

    // Combine all results
    const translations = [...cachedResults, ...pendingResults, ...batchResults];

    // Save cache to localStorage if new translations were added
    if (batchResults.length > 0 || pendingResults.length > 0) {
      saveCacheToStorage(locale);
      lastSaveTime = Date.now();
    }

    // Update state with all translations at once
    setTranslatedTexts((prev) => {
      const newMap = new Map(prev);
      translations.forEach(({ text, translated }) => {
        const cacheKey = `${locale}_${text.trim()}`;
        newMap.set(cacheKey, translated);
      });
      return newMap;
    });
  } catch (error) {
    console.error('Batch translation error:', error);
  } finally {
    isProcessing = false;
    setIsTranslating(false);
  }
};

export function useDynamicTranslation(): UseDynamicTranslationReturn {
  const { selectedLocale } = useAuth();
  const [translatedTexts, setTranslatedTexts] = useState<Map<string, string>>(new Map());
  const [isTranslating, setIsTranslating] = useState(false);
  const componentIdRef = useRef<string>(Math.random().toString(36).substring(7));

  // Translate for any non-English locale
  const shouldTranslate = selectedLocale !== 'en' && !!selectedLocale;
  const activeLocale = selectedLocale || 'ar';

  // Load cache for current locale
  useEffect(() => {
    if (shouldTranslate) {
      loadCacheForLocale(activeLocale);
    }
  }, [shouldTranslate, activeLocale]);

  // Debounced queue processor
  const scheduleTranslation = useCallback(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    currentQueueLocale = activeLocale;

    debounceTimer = setTimeout(() => {
      processTranslationQueue(currentQueueLocale, setTranslatedTexts, setIsTranslating);
      debounceTimer = null;
    }, 150);
  }, [activeLocale]);

  const translate = useCallback((text: string | null | undefined): string => {
    if (!text || !text.trim()) return '';
    if (!shouldTranslate) return text;

    const trimmedText = text.trim();
    const cacheKey = `${activeLocale}_${trimmedText}`;

    // Return cached translation if available
    if (clientCache.has(cacheKey)) {
      return clientCache.get(cacheKey)!;
    }

    // Return translated text from state if available
    if (translatedTexts.has(cacheKey)) {
      return translatedTexts.get(cacheKey)!;
    }

    // Check if already in queue or pending
    if (!globalQueue.has(trimmedText) && !pendingTranslations.has(cacheKey)) {
      globalQueue.add(trimmedText);
      scheduleTranslation();
    }

    // Return original text immediately
    return text;
  }, [shouldTranslate, activeLocale, translatedTexts, scheduleTranslation]);

  // Clear component state when locale changes
  useEffect(() => {
    if (!shouldTranslate) {
      setTranslatedTexts(new Map());
    }
  }, [shouldTranslate, activeLocale]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Component-specific cleanup if needed
    };
  }, []);

  return {
    translate,
    isTranslating,
  };
}

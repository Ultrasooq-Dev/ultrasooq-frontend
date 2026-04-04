import { NextRequest, NextResponse } from 'next/server';

// Supported target languages for dynamic content translation
const SUPPORTED_LANGUAGES = new Set([
  'ar', 'zh-CN', 'es', 'fr', 'de', 'pt', 'ru', 'ja', 'ko',
  'hi', 'tr', 'it', 'nl', 'pl', 'th', 'vi', 'id', 'ms', 'ur',
]);

// Map locale codes to Google Translate codes
const LOCALE_TO_GOOGLE: Record<string, string> = {
  zh: 'zh-CN',
};

function getGoogleLangCode(locale: string): string {
  return LOCALE_TO_GOOGLE[locale] || locale;
}

// Simple in-memory cache with LRU-like cleanup
const translationCache = new Map<string, string>();
const MAX_CACHE_SIZE = 10000;

/**
 * Direct Google Translate API call (no library dependency).
 */
async function translateDirect(text: string, targetLang: string): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible)',
    },
  });

  if (!res.ok) {
    throw new Error(`Google Translate HTTP ${res.status}`);
  }

  const data = await res.json();
  let translated = '';
  if (data && data[0]) {
    for (const segment of data[0]) {
      if (segment[0]) translated += segment[0];
    }
  }

  if (!translated) {
    throw new Error('Empty translation result');
  }

  return translated;
}

export async function POST(request: NextRequest) {
  let requestTexts: string[] = [];
  let requestTo = 'ar';

  try {
    const body = await request.json();
    requestTexts = Array.isArray(body.texts) ? body.texts : [];
    requestTo = body.to || 'ar';

    if (!requestTexts.length || !requestTo) {
      return NextResponse.json(
        { error: 'Texts array and target language (to) are required' },
        { status: 400 }
      );
    }

    // If target is English, return as-is
    if (requestTo === 'en') {
      return NextResponse.json({
        success: true,
        translations: requestTexts.map(text => ({
          originalText: text,
          translatedText: text,
        })),
      });
    }

    const googleLangCode = getGoogleLangCode(requestTo);

    // If language is not supported, return original texts
    if (!SUPPORTED_LANGUAGES.has(googleLangCode)) {
      return NextResponse.json({
        success: true,
        translations: requestTexts.map(text => ({
          originalText: text,
          translatedText: text,
        })),
      });
    }

    // Process translations in parallel, checking cache first
    const translationPromises = requestTexts.map(async (text) => {
      const trimmedText = text.trim();
      if (!trimmedText) {
        return { originalText: text, translatedText: text };
      }

      const cacheKey = `${trimmedText}_${googleLangCode}`;

      // Check cache first
      if (translationCache.has(cacheKey)) {
        return {
          originalText: text,
          translatedText: translationCache.get(cacheKey)!,
          cached: true,
        };
      }

      try {
        const translatedText = await translateDirect(trimmedText, googleLangCode);

        // Cache the result (with LRU cleanup)
        if (translationCache.size >= MAX_CACHE_SIZE) {
          const firstKey = translationCache.keys().next().value;
          if (firstKey) translationCache.delete(firstKey);
        }
        translationCache.set(cacheKey, translatedText);

        return {
          originalText: text,
          translatedText,
        };
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : 'Translation error';
        console.error('Translation error for:', trimmedText.substring(0, 50), errMsg);
        translationCache.set(cacheKey, text);
        return { originalText: text, translatedText: text };
      }
    });

    const translations = await Promise.all(translationPromises);

    return NextResponse.json({
      success: true,
      translations,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Translation failed';
    console.error('Batch translation error:', errMsg);
    return NextResponse.json({
      success: false,
      translations: requestTexts.map(text => ({
        originalText: text,
        translatedText: text,
      })),
      error: errMsg,
    }, { status: 500 });
  }
}

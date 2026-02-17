import { NextRequest, NextResponse } from 'next/server';

// Supported target languages for dynamic content translation
const SUPPORTED_LANGUAGES = new Set([
  'ar', 'zh-CN', 'es', 'fr', 'de', 'pt', 'ru', 'ja', 'ko',
  'hi', 'tr', 'it', 'nl', 'pl', 'th', 'vi', 'id', 'ms', 'ur',
]);

// Map locale codes to Google Translate codes
const LOCALE_TO_GOOGLE: Record<string, string> = {
  zh: 'zh-CN',
  // All others map 1:1
};

// Simple in-memory cache with LRU-like cleanup
const translationCache = new Map<string, string>();
const MAX_CACHE_SIZE = 10000;

function getGoogleLangCode(locale: string): string {
  return LOCALE_TO_GOOGLE[locale] || locale;
}

/**
 * Direct Google Translate API call (no library dependency).
 * Uses the same endpoint as the Google Translate web client.
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
  let requestText = '';
  let requestTo = 'ar';

  try {
    const body = await request.json();
    requestText = body.text || '';
    requestTo = body.to || 'ar';

    if (!requestText || !requestTo) {
      return NextResponse.json(
        { error: 'Text and target language (to) are required' },
        { status: 400 }
      );
    }

    // If target is English, return as-is (source is English)
    if (requestTo === 'en') {
      return NextResponse.json({
        success: true,
        originalText: requestText,
        translatedText: requestText,
        from: 'en',
        to: 'en',
      });
    }

    const googleLangCode = getGoogleLangCode(requestTo);

    // Check if language is supported
    if (!SUPPORTED_LANGUAGES.has(googleLangCode)) {
      return NextResponse.json({
        success: true,
        originalText: requestText,
        translatedText: requestText,
        from: 'en',
        to: requestTo,
        note: 'Unsupported language, returning original',
      });
    }

    // Check cache first
    const cacheKey = `${requestText.trim()}_${googleLangCode}`;
    if (translationCache.has(cacheKey)) {
      return NextResponse.json({
        success: true,
        originalText: requestText,
        translatedText: translationCache.get(cacheKey),
        from: 'en',
        to: requestTo,
        cached: true,
      });
    }

    // Translate using direct Google Translate API
    let translatedText: string;
    try {
      translatedText = await translateDirect(requestText.trim(), googleLangCode);
    } catch (translateError: unknown) {
      const errMsg = translateError instanceof Error ? translateError.message : 'Translation service error';
      return NextResponse.json({
        success: false,
        originalText: requestText,
        translatedText: requestText,
        error: errMsg,
      }, { status: 500 });
    }

    // Cache the result (with LRU cleanup)
    if (translationCache.size >= MAX_CACHE_SIZE) {
      const firstKey = translationCache.keys().next().value;
      if (firstKey) translationCache.delete(firstKey);
    }
    translationCache.set(cacheKey, translatedText);

    return NextResponse.json({
      success: true,
      originalText: requestText,
      translatedText,
      from: 'en',
      to: requestTo,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Translation failed';
    return NextResponse.json({
      success: false,
      originalText: requestText,
      translatedText: requestText,
      error: errMsg,
    }, { status: 500 });
  }
}

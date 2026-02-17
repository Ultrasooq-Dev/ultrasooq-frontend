'use server';

import translate from 'google-translate-api-x';

const serverCache = new Map<string, string>();

/**
 * Translates text to Arabic (server-side only)
 * @param text - The text to translate
 * @returns The translated text in Arabic, or original text if translation fails
 */
export async function translateToArabic(text: string | null | undefined): Promise<string> {
  if (!text || !text.trim()) return text || '';

  const cacheKey = `ar_${text.trim()}`;
  
  if (serverCache.has(cacheKey)) {
    return serverCache.get(cacheKey)!;
  }

  try {
    const result = await translate(text.trim(), {
      from: 'auto',
      to: 'ar',
    });

    serverCache.set(cacheKey, result.text);
    return result.text;
  } catch (error) {
    console.error('Server translation error:', error);
    // Cache original text to avoid retrying
    serverCache.set(cacheKey, text);
    return text;
  }
}

/**
 * Translates multiple texts to Arabic in batch (server-side only)
 * @param texts - Array of texts to translate
 * @returns Array of translated texts
 */
export async function translateBatchToArabic(
  texts: (string | null | undefined)[]
): Promise<string[]> {
  const uniqueTexts = Array.from(new Set(texts.filter(Boolean) as string[]));
  const results = await Promise.all(uniqueTexts.map(translateToArabic));
  
  // Create a map for quick lookup
  const resultMap = new Map<string, string>();
  uniqueTexts.forEach((text, index) => {
    resultMap.set(text, results[index]);
  });

  return texts.map((text) => resultMap.get(text || '') || text || '');
}

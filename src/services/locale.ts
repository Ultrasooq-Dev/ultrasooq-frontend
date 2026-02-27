'use server';

import { cookies } from 'next/headers';

// In this example the locale is read from a cookie. You could alternatively
// also read it from a database, backend service, or any other source.
const COOKIE_NAME = 'ULTRASOOQ_LOCALE';

// Supported locales — must match the translation files in /translations/
const SUPPORTED_LOCALES = new Set([
  'en', 'ar', 'zh', 'es', 'fr', 'de', 'pt', 'ru', 'ja', 'ko',
  'hi', 'tr', 'it', 'nl', 'pl', 'th', 'vi', 'id', 'ms', 'ur',
]);

export async function getUserLocale() {
  const cookieStore = await cookies();
  const locale = cookieStore.get(COOKIE_NAME)?.value || 'en';
  // Validate locale against supported list to prevent import errors
  return SUPPORTED_LOCALES.has(locale) ? locale : 'en';
}

export async function setUserLocale(locale: string) {
  if (SUPPORTED_LOCALES.has(locale)) {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
    });
  }
}

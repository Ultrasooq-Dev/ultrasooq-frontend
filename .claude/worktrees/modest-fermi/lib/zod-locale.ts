import * as z from "zod";

// Map app locales to Zod v4 built-in locale keys
const zodLocaleMap: Record<string, keyof typeof z.locales> = {
  en: "en",
  ar: "ar",
  zh: "zhCN",
  es: "es",
  fr: "fr",
  de: "de",
  pt: "pt",
  ru: "ru",
  ja: "ja",
  ko: "ko",
  tr: "tr",
  it: "it",
  nl: "nl",
  pl: "pl",
  th: "th",
  vi: "vi",
  id: "id",
  ms: "ms",
  ur: "ur",
};

export function loadZodLocale(locale: string) {
  const zodKey = zodLocaleMap[locale];
  if (zodKey && z.locales[zodKey]) {
    z.config(z.locales[zodKey]());
  } else {
    // Fallback to English
    z.config(z.locales.en());
  }
}

/** Shared i18n primitives (safe to import from server and client code). */

/** The nine official languages of the main-series games. The codes double as
 * PokéAPI `language.name` values, so API-side name lookups localize for free. */
export type Lang =
  | "es"
  | "en"
  | "fr"
  | "de"
  | "it"
  | "ja"
  | "ko"
  | "zh-Hans"
  | "zh-Hant";

export const LANGS: Lang[] = [
  "es",
  "en",
  "fr",
  "de",
  "it",
  "ja",
  "ko",
  "zh-Hans",
  "zh-Hant",
];
export const DEFAULT_LANG: Lang = "es";

/** English display name per language, for the header selector. */
export const LANG_LABELS: Record<Lang, string> = {
  es: "Spanish",
  en: "English",
  fr: "French",
  de: "German",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  "zh-Hans": "Chinese (Simplified)",
  "zh-Hant": "Chinese (Traditional)",
};

/** Compact code per language, for the phone-width header selector: a native
 * <select> shows its selected option verbatim, so the narrow header needs its
 * own set of labels rather than a truncated "Chinese (Simplified)". */
export const LANG_CODES: Record<Lang, string> = {
  es: "ES",
  en: "EN",
  fr: "FR",
  de: "DE",
  it: "IT",
  ja: "JA",
  ko: "KO",
  "zh-Hans": "ZH-S",
  "zh-Hant": "ZH-T",
};

/** Cookie names for the user's language and theme choices. Read by the root
 * layout on the server (SSR renders the right variant, no flash) and written
 * by the header toggles on the client. */
export const LANG_COOKIE = "lang";
export const THEME_COOKIE = "theme";

export type Theme = "dark" | "light";
export const DEFAULT_THEME: Theme = "dark";

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as string[]).includes(value);
}

export function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light";
}

/** `og:locale` per UI language: same locale, underscored as Open Graph wants. */
export function ogLocale(lang: Lang): string {
  return LOCALE[lang].replace("-", "_");
}

/** Intl locale per UI language (dates, list joins…). */
export const LOCALE: Record<Lang, string> = {
  es: "es-ES",
  en: "en-US",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
  ja: "ja-JP",
  ko: "ko-KR",
  "zh-Hans": "zh-CN",
  "zh-Hant": "zh-TW",
};

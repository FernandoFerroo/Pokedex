import { cookies } from "next/headers";
import {
  DEFAULT_LANG,
  DEFAULT_THEME,
  isLang,
  isTheme,
  LANG_COOKIE,
  THEME_COOKIE,
  type Lang,
  type Theme,
} from "./config";

/** Language for the current request. Note: reading cookies opts the route
 * into dynamic rendering — accepted trade-off so SSR always matches the
 * user's choice (PokéAPI data stays cached underneath). */
export async function getLang(): Promise<Lang> {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(value) ? value : DEFAULT_LANG;
}

export async function getTheme(): Promise<Theme> {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return isTheme(value) ? value : DEFAULT_THEME;
}

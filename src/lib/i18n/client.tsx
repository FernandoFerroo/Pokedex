"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { LANG_COOKIE, type Lang } from "./config";
import { getDict, type Dict } from "./index";

interface I18nContextValue {
  lang: Lang;
  dict: Dict;
  setLang: (lang: Lang) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/** Mounted once in the root layout with the SSR-resolved language. Switching
 * writes the cookie and refreshes the server tree, so server components
 * (daily banner, detail pages) re-render in the new language too. */
export function I18nProvider({
  lang,
  children,
}: {
  lang: Lang;
  children: ReactNode;
}) {
  const router = useRouter();

  const setLang = useCallback(
    (next: Lang) => {
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = next;
      router.refresh();
    },
    [router],
  );

  const value = useMemo(
    () => ({ lang, dict: getDict(lang), setLang }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

/** Shorthand for the common case: `const t = useT(); t.home.dailyTitle` */
export function useT(): Dict {
  return useI18n().dict;
}

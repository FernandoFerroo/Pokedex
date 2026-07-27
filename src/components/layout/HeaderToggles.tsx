"use client";

import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import {
  LANG_CODES,
  LANG_LABELS,
  LANGS,
  THEME_COOKIE,
  type Lang,
  type Theme,
} from "@/lib/i18n/config";

/**
 * Header controls for theme (dark by default) and language (Spanish by
 * default). Theme is pure CSS: flipping `data-theme` on <html> is enough, so
 * no refresh is needed. Language lives in the i18n provider, which also
 * refreshes the server tree so server-rendered copy switches too.
 */
export function ThemeToggle({ initial }: { initial: Theme }) {
  const [theme, setTheme] = useState<Theme>(initial);
  const { dict } = useI18n();

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  };

  const label =
    theme === "dark" ? dict.layout.themeToLight : dict.layout.themeToDark;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      // 44px square on phones: the WCAG 2.5.8 target size, which the 2.25rem
      // desktop chip misses once the mobile rem base shrinks it.
      className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-600/60 bg-black/30 text-slate-300 transition hover:border-amber-300/70 hover:text-amber-300 hover:shadow-[0_0_12px_-2px_rgba(251,191,36,0.5)] sm:h-9 sm:w-9"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

/**
 * A native <select> renders the selected option's text as-is, so a full
 * "Chinese (Traditional)" cannot be shortened by CSS for the phone header —
 * it just overflows it. Hence two selects over the same state: compact codes
 * below `sm`, full language names from `sm` up. Only one is ever visible, and
 * `aria-hidden` + `tabIndex={-1}` on the hidden one keeps assistive tech and
 * the Tab order seeing a single control.
 */
export function LangToggle() {
  const { lang, setLang, dict } = useI18n();

  const shared =
    "cursor-pointer rounded-md border border-slate-600/60 bg-black/30 font-mono font-bold text-slate-300 uppercase transition hover:border-amber-300/70 hover:text-amber-300 focus:border-amber-300/70 focus:outline-none [&>option]:bg-[#0a101d] [&>option]:text-slate-200 [&>option]:normal-case";

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setLang(e.target.value as Lang);

  return (
    <>
      <select
        value={lang}
        onChange={onChange}
        aria-label={dict.layout.langSwitchAria}
        title={dict.layout.langSwitchAria}
        className={`${shared} h-11 w-[4.25rem] px-1 text-xs sm:hidden`}
      >
        {LANGS.map((code: Lang) => (
          <option key={code} value={code}>
            {LANG_CODES[code]}
          </option>
        ))}
      </select>
      <select
        value={lang}
        onChange={onChange}
        aria-hidden
        tabIndex={-1}
        className={`${shared} hidden h-9 w-[14.5rem] px-2 text-xs tracking-widest sm:block`}
      >
        {LANGS.map((code: Lang) => (
          <option key={code} value={code}>
            {LANG_LABELS[code]}
          </option>
        ))}
      </select>
    </>
  );
}

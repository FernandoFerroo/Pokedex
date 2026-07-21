"use client";

import { Moon, Sun } from "lucide-react";

/**
 * Toggles the `.dark` class on <html> and persists the choice. Which icon is
 * visible is driven purely by CSS (`dark:` variants), so the component needs
 * no state and cannot mismatch during hydration.
 */
export function ThemeToggle() {
  return (
    <button
      type="button"
      aria-label="Cambiar entre modo claro y oscuro"
      onClick={() => {
        const isDark = document.documentElement.classList.toggle("dark");
        localStorage.setItem("theme", isDark ? "dark" : "light");
      }}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
    >
      <Sun size={16} className="hidden dark:block" />
      <Moon size={16} className="dark:hidden" />
    </button>
  );
}

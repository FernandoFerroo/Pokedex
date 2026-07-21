import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800/60 dark:bg-[#020409]/85">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-full bg-red-600 ring-4 ring-red-600/15"
          />
          <span className="text-lg font-semibold tracking-tight">Pokédex</span>
          <span className="mt-0.5 hidden text-xs text-slate-400 sm:block dark:text-slate-500">
            Base de datos nacional
          </span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}

import Link from "next/link";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = getDict(await getLang()).layout;
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center"
    >
      <p className="glitch neon-red font-pixel text-5xl">404</p>
      <p className="font-pixel text-xs text-slate-300">{t.notFoundFled}</p>
      <p className="max-w-sm font-mono text-sm text-slate-400">
        {t.notFoundBody}
      </p>
      <Link
        href="/"
        className="mt-2 rounded-md border border-red-500/60 bg-red-500/10 px-4 py-2 font-mono text-sm font-semibold tracking-wider text-red-300 uppercase transition hover:bg-red-500/20 hover:shadow-[0_0_18px_-2px_rgba(239,68,68,0.6)]"
      >
        {t.notFoundBack}
      </Link>
    </main>
  );
}

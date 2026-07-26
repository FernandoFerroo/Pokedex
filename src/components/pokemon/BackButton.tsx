import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Lang } from "@/lib/i18n/config";
import { getDict } from "@/lib/i18n";

/**
 * Always lands on the home listing — never walks browser history, so hopping
 * between evolutions (or arriving from a shared link) still exits in one tap.
 */
export function BackButton({ lang }: { lang: Lang }) {
  const d = getDict(lang).detail;
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 rounded-md border border-red-500/60 bg-red-500/10 px-4 py-2 font-mono text-sm font-bold tracking-widest text-red-300 uppercase shadow-[0_0_14px_-4px_rgba(239,68,68,0.6)] transition hover:border-red-400 hover:bg-red-500/20 hover:text-red-200 hover:shadow-[0_0_20px_-2px_rgba(239,68,68,0.8)]"
    >
      <ArrowLeft size={18} />
      {d.backToDex}
    </Link>
  );
}

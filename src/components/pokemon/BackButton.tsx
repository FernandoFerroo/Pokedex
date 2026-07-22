"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Goes back in history so the listing keeps its URL query params (filters and
 * search). Falls back to the plain listing on direct/deep-linked visits.
 */
export function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push("/");
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-black/40 px-2.5 py-1.5 font-mono text-xs tracking-widest text-slate-400 uppercase transition hover:border-red-500/60 hover:text-red-400 hover:shadow-[0_0_12px_-2px_rgba(239,68,68,0.5)]"
    >
      <ArrowLeft size={14} />
      Volver al listado
    </button>
  );
}

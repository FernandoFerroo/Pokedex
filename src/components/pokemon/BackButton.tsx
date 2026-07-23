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
      className="inline-flex items-center gap-2 rounded-md border border-red-500/60 bg-red-500/10 px-4 py-2 font-mono text-sm font-bold tracking-widest text-red-300 uppercase shadow-[0_0_14px_-4px_rgba(239,68,68,0.6)] transition hover:border-red-400 hover:bg-red-500/20 hover:text-red-200 hover:shadow-[0_0_20px_-2px_rgba(239,68,68,0.8)]"
    >
      <ArrowLeft size={18} />
      Volver a la Pokédex
    </button>
  );
}

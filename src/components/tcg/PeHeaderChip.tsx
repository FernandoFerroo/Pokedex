"use client";

import Link from "next/link";
import { Coins } from "lucide-react";
import { useTcg } from "@/components/tcg/TcgProvider";
import { useT } from "@/lib/i18n/client";

/**
 * El saldo de PE en la cabecera, junto al indicador de conexión.
 *
 * Los PE se ganan en el torneo y se gastan en la tienda del álbum —dos
 * pantallas que no se ven a la vez—, así que sin esto nadie sabe cuánto lleva
 * encima hasta entrar en la tienda. En ámbar, como los PE en todo el modo
 * colección, y enlazado a la tienda: enseñar el saldo invita a gastarlo.
 *
 * Calla con un guion hasta que el provider lee el almacenamiento: pintar «0 PE»
 * antes de hidratar sería mentir a quien tiene saldo.
 *
 * Aparece a partir de `xl`, que es donde la cabecera tiene hueco de verdad:
 * entre el selector de idioma (14.5rem), el equipo y los conmutadores, por
 * debajo de 1280px un control más parte el rótulo de la marca —«PO…» en el
 * móvil, y el lema a dos líneas en la tableta—. En pantallas estrechas el
 * saldo sigue estando donde se gasta, en la tienda del álbum.
 */
export function PeHeaderChip() {
  const t = useT().tcg;
  const { collection, hydrated } = useTcg();

  return (
    <Link
      href="/album?view=shop"
      className="hidden items-center gap-2 rounded-md border border-amber-400/40 bg-amber-400/[0.07] px-3 py-1.5 font-mono text-xs tracking-[0.2em] text-amber-200 uppercase transition hover:border-amber-300/70 hover:bg-amber-400/15 hover:shadow-[0_0_14px_-2px_rgba(251,191,36,0.6)] xl:inline-flex"
    >
      <Coins size={14} aria-hidden className="text-amber-300" />
      <span className="sr-only">{t.balanceLabel}: </span>
      <span className="font-bold text-amber-300">
        {hydrated ? t.balance(collection.pe) : "—"}
      </span>
    </Link>
  );
}

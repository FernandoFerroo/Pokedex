"use client";

import { BookOpen, PackageOpen, Store } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { AlbumView } from "@/hooks/use-album-filters";
import { ALBUM_SIZE } from "@/lib/tcg/totals";
import { useT } from "@/lib/i18n/client";

/**
 * Con quién habla la tienda.
 *
 * El sobre recién comprado sale volando de la tienda hacia esta pestaña, y para
 * apuntar necesita su nodo. Un `id` y un evento son todo el contrato: la tienda
 * no importa esta barra ni la barra conoce la tienda, así que ninguna de las dos
 * se rompe si la otra deja de estar en pantalla.
 */
export const PACKS_TAB_ID = "album-tab-packs";
export const PACK_LANDED_EVENT = "tcg:pack-landed";

/** Lo que dura el latido de la pestaña al recibir un sobre. */
const LANDING_MS = 720;

/**
 * La navegación del modo colección: tres tarjetas neón, no tres pastillas.
 *
 * Son la portada de la sección y no un ajuste dentro de ella, así que ocupan lo
 * que ocupa una portada. Cada una lleva además su cifra viva —fundas llenas,
 * sobres esperando, PE en el bolsillo—, que es lo que decide a cuál se entra:
 * con tres sobres sin abrir nadie quiere empezar por la tienda.
 *
 * Un color por pestaña, y no el cian de la activa para las tres, porque es el
 * mismo idioma que ya habla el resto del modo: cian el álbum, violeta los
 * sobres —como el Sobre Maestro— y ámbar la tienda, como los PE que gasta.
 */
const TABS: ReadonlyArray<{
  view: AlbumView;
  Icon: typeof BookOpen;
  edge: string;
}> = [
  { view: "album", Icon: BookOpen, edge: "#22d3ee" },
  { view: "packs", Icon: PackageOpen, edge: "#a855f7" },
  { view: "shop", Icon: Store, edge: "#fbbf24" },
];

export function AlbumTabs({
  view,
  owned,
  packsWaiting,
  pe,
  hydrated,
  onSelect,
}: {
  view: AlbumView;
  /** Especies conseguidas, para el contador de la pestaña del álbum. */
  owned: number;
  packsWaiting: number;
  pe: number;
  /** Falso hasta leer la colección: los contadores callan en vez de mentir. */
  hydrated: boolean;
  onSelect: (view: AlbumView) => void;
}) {
  const t = useT().tcg;

  // El acuse de recibo de la compra: la pestaña se enciende cuando el sobre
  // que viene volando de la tienda aterriza en ella.
  const [landing, setLanding] = useState(false);
  const timer = useRef(0);

  useEffect(() => {
    const onLanded = () => {
      window.clearTimeout(timer.current);
      setLanding(true);
      timer.current = window.setTimeout(() => setLanding(false), LANDING_MS);
    };
    window.addEventListener(PACK_LANDED_EVENT, onLanded);
    return () => {
      window.removeEventListener(PACK_LANDED_EVENT, onLanded);
      window.clearTimeout(timer.current);
    };
  }, []);

  const label: Record<AlbumView, string> = {
    album: t.tabAlbumLabel,
    packs: t.tabPacksLabel,
    shop: t.tabShopLabel,
  };
  /** En el móvil el rótulo largo se parte en tres líneas dentro de un tercio
   *  de pantalla, así que ahí manda el corto de siempre. */
  const shortLabel: Record<AlbumView, string> = {
    album: t.viewAlbum,
    packs: t.viewPacks,
    shop: t.viewShop,
  };
  const hint: Record<AlbumView, string> = {
    album: hydrated ? t.ctaProgress(owned, ALBUM_SIZE) : `— / ${ALBUM_SIZE}`,
    packs: hydrated ? t.ctaPacks(packsWaiting) : "",
    shop: hydrated ? t.balance(pe) : "",
  };

  return (
    <nav aria-label={t.tabsAria}>
      {/* Tres columnas también en el móvil: la barra encoge, no se apila. Una
          columna dejaría los sobres y la tienda por debajo del pliegue, que es
          exactamente el problema que esta barra viene a resolver. */}
      <ul className="grid grid-cols-3 gap-1.5 sm:gap-3">
        {TABS.map(({ view: tab, Icon, edge }) => {
          const active = view === tab;
          return (
            <li key={tab}>
              <button
                type="button"
                id={tab === "packs" ? PACKS_TAB_ID : undefined}
                onClick={() => onSelect(tab)}
                aria-pressed={active}
                data-landing={tab === "packs" && landing ? "true" : undefined}
                style={{ "--edge": edge } as CSSProperties}
                className="album-tab group"
              >
                <Icon
                  size={22}
                  aria-hidden
                  className="album-tab__icon shrink-0"
                />
                <span className="album-tab__label sm:hidden">
                  {shortLabel[tab]}
                </span>
                <span className="album-tab__label max-sm:hidden">
                  {label[tab]}
                </span>
                {hint[tab] && (
                  <span className="album-tab__hint">{hint[tab]}</span>
                )}

                {/* El contador de sobres sin abrir. Va en la pestaña y no
                    dentro de ella porque su trabajo es que se entre: quien no
                    sabe que tiene tres sobres no los abre. */}
                {tab === "packs" && hydrated && packsWaiting > 0 && (
                  <span aria-hidden className="album-tab__badge">
                    ×{packsWaiting}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

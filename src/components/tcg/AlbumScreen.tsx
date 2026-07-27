"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { Layers, SlidersHorizontal } from "lucide-react";
import type { PackResult, PackType, PoolCard, Rarity } from "@/types/tcg";
import { RARITY_ORDER } from "@/types/tcg";
import type { PokemonIndex } from "@/types/pokemon";
import { useTcg } from "@/components/tcg/TcgProvider";
import { useAlbumFilters, type AlbumView } from "@/hooks/use-album-filters";
import { hasCard, ownedIndices } from "@/lib/tcg/encode";
import { CARDS, raritiesOfSpecies } from "@/lib/tcg/pool";
import { openPack } from "@/lib/tcg/pull";
import { typeAura, typeLabel } from "@/lib/pokemon-meta";
import { useI18n, useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { AlbumBinder, type BinderSlot } from "./AlbumBinder";
import type { SleeveEntry } from "./AlbumSleeve";
import { AlbumTabs } from "./AlbumTabs";
import { CollectionProgress } from "./CollectionProgress";
import { CardZoom } from "./CardZoom";
import { PackOpener } from "./PackOpener";
import { PackShelf } from "./PackShelf";
import { PackShop } from "./PackShop";

const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Cristal esmerilado para los selectores de la barra de filtros. */
const controlClasses =
  "album-control h-10 rounded-full px-3.5 font-mono text-sm outline-none";

export function AlbumScreen({ index }: { index: PokemonIndex }) {
  const t = useT().tcg;
  const { lang } = useI18n();
  const { collection, hydrated, packsWaiting, spendPack, applyPull, buyPack } =
    useTcg();
  const [filters, setFilters] = useAlbumFilters();
  const [zoom, setZoom] = useState<PoolCard | null>(null);
  /**
   * El sobre en ceremonia, con un número de orden.
   *
   * El número no adorna: la ceremonia lleva su propio estado —por qué carta va,
   * si está girada, cuánto polvo se ha cobrado— y ese estado NO se reinicia
   * porque le cambien el sobre por la prop. Sin número, «abrir otro» heredaba
   * el punto en el que se quedó el anterior y el sobre nuevo aparecía en el
   * recuento, ya revelado. Como clave, cada sobre estrena ceremonia.
   */
  const [opening, setOpening] = useState<{
    result: PackResult;
    seq: number;
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  /** Las especies del catálogo, cruzadas con el índice de la Pokédex. */
  const entries = useMemo<SleeveEntry[]>(() => {
    const withCards = new Set(CARDS.map((card) => card.dexId));
    return index.entries
      .filter((entry) => withCards.has(entry.id))
      .map(({ id, name, types }) => ({ id, name, types }));
  }, [index]);

  const byId = useMemo(
    () => new Map(index.entries.map((entry) => [entry.id, entry])),
    [index],
  );

  /**
   * Las cartas conseguidas de cada especie, una por nivel.
   *
   * Por nivel y no sólo la mejor: quien tiene la Charizard común Y la Hyper
   * Rara tiene las dos, y un filtro de rareza que sólo mirase la mejor le diría
   * que no tiene ninguna común. Se recorre el catálogo una vez por cambio de
   * colección, no una vez por funda: mil búsquedas lineales al teclear en el
   * buscador serían perceptibles.
   */
  const ownedBySpecies = useMemo(() => {
    const bySpecies = new Map<number, Map<Rarity, PoolCard>>();
    for (const cardIndex of ownedIndices(collection.owned)) {
      const card = CARDS[cardIndex];
      if (!card) continue;
      let levels = bySpecies.get(card.dexId);
      if (!levels) bySpecies.set(card.dexId, (levels = new Map()));
      // Con dos cartas del mismo nivel se enseña la primera: son igual de
      // raras, y cambiar de ilustración al filtrar sería ruido.
      if (!levels.has(card.rarity)) levels.set(card.rarity, card);
    }
    return bySpecies;
  }, [collection.owned]);

  /** La mejor carta de cada especie: la que luce la funda sin filtro de nivel. */
  const bestBySpecies = useMemo(() => {
    const best = new Map<number, PoolCard>();
    for (const [dexId, levels] of ownedBySpecies) {
      for (const rarity of RARITY_ORDER) {
        const card = levels.get(rarity);
        // RARITY_ORDER va de menor a mayor, así que la última que exista gana.
        if (card) best.set(dexId, card);
      }
    }
    return best;
  }, [ownedBySpecies]);

  /** Todos los tipos presentes, para no inventar una lista aparte. */
  const types = useMemo(
    () =>
      Array.from(new Set(index.entries.flatMap((entry) => entry.types))).sort(),
    [index],
  );

  /**
   * Las fundas que pasan el filtro, cada una con la carta que le toca enseñar.
   *
   * El filtro de rareza se lee sobre el CATÁLOGO y no sobre lo conseguido: pedir
   * Hyper Rara deja las especies que tienen una —las haya conseguido o no—, y es
   * el filtro de estado el que decide si se enseñan las que ya están o las que
   * faltan. Al revés sería un filtro que sólo sabe hablar del pasado, y la lista
   * que uno quiere del álbum es justo la de lo que le queda por cazar.
   */
  const visible = useMemo(() => {
    const query = filters.q.trim().toLowerCase();
    const rarity = filters.rarity;
    const shown: BinderSlot[] = [];
    for (const entry of entries) {
      const meta = byId.get(entry.id);
      if (filters.gen !== null && meta?.generation !== filters.gen) continue;
      if (filters.type && !entry.types.includes(filters.type)) continue;
      if (query && !entry.name.includes(query)) continue;
      if (rarity && !raritiesOfSpecies(entry.id).has(rarity)) continue;
      // Con nivel elegido, «conseguida» significa conseguida DE ESE NIVEL, y la
      // funda enseña esa carta y no la mejor: si no, filtrar por común pintaría
      // un muestrario de Hyper Raras.
      const card = rarity
        ? (ownedBySpecies.get(entry.id)?.get(rarity) ?? null)
        : (bestBySpecies.get(entry.id) ?? null);
      if (filters.owned === "owned" && !card) continue;
      if (filters.owned === "missing" && card) continue;
      shown.push({ entry, card });
    }
    return shown;
  }, [entries, byId, filters, ownedBySpecies, bestBySpecies]);

  const owned = collection.speciesOwned;

  /**
   * La hoja abierta. Se recorta al pintar y no al escribir en la URL: al
   * quitar un filtro el álbum crece y la hoja 40 vuelve a existir, así que
   * guardarla recortada perdería el sitio para siempre.
   */
  const pageCount = Math.max(1, Math.ceil(visible.length / filters.sheet));
  const page = Math.min(Math.max(1, filters.page), pageCount);
  const slots = useMemo(
    () => visible.slice((page - 1) * filters.sheet, page * filters.sheet),
    [visible, page, filters.sheet],
  );

  /**
   * Abre un sobre: se sortea, se guarda y SÓLO ENTONCES empieza la ceremonia.
   * Si la animación fuese primero, recargar a mitad del revelado dejaría
   * repetir un sobre malo.
   */
  const open = useCallback(
    (type: PackType) => {
      if (!spendPack(type)) return;
      const result = openPack(type, collection.owned);
      const species = new Set(ownedBySpecies.keys());
      let cards = collection.cardsOwned;
      for (const card of result.cards) {
        if (!hasCard(collection.owned, card.index)) cards++;
        species.add(card.dexId);
      }
      applyPull(result, { species: species.size, cards });
      setOpening((prev) => ({ result, seq: (prev?.seq ?? 0) + 1 }));
    },
    [spendPack, collection, ownedBySpecies, applyPull],
  );

  const auraOf = useCallback(
    (dexId: number) => typeAura(byId.get(dexId)?.types[0]),
    [byId],
  );

  const activeFilters = [
    filters.gen !== null,
    Boolean(filters.type),
    Boolean(filters.rarity),
    Boolean(filters.owned),
    Boolean(filters.q),
  ].filter(Boolean).length;

  /**
   * Tocar un filtro devuelve a la primera hoja.
   *
   * Sin esto, buscar «pika» desde la hoja 60 dejaría el archivador abierto por
   * una hoja que ya no existe — y aunque el recorte de arriba lo salvaría, lo
   * que uno espera al filtrar es ver el resultado, no el final del resultado.
   */
  const setFilter = useCallback(
    (patch: Partial<Omit<typeof filters, "view" | "page" | "sheet">>) =>
      setFilters({ ...patch, page: 1 }),
    [setFilters],
  );

  return (
    // El archivador manda en el ancho de la página: es lo que se viene a
    // mirar, y a 72 rem la hoja de seis columnas dejaba cartas de 160 px. Todo
    // lo demás —cabecera, pestañas, filtros— se queda en el ancho de lectura
    // de siempre dentro del envoltorio de abajo: una barra de filtros de metro
    // y medio no se lee mejor por ser más larga.
    <div className="mx-auto w-full max-w-[92rem] px-3 py-5 max-sm:px-2 max-sm:py-2.5 sm:px-4">
      <div className="mx-auto w-full max-w-6xl">
        <Link
          href="/"
          className="font-mono text-xs text-slate-400 hover:text-slate-200"
        >
          {t.backToDex}
        </Link>

        <div className="mt-2 max-sm:mt-1">
          <CollectionProgress
            owned={owned}
            cards={collection.cardsOwned}
            hydrated={hydrated}
            claimed={collection.milestones}
          />
        </div>

        <div className="mt-4 max-sm:mt-2.5">
          <AlbumTabs
            view={filters.view}
            owned={owned}
            packsWaiting={packsWaiting}
            pe={collection.pe}
            hydrated={hydrated}
            onSelect={(view: AlbumView) => {
              setFilters({ view });
              setOpening(null);
            }}
          />
        </div>

        {filters.view === "packs" &&
          (opening ? (
            <PackOpener
              key={opening.seq}
              result={opening.result}
              auraOf={auraOf}
              onClose={() => setOpening(null)}
              onOpenAnother={
                (collection.packs[opening.result.type] ?? 0) > 0
                  ? () => open(opening.result.type)
                  : null
              }
            />
          ) : (
            <div className="mt-6 max-sm:mt-3">
              <PackShelf
                packs={collection.packs}
                hydrated={hydrated}
                onOpen={open}
              />
            </div>
          ))}

        {filters.view === "shop" && (
          <div className="mt-6 max-sm:mt-3">
            {/*
              Comprar ya NO salta a la estantería. El sobre comprado sale
              volando de la tienda y entra en la pestaña de Sobres, que se
              enciende con el contador subido: eso dice a dónde ha ido mejor que
              un cambio de pantalla, y deja seguir comprando —que es lo que hace
              cualquiera con PE de sobra— sin volver a la tienda entre sobres.
            */}
            <PackShop
              pe={collection.pe}
              ledger={collection.ledger}
              onBuy={(type, price) => buyPack(type, price)}
            />
          </div>
        )}

        {filters.view === "album" && (
          <>
            {/* Panel de cristal bajo la navegación: los filtros son un ajuste
                del álbum, así que se apoyan visualmente en la pestaña que los
                manda y no compiten con ella. */}
            <div className="album-filters mt-3">
              <button
                type="button"
                onClick={() => setShowFilters((open) => !open)}
                aria-expanded={showFilters}
                className={cn(
                  controlClasses,
                  "flex items-center gap-2 sm:hidden",
                )}
              >
                <SlidersHorizontal size={16} aria-hidden />
                {t.filtersToggle}
                {activeFilters > 0 && (
                  <span className="rounded-full bg-violet-500/30 px-1.5 text-[10px] text-violet-100">
                    {activeFilters}
                  </span>
                )}
              </button>

              <div
                className={cn(
                  "flex-wrap items-center justify-center gap-2 sm:flex",
                  showFilters ? "mt-2 flex sm:mt-0" : "hidden",
                )}
              >
                <input
                  type="search"
                  value={filters.q}
                  onChange={(e) => setFilter({ q: e.target.value })}
                  placeholder="Pokémon"
                  aria-label="Pokémon"
                  className={cn(controlClasses, "min-w-40 grow sm:grow-0")}
                />
                <select
                  value={filters.gen ?? ""}
                  onChange={(e) =>
                    setFilter({
                      gen: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  aria-label={t.filterGeneration}
                  className={controlClasses}
                >
                  <option value="">{t.filterGeneration}</option>
                  {GENERATIONS.map((gen) => (
                    <option key={gen} value={gen}>
                      {`Gen ${gen}`}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.type ?? ""}
                  onChange={(e) => setFilter({ type: e.target.value || null })}
                  aria-label={t.filterType}
                  className={controlClasses}
                >
                  <option value="">{t.filterType}</option>
                  {types.map((type) => (
                    <option key={type} value={type}>
                      {typeLabel(type, lang)}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.rarity ?? ""}
                  onChange={(e) =>
                    setFilter({ rarity: (e.target.value || null) as Rarity | null })
                  }
                  aria-label={t.filterRarity}
                  className={controlClasses}
                >
                  <option value="">{t.filterRarity}</option>
                  {RARITY_ORDER.map((rarity) => (
                    <option key={rarity} value={rarity}>
                      {t.rarityName[rarity]}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.owned ?? ""}
                  onChange={(e) =>
                    setFilter({
                      owned: (e.target.value || null) as "owned" | "missing" | null,
                    })
                  }
                  aria-label={t.filterOwnership}
                  className={controlClasses}
                >
                  <option value="">{t.optionAll}</option>
                  <option value="owned">{t.optionOwned}</option>
                  <option value="missing">{t.optionMissing}</option>
                </select>
                {activeFilters > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setFilter({
                        q: "",
                        gen: null,
                        type: null,
                        rarity: null,
                        owned: null,
                      })
                    }
                    className={cn(controlClasses, "text-slate-400")}
                  >
                    {t.clearFilters}
                  </button>
                )}
              </div>

              {/* El recuento, dentro del panel y no en una línea suya debajo:
                  es el resultado de estos filtros y de ningún otro sitio, y
                  como fila aparte costaba treinta píxeles de los que separan
                  al archivador de la parte de arriba de la pantalla. */}
              <p
                role="status"
                className="mt-1.5 text-center font-mono text-xs text-slate-500"
              >
                {t.resultCount(visible.length, entries.length)}
              </p>
            </div>

            {owned === 0 && hydrated && activeFilters === 0 && (
              <div className="hud-panel mx-auto mt-4 max-w-md rounded-xl p-5 text-center">
                <Layers size={28} className="mx-auto text-violet-300" />
                <h2 className="mt-2 font-display text-base font-bold text-slate-100">
                  {t.emptyTitle}
                </h2>
                <p className="mt-1 text-sm text-slate-400">{t.emptyBody}</p>
                <Link
                  href="/tournament"
                  className="glass-btn mt-3 inline-block rounded-full px-4 py-2 font-mono text-xs"
                >
                  {t.emptyCta}
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {/* El archivador, fuera del ancho de lectura: es el único bloque de la
          pantalla al que le sobra sitio, y aquí se lo queda. */}
      {filters.view === "album" &&
        (visible.length === 0 ? (
          <p className="mt-6 text-center text-sm text-slate-500">
            {t.noResults}
          </p>
        ) : (
          <AlbumBinder
            slots={slots}
            page={page}
            pageCount={pageCount}
            size={filters.sheet}
            onPage={(next) => setFilters({ page: next })}
            // Cambiar de lámina cambia dónde cae cada funda, así que la hoja
            // que había abierta deja de significar nada: se vuelve al
            // principio en vez de a un sitio aproximado.
            onSize={(next) => setFilters({ sheet: next, page: 1 })}
            onZoom={setZoom}
          />
        ))}

      {zoom && (
        <CardZoom card={zoom} aura={auraOf(zoom.dexId)} onClose={() => setZoom(null)} />
      )}
    </div>
  );
}

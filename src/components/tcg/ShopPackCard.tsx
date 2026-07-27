"use client";

import { useCallback, useRef, type CSSProperties } from "react";
import type { PackType } from "@/types/tcg";
import { useHoloTilt } from "@/hooks/use-holo-tilt";
import { useT } from "@/lib/i18n/client";
import { PACK_HEADLINE, PACK_SIZE } from "@/lib/tcg/pull";
import { PACK_ART, PACK_EDGE } from "@/lib/tcg/style";
import { PackArt } from "./PackArt";

/**
 * Un sobre en el escaparate.
 *
 * La rejilla de la tienda era una fila de tarjetas planas con una miniatura
 * dentro; esto es un expositor. La tarjeta entera se inclina con el puntero,
 * el brillo especular persigue al cursor, el canto proyecta su neón sobre el
 * fondo y cada sobre trae encima su propio clima —chispas, escamas, metal,
 * orbes— pintado en CSS a partir de las tres variables que ya definen su
 * identidad: `--edge`, `--deep` y `--glint`.
 *
 * El texto no cambia ni una coma: el nombre lo lleva impreso la portada, y
 * debajo van el precio, la línea de garantías y el botón de siempre.
 */
export function ShopPackCard({
  type,
  price,
  affordable,
  state,
  onBuy,
}: {
  type: PackType;
  price: number;
  affordable: boolean;
  /** `buying` toca la ceremonia de compra; `denied` el temblor rojo. */
  state: "idle" | "buying" | "denied";
  /** Recibe el nodo de la portada: es de donde sale volando el sobre. */
  onBuy: (origin: HTMLElement | null) => void;
}) {
  const t = useT().tcg;
  const artRef = useRef<HTMLDivElement>(null);
  // Menos grados que el visor: son cuatro tarjetas en fila y una inclinación de
  // carta ampliada las despegaría de la rejilla.
  const { ref, tiltProps, tiltStyle } = useHoloTilt<HTMLDivElement>({ max: 9 });

  const buy = useCallback(() => onBuy(artRef.current), [onBuy]);

  return (
    <div
      ref={ref}
      {...tiltProps}
      data-pack={type}
      data-state={state}
      style={
        {
          ...tiltStyle,
          "--edge": PACK_EDGE[type],
          "--deep": PACK_ART[type].deep,
          "--glint": PACK_ART[type].glint,
        } as CSSProperties
      }
      className="shop-card holo-tilt"
    >
      {/* Neón que la tarjeta proyecta hacia fuera, por detrás de todo. */}
      <span aria-hidden className="shop-card__aura" />
      {/* El clima del sobre: distinto por `data-pack`. */}
      <span aria-hidden className="shop-card__fx" />
      {/* Brillo especular siguiendo al cursor y filo interior. */}
      <span aria-hidden className="shop-card__shine" />
      <span aria-hidden className="shop-card__rim" />
      {/* Onda de choque de la compra. */}
      <span aria-hidden className="shop-card__ripple" />

      <div ref={artRef} className="shop-card__art">
        {/* Sin inclinación propia: la que manda es la de la tarjeta entera, y
            dos giros anidados se multiplican y descuadran la perspectiva. */}
        <PackArt type={type} tilt={0} className="w-full" />
      </div>

      {/* El precio, impreso bajo la portada y no sólo dentro del botón. La fila
          se lee de izquierda a derecha como una escalera, y para compararla no
          se puede obligar a saltar de botón en botón. Oculto al lector de
          pantalla porque el aria-label del botón ya lo canta. */}
      <span aria-hidden className="shop-card__price">
        {t.price(price)}
      </span>

      <span className="sr-only">
        {t.packName[type]} · {t.packCards(PACK_SIZE[type])} ·{" "}
        {t.packFloor(
          PACK_HEADLINE[type].count,
          t.rarityName[PACK_HEADLINE[type].rarity],
        )}
      </span>

      <p className="shop-card__desc">{t.packDesc[type]}</p>

      {/*
        Sin `disabled`: un botón deshabilitado no recibe el clic, y sin clic no
        hay temblor que explique por qué no se puede comprar. Con `aria-disabled`
        el lector de pantalla lo sigue anunciando como no disponible, y además
        se puede enfocar para oír el motivo — que estando deshabilitado ni
        siquiera se podía leer.
      */}
      <button
        type="button"
        aria-disabled={!affordable}
        onClick={buy}
        aria-label={
          affordable
            ? `${t.buyCta} ${t.packName[type]} · ${t.price(price)}`
            : `${t.packName[type]} · ${t.price(price)} · ${t.cantAfford}`
        }
        className="shop-buy"
        data-locked={!affordable}
      >
        <span className="shop-buy__label">
          {affordable ? `${t.buyCta} · ${t.price(price)}` : t.cantAfford}
        </span>
        <span aria-hidden className="shop-buy__pulse" />
      </button>
    </div>
  );
}

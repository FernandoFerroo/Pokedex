"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import type { PackType } from "@/types/tcg";
import { useHoloTilt } from "@/hooks/use-holo-tilt";
import { artworkUrl } from "@/lib/pokemon-meta";
import { useT } from "@/lib/i18n/client";
import { PACK_ART, PACK_EDGE } from "@/lib/tcg/style";
import { PACK_HEADLINE, PACK_SIZE } from "@/lib/tcg/pull";
import { cn } from "@/lib/utils";

interface PackArtProps {
  type: PackType;
  /**
   * `hero` es el sobre que se va a abrir: lámina viva, rayos girando y
   * destello siguiendo al puntero. `shelf` es la miniatura de la estantería y
   * de la tienda — la misma portada, sin nada que se mueva solo, porque salen
   * cinco a la vez y ninguna es todavía la protagonista.
   */
  variant?: "hero" | "shelf";
  /** Grados de inclinación al puntero. Cero deja la portada recta. */
  tilt?: number;
  /**
   * Etiqueta del envoltorio. `span` para colgarlo dentro de un botón —la ficha
   * de copa del vestíbulo lo es entera—, donde un `div` no es HTML válido.
   */
  as?: "div" | "span";
  className?: string;
  style?: CSSProperties;
}

/**
 * La portada de un sobre.
 *
 * No es un rectángulo con un icono dentro: es el envoltorio metalizado, con
 * su Pokémon estelar recortado sobre un abanico de rayos, la lámina
 * holográfica que se mueve con el puntero, la banda dentada de rasgado arriba
 * y el sello de la expansión abajo. Es lo primero que se ve del modo
 * colección y lo único que hay que desear antes de romperlo, así que se pinta
 * con el mismo cuidado que las cartas que trae dentro.
 *
 * Todas las capas son `span` decorativos por encima de la ilustración; el
 * texto va por delante de todas para que ninguna lámina se lo coma.
 */
export function PackArt({
  type,
  variant = "shelf",
  tilt = 10,
  as = "div",
  className,
  style,
}: PackArtProps) {
  const t = useT().tcg;
  const hero = variant === "hero";
  const art = PACK_ART[type];
  const { ref, tiltProps, tiltStyle } = useHoloTilt<HTMLDivElement>({
    max: tilt,
    tiltless: tilt <= 0,
  });
  // Las dos etiquetas admiten exactamente los mismos atributos; el molde a
  // `"div"` es sólo para que la referencia siga teniendo un tipo concreto.
  const Wrapper = as as "div";

  return (
    <Wrapper
      ref={ref}
      {...tiltProps}
      aria-hidden
      data-variant={variant}
      style={
        {
          ...tiltStyle,
          ...style,
          "--edge": PACK_EDGE[type],
          "--deep": art.deep,
          "--glint": art.glint,
        } as CSSProperties
      }
      className={cn("pack-art holo-tilt", className)}
    >
      {/* Lámina base: el degradado metalizado del envoltorio. */}
      <span className="pack-art__foil" />
      {/* Abanico de rayos detrás del protagonista, como el fondo impreso de un
          sobre de verdad. En la estantería se queda quieto. */}
      <span className="pack-art__rays" />
      <span className="pack-art__halo" />

      <Image
        src={artworkUrl(art.mascot)}
        alt=""
        fill
        sizes={hero ? "(max-width: 640px) 68vw, 280px" : "160px"}
        priority={hero}
        className="pack-art__mascot"
      />

      {/* Banda dentada de rasgado. La línea de puntos es por donde se corta —
          y en el sobre grande es literalmente por donde se corta. */}
      <span className="pack-art__strip">
        <span className="pack-art__teeth" />
      </span>

      {/* Acabado: lámina holográfica al puntero, barrido especular en bucle y
          el filo metálico. */}
      <span className="pack-art__sheen" />
      <span className="pack-art__gloss" />
      <span className="pack-art__frame" />

      <span className="pack-art__plate">
        <span className="pack-art__name">{t.packName[type]}</span>
        {/* Cuántas cartas trae y cuál es su suelo. Ya no dice generaciones:
            todos los sobres reparten las nueve, así que lo que hay que leer de
            un vistazo es lo que garantiza este y no el de al lado. */}
        <span className="pack-art__meta">
          {t.packCards(PACK_SIZE[type])} ·{" "}
          {t.packFloor(
            PACK_HEADLINE[type].count,
            t.rarityName[PACK_HEADLINE[type].rarity],
          )}
        </span>
      </span>

      <span className="pack-art__sigil">
        <span>{PACK_SIZE[type]}</span>
      </span>
    </Wrapper>
  );
}

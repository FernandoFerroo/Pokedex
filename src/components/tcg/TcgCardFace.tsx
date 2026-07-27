"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { isFoil, type PoolCard } from "@/types/tcg";
import { useHoloTilt } from "@/hooks/use-holo-tilt";
import { cn } from "@/lib/utils";

interface TcgCardFaceProps {
  card: PoolCard;
  /** Color del halo. Es el aura del tipo del Pokémon, no de la carta. */
  aura?: string;
  /**
   * `live` inclina al puntero y anima el arcoíris de las Hyper Raras. Las mil
   * fundas del álbum van en `static`: sólo el brillo de reposo.
   */
  motion?: "static" | "live";
  /** Escaneo grande. Sólo para el visor: pesa unas cuatro veces más. */
  high?: boolean;
  sizes: string;
  priority?: boolean;
  /**
   * Carga el escaneo aunque no se esté viendo.
   *
   * Hace falta exactamente donde hay un giro: una imagen que está en la cara
   * de atrás de una carta boca abajo no cuenta como visible para la carga
   * perezosa, así que el navegador no la pide hasta que la carta YA se ha
   * girado — y entonces se ve un rectángulo negro durante el instante que
   * tarda en llegar, justo en el momento del premio.
   */
  eager?: boolean;
  /** Grados de inclinación en el extremo. */
  tilt?: number;
  /**
   * Modo holograma: la carta se inclina también con el dedo y le entra una
   * trama de prisma por encima. Sólo el visor a pantalla completa, que es el
   * único sitio donde la carta es la pantalla entera.
   */
  holo?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Una carta del JCC con acabado de coleccionista.
 *
 * La ilustración, el marco, el número y el nombre vienen impresos en el
 * escaneo real; no dibujamos ninguno. Lo nuestro son las capas de encima —
 * canto metálico, lámina foil que sigue al puntero, destello y halo —, que
 * son justo lo que una carta tiene en la mano y una imagen plana no.
 */
export function TcgCardFace({
  card,
  aura,
  motion = "static",
  high = false,
  sizes,
  priority = false,
  eager = false,
  tilt = 12,
  holo = false,
  className,
  style,
}: TcgCardFaceProps) {
  const live = motion === "live";
  const { ref, tiltProps, tiltStyle } = useHoloTilt<HTMLDivElement>({
    max: tilt,
    tiltless: !live,
    touch: holo,
  });
  const foil = isFoil(card.rarity);

  return (
    <div
      ref={ref}
      // En estático ni se cuelgan los manejadores: mil fundas escuchando el
      // puntero para no mover nada es trabajo tirado.
      {...(live ? tiltProps : {})}
      data-rarity={card.rarity}
      data-motion={motion}
      style={
        {
          ...tiltStyle,
          ...style,
          "--aura": aura ?? "#94a3b8",
        } as CSSProperties
      }
      className={cn("tcg-card holo-tilt", className)}
    >
      <Image
        src={high ? card.imageHighUrl : card.imageUrl}
        alt={card.name}
        fill
        sizes={sizes}
        priority={priority}
        loading={eager && !priority ? "eager" : undefined}
        className="object-cover"
      />
      <span aria-hidden className="tcg-edge" />
      {foil && (
        <>
          <span aria-hidden className="tcg-sheen" />
          <span aria-hidden className="tcg-glare" />
        </>
      )}
      {holo && <span aria-hidden className="tcg-prism" />}
    </div>
  );
}

/**
 * El dorso. La API no publica escaneos del reverso, así que la trama es
 * nuestra — y da igual: todas las cartas comparten dorso, que es precisamente
 * lo que hace que un sobre boca abajo no delate nada.
 */
export function CardBack({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("tcg-back relative h-full w-full overflow-hidden", className)}
    >
      {/* Los rayos del fondo y el orbe del centro. El dorso se mira durante
          medio segundo por carta, pero se mira SEIS veces por sobre: es lo
          único que hay en pantalla justo antes del premio. */}
      <span className="tcg-back__rays" />
      <span className="tcg-back__orb">
        <span className="tcg-back__band" />
        <span className="tcg-back__core" />
      </span>
      <span className="tcg-back__frame" />
      <span className="tcg-back__sheen" />
    </div>
  );
}

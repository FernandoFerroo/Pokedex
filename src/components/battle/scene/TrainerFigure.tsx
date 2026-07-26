"use client";

import type { CSSProperties } from "react";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/**
 * Drawn stand-in for a trainer whose generated figure has not landed — or is
 * never coming, because the deployment has no image key. It is deliberately a
 * silhouette rather than an empty space: the point of the whole feature is
 * that somebody is standing on the other side of the field, and that reads
 * just as well backlit as it does painted.
 */
function TrainerSilhouette({ label }: { label: string }) {
  return (
    <svg
      viewBox="0 0 100 200"
      role="img"
      aria-label={label}
      className="block h-auto w-full"
      style={{ filter: "drop-shadow(0 0 14px rgba(248,113,113,0.45))" }}
    >
      <g fill="#111a2e" stroke="#fca5a5" strokeWidth="3" strokeLinejoin="round">
        {/* Gorra con visera hacia la izquierda, mirando al campo. */}
        <path d="M33 42a19 19 0 0 1 38 0v3H33z" />
        <path d="M33 39 11 46l2-9 20-3z" />
        <circle cx="52" cy="45" r="16" />
        {/* Cuello, chaqueta y los dos brazos: uno caído, otro en la cadera. */}
        <path d="M45 58h14v7H45z" />
        <path d="M40 63h20l14 13-4 44H30l-4-44z" />
        <path d="M27 78 19 108l3 13 10-3-4-11 8-25z" />
        <path d="M73 78l9 17-11 15-7-7 7-9-5-11z" />
        {/* Piernas y botas. */}
        <path d="M33 118h15l-2 58H31z" />
        <path d="M52 118h16l3 58H54z" />
        <path d="M29 174h18v13H23z" />
        <path d="M54 174h17v13H52z" />
      </g>
    </svg>
  );
}

/**
 * El entrenador rival de pie junto a su Pokémon, como en los juegos: la
 * figura generada (recorte con fondo transparente) o su silueta, respirando
 * en bucle sobre su sombra de contacto.
 *
 * Es decoración pura — no intercepta clics — pero sí se anuncia: en un
 * combate contra un entrenador con nombre, saber que está ahí forma parte de
 * la escena, no del adorno.
 */
export function TrainerFigure({
  image,
  name,
  className,
  style,
}: {
  /** Generated cut-out, or null while it loads (or if it never arrives). */
  image: string | null;
  /** Trainer's name, for the figure's accessible description. */
  name: string;
  /** Placement over the stage, decided by the composition. */
  className?: string;
  /** Punto de apoyo en el suelo, que la escena mide sobre el decorado. */
  style?: CSSProperties;
}) {
  const a11y = useT().a11y;
  const label = a11y.rivalTrainerOnField(name);

  return (
    <div
      className={cn("pk-trainer-in pointer-events-none absolute", className)}
      style={style}
    >
      {/* Sombra de contacto: es lo único que ata la figura al suelo — no pisa
          plataforma, como los entrenadores de los juegos —, así que se dibuja
          ancha y algo desplazada hacia la luz para que se lea como apoyo y no
          como mancha. */}
      <span
        aria-hidden
        className="pk-ground-shadow pk-shadow-t absolute -bottom-[1.5%] left-1/2 h-[9%] w-[62%] -translate-x-1/2 rounded-[50%]"
      />
      <div className="pk-idle-t relative flex w-full items-end justify-center">
        {image ? (
          // Recorte generado: se nombra, porque el entrenador al que retrata
          // es parte de la escena y no un adorno del fondo.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={label}
            className="block h-auto w-full object-contain object-bottom"
            style={{
              // Pase de integración: lo último que separa un recorte de una
              // figura que estaba ahí.
              //
              // · La exposición. El generador entrega a todo el mundo bien
              //   iluminado, y el estadio es de noche; bajar brillo y
              //   saturación mete a la figura en la misma exposición que el
              //   decorado en vez de dejarla encima, y el punto de contraste
              //   le devuelve el cuerpo que se pierde al bajarla.
              // · La sombra proyectada, corta y hacia abajo, como la de quien
              //   tiene los focos encima.
              //
              // Antes llevaba además un halo rojo de neón alrededor: ese
              // contorno luminoso era justo lo que la delataba como pegatina,
              // porque nada más en el campo brilla por su cuenta.
              filter:
                "brightness(0.82) saturate(0.88) contrast(1.06) drop-shadow(0 8px 9px rgba(4, 8, 20, 0.55))",
            }}
          />
        ) : (
          // La silueta ocupa el mismo hueco que el recorte, centrada: el
          // encuadre no salta cuando la imagen generada entra.
          <div className="w-[52%]">
            <TrainerSilhouette label={label} />
          </div>
        )}
      </div>
    </div>
  );
}

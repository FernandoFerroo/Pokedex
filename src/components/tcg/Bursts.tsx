"use client";

import { useCallback, useEffect, useMemo, useRef, type CSSProperties } from "react";

/**
 * Avisa una sola vez, venga el aviso de donde venga.
 *
 * `animationend` es la señal buena: da el instante exacto en que el efecto
 * termina. Pero cuando la duración se colapsa a un milisegundo —que es lo que
 * hace el bloque de movimiento reducido— el navegador puede terminar la
 * animación ANTES de llegar a pintar el elemento, y entonces no dispara el
 * evento y la apertura se queda colgada. Se aprendió probándolo.
 *
 * Así que el evento manda y un temporizador cubre el hueco.
 */
function useOnceAfter(onDone: () => void, fallbackMs: number) {
  const fired = useRef(false);
  const done = useCallback(() => {
    if (fired.current) return;
    fired.current = true;
    onDone();
  }, [onDone]);

  useEffect(() => {
    const timer = window.setTimeout(done, fallbackMs);
    return () => window.clearTimeout(timer);
  }, [done, fallbackMs]);

  return done;
}

/** Hash determinista. El mismo que usan las partículas de la arena, y por la
 *  misma razón: nada de azar en un render, o la metralla salta de sitio. */
function rnd(index: number, salt: number): number {
  const x = Math.sin(index * 91.7 + salt * 47.3) * 43758.5453;
  return x - Math.floor(x);
}

const SHARDS = 22;

/**
 * El sobre al romperse: un fogonazo blanco y veintidós esquirlas de
 * envoltorio saliendo en abanico.
 *
 * Los vectores se calculan aquí y el recorrido lo hace CSS. `onDone` cuelga
 * del fogonazo, no de un temporizador: bajo movimiento reducido las
 * duraciones se colapsan a un milisegundo, y una cadena guiada por
 * `animationend` se completa igual de bien mientras que una de temporizadores
 * se quedaría esperando cuatrocientos por paso.
 */
export function TearBurst({ onDone }: { onDone: () => void }) {
  // El doble de lo que dura `tear-flash`: si el evento llega, este nunca corre.
  const done = useOnceAfter(onDone, 800);
  const shards = useMemo(
    () =>
      Array.from({ length: SHARDS }, (_, i) => {
        const angle = (i / SHARDS) * Math.PI * 2 + rnd(i, 3) * 0.5;
        const distance = 90 + rnd(i, 7) * 130;
        return {
          "--dx": `${Math.cos(angle) * distance}px`,
          "--dy": `${Math.sin(angle) * distance * 0.72}px`,
          "--spin": `${140 + rnd(i, 11) * 260}deg`,
          background:
            i % 3 === 0 ? "#fde68a" : i % 3 === 1 ? "#ffffff" : "var(--edge, #fbbf24)",
          animationDelay: `${rnd(i, 13) * 90}ms`,
        } as CSSProperties;
      }),
    [],
  );

  return (
    // `contain` para que veintidós elementos en movimiento no puedan ensuciar
    // el cálculo de posición del abanico que hay debajo.
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 [contain:layout_paint]"
    >
      <span
        className="tear-flash absolute top-1/2 left-1/2 h-24 w-24 rounded-full bg-white/90 blur-md"
        onAnimationEnd={done}
      />
      {shards.map((style, i) => (
        <span
          key={i}
          style={style}
          className="tear-shard absolute top-1/2 left-1/2 h-1.5 w-3 rounded-[1px]"
        />
      ))}
    </span>
  );
}

/**
 * El aviso de rareza: un anillo que se abre y unos rayos que giran, justo
 * ANTES de que la carta se dé la vuelta. Es lo que convierte el giro en un
 * acontecimiento en lugar de en un trámite.
 */
export function RareBurst({
  color,
  onDone,
}: {
  color: string;
  onDone: () => void;
}) {
  // El doble de lo que dura `rare-ring`.
  const done = useOnceAfter(onDone, 950);
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 z-20">
      <span
        className="rare-rays absolute top-1/2 left-1/2 h-40 w-40"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg 12deg, ${color} 14deg 18deg, transparent 20deg 42deg, ${color} 44deg 48deg, transparent 50deg 90deg, ${color} 92deg 96deg, transparent 98deg 140deg, ${color} 142deg 146deg, transparent 148deg 360deg)`,
          filter: "blur(1px)",
        }}
      />
      <span
        className="rare-ring absolute top-1/2 left-1/2 h-24 w-24 rounded-full border-4"
        style={{ borderColor: color, boxShadow: `0 0 28px ${color}` }}
        onAnimationEnd={done}
      />
    </span>
  );
}

/**
 * Cuántas motas levanta una repetida.
 *
 * La cantidad ES la calidad: una común deja seis chispas y una Hyper Rara
 * dieciocho, con la misma escalera que reparte los PE. Así el premio se ve
 * antes de leerse — se nota que la carta valía cuando el chorro es espeso, sin
 * tener que mirar la cifra.
 */
function moteCount(dust: number): number {
  return Math.min(18, 6 + Math.round(dust / 7));
}

/**
 * El polvo de una repetida viajando a la hucha.
 *
 * Vive en un lienzo FIJO y no dentro de la carta: el recorrido va de la carta
 * al contador, dos nodos que están en ramas distintas del árbol, así que las
 * dos puntas se miden en coordenadas de pantalla y las motas se pintan encima
 * de todo. `from` trae también el tamaño de la carta, que es de donde salen
 * repartidas — brotando de toda la ilustración y no de un punto.
 *
 * El arco sale de repartir el recorrido en dos nodos con curvas distintas: el
 * de fuera lleva la X y arranca despacio, el de dentro lleva la Y y arranca
 * rápido. Una sola transformación daría una línea recta, que es lo que hace
 * que un efecto así parezca un cálculo y no un puñado de brillo.
 */
export function DustStream({
  from,
  to,
  dust,
  color,
  onArrive,
  onDone,
}: {
  from: { x: number; y: number; w: number; h: number };
  to: { x: number; y: number };
  dust: number;
  color: string;
  /** Las primeras motas tocan la hucha: es cuando el contador echa a andar. */
  onArrive: () => void;
  onDone: () => void;
}) {
  // La primera mota llega a los 620 ms y la última sale con 260 ms de retraso.
  const arrived = useOnceAfter(onArrive, 760);
  useOnceAfter(onDone, 1150);

  const motes = useMemo(
    () =>
      Array.from({ length: moteCount(dust) }, (_, i) => ({
        "--sx": `${(rnd(i, 21) - 0.5) * from.w * 0.78}px`,
        "--sy": `${(rnd(i, 33) - 0.5) * from.h * 0.78}px`,
        "--dx": `${to.x - from.x}px`,
        "--dy": `${to.y - from.y}px`,
        // Dos de cada tres motas van en ámbar, que es el color de los PE en
        // todo el modo colección; la tercera lleva el del nivel de la carta.
        // El chorro se lee como dinero, y a la vez se ve de qué carta salió.
        "--mote": i % 3 === 0 ? color : i % 3 === 1 ? "#fde68a" : "#fbbf24",
        width: `${5 + rnd(i, 71) * 4}px`,
        height: `${5 + rnd(i, 71) * 4}px`,
        animationDelay: `${rnd(i, 51) * 260}ms`,
      })) as CSSProperties[],
    [dust, from.w, from.h, from.x, from.y, to.x, to.y, color],
  );

  return (
    <span
      aria-hidden
      className="dust-stream"
      style={{ left: `${from.x}px`, top: `${from.y}px` }}
    >
      {motes.map((style, i) => (
        <span key={i} className="dust-mote" style={style}>
          {/* Tres nodos y no uno: X, Y y el destello son tres animaciones que
              caerían sobre la misma `transform` si compartieran elemento. */}
          <span className="dust-mote__y" onAnimationEnd={i === 0 ? arrived : undefined}>
            <span className="dust-mote__dot" />
          </span>
        </span>
      ))}
    </span>
  );
}

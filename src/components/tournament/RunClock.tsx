"use client";

import { useEffect, useState } from "react";
import { formatClock } from "@/lib/tournament/score";

/**
 * El reloj de la partida Relámpago, corriendo.
 *
 * Es un componente propio por una razón concreta: el tic vive por DEBAJO de la
 * frontera de props de la arena. Si el minutero fuera estado de
 * `TournamentScreen`, cada segundo re-renderizaría el combate entero — con sus
 * sprites y su escenario — para mover dos cifras de la esquina. Aquí, lo único
 * que se vuelve a pintar cada medio segundo es este `<span>`.
 *
 * Se pasa el instante de salida y no los milisegundos transcurridos, por lo
 * mismo: un ancla fija no obliga al padre a contar nada.
 */
export function RunClock({ anchor }: { anchor: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // Medio segundo: con un tic de un segundo la cifra que se ve puede ir casi
    // un segundo por detrás de la real, y en una partida de tres minutos eso
    // se nota al compararla con el récord.
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  return <>{formatClock(now - anchor)}</>;
}

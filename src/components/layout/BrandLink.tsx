"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useFilters } from "@/hooks/use-filters";

/**
 * La marca de la cabecera (Poké Ball + "Pokédex") siempre aterriza en la
 * portada limpia, nunca retrocede en el historial.
 *
 * Estando ya en "/", <Link href="/"> se queda corto: los filtros viven en la
 * query vía nuqs con `history: "replace"`, que los escribe por debajo del
 * router, así que navegar a "/" es un no-op y la rejilla sigue filtrada. Ahí
 * los limpiamos a mano (y subimos arriba); desde cualquier otra ruta basta con
 * dejar que el Link haga su navegación normal.
 */
export function BrandLink({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const [, setFilters] = useFilters();

  return (
    <Link
      href="/"
      className={className}
      onClick={(event) => {
        if (pathname !== "/") return;
        // Cmd/Ctrl/Shift + clic sigue abriendo en pestaña o ventana nueva.
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        // `push`, no `replace`: volver atrás devuelve la búsqueda anterior.
        void setFilters(null, { history: "push" });
        window.scrollTo({ top: 0 });
      }}
    >
      {children}
    </Link>
  );
}

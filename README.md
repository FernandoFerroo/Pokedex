<div align="center"> 

<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" width="90" alt="Pikachu" /><img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png" width="90" alt="Charizard" /><img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png" width="90" alt="Gengar" />

# ⚡ POKéDEX — Sistema Nacional

**Una Pokédex de neón, oscura y "gaming", construida sobre PokéAPI.** 
*1025 especies · Gen I–IX · búsqueda evolutiva en tiempo real · modelos 3D · cartas del JCC*

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PokéAPI](https://img.shields.io/badge/PokéAPI-EF4444?logo=pokemon&logoColor=white)](https://pokeapi.co)

**[🔴 DEMO EN VIVO → pokedex-bin-par.vercel.app](https://pokedex-bin-par.vercel.app)** 

</div>

---
 
## 🚀 Puesta en marcha 

**Opción A — npm (desarrollo):**

```bash
npm install
npm run dev      # http://localhost:3000
```

**Opción B — Docker (un solo comando):** 

```bash
docker compose up
```

Construye la imagen (multi-stage, salida `standalone` de Next.js) y sirve la app en `http://localhost:3000`. No requiere Node en el host ni variables de entorno.

> La primera carga/build tarda unos segundos: el servidor agrega los datos de PokéAPI y los cachea. Las cargas siguientes son instantáneas.

## ✅ Requisitos de la prueba, uno a uno

| Requisito | Dónde está |
|---|---|
| Listado con nombre, generación y tipos, ordenado por id | Página principal (`/`), tarjetas con nº de Pokédex, generación, tipos y artwork oficial |
| Filtros por tipo y generación | Barra de filtros (más 6 filtros avanzados extra: color, hábitat, grupo huevo, categoría, etapa y forma) |
| Buscador en tiempo real con evoluciones | Buscar "pikachu" muestra también a Pichu y Raichu; funciona con cadenas ramificadas (Eevee) |
| Detalle con nombre, imagen, generación, tipos, evoluciones y stats | `/pokemon/[name]`, con la cadena evolutiva navegable y la etapa actual resaltada en rojo neón |
| Estado del listado al volver del detalle | Los filtros viven en la URL: el botón atrás restaura búsqueda, filtros y página — y además sobrevive a refrescos y se puede compartir |
| Entregable | Repo público + este README + [demo desplegada](https://pokedex-bin-par.vercel.app) + `docker compose up` |

## ✨ Extras de experiencia (la parte fan)

- **Interfaz "gaming HUD"** exclusivamente oscura: rejilla de fondo, scanlines CRT, tipografías arcade (Press Start 2P) y sci-fi (Orbitron), leds parpadeantes y emblema Poké Ball en la cabecera.
- **Auras de neón por tipo**: cada tarjeta brilla con el color de su tipo primario (halo con textura de brocha + resplandor que sigue la silueta), con retícula de fijado de objetivo y barrido de escáner al pasar el cursor.
- **Visor de sprites** en el detalle: arte oficial, **modelos 3D glTF interactivos** (con fallback a render HOME arrastrable), sprites animados 2D frente/espalda y variantes **shiny**.
- **Radar de estadísticas** hexagonal con el acento del tipo.
- **Galería de cartas del JCC** con efecto holográfico que sigue al puntero (vía TCGdex).
- **Paginación** por URL (60 por página) para mantener el DOM ligero.
- **404 temático**: "¡El Pokémon salvaje huyó!" con glitch de MissingNo.
- Micro-interacciones que respetan `prefers-reduced-motion` en todos los casos.

## 🧠 Decisiones técnicas

### El problema: PokéAPI no da lo que pide el listado

- La **generación** no está en `/pokemon/{id}`, sino en `/pokemon-species/{id}`.
- Obtener nombre + tipos + generación de ~1300 Pokémon de forma directa serían **~2600 peticiones**.
- La **búsqueda por cadena evolutiva** necesita un mapa nombre → cadena → miembros que ningún endpoint ofrece.

### La solución: un índice compacto construido en el servidor

`src/lib/index/build-index.ts` agrega los endpoints *invertidos* de PokéAPI:

| Fuente | Peticiones | Aporta |
|---|---|---|
| `/generation/{id}` | ~9 | especie → generación |
| `/type/{id}` | ~20 | pokémon → tipos |
| `/evolution-chain/{id}` | ~550 (en paralelo) | pertenencia a cadenas evolutivas |

Todas las peticiones pasan por la caché de datos de Next (`revalidate: 24h`), así que este coste se paga **una vez por despliegue/revalidación (ISR), nunca por visitante**. El resultado es un índice serializable (~150 KB) que se entrega al cliente: todo el filtrado y la búsqueda son **síncronos y en memoria** — cero peticiones de red por pulsación de tecla.

### Búsqueda por cadena evolutiva

`src/lib/search/evolution-search.ts` (función pura, testeable sin React):

1. Se buscan las especies cuyo nombre contiene la consulta.
2. Cada coincidencia aporta su `chainId`; el conjunto de resultados se **expande a todos los miembros de esas cadenas** (mapa `chainId → miembros` precalculado en el índice).
3. El resultado se interseca con los filtros de tipo y generación.

### Estado de filtros en la URL (y no en un store global)

Los filtros y la paginación usan [`nuqs`](https://nuqs.dev) (query params tipados). Se descartó un store global deliberadamente: el requisito de "mantener el estado al volver del detalle" lo resuelve la propia URL de forma más robusta (atrás/adelante del navegador, refresco, enlaces compartibles, SSR) sin estado duplicado que sincronizar.

### Otras decisiones

- **Sin TanStack Query/SWR**: los detalles se renderizan como Server Components con la caché de `fetch` de Next; añadir una capa de fetching en cliente sería redundante aquí.
- **Anti-corruption layer**: los tipos crudos de PokéAPI viven en `src/lib/pokeapi/` y no salen de la capa de datos; la app consume tipos de dominio limpios (`src/types/pokemon.ts`).
- **Rendimiento del listado**: paginación por URL, `next/image` con lazy-loading y `content-visibility: auto` en las tarjetas.
- **Casos límite cubiertos**: especies cuya variedad por defecto tiene otro nombre de pokémon (Deoxys, Giratina, etc.) se resuelven vía `varieties`; las cadenas ramificadas se aplanan recursivamente; la descripción usa el texto en español y cae al inglés cuando PokéAPI no lo ofrece (p. ej. especies de la Gen IX).
- **Oscuro por diseño, no por defecto**: la estética de neón (auras `color-mix` sobre negro, scanlines, glows) solo funciona sobre un fondo casi negro, así que el tema claro se eliminó conscientemente en favor de una identidad visual fuerte. Todo el sistema de auras se deriva de **una sola variable CSS por tipo** (`--aura`), de la que salen halos, retículas, chips y brillos.
- **3D con degradación elegante**: los modelos glTF (comunidad, vía `<model-viewer>`) pueden no existir para una especie; si fallan, el visor cae automáticamente a un render de Pokémon HOME con rotación por arrastre en CSS, y si tampoco existe, el modo 3D no se ofrece.

## 📁 Estructura

```
src/
├── app/                      # Rutas (listado, detalle /pokemon/[name], loading, 404)
├── components/
│   ├── filters/              # FilterBar (búsqueda + selects, básicos y avanzados)
│   ├── layout/               # Header (emblema, leds, wordmark)
│   ├── pokemon/              # PokedexView, PokemonCard, Pagination, SpriteViewer,
│   │                         #   Model3D, StatsRadar, EvolutionChain, CardGallery…
│   └── ui/                   # Primitivas (TypeBadge)
├── hooks/                    # use-filters (nuqs: filtros + página en la URL)
├── lib/
│   ├── pokeapi/              # Cliente HTTP tipado + tipos crudos de la API
│   ├── index/                # Construcción del índice agregado (servidor)
│   ├── search/               # Búsqueda por nombre + cadena evolutiva (funciones puras)
│   ├── tcgdex.ts             # Cartas del JCC
│   └── pokemon-meta.ts       # Colores de aura, etiquetas, sprites
└── types/                    # Tipos de dominio
```

## ☁️ Despliegue

- **Vercel**: sin variables de entorno ni configuración — importar el repo y desplegar. El listado se sirve estático con ISR diario y los detalles se generan bajo demanda. Demo: **<https://pokedex-bin-par.vercel.app>**.
- **Docker**: `docker compose up` (imagen multi-stage sobre `node:22-alpine` con salida `standalone`; el build necesita red hacia PokéAPI para prerrenderizar el listado).

## 🤖 Uso de IA

Este proyecto se ha desarrollado **en pair-programming con IA** (Claude Code): exploración de enfoques, prototipado del sistema visual, depuración e implementación acelerada. Las decisiones de arquitectura (índice agregado en servidor, estado en la URL, capa anticorrupción, degradación del 3D) están razonadas en este README y puedo defenderlas y explicarlas en detalle, línea a línea.

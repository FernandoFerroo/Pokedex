# Pokédex — Prueba técnica

Pokédex construida con **Next.js (App Router)**, **TypeScript** y **Tailwind CSS** sobre [PokéAPI](https://pokeapi.co).

## Funcionalidades

- **Listado completo** (1025 especies) con nombre, generación y tipos.
- **Filtros por tipo y generación**, combinables entre sí y con la búsqueda.
- **Buscador en tiempo real** por nombre **y por cadena evolutiva**: buscar "pikachu" también muestra a Pichu y Raichu (las cadenas ramificadas, como la de Eevee, funcionan igual).
- **Vista detalle** con estadísticas base, cadena evolutiva **interactiva** (cada etapa navega a su detalle), tipos, generación, imagen oficial, descripción en español, altura y peso.
- **Persistencia de filtros** al volver del detalle: el estado vive en la URL (`/?q=pika&type=electric&gen=1`), por lo que sobrevive al botón atrás, a un refresco y se puede compartir.
- **Modo claro y oscuro** con conmutador manual: respeta la preferencia del sistema por defecto, persiste la elección en `localStorage` y se aplica antes del primer pintado (sin *flash* de tema incorrecto).

## Puesta en marcha

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de producción (listo para Vercel, sin configuración extra)
```

> La primera carga en local tarda unos segundos: el servidor agrega los datos de PokéAPI y los cachea (ver más abajo). Las cargas siguientes son instantáneas.

## Decisiones técnicas

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

### Estado de filtros en la URL (y no en Zustand)

Los filtros usan [`nuqs`](https://nuqs.dev) (query params tipados). Se descartó un store global deliberadamente: el requisito de "mantener el estado al volver del detalle" lo resuelve la propia URL de forma más robusta (atrás/adelante del navegador, refresco, enlaces compartibles, SSR) sin estado duplicado que sincronizar.

### Otras decisiones

- **Sin TanStack Query/SWR**: los detalles se renderizan como Server Components con la caché de `fetch` de Next; añadir una capa de fetching en cliente sería redundante aquí.
- **Anti-corruption layer**: los tipos crudos de PokéAPI viven en `src/lib/pokeapi/` y no salen de la capa de datos; la app consume tipos de dominio limpios (`src/types/pokemon.ts`).
- **Rendimiento del listado**: `next/image` con lazy-loading y `content-visibility: auto` en las tarjetas para que el navegador no pinte las ~1000 tarjetas fuera de viewport.
- **Casos límite cubiertos**: especies cuya variedad por defecto tiene otro nombre de pokémon (Deoxys, Giratina, etc.) se resuelven vía `varieties`; las cadenas ramificadas se aplanan recursivamente; la descripción usa el texto en español y cae al inglés cuando PokéAPI no lo ofrece (p. ej. especies de la Gen IX).
- **Tema claro/oscuro sin dependencias**: variante `dark` de Tailwind basada en clase (`@custom-variant`), un script inline que aplica el tema persistido antes del primer pintado y un conmutador sin estado React (los iconos se alternan por CSS), lo que evita cualquier desajuste de hidratación.

## Estructura

```
src/
├── app/                      # Rutas (listado, detalle /pokemon/[name], loading, 404)
├── components/
│   ├── filters/              # FilterBar (búsqueda + selects)
│   ├── layout/               # Header
│   ├── pokemon/              # PokedexView, PokemonCard, StatsPanel, EvolutionChain, BackButton
│   └── ui/                   # Primitivas (TypeBadge)
├── hooks/                    # use-filters (nuqs)
├── lib/
│   ├── pokeapi/              # Cliente HTTP tipado + tipos crudos de la API
│   ├── index/                # Construcción del índice agregado (servidor)
│   ├── search/               # Búsqueda por nombre + cadena evolutiva (funciones puras)
│   └── pokemon-meta.ts       # Colores/etiquetas de tipos, generaciones, sprites
└── types/                    # Tipos de dominio
```

## Despliegue en Vercel

Sin variables de entorno ni configuración: importar el repositorio en Vercel y desplegar. El listado se sirve estático con ISR diario y los detalles se generan bajo demanda con la misma política de revalidación.

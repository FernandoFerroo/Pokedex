"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Maximize2, X } from "lucide-react";
import {
  isFoil,
  RARITY_ORDER,
  type PackResult,
  type PoolCard,
  type PulledCard,
} from "@/types/tcg";
import { useSfx } from "@/components/audio/SfxProvider";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { PACK_ART, PACK_EDGE, RARITY_EDGE } from "@/lib/tcg/style";
import { CardBack, TcgCardFace } from "./TcgCardFace";
import { CardZoom } from "./CardZoom";
import { PackArt } from "./PackArt";
import { DustStream, RareBurst, TearBurst } from "./Bursts";
import { PeTally } from "./PeTally";

/**
 * La ceremonia, en cuatro tiempos: el sobre entero, el corte, las cartas de
 * una en una y el recuento.
 *
 * `stack` es el corazón —y la razón de que esto ya no sea un abanico—: en el
 * JCC Pocket las cartas salen EN FILA, una encima de otra, y cada una se gira
 * y se aparta antes de que aparezca la siguiente. Cinco cartas a la vez dan
 * cinco premios pequeños; cinco cartas de una en una dan cinco momentos.
 */
type State =
  | { kind: "idle" }
  | { kind: "tearing" }
  | { kind: "stack"; at: number; flipped: boolean; bursting: boolean }
  | { kind: "summary" };

type Action =
  | { t: "tear" }
  | { t: "torn" }
  | { t: "burst" }
  | { t: "flip" }
  | { t: "next"; total: number }
  | { t: "summary" };

function reducer(state: State, action: Action): State {
  switch (action.t) {
    case "tear":
      return state.kind === "idle" ? { kind: "tearing" } : state;
    case "torn":
      return { kind: "stack", at: 0, flipped: false, bursting: false };
    case "burst":
      return state.kind === "stack" ? { ...state, bursting: true } : state;
    case "flip":
      return state.kind === "stack"
        ? { ...state, flipped: true, bursting: false }
        : state;
    case "next": {
      if (state.kind !== "stack") return state;
      const at = state.at + 1;
      // La última carta no se aparta hacia un hueco vacío: cae directa al
      // recuento, que es donde vuelven a estar las seis juntas.
      return at >= action.total
        ? { kind: "summary" }
        : { kind: "stack", at, flipped: false, bursting: false };
    }
    case "summary":
      return { kind: "summary" };
    default:
      return state;
  }
}

/** Peldaño sonoro de la rareza: 1 holo, 2 ex / ilustración, 3 hyper. */
function rarityStep(card: PulledCard): number {
  const at = RARITY_ORDER.indexOf(card.rarity);
  return at >= RARITY_ORDER.indexOf("hyper") ? 3 : at >= RARITY_ORDER.indexOf("ex") ? 2 : 1;
}

/** Cuántas cartas del fondo asoman por detrás de la que toca. Más de tres no
 *  se distinguen y cada una es una carta más montada. */
const STACK_DEPTH = 3;

/** Recorrido, en fracción del ancho, que hay que arrastrar para que el corte
 *  prenda. Por debajo el envoltorio se cierra solo. */
const CUT_THRESHOLD = 0.55;

/** Píxeles de arrastre que apartan una carta ya girada. */
const THROW_THRESHOLD = 64;

/**
 * Lo que espera el polvo desde que la carta se gira.
 *
 * La repetida se lee ANTES de deshacerse: primero se ve qué carta era y sólo
 * entonces se convierte. Al revés —el polvo saliendo mientras la carta aún da
 * la vuelta— el efecto tapa justo lo que viene a premiar, y el jugador se
 * queda sin saber qué acaba de vender.
 */
const DUST_DELAY = 420;

/** Las dos puntas del viaje del polvo, en coordenadas de pantalla. */
interface DustFlight {
  /** Qué carta de la pila se está deshaciendo: también sirve de clave. */
  at: number;
  from: { x: number; y: number; w: number; h: number };
  to: { x: number; y: number };
  dust: number;
  color: string;
}

function centerOf(node: Element | null) {
  if (!node) return null;
  const rect = node.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    w: rect.width,
    h: rect.height,
  };
}

interface PackOpenerProps {
  /**
   * El sobre YA abierto y guardado. La ceremonia se reproduce desde un
   * resultado comprometido: si el sorteo ocurriera durante la animación,
   * recargar a mitad permitiría repetir un mal sobre.
   */
  result: PackResult;
  auraOf: (dexId: number) => string;
  onClose: () => void;
  onOpenAnother: (() => void) | null;
}

export function PackOpener({
  result,
  auraOf,
  onClose,
  onOpenAnother,
}: PackOpenerProps) {
  const t = useT().tcg;
  const sfx = useSfx();
  const reducedMotion = useReducedMotion();
  const [state, dispatch] = useReducer(reducer, { kind: "idle" });
  const [zoom, setZoom] = useState<PoolCard | null>(null);

  const cards = result.cards;
  const total = cards.length;
  const edge = PACK_EDGE[result.type];
  const glint = PACK_ART[result.type].glint;

  // La escena se come la pantalla: es una ceremonia, no una tarjeta más de la
  // página. Mientras dura, el álbum de debajo no se desplaza — y Escape sale,
  // que es lo que se espera de cualquier cosa que tape la pantalla entera. Las
  // cartas ya están guardadas antes de la primera animación, así que salirse a
  // medias no cuesta nada.
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // Con el visor holográfico abierto manda él: su Escape lo cierra a él.
      if (event.key === "Escape" && !zoom) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, zoom]);

  const tear = useCallback(() => {
    if (state.kind !== "idle") return;
    sfx.play("packTear");
    dispatch({ t: "tear" });
  }, [state.kind, sfx]);

  // ---- El corte -----------------------------------------------------------
  // El progreso NO vive en estado: un dedo dispara cien eventos por segundo y
  // cada uno sería un render entero. Se escribe la variable en el nodo y CSS
  // hace el resto — el mismo trato que reciben la inclinación holográfica y
  // los sprites arrastrables de la ficha.
  const packRef = useRef<HTMLDivElement>(null);
  const cut = useRef({ from: 0, width: 1, progress: 0, dragging: false });

  const setCut = useCallback((value: number) => {
    cut.current.progress = value;
    packRef.current?.style.setProperty("--cut", String(value));
  }, []);

  const onCutStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (state.kind !== "idle") return;
      const rect = event.currentTarget.getBoundingClientRect();
      cut.current = {
        from: event.clientX,
        width: rect.width,
        progress: 0,
        dragging: true,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [state.kind],
  );

  const onCutMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!cut.current.dragging) return;
      const travelled = (event.clientX - cut.current.from) / cut.current.width;
      setCut(Math.min(1, Math.max(0, travelled)));
    },
    [setCut],
  );

  const onCutEnd = useCallback(() => {
    if (!cut.current.dragging) return;
    cut.current.dragging = false;
    if (cut.current.progress >= CUT_THRESHOLD) {
      setCut(1);
      tear();
    } else {
      // Se cierra solo. Que el envoltorio vuelva a su sitio es lo que enseña
      // que el gesto hay que terminarlo.
      setCut(0);
    }
  }, [setCut, tear]);

  // ---- Las repetidas ------------------------------------------------------
  // Una repetida no se guarda: se deshace en Puntos de Entrenador. Los PE ya
  // están cobrados desde antes de la primera animación —el sorteo entero se
  // guardó al abrir—, así que esto es la CRÓNICA de un cobro y no el cobro: se
  // puede cerrar la escena a media conversión sin perder un punto.
  //
  // Lo abonado no se lleva en un acumulador sino en el índice de la última
  // carta cobrada, y el total se suma de ahí. Un acumulador se desincroniza en
  // cuanto alguien pasa de carta con las motas aún en el aire —el abono se
  // quedaría por el camino y la hucha diría menos de lo que hay—; con el índice
  // el cobro es idempotente y no puede saltarse ninguna.
  const [paidUpTo, setPaidUpTo] = useState(-1);
  const [flight, setFlight] = useState<DustFlight | null>(null);
  const tallyRef = useRef<HTMLSpanElement>(null);

  const tally = useMemo(
    () =>
      cards.slice(0, paidUpTo + 1).reduce((sum, card) => sum + card.dust, 0),
    [cards, paidUpTo],
  );

  const pay = useCallback((at: number) => {
    setPaidUpTo((prev) => Math.max(prev, at));
  }, []);

  // ---- Las cartas ---------------------------------------------------------
  const current = state.kind === "stack" ? cards[state.at] : null;

  /** Gira la carta de arriba, con aviso de rareza si lo merece. */
  const flip = useCallback(() => {
    if (state.kind !== "stack" || state.flipped || state.bursting || !current) return;
    // Las raras avisan antes de girar: el estallido es lo que convierte el
    // giro en un acontecimiento. Las comunes van directas — y con movimiento
    // reducido van directas TODAS: un estallido que dura un milisegundo no
    // anuncia nada, sólo mete un paso más entre el toque y la carta.
    if (isFoil(current.rarity) && !reducedMotion) {
      sfx.play("rareReveal", rarityStep(current));
      dispatch({ t: "burst" });
      return;
    }
    // El sonido de rareza SÍ suena aunque no haya estallido: quien pide menos
    // movimiento no está pidiendo menos premio.
    sfx.play(isFoil(current.rarity) ? "rareReveal" : "cardFlip", rarityStep(current));
    dispatch({ t: "flip" });
  }, [state, current, sfx, reducedMotion]);

  /** Aparta la carta girada y saca la siguiente. */
  const next = useCallback(() => {
    if (state.kind !== "stack" || !state.flipped) return;
    // Quien pasa deprisa deja el polvo a medio vuelo: se abona al apartar la
    // carta, para que la hucha nunca diga menos de lo que ya se ha ganado.
    pay(state.at);
    if (state.at + 1 >= total) {
      // La fanfarria se reserva para los sobres que la merecen; si no, cada
      // sobre de relleno sonaría a hazaña.
      if (cards.some((card) => rarityStep(card) >= 2)) sfx.play("victory");
      else sfx.play("confirm");
    } else {
      sfx.play("cardFlip");
    }
    dispatch({ t: "next", total });
  }, [state, total, cards, sfx, pay]);

  /** Un toque hace lo que toque: girar si está boca abajo, apartar si no. */
  const advance = useCallback(() => {
    if (state.kind !== "stack") return;
    if (state.flipped) next();
    else flip();
  }, [state, flip, next]);

  const skip = useCallback(() => {
    if (cards.some((card) => rarityStep(card) >= 2)) sfx.play("victory");
    else sfx.play("confirm");
    // Saltarse el revelado no es renunciar a las repetidas: se cobran todas.
    pay(total - 1);
    dispatch({ t: "summary" });
  }, [cards, sfx, pay, total]);

  // Arrastrar la carta girada para apartarla, como quien reparte. El toque
  // seco sigue funcionando: sólo cuenta como lanzamiento si de verdad se ha
  // recorrido distancia.
  const cardRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ x: 0, y: 0, moved: 0, dragging: false });

  const onCardDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      moved: 0,
      dragging: true,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onCardMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!drag.current.dragging || state.kind !== "stack" || !state.flipped) return;
      const dx = event.clientX - drag.current.x;
      const dy = event.clientY - drag.current.y;
      drag.current.moved = Math.hypot(dx, dy);
      const node = cardRef.current;
      if (!node) return;
      node.style.setProperty("--drag-x", `${dx}px`);
      node.style.setProperty("--drag-y", `${dy * 0.35}px`);
      node.style.setProperty("--drag-rot", `${dx * 0.05}deg`);
    },
    [state],
  );

  const releaseDrag = useCallback(() => {
    const node = cardRef.current;
    if (node) {
      node.style.removeProperty("--drag-x");
      node.style.removeProperty("--drag-y");
      node.style.removeProperty("--drag-rot");
    }
  }, []);

  const onCardUp = useCallback(() => {
    if (!drag.current.dragging) return;
    drag.current.dragging = false;
    const thrown = drag.current.moved >= THROW_THRESHOLD;
    releaseDrag();
    if (thrown && state.kind === "stack" && state.flipped) next();
  }, [state, next, releaseDrag]);

  // El clic del navegador llega DESPUÉS del `pointerup`; sin esto, un
  // lanzamiento contaría además como toque y se saltaría dos cartas.
  const onCardClick = useCallback(() => {
    if (drag.current.moved >= 8) {
      drag.current.moved = 0;
      return;
    }
    advance();
  }, [advance]);

  /**
   * La conversión: la carta girada resulta ser repetida y se deshace.
   *
   * Las dos puntas del viaje se miden aquí y no en CSS porque están en ramas
   * distintas del árbol —la carta en la pila, la hucha sobre el recuento—, y
   * se miden EN EL MOMENTO y no al montar: la pila se mueve entre cartas y una
   * medida guardada mandaría el polvo al sitio de la anterior.
   *
   * Con movimiento reducido no hay viaje: se abona y se acabó. El premio se
   * cuenta igual —quien pide menos movimiento no está pidiendo menos premio—,
   * pero contarlo no puede depender de que una animación termine.
   */
  useEffect(() => {
    if (state.kind !== "stack" || !state.flipped) return;
    const card = cards[state.at];
    if (!card || card.isNew || card.dust <= 0) return;
    if (paidUpTo >= state.at) return;

    const at = state.at;
    const timer = window.setTimeout(
      () => {
        sfx.play("dustConvert", rarityStep(card));
        const from = centerOf(cardRef.current);
        const to = centerOf(tallyRef.current);
        if (reducedMotion || !from || !to) {
          pay(at);
          return;
        }
        setFlight({ at, from, to, dust: card.dust, color: RARITY_EDGE[card.rarity] });
      },
      reducedMotion ? 0 : DUST_DELAY,
    );
    return () => window.clearTimeout(timer);
  }, [state, cards, paidUpTo, pay, sfx, reducedMotion]);

  const newCount = cards.filter((card) => card.isNew).length;
  const godPack = result.godPack || result.type === "god";

  /**
   * El abanico del recuento.
   *
   * El arco se reparte entre las cartas que haya en vez de dar un grado fijo a
   * cada una: los sobres no traen todos lo mismo —cinco el Relámpago, ocho el
   * Especial— y un grado por carta abriría el del Especial hasta poner las de
   * los extremos casi de canto. Así el abanico se ve igual de abierto los abra
   * quien los abra.
   */
  const spread = useMemo(
    () =>
      cards.map((_, i) => {
        const steps = Math.max(1, cards.length - 1);
        const offset = i - steps / 2;
        return {
          "--rot": `${(offset * 16) / steps}deg`,
          "--lift": `${(Math.abs(offset) * 20) / steps}%`,
          animationDelay: `${i * 90}ms`,
        } as CSSProperties;
      }),
    [cards],
  );

  return (
    <div
      className="pack-stage"
      style={{ "--edge": edge, "--glint": glint } as CSSProperties}
    >
      {/* Telón: el álbum sigue detrás, pero apagado. */}
      <span aria-hidden className="pack-stage__veil" />
      <span aria-hidden className="pack-stage__beams" data-phase={state.kind} />

      {/* La región de anuncios vive FUERA de lo que se transforma: dentro de
          un subárbol en movimiento algunos lectores de pantalla se pierden las
          mutaciones. */}
      <p role="status" aria-live="polite" className="sr-only">
        {state.kind === "stack" && state.flipped && current
          ? t.revealAnnounce(current.name, t.rarityName[current.rarity])
          : ""}
      </p>

      <button
        type="button"
        onClick={onClose}
        aria-label={t.closeOpener}
        className="absolute top-3 right-3 z-30 rounded-full bg-slate-100/10 p-2 text-slate-300 transition hover:bg-slate-100/20 hover:text-slate-100"
      >
        <X size={18} />
      </button>

      {/* `godPack` sólo marca el sobre NORMAL que se convirtió en Divino; uno
          que ya nació Divino lo dice su propio tipo. Las dos cosas merecen el
          cartel — quien abre un Divino tiene que verlo anunciado. */}
      {godPack && state.kind !== "idle" && (
        <div className="god-banner">
          <p className="font-display text-lg font-bold tracking-wide text-fuchsia-200">
            {t.godPackTitle}
          </p>
          <p className="font-mono text-xs text-fuchsia-200/70">{t.godPackBody}</p>
        </div>
      )}

      {/* ---- El sobre entero ---------------------------------------------- */}
      {(state.kind === "idle" || state.kind === "tearing") && (
        <div className="relative z-10 flex flex-col items-center gap-5">
          {/*
            El clic vive AQUÍ y no en el botón de dentro, y no es capricho:
            `setPointerCapture` redirige el `click` al elemento que capturó, así
            que un botón hijo de un capturador no se entera de que lo han
            pulsado. Con el manejador en el capturador funcionan las dos cosas —
            el ratón porque el evento acaba aquí, y el teclado porque el clic
            del botón sube hasta aquí.
          */}
          <div
            ref={packRef}
            onPointerDown={onCutStart}
            onPointerMove={onCutMove}
            onPointerUp={onCutEnd}
            onPointerCancel={onCutEnd}
            onClick={tear}
            data-phase={state.kind}
            className="pack-hero"
          >
            <span aria-hidden className="pack-aura" />
            {state.kind === "tearing" && (
              <TearBurst onDone={() => dispatch({ t: "torn" })} />
            )}

            {/* Dos mitades de la MISMA portada, recortadas por una máscara: el
                envoltorio se abre por donde se ha cortado en vez de ser dos
                dibujos distintos que se separan. */}
            <span className="pack-hero__half pack-hero__half--top">
              <PackArt type={result.type} variant="hero" tilt={0} />
            </span>
            <span className="pack-hero__half pack-hero__half--bottom">
              <PackArt type={result.type} variant="hero" tilt={0} />
            </span>

            {/* El corte: la brecha luminosa y la chispa que la abre. */}
            <span aria-hidden className="pack-hero__slit" />
            <span aria-hidden className="pack-hero__spark" />

            <button
              type="button"
              disabled={state.kind !== "idle"}
              aria-label={t.openAria(t.packName[result.type], total)}
              className="pack-hero__hit"
            />
          </div>

          {state.kind === "idle" && (
            <p className="pack-hint">
              <span className="pack-hint__swipe" aria-hidden />
              {t.swipeHint}
            </p>
          )}
        </div>
      )}

      {/* ---- Las cartas, de una en una ------------------------------------ */}
      {state.kind === "stack" && current && (
        <div className="relative z-10 flex flex-col items-center gap-4">
          {/* El recuento, en cuentas y no sólo en cifras: de un vistazo se ve
              cuánto queda sin tener que restar. La cifra se queda igualmente —
              es lo que se dicta en voz alta cuando alguien mira por encima del
              hombro. */}
          <div className="pack-progress">
            <p className="pack-progress__count">
              <span style={{ color: edge }}>{state.at + 1}</span>
              <span className="text-slate-500"> / {total}</span>
            </p>
            <span aria-hidden className="pack-progress__pips">
              {cards.map((card, i) => (
                <span
                  key={`${card.index}-${i}`}
                  className="pack-progress__pip"
                  data-state={i < state.at ? "done" : i === state.at ? "now" : "todo"}
                />
              ))}
            </span>

            {/* La hucha. Va aquí arriba y no bajo la carta a propósito: es el
                sitio al que vuela el polvo, y el recorrido tiene que cruzar la
                ilustración de abajo arriba para que se vea de dónde sale. */}
            <span ref={tallyRef}>
              <PeTally
                value={tally}
                format={t.dustTally}
                srLabel={t.dustTallyLabel}
                shown={tally > 0}
              />
            </span>
          </div>

          <div
            className="card-stack"
            data-flipped={state.flipped}
            style={
              {
                "--aura": auraOf(current.dexId),
                "--rare": RARITY_EDGE[current.rarity],
              } as CSSProperties
            }
          >
            {/* El foco y el pedestal: la carta deja de flotar sobre la nada y
                pasa a estar puesta EN algún sitio. Se tiñen del aura del
                Pokémon que toca, así que el fondo cambia de color con cada
                carta — y en el momento del giro se enciende. */}
            <span aria-hidden className="card-stack__pool" />
            <span aria-hidden className="card-stack__floor" />
            {/*
              Profundidades, de la más honda a la más superficial y luego la
              que se marcha. El orden del DOM ES el orden de pintado, y `-1`
              —la carta que acaba de apartarse— tiene que ir por encima de
              todas mientras sale volando.

              Se conserva su nodo a propósito: la clave no cambia, así que la
              carta que estabas mirando es la MISMA que se va, y no una copia
              que aparece de la nada donde estaba la otra.
            */}
            {Array.from(
              { length: Math.min(STACK_DEPTH + 1, total - state.at) + 1 },
              (_, i) => i - 1,
            )
              .filter((depth) => state.at + depth >= 0)
              .reverse()
              .map((depth) => {
                const index = state.at + depth;
                const card = cards[index];
                if (!card) return null;
                const top = depth === 0;
                const leaving = depth < 0;
                const revealed = leaving || (top && state.flipped);

                return (
                  <div
                    key={`${card.index}-${index}`}
                    ref={top ? cardRef : undefined}
                    className="stack-card"
                    data-top={top}
                    data-leaving={leaving}
                    data-flipped={top && state.flipped}
                    style={{ "--depth": Math.max(0, depth) } as CSSProperties}
                    // El clic va en el capturador, no en el botón de dentro:
                    // ver la nota del sobre.
                    {...(top
                      ? {
                          onPointerDown: onCardDown,
                          onPointerMove: onCardMove,
                          onPointerUp: onCardUp,
                          onPointerCancel: onCardUp,
                          onClick: onCardClick,
                        }
                      : {})}
                  >
                    {/* La carta deshaciéndose: un barrido de luz que la sube
                        entera mientras el polvo sale. Es lo que hace que las
                        motas salgan DE la carta y no de delante de ella. */}
                    {top && flight?.at === index && (
                      <span aria-hidden className="dust-drain" />
                    )}

                    {top && state.bursting && (
                      <RareBurst
                        color={auraOf(card.dexId)}
                        onDone={() => {
                          sfx.play("cardFlip");
                          dispatch({ t: "flip" });
                        }}
                      />
                    )}

                    <span className="stack-card__deal">
                      <button
                        type="button"
                        disabled={!top}
                        aria-hidden={!top}
                        tabIndex={top ? 0 : -1}
                        aria-label={
                          state.flipped
                            ? t.nextCardAria(card.name, t.rarityName[card.rarity])
                            : t.slotHiddenAria(index + 1, total)
                        }
                        className="stack-card__hit"
                      >
                        <span className="relative block h-full w-full">
                          <span className="tcg-flip block" data-revealed={revealed}>
                            <span className="tcg-face block">
                              <CardBack />
                            </span>
                            <span className="tcg-face tcg-face--front block">
                              {/*
                                Escaneo grande, y para TODAS las de la pila.
                                Aquí la carta es lo más grande que se ve en
                                toda la aplicación: con el escaneo pequeño
                                —245 px de ancho— una pantalla de retina la
                                estira al doble y el texto de los ataques sale
                                emborronado. Y va en todas, no sólo en la de
                                arriba, porque cambiarle la fuente a la imagen
                                justo cuando sube a primera fila parpadea.
                              */}
                              <TcgCardFace
                                card={card}
                                aura={auraOf(card.dexId)}
                                motion={top ? "live" : "static"}
                                high
                                eager
                                tilt={12}
                                sizes="(max-width: 640px) 86vw, 340px"
                                className="h-full w-full"
                              />
                            </span>
                          </span>
                        </span>
                      </button>
                    </span>
                  </div>
                );
              })}
          </div>

          {/* Ficha de la carta girada: nombre, nivel y si ya la tenías. Debajo
              de la carta y no encima — lo que se mira es la ilustración. */}
          <div className="card-plate" data-shown={state.flipped}>
            {state.flipped && (
              <span className="card-plate__inner">
                <p className="font-display text-base font-bold text-slate-100">
                  {current.name}
                </p>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 font-mono text-[10px]"
                    style={{
                      color: RARITY_EDGE[current.rarity],
                      background: `color-mix(in srgb, ${RARITY_EDGE[current.rarity]} 15%, transparent)`,
                    }}
                  >
                    {t.rarityName[current.rarity]}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-mono text-[10px]",
                      current.isNew
                        ? "bg-emerald-400/20 text-emerald-200"
                        : "bg-slate-100/10 text-slate-300",
                    )}
                  >
                    {current.isNew ? t.newBadge : t.dupeBadge(current.dust)}
                  </span>
                </div>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <p className="font-mono text-xs text-slate-400">
              {state.flipped ? t.tapToContinue : t.tapToFlip}
            </p>
            {state.flipped && (
              <button
                type="button"
                onClick={() => setZoom(current)}
                aria-label={t.zoomAria(current.name)}
                className="glass-btn inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[11px] text-cyan-200"
              >
                <Maximize2 size={12} aria-hidden />
                {t.holoCta}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={skip}
            className="font-mono text-[11px] text-slate-500 underline-offset-4 transition hover:text-slate-300 hover:underline"
          >
            {t.revealAll}
          </button>
        </div>
      )}

      {/* ---- El recuento --------------------------------------------------- */}
      {state.kind === "summary" && (
        <div className="pack-summary">
          <h3 className="font-display text-lg font-bold tracking-wide text-slate-100">
            {t.summaryTitle}
          </h3>

          {/* El ancho de cada carta sale del número de cartas: el abanico tiene
              que caber de una fila, o el arco se parte por la mitad. */}
          <ul
            className="pack-summary__spread"
            style={{ "--fan": total } as CSSProperties}
          >
            {cards.map((card, i) => (
              <li key={`${card.index}-${i}`} style={spread[i]}>
                <button
                  type="button"
                  onClick={() => setZoom(card)}
                  aria-label={t.slotRevealedAria(card.name, t.rarityName[card.rarity])}
                  className="block w-full cursor-zoom-in rounded-lg focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
                >
                  <TcgCardFace
                    card={card}
                    aura={auraOf(card.dexId)}
                    sizes="(max-width: 640px) 30vw, 180px"
                    className="w-full"
                  />
                </button>
                {card.isNew && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-400 px-1.5 py-px font-mono text-[8px] leading-tight font-bold whitespace-nowrap text-emerald-950 shadow-sm shadow-emerald-900/60">
                    {t.newBadge}
                  </span>
                )}
              </li>
            ))}
          </ul>

          {/* El recuento vuelve a contar los PE desde donde se quedó la hucha:
              quien se saltó el revelado los ve subir enteros aquí, y quien los
              vio caer uno a uno ve confirmado el total que ya tenía. */}
          <p className="flex flex-wrap items-center justify-center gap-2 font-mono text-sm text-slate-300">
            {newCount > 0 ? t.summaryNew(newCount) : t.summaryNothingNew}
            <PeTally
              value={result.peGained}
              format={t.summaryDust}
              srLabel={t.dustTallyLabel}
              shown={result.peGained > 0}
            />
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="glass-btn rounded-full px-4 py-2 font-mono text-xs"
            >
              {t.backToShelf}
            </button>
            {onOpenAnother && (
              <button
                type="button"
                onClick={onOpenAnother}
                className="glass-btn rounded-full px-4 py-2 font-mono text-xs text-cyan-200"
              >
                {t.openAnother}
              </button>
            )}
          </div>
        </div>
      )}

      {/* El polvo cuelga de la escena y no de la carta: cruza de una a otra y
          dentro de la pila lo recortaría el `contain` de las cartas. */}
      {flight && (
        <DustStream
          key={flight.at}
          from={flight.from}
          to={flight.to}
          dust={flight.dust}
          color={flight.color}
          onArrive={() => pay(flight.at)}
          onDone={() => setFlight(null)}
        />
      )}

      {zoom && (
        <CardZoom card={zoom} aura={auraOf(zoom.dexId)} onClose={() => setZoom(null)} />
      )}
    </div>
  );
}

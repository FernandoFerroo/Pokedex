"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Coins } from "lucide-react";
import type { PackType, PeEntry } from "@/types/tcg";
import { useSfx } from "@/components/audio/SfxProvider";
import { useCountTo } from "@/hooks/use-count-to";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { PACK_PRICE, SHOP_PACKS } from "@/lib/tcg/pull";
import { PACK_ART, PACK_EDGE } from "@/lib/tcg/style";
import { useT } from "@/lib/i18n/client";
import { PACKS_TAB_ID, PACK_LANDED_EVENT } from "./AlbumTabs";
import { ShopPackCard } from "./ShopPackCard";

/** Lo que dura la ceremonia de compra en la tarjeta: elevarse, destellar, caer. */
const BUY_MS = 900;
/** Lo que tarda el sobre en llegar volando a la pestaña de Sobres. */
const FLIGHT_MS = 820;
/** Lo que dura el temblor rojo de «no llega». */
const DENY_MS = 520;

interface Flight {
  /** Cambia en cada compra: es lo que remonta la animación desde cero. */
  id: number;
  type: PackType;
  from: DOMRect;
}

/**
 * La tienda. El Sobre Divino no aparece a propósito: es la única recompensa
 * que dice «has hecho algo difícil», y un precio lo borraría.
 *
 * Comprar es el único momento de esta pantalla en el que pasa algo, así que es
 * lo único que se anima, y se anima entero: el botón responde, los puntos se
 * van del contador, el sobre se levanta con su onda de choque y sale volando en
 * curva hasta la pestaña de Sobres, que lo recibe con un latido. Es la cadena
 * completa —he pagado, tengo el sobre, está allí— sin una sola línea de texto
 * que la explique.
 */
export function PackShop({
  pe,
  ledger,
  onBuy,
}: {
  pe: number;
  ledger: PeEntry[];
  onBuy: (type: PackType, price: number) => void;
}) {
  const t = useT().tcg;
  const sfx = useSfx();
  const reducedMotion = useReducedMotion();

  const [flight, setFlight] = useState<Flight | null>(null);
  const [buying, setBuying] = useState<PackType | null>(null);
  const [denied, setDenied] = useState<PackType | null>(null);
  /** El «−60 PE» que se desprende del contador. Se remonta con la clave. */
  const [spent, setSpent] = useState<{ id: number; price: number } | null>(null);

  const balanceRef = useCountTo(pe, t.balance);
  const timers = useRef<number[]>([]);
  const nextId = useRef(0);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(
    () => () => {
      for (const timer of timers.current) window.clearTimeout(timer);
    },
    [],
  );

  const buy = useCallback(
    (type: PackType, price: number, origin: HTMLElement | null) => {
      if (pe < price) {
        // No llega: el botón tiembla en rojo y no pasa nada más. Sin diálogo,
        // sin mensaje nuevo — la etiqueta ya dice «PE insuficientes».
        sfx.play("cancel");
        setDenied(type);
        later(() => setDenied((current) => (current === type ? null : current)), DENY_MS);
        return;
      }

      // Primero el estado y después la fiesta: si la animación fuese antes,
      // salirse a mitad dejaría un sobre comprado a medias.
      onBuy(type, price);
      sfx.play("itemUse");

      const id = ++nextId.current;
      setSpent({ id, price });
      later(() => setSpent((current) => (current?.id === id ? null : current)), 1000);

      if (reducedMotion) return;

      setBuying(type);
      later(() => setBuying((current) => (current === type ? null : current)), BUY_MS);

      const rect = origin?.getBoundingClientRect();
      if (!rect) return;
      setFlight({ id, type, from: rect });
      // Red de seguridad: una pestaña en segundo plano congela las animaciones,
      // y un sobre a medio camino que no llega nunca se quedaría clavado sobre
      // la página. El estado ya está guardado; esto sólo recoge el nodo.
      later(
        () => setFlight((current) => (current?.id === id ? null : current)),
        FLIGHT_MS + 400,
      );
    },
    [pe, onBuy, sfx, reducedMotion, later],
  );

  return (
    <div className="shop-stage">
      <span aria-hidden className="shop-stage__grid" />
      <span aria-hidden className="shop-stage__aurora" />

      <div className="shop-head">
        <h2 className="shop-head__title">{t.shopTitle}</h2>
        <p className="shop-head__sub">{t.shopSubtitle}</p>

        <p className="shop-balance">
          <Coins size={16} aria-hidden className="shop-balance__coin" />
          <span className="sr-only">{t.balanceLabel}: </span>
          {/* El texto formateado se pinta aquí para que el servidor ya diga la
              cifra buena; la cuenta atrás sólo reescribe el nodo. */}
          <span ref={balanceRef} className="shop-balance__value">
            {t.balance(pe)}
          </span>
          {spent && (
            <span key={spent.id} aria-hidden className="shop-balance__spent">
              −{t.price(spent.price)}
            </span>
          )}
        </p>
      </div>

      <ul className="shop-grid">
        {SHOP_PACKS.map((type) => {
          const price = PACK_PRICE[type] ?? 0;
          return (
            <li key={type}>
              <ShopPackCard
                type={type}
                price={price}
                affordable={pe >= price}
                state={
                  buying === type ? "buying" : denied === type ? "denied" : "idle"
                }
                onBuy={(origin) => buy(type, price, origin)}
              />
            </li>
          );
        })}
      </ul>

      <section className="shop-ledger">
        <h3 className="shop-ledger__title">{t.ledgerTitle}</h3>
        {ledger.length === 0 ? (
          <p className="shop-ledger__empty">{t.ledgerEmpty}</p>
        ) : (
          <ul>
            {ledger.map((entry, i) => (
              <li key={`${entry.at}-${i}`} className="shop-ledger__row">
                <span className="shop-ledger__reason">
                  {t.ledgerReason[entry.reason]}
                </span>
                <span
                  className="shop-ledger__amount"
                  data-sign={entry.amount >= 0 ? "up" : "down"}
                >
                  {entry.amount >= 0 ? "+" : ""}
                  {entry.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {flight && (
        <PackFlight
          key={flight.id}
          flight={flight}
          onDone={() => setFlight((current) => (current?.id === flight.id ? null : current))}
        />
      )}
    </div>
  );
}

/**
 * El sobre comprado viajando a la pestaña de Sobres.
 *
 * Va en coordenadas de ventana —`position: fixed`— y por una curva de Bézier,
 * no en línea recta: un objeto que sale de una tarjeta y entra en una pestaña
 * describiendo un arco se lee como algo que alguien ha lanzado, y en línea
 * recta se lee como un div moviéndose. La estela encoge y se apaga justo al
 * llegar, que es donde toma el relevo el latido de la pestaña.
 */
function PackFlight({ flight, onDone }: { flight: Flight; onDone: () => void }) {
  const ref = useRef<HTMLSpanElement>(null);

  // El aviso de llegada se guarda aparte y en un efecto declarado antes: la
  // animación se monta una sola vez y no puede depender de una función que
  // cambia de identidad en cada render del padre.
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const { from } = flight;
    const target = document.getElementById(PACKS_TAB_ID)?.getBoundingClientRect();
    const x0 = from.left + from.width / 2;
    const y0 = from.top + from.height / 2;
    const x1 = target ? target.left + target.width / 2 : x0;
    const y1 = target ? target.top + target.height / 2 : y0 - 240;

    // El vértice de la curva, por encima de las dos puntas: el sobre sube
    // antes de bajar a la pestaña, como una moneda lanzada.
    const cx = (x0 + x1) / 2;
    const cy = Math.min(y0, y1) - Math.max(120, Math.abs(x1 - x0) * 0.32);

    const land = () => {
      window.dispatchEvent(new CustomEvent(PACK_LANDED_EVENT));
      done.current();
    };

    const curved = CSS.supports?.("offset-path", "path('M 0 0 L 1 1')");
    const animation = curved
      ? node.animate(
          [
            { offsetDistance: "0%", scale: "1", opacity: 1 },
            { offsetDistance: "62%", scale: "0.62", opacity: 1, offset: 0.62 },
            { offsetDistance: "100%", scale: "0.14", opacity: 0 },
          ],
          { duration: FLIGHT_MS, easing: "cubic-bezier(0.45, 0, 0.3, 1)" },
        )
      : // Sin `offset-path` el sobre va en recta. Peor, pero llega — y llegar
        // es lo que cuenta la animación.
        node.animate(
          [
            { translate: "0 0", scale: "1", opacity: 1 },
            { translate: `${x1 - x0}px ${y1 - y0}px`, scale: "0.14", opacity: 0 },
          ],
          { duration: FLIGHT_MS, easing: "cubic-bezier(0.45, 0, 0.3, 1)" },
        );

    if (curved) {
      node.style.offsetPath = `path("M ${x0} ${y0} Q ${cx} ${cy} ${x1} ${y1}")`;
    } else {
      node.style.left = `${x0}px`;
      node.style.top = `${y0}px`;
    }

    animation.addEventListener("finish", land);
    // Cancelar NO es aterrizar. React monta y desmonta este efecto dos veces en
    // desarrollo, y tomar ese `cancel` por una llegada borraba el vuelo antes
    // del primer fotograma: el sobre no salía nunca. Quien limpia el estado si
    // la animación no termina es el temporizador de seguridad de la tienda.
    return () => animation.cancel();
  }, [flight]);

  return (
    <span
      ref={ref}
      aria-hidden
      className="pack-comet"
      style={
        {
          "--edge": PACK_EDGE[flight.type],
          "--glint": PACK_ART[flight.type].glint,
          "--deep": PACK_ART[flight.type].deep,
        } as CSSProperties
      }
    >
      <span className="pack-comet__trail" />
    </span>
  );
}

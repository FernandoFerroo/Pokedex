"use client";

import type { CSSProperties } from "react";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/**
 * Momento de la coreografía en el que está una figura.
 *
 * - `off`   fuera del encuadre, por su lado. Solo antes de que empiece el
 *           combate: es de donde entran para la presentación.
 * - `ready` plantado junto a su Pokémon. Es el estado de TODO el combate —
 *           quien da las órdenes las da desde el campo, como en los juegos.
 * - `throw` lanzando la Poké Ball.
 */
export type TrainerStance = "off" | "ready" | "throw";

/**
 * Un Entrenador de pie junto a su Pokémon, como en los juegos: el sprite
 * oficial (80×80 de pixel art, el mismo origen que los combatientes animados)
 * respirando en bucle sobre su sombra de contacto.
 *
 * Los sprites de la librería están todos pintados DE FRENTE, mirando a la
 * cámara —no hay vista de perfil ni de espaldas en la librería—, así que la
 * figura se gira sobre su propio eje con perspectiva hasta quedar de tres
 * cuartos hacia el campo. No es una pose nueva: es el mismo dibujo visto desde
 * un ángulo, que es todo lo que hace falta para que se lea que los dos se
 * miran el uno al otro y no al público.
 *
 * Es decoración pura — no intercepta clics — pero sí se anuncia: saber quién
 * hay al otro lado forma parte de la escena, no del adorno.
 */
export function TrainerFigure({
  sprite,
  name,
  side,
  foot,
  className,
  style,
  stance,
  light,
  bounce,
  far = false,
}: {
  /** Ruta del sprite oficial ya bajado a `public/trainers/`. */
  sprite: string;
  /** Nombre del Entrenador, para la descripción accesible de la figura. */
  name: string;
  side: "player" | "rival";
  /**
   * Filas transparentes que el sprite deja bajo los pies, de sus 80. La
   * figura se baja justo eso para que los pies caigan sobre el punto de
   * contacto en vez de flotar sobre él.
   */
  foot: number;
  /** Colocación sobre la escena, que decide la composición. */
  className?: string;
  /** Punto de apoyo en el suelo, que la escena mide sobre el decorado. */
  style?: CSSProperties;
  stance: TrainerStance;
  /**
   * Color de la luz del escenario (`palette.lightPool`): la misma con la que
   * el decorado ilumina el campo.
   *
   * Sale dos veces, y las dos para lo mismo — que la figura esté ENCENDIDA por
   * el sitio donde está y no por el juego del que viene: el charco de foco que
   * le abre sitio en la hierba y el filo de luz que le recorre el contorno por
   * arriba. Va por parámetro porque el estadio alumbra cálido y la cámara de
   * simulación alumbra en cian, y una figura con la luz cambiada vuelve a
   * leerse pegada encima.
   */
  light: string;
  /**
   * Color del SUELO que pisa (`palette.ground`), para el rebote.
   *
   * Una superficie iluminada devuelve su color a lo que tiene encima: quien
   * está de pie sobre césped bajo focos lleva verde en los bajos del pantalón
   * y en las suelas, siempre. Es el detalle que más barato ata una figura a un
   * decorado, y el que faltaba aquí — el pase de luz iba de cálido arriba a
   * azul de noche abajo, o sea que los pies recibían el color del CIELO. Con
   * eso, por bien resuelta que estuviera la sombra, el sprite seguía leyéndose
   * recortado y pegado encima en vez de plantado dentro.
   */
  bounce?: string;
  /**
   * Figura del fondo del campo (el Entrenador rival). Se integra con el
   * estadio como se integra todo lo que está lejos: pierde luz y contraste
   * contra el aire que hay por medio, y su sombra es más corta y más recta.
   * Sin esto, el rival se recorta con la misma nitidez que tú y las dos
   * figuras se leen en el mismo plano.
   */
  far?: boolean;
}) {
  const a11y = useT().a11y;
  const label =
    side === "player"
      ? a11y.playerTrainerOnField(name)
      : a11y.rivalTrainerOnField(name);

  // Aire que el sprite deja bajo los pies, en % de su propio alto. Sale tres
  // veces: baja la figura hasta el suelo, sube la sombra proyectada hasta la
  // línea de los pies y coloca el eje sobre el que esa sombra se tumba.
  const gap = (foot / 80) * 100;
  const drop = foot ? `0 ${gap}%` : undefined;

  // El giro hacia el campo, en grados sobre el eje vertical de la figura. El
  // del fondo gira poco más de la mitad: a esa distancia el escorzo se nota
  // el doble, y con el mismo ángulo que el de delante se quedaría de canto.
  const turn = far ? 23 : 42;
  // Lo que la figura encoge de ancho al girarse. Todo lo que la acompaña en el
  // suelo —sombras y contacto— encoge con ella: son la misma persona vista
  // desde arriba, y una sombra que no gire delata el truco.
  const squeeze = Math.cos((turn * Math.PI) / 180);

  // Máscara de silueta: la sombra proyectada y el pase de luz son el mismo
  // recorte que el sprite, así que los dos se recortan CON él en vez de
  // aproximarlo con una elipse. Va en estilo en línea, que no pasa por
  // Lightning CSS.
  const silhouette = {
    maskImage: `url(${sprite})`,
    WebkitMaskImage: `url(${sprite})`,
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
  } satisfies CSSProperties;

  return (
    <div
      className={cn("pointer-events-none absolute", className)}
      // Fuera de escena no debe leerse: en `off` la figura sigue montada —
      // para poder volver a entrar deslizándose — pero no es contenido.
      aria-hidden={stance === "off" || undefined}
      // La mezcla del pase de luz se queda dentro de la figura: sin aislar,
      // un `soft-light` se come también el decorado que tiene detrás.
      style={{ ...style, isolation: "isolate" }}
    >
      {/* Charco de foco sobre el suelo. La figura se planta en la banda más
          oscura del decorado —el césped ahí es casi negro—, así que por bien
          resuelto que esté el contacto, un pixel art de juego de día encima se
          lee como una pegatina. Esto le abre sitio: un óvalo de la luz del
          estadio, desplazado hacia el campo, que explica por qué se le ve.

          Va el primero de todo, debajo incluso de las sombras: es suelo
          iluminado, y lo que la figura tape del charco lo tiene que tapar. */}
      <span
        aria-hidden
        className="absolute left-[56%] -translate-x-1/2 rounded-[50%]"
        style={{
          bottom: far ? "-5%" : "-7%",
          width: far ? "170%" : "210%",
          height: far ? "20%" : "26%",
          background: `radial-gradient(ellipse at 50% 50%, ${light} 0%, transparent 72%)`,
          opacity: far ? 0.55 : 0.75,
          filter: `blur(${far ? 0.5 : 0.8}cqw)`,
        }}
      />
      {/* La segunda sombra, la del foco contrario. Un campo bajo torres se
          alumbra desde las cuatro esquinas, y lo que delata a un estadio no es
          tener sombra sino tener DOS cruzadas: la corta y clara que cae al otro
          lado es la que dice que quien está ahí está bajo focos. */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-full"
        style={{
          ...silhouette,
          backgroundColor: "#040914",
          transformOrigin: `50% ${100 - gap}%`,
          translate: drop,
          // `-squeeze`: la silueta se voltea con la figura. El recorte de la
          // sombra es el MISMO dibujo que el sprite, y el sprite se mira al
          // espejo para volverse hacia el campo (ver el bloque de la lámina).
          // El volteo va en el factor de ancho, el más interno, así que no
          // toca la inclinación de la sombra — sólo de qué lado cae la visera.
          transform: far
            ? `scaleY(-0.3) skewX(16deg) scaleX(${-squeeze})`
            : `scaleY(-0.4) skewX(26deg) scaleX(${-squeeze})`,
          filter: `blur(${far ? 0.5 : 0.8}cqw)`,
          opacity: far ? 0.22 : 0.28,
        }}
      />
      {/* Sombra PROYECTADA sobre la hierba: la propia silueta tumbada hacia la
          cámara, que es adonde caen las franjas del decorado —los focos están
          altos y al fondo—. Es lo que mete a la figura en el campo; una elipse
          bajo los pies, por oscura que sea, sigue leyéndose como una calca.

          El eje del espejo pasa por la LÍNEA DE LOS PIES, no por el borde de
          la caja: el sprite deja `foot` filas de aire debajo, y espejar sobre
          el borde nace la sombra despegada de quien la echa. */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-full"
        style={{
          ...silhouette,
          backgroundColor: "#03060f",
          transformOrigin: `50% ${100 - gap}%`,
          translate: drop,
          transform: far
            ? `scaleY(-0.42) skewX(-12deg) scaleX(${-squeeze})`
            : `scaleY(-0.62) skewX(-22deg) scaleX(${-squeeze})`,
          filter: `blur(${far ? 0.34 : 0.5}cqw)`,
          // El césped de este decorado ya es oscuro: por debajo de ~0.45 la
          // sombra deja de leerse y la figura vuelve a flotar.
          opacity: far ? 0.5 : 0.62,
        }}
      />
      {/* Y bajo los pies, la oclusión: corta, estrecha y MUY oscura, que es lo
          que no le llega al suelo por tener a alguien encima. Larga era
          mancha; ésta es lo que clava la figura donde está. */}
      <span
        aria-hidden
        className={cn(
          "pk-shadow-t absolute left-1/2 -translate-x-1/2 rounded-[50%]",
          far ? "-bottom-[1%] h-[4%]" : "-bottom-[1.4%] h-[5.5%]",
        )}
        style={{
          width: `${(far ? 46 : 54) * squeeze}%`,
          // Negro puro y opaco en el centro: la oclusión de contacto no es una
          // sombra a medias, es luz que NO llega porque hay una suela encima.
          // Con el 0,9 de antes el césped seguía asomando bajo los pies, que es
          // la lectura de «apoyado sobre» y no de «plantado en».
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0.78) 40%, rgba(0,0,0,0.3) 66%, rgba(0,0,0,0) 82%)",
          filter: `blur(${far ? 0.2 : 0.3}cqw)`,
        }}
      />
      <div
        className={cn(
          "relative flex w-full items-end justify-center",
          stance === "throw" ? "pk-trainer-throw" : "pk-idle-t",
        )}
      >
        <div
          className="relative w-full"
          // Los pies al suelo: el aire que el sprite deja debajo se descuenta
          // en proporción a su propio alto, así que aguanta a cualquier tamaño
          // de arena. Va en `translate`, que es su propia propiedad, para
          // dejarle el `transform` entero al giro.
          style={{
            translate: drop,
            // El giro hacia el enfrente, sobre los pies. La perspectiva es
            // larga —más de medio ancho de arena— para que el escorzo se lea
            // como una persona que se ha vuelto y no como un dibujo doblado.
            // Va aquí, en el envoltorio y no en la lámina, para que el pase de
            // luz —que es la misma silueta— se gire con ella.
            //
            // El orden importa, y se lee de DERECHA a izquierda:
            //
            //   1. `scaleX(-1)` voltea la lámina. Los sprites de la librería
            //      están pintados mirando hacia la izquierda del que mira, así
            //      que sin esto el de tu lado —que está a la izquierda del
            //      campo— se queda mirando fuera de plano, de espaldas a quien
            //      tiene enfrente. Volteado, la visera de la gorra, los ojos y
            //      la mano de la bola apuntan al rival.
            //   2. `rotateY` lo gira hacia su enfrente: positivo desde tu lado
            //      (hacia la derecha, donde está el rival) y negativo desde el
            //      suyo (hacia la izquierda, donde estás tú).
            //
            // El volteo va DENTRO del giro, no fuera: un `scaleX(-1)` por
            // delante espeja el resultado ya girado, y entonces la pose y la
            // perspectiva se contradicen — el dibujo mira a un lado y el
            // escorzo al otro, que es exactamente lo que hacía que la figura
            // se leyera «dada la vuelta».
            transform: `perspective(60cqw) rotateY(${side === "rival" ? -turn : turn}deg) scaleX(-1)`,
            transformOrigin: "50% 100%",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sprite}
            alt={label}
            className="block h-auto w-full object-contain object-bottom"
            style={{
              // Pixel art escalado: sin suavizado, igual que los sprites de
              // combate. Un Entrenador interpolado al lado de un Pokémon
              // nítido canta más que uno grande.
              imageRendering: "pixelated",
              // Exposición: el sprite viene de un juego iluminado de día y
              // aquí es de noche bajo focos. Baja de luz hasta la del campo
              // que pisa, y el contorno de arriba se enciende con la luz del
              // escenario —el filo que deja un foco alto sobre los hombros y
              // la gorra—. Ese filo es lo que ata la silueta al aire que
              // tiene alrededor en vez de recortarla contra él.
              filter: far
                ? `brightness(0.68) saturate(0.8) contrast(0.96) drop-shadow(0 -0.1cqw 0.2cqw ${light}) drop-shadow(0 1px 2px rgba(4, 8, 20, 0.5))`
                : `brightness(0.74) saturate(0.86) contrast(1.02) drop-shadow(0 -0.12cqw 0.26cqw ${light}) drop-shadow(0 2px 3px rgba(4, 8, 20, 0.6))`,
            }}
          />
          {/* Pase de luz del estadio, recortado con la propia silueta: cálido
              de foco por arriba, azul de noche por abajo. Es lo que hace que
              el pixel art comparta iluminación con el decorado en vez de
              traer la suya puesta. */}
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              ...silhouette,
              backgroundImage:
                "linear-gradient(to bottom, rgba(255, 232, 188, 0.62) 0%, rgba(255, 226, 176, 0.2) 26%, rgba(9, 20, 44, 0) 46%, rgba(9, 20, 44, 0.7) 100%)",
              mixBlendMode: "soft-light",
              opacity: far ? 0.85 : 1,
            }}
          />
          {/* REBOTE DEL SUELO. El césped que pisa está iluminado por los mismos
              focos, y todo suelo iluminado devuelve su color hacia arriba: los
              bajos del pantalón y las suelas de quien está de pie sobre hierba
              llevan verde, siempre.
              Sube sólo hasta media pierna —un rebote pierde fuerza a cuadrado
              de la distancia— y va en `screen`, que suma luz sin ensuciar el
              dibujo. Es la capa que dice que la figura está DENTRO del campo y
              no apoyada sobre una foto del campo. */}
          {bounce && (
            <span
              aria-hidden
              className="absolute inset-0"
              style={{
                ...silhouette,
                backgroundImage: `linear-gradient(to top, ${bounce} 0%, color-mix(in srgb, ${bounce} 40%, transparent) 10%, transparent 28%)`,
                mixBlendMode: "screen",
                opacity: far ? 0.3 : 0.4,
              }}
            />
          )}
        </div>
      </div>
      {/* Y lo último, POR DELANTE del sprite: lo que el suelo le tapa. El
          pixel art acaba en una fila recta de suela, y una suela entera a la
          vista es la última cosa que sigue diciendo «encima del campo» cuando
          ya está todo lo demás resuelto. Esta franja se la come — hierba
          delante de los pies, que es lo que hay cuando alguien está DENTRO
          del césped y no apoyado sobre él. */}
      <span
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 rounded-[50%]"
        style={{
          bottom: far ? "-1.6%" : "-2.2%",
          width: `${(far ? 46 : 56) * squeeze}%`,
          height: far ? "4.6%" : "6%",
          background:
            "radial-gradient(ellipse at 50% 38%, rgba(2, 5, 3, 0.94) 0%, rgba(2, 5, 3, 0.7) 48%, rgba(2, 5, 3, 0) 76%)",
          filter: `blur(${far ? 0.16 : 0.22}cqw)`,
        }}
      />
    </div>
  );
}

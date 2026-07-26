/**
 * Iconos dibujados a mano para el menú de combate.
 *
 * The four commands need glyphs no icon set ships in a matching style — a
 * clenched fist, a Poké Ball, a field bag and a running pair of legs — so
 * they are drawn here as flat vector paths on a shared 24×24 grid. They
 * inherit `currentColor`, which is what lets one button style light them
 * all up.
 */

type IconProps = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  "aria-hidden": true as const,
  focusable: "false" as const,
});

/** Puño cerrado: el comando de atacar. */
export function FistIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="currentColor">
      {/* Knuckles */}
      <path d="M5.6 8.2c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v1.3H5.6V8.2Z" />
      <path d="M9.2 7.1c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v2.4H9.2V7.1Z" />
      <path d="M12.8 7.4c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v2.1h-3.6V7.4Z" />
      <path d="M16.4 8.6c0-.9.7-1.6 1.6-1.6s1.6.7 1.6 1.6v.9h-3.2v-.9Z" />
      {/* Fist body */}
      <path d="M4.8 10.6h14.6c.5 0 .9.4.9.9v2.2c0 3.1-2.5 5.6-5.6 5.6h-4.6c-3.2 0-5.8-2.6-5.8-5.8v-2c0-.5.4-.9.5-.9Z" />
      {/* Thumb */}
      <path d="M4.9 11.2c-1 .3-1.7 1-1.9 1.9-.2.9.2 1.7.9 2.2l1.4.9c-.3-.9-.4-1.8-.4-2.7v-2.3Z" />
    </svg>
  );
}

/** Poké Ball: el comando de cambiar de Pokémon. */
export function BallIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="9.2" fill="currentColor" opacity={0.25} />
      <path
        d="M2.8 12a9.2 9.2 0 0 1 18.4 0Z"
        fill="currentColor"
      />
      <path
        d="M2.8 12h18.4"
        stroke="currentColor"
        strokeWidth="2.2"
        fill="none"
      />
      <circle
        cx="12"
        cy="12"
        r="9.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3.1" fill="#0b1220" />
      <circle
        cx="12"
        cy="12"
        r="3.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

/** Mochila de campo: el comando de objetos. */
export function BagIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="currentColor">
      {/* Flap handle */}
      <path
        d="M8.6 6.4a3.4 3.4 0 0 1 6.8 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Body */}
      <path d="M5.4 8.4h13.2c.9 0 1.6.8 1.5 1.7l-.9 8.1c-.1.8-.8 1.4-1.6 1.4H6.4c-.8 0-1.5-.6-1.6-1.4l-.9-8.1c-.1-.9.6-1.7 1.5-1.7Z" />
      {/* Front pocket, cut out so the bag reads at 20px */}
      <path
        d="M8.4 13.4h7.2v3.6H8.4z"
        fill="#0b1220"
        opacity={0.55}
      />
      <path d="M10.9 11.6h2.2v2.2h-2.2z" fill="#0b1220" opacity={0.55} />
    </svg>
  );
}

/** Piernas corriendo: el comando de huida. */
export function RunIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Front leg, striding forward */}
        <path d="M13.2 5.4 10.4 10l3.4 2.4-1 4.2" />
        {/* Rear leg, pushing off */}
        <path d="m10.4 10-3.2 1.4.4 3.4" />
        <path d="m12.8 16.6-3.4 2.6" />
        {/* Speed lines */}
        <path d="M4.2 8.4h3M3 12h2.4" strokeWidth="1.6" opacity={0.75} />
      </g>
      <circle cx="15.4" cy="4.6" r="2" fill="currentColor" />
    </svg>
  );
}

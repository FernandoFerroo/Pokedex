/**
 * The build editor's one-tap move briefs.
 *
 * The chips are labelled in the user's language (see the `team` dictionary),
 * but what travels to the model is the KEY, never the label: the brief itself
 * is written once, here, in the same Spanish the rest of the prompts use. That
 * keeps the nine translations free to phrase the button however reads best
 * without any of them quietly changing what the AI is actually asked for.
 */
export const MOVE_PRESETS = [
  "competitive",
  "physical",
  "special",
  "coverage",
  "status",
  "bulky",
] as const;

export type MovePreset = (typeof MOVE_PRESETS)[number];

export function isMovePreset(value: unknown): value is MovePreset {
  return (
    typeof value === "string" &&
    (MOVE_PRESETS as readonly string[]).includes(value)
  );
}

/** What each chip actually asks the coach for. */
export const PRESET_BRIEF: Record<MovePreset, string> = {
  competitive:
    "Un set competitivo estándar: dos ataques STAB fiables, un ataque de cobertura y una cuarta ranura útil (mejora de estadísticas, estado o prioridad). Precisión alta antes que potencia bruta.",
  physical:
    "Máximo daño físico: los ataques físicos más fuertes que tenga, con STAB siempre que pueda, y una mejora de Ataque si dispone de ella.",
  special:
    "Máximo daño especial: los ataques especiales más fuertes que tenga, con STAB siempre que pueda, y una mejora de Ataque Especial si dispone de ella.",
  coverage:
    "Cobertura de tipos: cuatro ataques de tipos DISTINTOS que entre todos golpeen al mayor número posible de tipos, aunque alguno pegue menos.",
  status:
    "Control: movimientos de estado y de apoyo (paralizar, dormir, envenenar, bajar estadísticas del rival) con uno o dos ataques para no quedarse sin ofensiva.",
  bulky:
    "Aguante y desgaste: curación o recuperación si la tiene, mejoras defensivas, daño residual (veneno, quemadura) y un ataque STAB fiable.",
};

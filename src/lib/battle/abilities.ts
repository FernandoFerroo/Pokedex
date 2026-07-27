/**
 * Qué habilidades se anuncian al salir al campo.
 *
 * En la 7.ª generación la ventana de habilidad no aparece por tener una: sale
 * cuando la habilidad *hace* algo, y el momento más visible es la entrada —
 * Intimidación bajando el Ataque, Llovizna montando la lluvia, Presión
 * avisando de lo que viene. El resto (Mar Llamas, Torrente…) actúan a mitad
 * de combate y allí no se anuncian solas.
 *
 * Esta lista es la de esas habilidades de entrada, por su slug de PokéAPI. La
 * arena la usa para decidir si abre la ventana cuando un Pokémon pisa el
 * campo, así que un Charizard sale sin ruido y un Gyarados sí se anuncia.
 */
const ANNOUNCED_ON_ENTRY = new Set([
  // Estadísticas y avisos.
  "intimidate",
  "download",
  "trace",
  "imposter",
  "pressure",
  "unnerve",
  "anticipation",
  "forewarn",
  "frisk",
  "mold-breaker",
  "teravolt",
  "turboblaze",
  "slow-start",
  "comatose",
  "schooling",
  // Clima y campos.
  "drizzle",
  "drought",
  "sand-stream",
  "snow-warning",
  "air-lock",
  "cloud-nine",
  "primordial-sea",
  "desolate-land",
  "delta-stream",
  "electric-surge",
  "psychic-surge",
  "grassy-surge",
  "misty-surge",
  // Auras.
  "dark-aura",
  "fairy-aura",
  "aura-break",
]);

/** True si esa habilidad se anuncia al salir al campo. */
export function announcesOnEntry(slug: string | null | undefined): boolean {
  return slug !== null && slug !== undefined && ANNOUNCED_ON_ENTRY.has(slug);
}

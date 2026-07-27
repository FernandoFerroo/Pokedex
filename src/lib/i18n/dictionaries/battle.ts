import type { EngineTexts } from "@/lib/battle/engine";
import type { Side } from "@/types/battle";
import type { Lang } from "../config";

/** Battle mode: page metadata, the pre-battle lobby (RivalBuilder), the HUD,
 * the orchestrator (BattleScreen), the pure engine's battle lines and the
 * server strings of the /api/battle routes. */

/* ------------------------------------------------------------------ */
/* Engine lines (injected into resolveTurn as its `texts` bundle)      */
/* ------------------------------------------------------------------ */

/** ES marks the foe by appending " enemigo" after the name. */
const esSide = (side: Side) => (side === "player" ? "" : " enemigo");

const esEngine: EngineTexts = {
  useMove: (label, side, moveLabel) =>
    `¡${label}${esSide(side)} usó ${moveLabel}!`,
  miss: (label) => `¡${label} falló el ataque!`,
  noEffect: (label, side) => `No afecta a ${label}${esSide(side)}…`,
  crit: "¡Golpe crítico!",
  superEffective: "¡Es súper eficaz!",
  notVeryEffective: "No es muy eficaz…",
  faint: (label, side) => `¡${label}${esSide(side)} se debilitó!`,
  win: "¡Has ganado el combate!",
  lose: "Te has quedado sin Pokémon… ¡Has perdido!",
  sendOut: (label, side) =>
    side === "player" ? `¡Adelante, ${label}!` : `¡El rival envía a ${label}!`,
  potion: (label, side, amount) =>
    side === "player"
      ? `Usaste una Poción: ${label} recupera ${amount} PS.`
      : `¡El rival usa una Poción y ${label} recupera ${amount} PS!`,

  statNames: {
    atk: "Ataque",
    def: "Defensa",
    spa: "Ataque Especial",
    spd: "Defensa Especial",
    spe: "Velocidad",
    acc: "Precisión",
    eva: "Evasión",
  },
  statRose: (label, side, stat, sharply) =>
    `¡El ${stat} de ${label}${esSide(side)} subió${sharply ? " mucho" : ""}!`,
  statFell: (label, side, stat, sharply) =>
    `¡El ${stat} de ${label}${esSide(side)} bajó${sharply ? " mucho" : ""}!`,
  statNoHigher: (label, side, stat) =>
    `¡El ${stat} de ${label}${esSide(side)} no puede subir más!`,
  statNoLower: (label, side, stat) =>
    `¡El ${stat} de ${label}${esSide(side)} no puede bajar más!`,
  healed: (label, side) => `¡${label}${esSide(side)} recuperó PS!`,
  healFull: (label, side) =>
    `Los PS de ${label}${esSide(side)} ya están al máximo…`,
  fail: "¡Pero falló!",
  inflicted: {
    paralysis: (label, side) =>
      `¡${label}${esSide(side)} está paralizado! Quizá no pueda moverse.`,
    burn: (label, side) => `¡${label}${esSide(side)} sufre quemaduras!`,
    poison: (label, side) => `¡${label}${esSide(side)} ha sido envenenado!`,
    sleep: (label, side) => `¡${label}${esSide(side)} se ha dormido!`,
    freeze: (label, side) => `¡${label}${esSide(side)} se ha congelado!`,
    confusion: (label, side) => `¡${label}${esSide(side)} está confuso!`,
  },
  noEffectGeneric: "¡Pero no tuvo efecto!",
  fullyParalyzed: (label, side) =>
    `¡${label}${esSide(side)} está paralizado! ¡No se puede mover!`,
  asleep: (label, side) => `${label}${esSide(side)} está dormido…`,
  wokeUp: (label, side) => `¡${label}${esSide(side)} se despertó!`,
  frozenSolid: (label, side) => `¡${label}${esSide(side)} está congelado!`,
  thawed: (label, side) => `¡${label}${esSide(side)} se descongeló!`,
  hurtByBurn: (label, side) =>
    `¡${label}${esSide(side)} sufre daño por la quemadura!`,
  hurtByPoison: (label, side) =>
    `¡${label}${esSide(side)} sufre daño por el veneno!`,
  confusedCheck: (label, side) => `${label}${esSide(side)} está confuso…`,
  hurtItself: "¡Está tan confuso que se hirió a sí mismo!",
  snappedOut: (label, side) => `¡${label}${esSide(side)} ya no está confuso!`,
  drained: (label, side) => `¡${label}${esSide(side)} absorbió energía!`,
  recoil: (label, side) =>
    `¡${label}${esSide(side)} sufre daño por el retroceso!`,

  charge: {
    underground: (label, side) =>
      `¡${label}${esSide(side)} se escondió bajo tierra!`,
    airborne: (label, side) => `¡${label}${esSide(side)} voló muy alto!`,
    underwater: (label, side) =>
      `¡${label}${esSide(side)} se ocultó bajo el agua!`,
    vanished: (label, side) =>
      `¡${label}${esSide(side)} desapareció de repente!`,
    charging: (label, side) =>
      `¡${label}${esSide(side)} está acumulando energía!`,
  },
  avoided: (label, side) => `¡${label}${esSide(side)} evitó el ataque!`,
};

/** EN marks the foe by prefixing "The opposing X", like the modern games. */
const enName = (label: string, side: Side) =>
  side === "player" ? label : `The opposing ${label}`;

const enEngine: EngineTexts = {
  useMove: (label, side, moveLabel) =>
    side === "player"
      ? `${label} used ${moveLabel}!`
      : `The opposing ${label} used ${moveLabel}!`,
  miss: (label, side) =>
    side === "player"
      ? `${label}'s attack missed!`
      : `The opposing ${label}'s attack missed!`,
  noEffect: (label, side) =>
    side === "player"
      ? `It doesn't affect ${label}…`
      : `It doesn't affect the opposing ${label}…`,
  crit: "A critical hit!",
  superEffective: "It's super effective!",
  notVeryEffective: "It's not very effective…",
  faint: (label, side) =>
    side === "player"
      ? `${label} fainted!`
      : `The opposing ${label} fainted!`,
  win: "You won the battle!",
  lose: "You're out of Pokémon… You lost!",
  sendOut: (label, side) =>
    side === "player" ? `Go, ${label}!` : `The rival sent out ${label}!`,
  potion: (label, side, amount) =>
    side === "player"
      ? `You used a Potion: ${label} recovered ${amount} HP.`
      : `The rival used a Potion and ${label} recovered ${amount} HP!`,

  statNames: {
    atk: "Attack",
    def: "Defense",
    spa: "Sp. Atk",
    spd: "Sp. Def",
    spe: "Speed",
    acc: "accuracy",
    eva: "evasiveness",
  },
  statRose: (label, side, stat, sharply) =>
    `${enName(label, side)}'s ${stat} rose${sharply ? " sharply" : ""}!`,
  statFell: (label, side, stat, sharply) =>
    `${enName(label, side)}'s ${stat} ${sharply ? "harshly fell" : "fell"}!`,
  statNoHigher: (label, side, stat) =>
    `${enName(label, side)}'s ${stat} won't go any higher!`,
  statNoLower: (label, side, stat) =>
    `${enName(label, side)}'s ${stat} won't go any lower!`,
  healed: (label, side) => `${enName(label, side)} regained health!`,
  healFull: (label, side) => `${enName(label, side)}'s HP is already full…`,
  fail: "But it failed!",
  inflicted: {
    paralysis: (label, side) =>
      `${enName(label, side)} is paralyzed! It may be unable to move!`,
    burn: (label, side) => `${enName(label, side)} was burned!`,
    poison: (label, side) => `${enName(label, side)} was poisoned!`,
    sleep: (label, side) => `${enName(label, side)} fell asleep!`,
    freeze: (label, side) => `${enName(label, side)} was frozen solid!`,
    confusion: (label, side) => `${enName(label, side)} became confused!`,
  },
  noEffectGeneric: "But it had no effect!",
  fullyParalyzed: (label, side) =>
    `${enName(label, side)} is paralyzed! It can't move!`,
  asleep: (label, side) => `${enName(label, side)} is fast asleep…`,
  wokeUp: (label, side) => `${enName(label, side)} woke up!`,
  frozenSolid: (label, side) => `${enName(label, side)} is frozen solid!`,
  thawed: (label, side) => `${enName(label, side)} thawed out!`,
  hurtByBurn: (label, side) =>
    `${enName(label, side)} is hurt by its burn!`,
  hurtByPoison: (label, side) =>
    `${enName(label, side)} is hurt by poison!`,
  confusedCheck: (label, side) => `${enName(label, side)} is confused…`,
  hurtItself: "It hurt itself in its confusion!",
  snappedOut: (label, side) =>
    `${enName(label, side)} snapped out of its confusion!`,
  drained: (label, side) => `${enName(label, side)} absorbed energy!`,
  recoil: (label, side) => `${enName(label, side)} is damaged by recoil!`,

  charge: {
    underground: (label, side) =>
      `${enName(label, side)} burrowed its way under the ground!`,
    airborne: (label, side) => `${enName(label, side)} flew up high!`,
    underwater: (label, side) => `${enName(label, side)} hid underwater!`,
    vanished: (label, side) => `${enName(label, side)} vanished instantly!`,
    charging: (label, side) => `${enName(label, side)} is gathering power!`,
  },
  avoided: (label, side) => `${enName(label, side)} avoided the attack!`,
};

/* ------------------------------------------------------------------ */
/* Dictionaries                                                        */
/* ------------------------------------------------------------------ */

const es = {
  engine: esEngine,

  // /battle page metadata
  metaTitle: "Modo Combate",
  metaDescription:
    "Combate Pokémon contra un Entrenador generado por IA: arena 3D, diálogo en tiempo real y decisiones tácticas turno a turno.",

  // BattleScreen: no-team card
  noTeamTitle: "MODO COMBATE",
  noTeamBody:
    "Necesitas al menos un Pokémon en tu equipo para entrar en la arena.",
  noTeamCta: "Montar mi equipo",

  // BattleScreen: chrome + loading + error
  backToDex: "← Volver a la Pokédex",
  /** Same exit, for the arena corner where the full sentence does not fit. */
  backToDexShort: "Pokédex",
  loadingTitle: "Generando rival y preparando la arena…",
  loadingHint: "La IA está montando un equipo a tu altura.",
  retry: "Reintentar",
  changeRival: "Cambiar rival",
  setupFailed: "No se pudo preparar el combate.",
  noServer: "Sin conexión con el servidor de combate.",

  // BattleScreen: opening sequence + prompts
  challenge: (name: string) => `¡${name} te desafía!`,
  trainerSendsOut: (trainer: string, label: string) =>
    `¡${trainer} envía a ${label}!`,
  fallbackRival: "El rival",
  whatWillDo: (label: string) => `¿Qué hará ${label}?`,
  whichItem: "¿Qué objeto usarás?",
  whichSwitch: "¿A qué Pokémon envías ahora?",
  /** Said while the red beam pulls a Pokémon back into its ball. */
  recall: (label: string, side: Side) =>
    side === "player" ? `¡Vuelve, ${label}!` : `¡El rival retira a ${label}!`,

  // BattleScreen: rival dialogue fallbacks
  dialogueDefault: "¡Vamos!",
  dialogueFallback: "¡No pienso ponértelo fácil!",

  // BattleScreen: intro overlay
  introChallenge: "¡Un entrenador quiere luchar!",
  /** The rival's battle cry, wrapped in the language's quote marks. */
  motto: (lema: string) => `«${lema}»`,
  fight: "¡Al combate!",

  // BattleScreen: flee confirm
  fleeConfirm: "¿Seguro que quieres huir del combate?",
  fleeYes: "Huir",
  fleeNo: "Seguir luchando",
  fledMsg: "Has huido del combate…",

  // BattleScreen: end-of-battle overlay
  overFled: "COMBATE ABANDONADO",
  victory: "¡VICTORIA!",
  defeat: "DERROTA",
  victoryBody: (name: string) =>
    `Has derrotado a ${name}. ¡Tu equipo puede con todo!`,
  defeatBody: (name: string) =>
    `${name} se lleva el combate. ¡Entrena y vuelve a por la revancha!`,
  yourRivalLower: "tu rival",
  yourRivalUpper: "Tu rival",
  rematch: "Revancha",
  backToDexPlain: "Volver a la Pokédex",

  // BattleHud
  hp: "PS",
  lvShort: "Nv.",
  abilityShort: "Hab.",
  menuFight: "Lucha",
  menuPokemon: "Pokémon",
  menuBag: "Mochila",
  menuFlee: "Huir",
  hintNoEffect: "Sin efecto",
  /**
   * Los dos rótulos que premian el golpe: el marcador de racha, que sube con
   * cada golpe encadenado que duele, y el K.O. que se planta sobre el Pokémon
   * que acaba de caer. Van sobre el campo y en grande, así que se quedan en
   * una palabra.
   */
  comboLabel: "Racha",
  koStinger: "¡K.O.!",
  hintSuper: "¡Súper eficaz!",
  hintNotVery: "Poco eficaz",
  hintNeutral: "Eficaz",
  classStatus: "Estado",
  classPhysical: "Físico",
  classSpecial: "Especial",
  /** Etiqueta corta de la potencia base del movimiento. */
  powerShort: "PB",
  // SfxControl (sonido del combate; la música tiene su propio reproductor)
  sfxLabel: "SFX",
  sfxGroupAria: "Efectos de sonido del combate",
  sfxOnAria: "Activar los efectos de sonido",
  sfxOffAria: "Silenciar los efectos de sonido",
  sfxVolumeAria: "Volumen de los efectos de sonido",
  back: "← Volver",
  potionItem: "Poción",
  potionDesc: "Restaura 60 PS. Gasta el turno.",
  choosePokemon: "Elige un Pokémon.",
  statusFainted: "Debilitado",
  statusActive: "En combate",

  // RivalBuilder (pre-battle lobby)
  builder: {
    closePickerAria: "Cerrar selector",
    pickerDialogAria: (slot: number) =>
      `Elegir Pokémon rival para la ranura ${slot}`,
    pickerTitle: "ELIGE UN POKÉMON RIVAL",
    pickerSlot: (slot: number) => `Ranura ${slot}`,
    filterPlaceholder: "Filtra por nombre (ej. pikachu)…",
    filterAria: "Filtrar Pokémon por nombre",
    indexFailedClose:
      "No se pudo cargar el índice de especies. Cierra y vuelve a intentarlo.",
    loadingSpecies: "Cargando especies…",
    noResultsFor: (query: string) =>
      `Sin resultados para «${query}» (los nombres van en inglés).`,
    slotChoose: "Elegir",
    slotChooseTitle: "Elegir Pokémon rival",
    removeAria: (name: string) => `Quitar a ${name} del equipo rival`,
    levelAria: (name: string) => `Nivel de ${name}`,
    title: "EQUIPO RIVAL",
    clear: "Vaciar",
    randomTitle: "La IA inventa un entrenador y su equipo, a tu altura",
    random: "Rival aleatorio",
    coachNote: "Equipo rival generado por el Coach Bot",
    coachAskTitle: "¿Sin rival? Pídeselo a la IA por mensaje",
    coachAskBody:
      "Describe el equipo rival que quieres y el Coach Bot montará uno de 6 Pokémon.",
    wishPlaceholder:
      "Ej.: un equipo de dragones legendarios, o los seis iniciales de Kanto…",
    wishAria: "Describe el equipo rival que quieres generar",
    generating: "Montando rival…",
    generateCta: "✨ Generar rival con IA",
    coachFail: "El Coach Bot no responde. Inténtalo de nuevo.",
    coachOffline: "Sin conexión con el Coach Bot…",
    searchPlaceholder: "Busca cualquier Pokémon para el rival (ej. mewtwo)…",
    searchAria: "Buscar Pokémon para añadir al equipo rival",
    indexFailedReload:
      "No se pudo cargar el índice de especies. Recarga e inténtalo de nuevo.",
    emptyHint:
      "Pulsa «+» en una ranura, busca arriba, pídelo por mensaje… o lanza un rival aleatorio.",
    slotEmpty: "Ranura vacía",
    slotPick: "+ Elegir rival",
    changeAria: (name: string) => `Cambiar a ${name} por otro Pokémon`,
    consoleTitle: "Coach-Bot · terminal",
    presetsLabel: "Presets rápidos",
    presetChampions: "Equipos de Campeones",
    presetDragon: "Monotype Dragón",
    presetRain: "Equipo Lluvia",
    presetRandom: "6 Aleatorios",
    presetIndexLoading: "Cargando el índice de especies…",
    launchCta: "¡Ir al combate!",
    launchEmpty: "Elige al menos un rival",
    launchReady: "Equipo rival completo · 6 vs 6",
    launchPartial: (filled: number) => `Solo ${filled} de 6 rivales listos`,
    launchConfirm: "Pulsa otra vez para combatir así",
  },

  // /api/battle routes (errors, LLM language line and canned fallbacks)
  api: {
    errNoKey: "Falta OPENAI_API_KEY en el servidor.",
    errBadJson: "JSON inválido.",
    errNeedTeam: "Necesitas al menos un Pokémon en el equipo para combatir.",
    errLoadout:
      "No se pudieron preparar los equipos de combate. Inténtalo de nuevo.",
    errIncompleteState: "Estado de combate incompleto.",
    /** Appended to every system prompt so the LLM speaks the UI language. */
    answerIn:
      "IMPORTANTE: escribe todos los textos del JSON (nombre, lema, estilo, frase…) en español.",
    levelWord: "Nivel",
    fallbackStyle: "entrenador misterioso de estética neón",
    cannedRivals: [
      {
        nombre: "Neo, el Domador del Circuito",
        lema: "¡Mis circuitos ya calcularon tu derrota!",
        estilo: "entrenador cyberpunk con visor neón y gabardina",
      },
      {
        nombre: "Askal, la Sombra de Kanto",
        lema: "En la oscuridad de la arena, solo brillará mi victoria.",
        estilo: "entrenadora misteriosa con capa oscura y ojos brillantes",
      },
    ],
    turnFallbackDialogue: "¡Sigue atacando, no les des tregua!",
    turnDefaultDialogue: "¡A por ellos!",
  },
};

const en: typeof es = {
  engine: enEngine,

  metaTitle: "Battle Mode",
  metaDescription:
    "Pokémon battle against an AI-generated Trainer: 3D arena, real-time dialogue and turn-by-turn tactical decisions.",

  noTeamTitle: "BATTLE MODE",
  noTeamBody: "You need at least one Pokémon in your team to enter the arena.",
  noTeamCta: "Build my team",

  backToDex: "← Back to the Pokédex",
  backToDexShort: "Pokédex",
  loadingTitle: "Generating a rival and preparing the arena…",
  loadingHint: "The AI is building a team that matches yours.",
  retry: "Retry",
  changeRival: "Change rival",
  setupFailed: "The battle could not be prepared.",
  noServer: "No connection to the battle server.",

  challenge: (name: string) => `You are challenged by ${name}!`,
  trainerSendsOut: (trainer: string, label: string) =>
    `${trainer} sent out ${label}!`,
  fallbackRival: "The rival",
  whatWillDo: (label: string) => `What will ${label} do?`,
  whichItem: "Which item will you use?",
  whichSwitch: "Which Pokémon will you send in next?",
  recall: (label, side) =>
    side === "player" ? `${label}, come back!` : `The foe withdraws ${label}!`,

  dialogueDefault: "Let's go!",
  dialogueFallback: "I won't make this easy for you!",

  introChallenge: "A Trainer wants to battle!",
  motto: (lema: string) => `“${lema}”`,
  fight: "Let's battle!",

  fleeConfirm: "Are you sure you want to flee the battle?",
  fleeYes: "Flee",
  fleeNo: "Keep battling",
  fledMsg: "You fled from the battle…",

  overFled: "BATTLE ABANDONED",
  victory: "VICTORY!",
  defeat: "DEFEAT",
  victoryBody: (name: string) =>
    `You defeated ${name}. Your team can take on anything!`,
  defeatBody: (name: string) =>
    `${name} takes the battle. Train up and come back for a rematch!`,
  yourRivalLower: "your rival",
  yourRivalUpper: "Your rival",
  rematch: "Rematch",
  backToDexPlain: "Back to the Pokédex",

  hp: "HP",
  lvShort: "Lv.",
  abilityShort: "Ab.",
  menuFight: "Fight",
  menuPokemon: "Pokémon",
  menuBag: "Bag",
  menuFlee: "Run",
  hintNoEffect: "No effect",
  comboLabel: "Combo",
  koStinger: "K.O.!",
  hintSuper: "Super effective!",
  hintNotVery: "Not very effective",
  hintNeutral: "Effective",
  classStatus: "Status",
  classPhysical: "Physical",
  classSpecial: "Special",
  powerShort: "BP",
  sfxLabel: "SFX",
  sfxGroupAria: "Battle sound effects",
  sfxOnAria: "Turn sound effects on",
  sfxOffAria: "Mute sound effects",
  sfxVolumeAria: "Sound effects volume",
  back: "← Back",
  potionItem: "Potion",
  potionDesc: "Restores 60 HP. Uses up the turn.",
  choosePokemon: "Choose a Pokémon.",
  statusFainted: "Fainted",
  statusActive: "In battle",

  builder: {
    closePickerAria: "Close picker",
    pickerDialogAria: (slot: number) =>
      `Choose a rival Pokémon for slot ${slot}`,
    pickerTitle: "CHOOSE A RIVAL POKÉMON",
    pickerSlot: (slot: number) => `Slot ${slot}`,
    filterPlaceholder: "Filter by name (e.g. pikachu)…",
    filterAria: "Filter Pokémon by name",
    indexFailedClose:
      "The species index could not be loaded. Close and try again.",
    loadingSpecies: "Loading species…",
    noResultsFor: (query: string) => `No results for “${query}”.`,
    slotChoose: "Choose",
    slotChooseTitle: "Choose a rival Pokémon",
    removeAria: (name: string) => `Remove ${name} from the rival team`,
    levelAria: (name: string) => `Level of ${name}`,
    title: "RIVAL TEAM",
    clear: "Clear",
    randomTitle: "The AI invents a trainer and a team that matches yours",
    random: "Random rival",
    coachNote: "Rival team generated by the Coach Bot",
    coachAskTitle: "No rival? Ask the AI by message",
    coachAskBody:
      "Describe the rival team you want and the Coach Bot will build one with 6 Pokémon.",
    wishPlaceholder:
      "E.g.: a team of legendary dragons, or the six Kanto starters…",
    wishAria: "Describe the rival team you want to generate",
    generating: "Building rival…",
    generateCta: "✨ Generate rival with AI",
    coachFail: "The Coach Bot is not responding. Try again.",
    coachOffline: "No connection to the Coach Bot…",
    searchPlaceholder: "Search any Pokémon for the rival (e.g. mewtwo)…",
    searchAria: "Search Pokémon to add to the rival team",
    indexFailedReload:
      "The species index could not be loaded. Reload and try again.",
    emptyHint:
      "Press “+” on a slot, search above, ask by message… or launch a random rival.",
    slotEmpty: "Empty slot",
    slotPick: "+ Pick a rival",
    changeAria: (name) => `Swap ${name} for another Pokémon`,
    consoleTitle: "Coach-Bot · terminal",
    presetsLabel: "Quick presets",
    presetChampions: "Champion teams",
    presetDragon: "Dragon monotype",
    presetRain: "Rain team",
    presetRandom: "6 random",
    presetIndexLoading: "Loading the species index…",
    launchCta: "Into battle!",
    launchEmpty: "Pick at least one rival",
    launchReady: "Rival team complete · 6 vs 6",
    launchPartial: (filled) => `Only ${filled} of 6 rivals ready`,
    launchConfirm: "Press again to battle anyway",
  },

  api: {
    errNoKey: "OPENAI_API_KEY is missing on the server.",
    errBadJson: "Invalid JSON.",
    errNeedTeam: "You need at least one Pokémon in your team to battle.",
    errLoadout: "The battle teams could not be prepared. Try again.",
    errIncompleteState: "Incomplete battle state.",
    answerIn:
      "IMPORTANT: write every text value in the JSON (name, motto, style, dialogue…) in English.",
    levelWord: "Level",
    fallbackStyle: "mysterious trainer with a neon aesthetic",
    cannedRivals: [
      {
        nombre: "Neo, the Circuit Tamer",
        lema: "My circuits have already computed your defeat!",
        estilo: "cyberpunk trainer with a neon visor and trench coat",
      },
      {
        nombre: "Askal, the Shadow of Kanto",
        lema: "In the darkness of the arena, only my victory will shine.",
        estilo: "mysterious trainer with a dark cape and glowing eyes",
      },
    ],
    turnFallbackDialogue: "Keep attacking, give them no quarter!",
    turnDefaultDialogue: "Go get them!",
  },
};

/* ------------------------------------------------------------------ */
/* French                                                              */
/* ------------------------------------------------------------------ */

/** FR marks the foe by appending " ennemi" after the name. */
const frSide = (side: Side) => (side === "player" ? "" : " ennemi");

const frEngine: EngineTexts = {
  useMove: (label, side, moveLabel) =>
    `${label}${frSide(side)} utilise ${moveLabel} !`,
  miss: (label, side) => `L'attaque de ${label}${frSide(side)} échoue !`,
  noEffect: (label, side) => `Ça n'affecte pas ${label}${frSide(side)}…`,
  crit: "Coup critique !",
  superEffective: "C'est super efficace !",
  notVeryEffective: "Ce n'est pas très efficace…",
  faint: (label, side) => `${label}${frSide(side)} est K.O. !`,
  win: "Tu as gagné le combat !",
  lose: "Tu n'as plus de Pokémon… Tu as perdu !",
  sendOut: (label, side) =>
    side === "player" ? `En avant, ${label} !` : `Le rival envoie ${label} !`,
  potion: (label, side, amount) =>
    side === "player"
      ? `Tu utilises une Potion : ${label} récupère ${amount} PV.`
      : `Le rival utilise une Potion et ${label} récupère ${amount} PV !`,

  statNames: {
    atk: "Attaque",
    def: "Défense",
    spa: "Attaque Spéciale",
    spd: "Défense Spéciale",
    spe: "Vitesse",
    acc: "Précision",
    eva: "Esquive",
  },
  statRose: (label, side, stat, sharply) =>
    `${stat} de ${label}${frSide(side)} monte${sharply ? " beaucoup" : ""} !`,
  statFell: (label, side, stat, sharply) =>
    `${stat} de ${label}${frSide(side)} baisse${sharply ? " beaucoup" : ""} !`,
  statNoHigher: (label, side, stat) =>
    `${stat} de ${label}${frSide(side)} ne peut plus monter !`,
  statNoLower: (label, side, stat) =>
    `${stat} de ${label}${frSide(side)} ne peut plus baisser !`,
  healed: (label, side) => `${label}${frSide(side)} récupère des PV !`,
  healFull: (label, side) =>
    `Les PV de ${label}${frSide(side)} sont déjà au maximum…`,
  fail: "Mais cela échoue !",
  inflicted: {
    paralysis: (label, side) =>
      `${label}${frSide(side)} est paralysé ! Il aura peut-être du mal à attaquer !`,
    burn: (label, side) => `${label}${frSide(side)} est brûlé !`,
    poison: (label, side) => `${label}${frSide(side)} est empoisonné !`,
    sleep: (label, side) => `${label}${frSide(side)} s'endort !`,
    freeze: (label, side) => `${label}${frSide(side)} est gelé !`,
    confusion: (label, side) => `Ça rend ${label}${frSide(side)} confus !`,
  },
  noEffectGeneric: "Mais ça n'a aucun effet !",
  fullyParalyzed: (label, side) =>
    `${label}${frSide(side)} est paralysé ! Il ne peut pas attaquer !`,
  asleep: (label, side) => `${label}${frSide(side)} dort profondément…`,
  wokeUp: (label, side) => `${label}${frSide(side)} se réveille !`,
  frozenSolid: (label, side) =>
    `${label}${frSide(side)} est gelé et ne peut plus bouger !`,
  thawed: (label, side) => `${label}${frSide(side)} dégèle !`,
  hurtByBurn: (label, side) =>
    `La brûlure fait souffrir ${label}${frSide(side)} !`,
  hurtByPoison: (label, side) =>
    `Le poison fait souffrir ${label}${frSide(side)} !`,
  confusedCheck: (label, side) => `${label}${frSide(side)} est confus…`,
  hurtItself: "Il se blesse dans sa confusion !",
  snappedOut: (label, side) => `${label}${frSide(side)} n'est plus confus !`,
  drained: (label, side) => `${label}${frSide(side)} absorbe de l'énergie !`,
  recoil: (label, side) =>
    `Le contrecoup blesse ${label}${frSide(side)} !`,

  charge: {
    underground: (label, side) =>
      `${label}${frSide(side)} s'enterre profondément !`,
    airborne: (label, side) => `${label}${frSide(side)} s'envole très haut !`,
    underwater: (label, side) => `${label}${frSide(side)} plonge sous l'eau !`,
    vanished: (label, side) => `${label}${frSide(side)} disparaît d'un coup !`,
    charging: (label, side) => `${label}${frSide(side)} concentre son énergie !`,
  },
  avoided: (label, side) => `${label}${frSide(side)} esquive l'attaque !`,
};

const fr: typeof es = {
  engine: frEngine,

  metaTitle: "Mode Combat",
  metaDescription:
    "Combat Pokémon contre un Dresseur généré par IA : arène 3D, dialogues en temps réel et décisions tactiques tour par tour.",

  noTeamTitle: "MODE COMBAT",
  noTeamBody:
    "Il te faut au moins un Pokémon dans ton équipe pour entrer dans l'arène.",
  noTeamCta: "Créer mon équipe",

  backToDex: "← Retour au Pokédex",
  backToDexShort: "Pokédex",
  loadingTitle: "Génération du rival et préparation de l'arène…",
  loadingHint: "L'IA prépare une équipe à ta hauteur.",
  retry: "Réessayer",
  changeRival: "Changer de rival",
  setupFailed: "Impossible de préparer le combat.",
  noServer: "Pas de connexion au serveur de combat.",

  challenge: (name: string) => `${name} te défie !`,
  trainerSendsOut: (trainer: string, label: string) =>
    `${trainer} envoie ${label} !`,
  fallbackRival: "Le rival",
  whatWillDo: (label: string) => `Que doit faire ${label} ?`,
  whichItem: "Quel objet veux-tu utiliser ?",
  whichSwitch: "Quel Pokémon veux-tu envoyer maintenant ?",
  recall: (label, side) =>
    side === "player"
      ? `${label}, reviens !`
      : `Le rival rappelle ${label} !`,

  dialogueDefault: "Allons-y !",
  dialogueFallback: "Je ne vais pas te faciliter la tâche !",

  introChallenge: "Un Dresseur veut se battre !",
  motto: (lema: string) => `« ${lema} »`,
  fight: "Au combat !",

  fleeConfirm: "Veux-tu vraiment fuir le combat ?",
  fleeYes: "Fuir",
  fleeNo: "Continuer le combat",
  fledMsg: "Tu as fui le combat…",

  overFled: "COMBAT ABANDONNÉ",
  victory: "VICTOIRE !",
  defeat: "DÉFAITE",
  victoryBody: (name: string) =>
    `Tu as battu ${name}. Ton équipe peut tout affronter !`,
  defeatBody: (name: string) =>
    `${name} remporte le combat. Entraîne-toi et reviens prendre ta revanche !`,
  yourRivalLower: "ton rival",
  yourRivalUpper: "Ton rival",
  rematch: "Revanche",
  backToDexPlain: "Retour au Pokédex",

  hp: "PV",
  lvShort: "N.",
  abilityShort: "Tal.",
  menuFight: "Attaque",
  menuPokemon: "Pokémon",
  menuBag: "Sac",
  menuFlee: "Fuite",
  hintNoEffect: "Aucun effet",
  comboLabel: "Combo",
  koStinger: "K.O. !",
  hintSuper: "Super efficace !",
  hintNotVery: "Peu efficace",
  hintNeutral: "Efficace",
  classStatus: "Statut",
  classPhysical: "Physique",
  classSpecial: "Spéciale",
  powerShort: "PB",
  sfxLabel: "SFX",
  sfxGroupAria: "Effets sonores du combat",
  sfxOnAria: "Activer les effets sonores",
  sfxOffAria: "Couper les effets sonores",
  sfxVolumeAria: "Volume des effets sonores",
  back: "← Retour",
  potionItem: "Potion",
  potionDesc: "Restaure 60 PV. Consomme le tour.",
  choosePokemon: "Choisis un Pokémon.",
  statusFainted: "K.O.",
  statusActive: "Au combat",

  builder: {
    closePickerAria: "Fermer le sélecteur",
    pickerDialogAria: (slot: number) =>
      `Choisir un Pokémon rival pour l'emplacement ${slot}`,
    pickerTitle: "CHOISIS UN POKÉMON RIVAL",
    pickerSlot: (slot: number) => `Emplacement ${slot}`,
    filterPlaceholder: "Filtre par nom (ex. pikachu)…",
    filterAria: "Filtrer les Pokémon par nom",
    indexFailedClose:
      "Impossible de charger l'index des espèces. Ferme et réessaie.",
    loadingSpecies: "Chargement des espèces…",
    noResultsFor: (query: string) =>
      `Aucun résultat pour « ${query} » (les noms sont en anglais).`,
    slotChoose: "Choisir",
    slotChooseTitle: "Choisir un Pokémon rival",
    removeAria: (name: string) => `Retirer ${name} de l'équipe rivale`,
    levelAria: (name: string) => `Niveau de ${name}`,
    title: "ÉQUIPE RIVALE",
    clear: "Vider",
    randomTitle: "L'IA invente un dresseur et son équipe, à ta hauteur",
    random: "Rival aléatoire",
    coachNote: "Équipe rivale générée par le Coach Bot",
    coachAskTitle: "Pas de rival ? Demande à l'IA par message",
    coachAskBody:
      "Décris l'équipe rivale que tu veux et le Coach Bot en montera une de 6 Pokémon.",
    wishPlaceholder:
      "Ex. : une équipe de dragons légendaires, ou les six starters de Kanto…",
    wishAria: "Décris l'équipe rivale que tu veux générer",
    generating: "Création du rival…",
    generateCta: "✨ Générer un rival avec l'IA",
    coachFail: "Le Coach Bot ne répond pas. Réessaie.",
    coachOffline: "Pas de connexion au Coach Bot…",
    searchPlaceholder:
      "Cherche n'importe quel Pokémon pour le rival (ex. mewtwo)…",
    searchAria: "Chercher un Pokémon à ajouter à l'équipe rivale",
    indexFailedReload:
      "Impossible de charger l'index des espèces. Recharge et réessaie.",
    emptyHint:
      "Appuie sur « + » sur un emplacement, cherche ci-dessus, demande par message… ou lance un rival aléatoire.",
    slotEmpty: "Emplacement vide",
    slotPick: "+ Choisir un rival",
    changeAria: (name) => `Remplacer ${name} par un autre Pokémon`,
    consoleTitle: "Coach-Bot · terminal",
    presetsLabel: "Préréglages rapides",
    presetChampions: "Équipes de Maîtres",
    presetDragon: "Monotype Dragon",
    presetRain: "Équipe Pluie",
    presetRandom: "6 aléatoires",
    presetIndexLoading: "Chargement de l'index des espèces…",
    launchCta: "Au combat !",
    launchEmpty: "Choisis au moins un rival",
    launchReady: "Équipe rivale complète · 6 contre 6",
    launchPartial: (filled) => `Seulement ${filled} rivaux sur 6`,
    launchConfirm: "Appuie encore pour combattre ainsi",
  },

  api: {
    errNoKey: "OPENAI_API_KEY est absente du serveur.",
    errBadJson: "JSON invalide.",
    errNeedTeam: "Il te faut au moins un Pokémon dans ton équipe pour combattre.",
    errLoadout:
      "Impossible de préparer les équipes de combat. Réessaie.",
    errIncompleteState: "État du combat incomplet.",
    answerIn:
      "IMPORTANT : rédige tous les textes du JSON (nom, devise, style, réplique…) en français.",
    levelWord: "Niveau",
    fallbackStyle: "dresseur mystérieux à l'esthétique néon",
    cannedRivals: [
      {
        nombre: "Neo, le Dompteur du Circuit",
        lema: "Mes circuits ont déjà calculé ta défaite !",
        estilo: "dresseur cyberpunk avec visière néon et trench-coat",
      },
      {
        nombre: "Askal, l'Ombre de Kanto",
        lema: "Dans l'obscurité de l'arène, seule ma victoire brillera.",
        estilo: "dresseuse mystérieuse à la cape sombre et aux yeux brillants",
      },
    ],
    turnFallbackDialogue: "Continue d'attaquer, ne leur laisse aucun répit !",
    turnDefaultDialogue: "À l'attaque !",
  },
};

/* ------------------------------------------------------------------ */
/* German                                                              */
/* ------------------------------------------------------------------ */

/** DE marks the foe by prefixing "Das gegnerische X", like the modern games. */
const deName = (label: string, side: Side) =>
  side === "player" ? label : `Das gegnerische ${label}`;
/** Dative variant, used after "von". */
const deNameDat = (label: string, side: Side) =>
  side === "player" ? label : `dem gegnerischen ${label}`;
/** Mid-sentence accusative variant, lowercase article. */
const deNameMid = (label: string, side: Side) =>
  side === "player" ? label : `das gegnerische ${label}`;

const deEngine: EngineTexts = {
  useMove: (label, side, moveLabel) =>
    `${deName(label, side)} setzt ${moveLabel} ein!`,
  miss: (label, side) =>
    `Die Attacke von ${deNameDat(label, side)} geht daneben!`,
  noEffect: (label, side) =>
    `Es hat keine Wirkung auf ${deNameMid(label, side)}…`,
  crit: "Ein Volltreffer!",
  superEffective: "Das ist sehr effektiv!",
  notVeryEffective: "Das ist nicht sehr effektiv…",
  faint: (label, side) => `${deName(label, side)} wurde besiegt!`,
  win: "Du hast den Kampf gewonnen!",
  lose: "Du hast keine kampffähigen Pokémon mehr… Du hast verloren!",
  sendOut: (label, side) =>
    side === "player"
      ? `Los, ${label}!`
      : `Der Rivale schickt ${label} in den Kampf!`,
  potion: (label, side, amount) =>
    side === "player"
      ? `Du setzt einen Trank ein: ${label} gewinnt ${amount} KP zurück.`
      : `Der Rivale setzt einen Trank ein und ${label} gewinnt ${amount} KP zurück!`,

  statNames: {
    atk: "Angriff",
    def: "Verteidigung",
    spa: "Spezial-Angriff",
    spd: "Spezial-Verteidigung",
    spe: "Initiative",
    acc: "Genauigkeit",
    eva: "Fluchtwert",
  },
  statRose: (label, side, stat, sharply) =>
    `${stat} von ${deNameDat(label, side)} steigt${sharply ? " stark" : ""}!`,
  statFell: (label, side, stat, sharply) =>
    `${stat} von ${deNameDat(label, side)} sinkt${sharply ? " stark" : ""}!`,
  statNoHigher: (label, side, stat) =>
    `${stat} von ${deNameDat(label, side)} kann nicht weiter steigen!`,
  statNoLower: (label, side, stat) =>
    `${stat} von ${deNameDat(label, side)} kann nicht weiter sinken!`,
  healed: (label, side) =>
    `Die KP von ${deNameDat(label, side)} wurden wieder aufgefüllt!`,
  healFull: (label, side) =>
    `Die KP von ${deNameDat(label, side)} sind bereits voll…`,
  fail: "Aber es schlägt fehl!",
  inflicted: {
    paralysis: (label, side) =>
      `${deName(label, side)} wurde paralysiert! Es kann eventuell nicht angreifen!`,
    burn: (label, side) => `${deName(label, side)} erleidet Verbrennungen!`,
    poison: (label, side) => `${deName(label, side)} wurde vergiftet!`,
    sleep: (label, side) => `${deName(label, side)} ist eingeschlafen!`,
    freeze: (label, side) => `${deName(label, side)} wurde eingefroren!`,
    confusion: (label, side) => `${deName(label, side)} wurde verwirrt!`,
  },
  noEffectGeneric: "Aber es hat keine Wirkung!",
  fullyParalyzed: (label, side) =>
    `${deName(label, side)} ist paralysiert! Es kann sich nicht bewegen!`,
  asleep: (label, side) => `${deName(label, side)} schläft tief und fest…`,
  wokeUp: (label, side) => `${deName(label, side)} ist aufgewacht!`,
  frozenSolid: (label, side) => `${deName(label, side)} ist eingefroren!`,
  thawed: (label, side) => `${deName(label, side)} ist aufgetaut!`,
  hurtByBurn: (label, side) =>
    `Die Verbrennung schadet ${deNameDat(label, side)}!`,
  hurtByPoison: (label, side) =>
    `Die Vergiftung schadet ${deNameDat(label, side)}!`,
  confusedCheck: (label, side) => `${deName(label, side)} ist verwirrt…`,
  hurtItself: "Es hat sich vor Verwirrung selbst verletzt!",
  snappedOut: (label, side) =>
    `${deName(label, side)} ist nicht mehr verwirrt!`,
  drained: (label, side) => `${deName(label, side)} absorbiert Energie!`,
  recoil: (label, side) =>
    `${deName(label, side)} wird durch den Rückstoß verletzt!`,

  charge: {
    underground: (label, side) => `${deName(label, side)} gräbt sich ein!`,
    airborne: (label, side) => `${deName(label, side)} fliegt hoch hinauf!`,
    underwater: (label, side) => `${deName(label, side)} taucht unter!`,
    vanished: (label, side) => `${deName(label, side)} verschwindet plötzlich!`,
    charging: (label, side) => `${deName(label, side)} sammelt Energie!`,
  },
  avoided: (label, side) => `${deName(label, side)} weicht dem Angriff aus!`,
};

const de: typeof es = {
  engine: deEngine,

  metaTitle: "Kampfmodus",
  metaDescription:
    "Pokémon-Kampf gegen einen KI-generierten Trainer: 3D-Arena, Dialoge in Echtzeit und taktische Entscheidungen Zug um Zug.",

  noTeamTitle: "KAMPFMODUS",
  noTeamBody:
    "Du brauchst mindestens ein Pokémon in deinem Team, um die Arena zu betreten.",
  noTeamCta: "Mein Team aufstellen",

  backToDex: "← Zurück zum Pokédex",
  backToDexShort: "Pokédex",
  loadingTitle: "Rivale wird generiert und die Arena vorbereitet…",
  loadingHint: "Die KI stellt ein Team auf deinem Niveau zusammen.",
  retry: "Erneut versuchen",
  changeRival: "Rivalen wechseln",
  setupFailed: "Der Kampf konnte nicht vorbereitet werden.",
  noServer: "Keine Verbindung zum Kampfserver.",

  challenge: (name: string) => `Du wirst von ${name} herausgefordert!`,
  trainerSendsOut: (trainer: string, label: string) =>
    `${trainer} schickt ${label} in den Kampf!`,
  fallbackRival: "Der Rivale",
  whatWillDo: (label: string) => `Was soll ${label} tun?`,
  whichItem: "Welches Item willst du einsetzen?",
  whichSwitch: "Welches Pokémon schickst du als Nächstes in den Kampf?",
  recall: (label, side) =>
    side === "player"
      ? `${label}, komm zurück!`
      : `Der Gegner ruft ${label} zurück!`,

  dialogueDefault: "Los geht's!",
  dialogueFallback: "Ich werde es dir nicht leicht machen!",

  introChallenge: "Ein Trainer will kämpfen!",
  motto: (lema: string) => `„${lema}“`,
  fight: "Auf in den Kampf!",

  fleeConfirm: "Willst du wirklich aus dem Kampf fliehen?",
  fleeYes: "Fliehen",
  fleeNo: "Weiterkämpfen",
  fledMsg: "Du bist aus dem Kampf geflohen…",

  overFled: "KAMPF ABGEBROCHEN",
  victory: "SIEG!",
  defeat: "NIEDERLAGE",
  victoryBody: (name: string) =>
    `Du hast ${name} besiegt. Dein Team nimmt es mit allem auf!`,
  defeatBody: (name: string) =>
    `${name} gewinnt den Kampf. Trainiere und komm für die Revanche zurück!`,
  yourRivalLower: "dein Rivale",
  yourRivalUpper: "Dein Rivale",
  rematch: "Revanche",
  backToDexPlain: "Zurück zum Pokédex",

  hp: "KP",
  lvShort: "Lv.",
  abilityShort: "Fäh.",
  menuFight: "Kampf",
  menuPokemon: "Pokémon",
  menuBag: "Beutel",
  menuFlee: "Flucht",
  hintNoEffect: "Keine Wirkung",
  comboLabel: "Combo",
  koStinger: "K.O.!",
  hintSuper: "Sehr effektiv!",
  hintNotVery: "Nicht sehr effektiv",
  hintNeutral: "Normal effektiv",
  classStatus: "Status",
  classPhysical: "Physisch",
  classSpecial: "Spezial",
  powerShort: "BP",
  sfxLabel: "SFX",
  sfxGroupAria: "Soundeffekte des Kampfes",
  sfxOnAria: "Soundeffekte einschalten",
  sfxOffAria: "Soundeffekte stummschalten",
  sfxVolumeAria: "Lautstärke der Soundeffekte",
  back: "← Zurück",
  potionItem: "Trank",
  potionDesc: "Stellt 60 KP wieder her. Verbraucht den Zug.",
  choosePokemon: "Wähle ein Pokémon.",
  statusFainted: "Besiegt",
  statusActive: "Im Kampf",

  builder: {
    closePickerAria: "Auswahl schließen",
    pickerDialogAria: (slot: number) =>
      `Rivalen-Pokémon für Platz ${slot} wählen`,
    pickerTitle: "WÄHLE EIN RIVALEN-POKÉMON",
    pickerSlot: (slot: number) => `Platz ${slot}`,
    filterPlaceholder: "Nach Name filtern (z. B. pikachu)…",
    filterAria: "Pokémon nach Name filtern",
    indexFailedClose:
      "Der Arten-Index konnte nicht geladen werden. Schließe und versuche es erneut.",
    loadingSpecies: "Arten werden geladen…",
    noResultsFor: (query: string) =>
      `Keine Ergebnisse für „${query}“ (die Namen sind auf Englisch).`,
    slotChoose: "Wählen",
    slotChooseTitle: "Rivalen-Pokémon wählen",
    removeAria: (name: string) => `${name} aus dem Rivalen-Team entfernen`,
    levelAria: (name: string) => `Level von ${name}`,
    title: "RIVALEN-TEAM",
    clear: "Leeren",
    randomTitle:
      "Die KI erfindet einen Trainer und sein Team auf deinem Niveau",
    random: "Zufälliger Rivale",
    coachNote: "Rivalen-Team vom Coach Bot generiert",
    coachAskTitle: "Kein Rivale? Frag die KI per Nachricht",
    coachAskBody:
      "Beschreibe das gewünschte Rivalen-Team und der Coach Bot stellt eines mit 6 Pokémon zusammen.",
    wishPlaceholder:
      "Z. B.: ein Team aus legendären Drachen oder die sechs Kanto-Starter…",
    wishAria: "Beschreibe das Rivalen-Team, das du generieren willst",
    generating: "Rivale wird aufgestellt…",
    generateCta: "✨ Rivalen mit KI generieren",
    coachFail: "Der Coach Bot antwortet nicht. Versuche es erneut.",
    coachOffline: "Keine Verbindung zum Coach Bot…",
    searchPlaceholder:
      "Suche ein beliebiges Pokémon für den Rivalen (z. B. mewtwo)…",
    searchAria: "Pokémon suchen, um es dem Rivalen-Team hinzuzufügen",
    indexFailedReload:
      "Der Arten-Index konnte nicht geladen werden. Lade neu und versuche es erneut.",
    emptyHint:
      "Drücke „+“ auf einem Platz, suche oben, frag per Nachricht… oder starte einen zufälligen Rivalen.",
    slotEmpty: "Freier Platz",
    slotPick: "+ Rivalen wählen",
    changeAria: (name) => `${name} gegen ein anderes Pokémon tauschen`,
    consoleTitle: "Coach-Bot · Terminal",
    presetsLabel: "Schnelle Vorlagen",
    presetChampions: "Champion-Teams",
    presetDragon: "Monotyp Drache",
    presetRain: "Regen-Team",
    presetRandom: "6 zufällige",
    presetIndexLoading: "Arten-Index wird geladen…",
    launchCta: "Ab in den Kampf!",
    launchEmpty: "Wähle mindestens einen Rivalen",
    launchReady: "Rivalenteam komplett · 6 gegen 6",
    launchPartial: (filled) => `Nur ${filled} von 6 Rivalen bereit`,
    launchConfirm: "Nochmal drücken, um so zu kämpfen",
  },

  api: {
    errNoKey: "OPENAI_API_KEY fehlt auf dem Server.",
    errBadJson: "Ungültiges JSON.",
    errNeedTeam:
      "Du brauchst mindestens ein Pokémon in deinem Team, um zu kämpfen.",
    errLoadout:
      "Die Kampfteams konnten nicht vorbereitet werden. Versuche es erneut.",
    errIncompleteState: "Unvollständiger Kampfzustand.",
    answerIn:
      "WICHTIG: Schreibe alle Textwerte im JSON (Name, Motto, Stil, Dialog…) auf Deutsch.",
    levelWord: "Level",
    fallbackStyle: "mysteriöser Trainer mit Neon-Ästhetik",
    cannedRivals: [
      {
        nombre: "Neo, der Bezwinger des Schaltkreises",
        lema: "Meine Schaltkreise haben deine Niederlage längst berechnet!",
        estilo: "Cyberpunk-Trainer mit Neon-Visier und Trenchcoat",
      },
      {
        nombre: "Askal, der Schatten von Kanto",
        lema: "In der Dunkelheit der Arena wird nur mein Sieg erstrahlen.",
        estilo: "mysteriöse Trainerin mit dunklem Umhang und leuchtenden Augen",
      },
    ],
    turnFallbackDialogue: "Greif weiter an, gönn ihnen keine Pause!",
    turnDefaultDialogue: "Auf sie!",
  },
};

/* ------------------------------------------------------------------ */
/* Italian                                                             */
/* ------------------------------------------------------------------ */

/** IT marks the foe by appending " nemico" after the name. */
const itSide = (side: Side) => (side === "player" ? "" : " nemico");

const itEngine: EngineTexts = {
  useMove: (label, side, moveLabel) =>
    `${label}${itSide(side)} usa ${moveLabel}!`,
  miss: (label, side) =>
    `L'attacco di ${label}${itSide(side)} non va a segno!`,
  noEffect: (label, side) => `Non ha effetto su ${label}${itSide(side)}…`,
  crit: "Brutto colpo!",
  superEffective: "È superefficace!",
  notVeryEffective: "Non è molto efficace…",
  faint: (label, side) => `${label}${itSide(side)} è esausto!`,
  win: "Hai vinto la lotta!",
  lose: "Non hai più Pokémon in grado di lottare… Hai perso!",
  sendOut: (label, side) =>
    side === "player"
      ? `Vai, ${label}!`
      : `Il rivale manda in campo ${label}!`,
  potion: (label, side, amount) =>
    side === "player"
      ? `Hai usato una Pozione: ${label} recupera ${amount} PS.`
      : `Il rivale usa una Pozione e ${label} recupera ${amount} PS!`,

  statNames: {
    atk: "Attacco",
    def: "Difesa",
    spa: "Attacco Speciale",
    spd: "Difesa Speciale",
    spe: "Velocità",
    acc: "Precisione",
    eva: "Elusione",
  },
  statRose: (label, side, stat, sharply) =>
    `${stat} di ${label}${itSide(side)} aumenta${sharply ? " di molto" : ""}!`,
  statFell: (label, side, stat, sharply) =>
    `${stat} di ${label}${itSide(side)} diminuisce${sharply ? " di molto" : ""}!`,
  statNoHigher: (label, side, stat) =>
    `${stat} di ${label}${itSide(side)} non può aumentare ulteriormente!`,
  statNoLower: (label, side, stat) =>
    `${stat} di ${label}${itSide(side)} non può diminuire ulteriormente!`,
  healed: (label, side) => `${label}${itSide(side)} recupera PS!`,
  healFull: (label, side) =>
    `I PS di ${label}${itSide(side)} sono già al massimo…`,
  fail: "Ma la mossa fallisce!",
  inflicted: {
    paralysis: (label, side) =>
      `${label}${itSide(side)} è paralizzato! Forse non riuscirà a muoversi!`,
    burn: (label, side) => `${label}${itSide(side)} è stato scottato!`,
    poison: (label, side) => `${label}${itSide(side)} è stato avvelenato!`,
    sleep: (label, side) => `${label}${itSide(side)} si è addormentato!`,
    freeze: (label, side) => `${label}${itSide(side)} è stato congelato!`,
    confusion: (label, side) => `${label}${itSide(side)} è confuso!`,
  },
  noEffectGeneric: "Ma non ha effetto!",
  fullyParalyzed: (label, side) =>
    `${label}${itSide(side)} è paralizzato! Non riesce a muoversi!`,
  asleep: (label, side) => `${label}${itSide(side)} sta dormendo…`,
  wokeUp: (label, side) => `${label}${itSide(side)} si è svegliato!`,
  frozenSolid: (label, side) => `${label}${itSide(side)} è congelato!`,
  thawed: (label, side) => `${label}${itSide(side)} si è scongelato!`,
  hurtByBurn: (label, side) =>
    `La scottatura infligge danni a ${label}${itSide(side)}!`,
  hurtByPoison: (label, side) =>
    `Il veleno infligge danni a ${label}${itSide(side)}!`,
  confusedCheck: (label, side) => `${label}${itSide(side)} è confuso…`,
  hurtItself: "È così confuso che si colpisce da solo!",
  snappedOut: (label, side) => `${label}${itSide(side)} non è più confuso!`,
  drained: (label, side) => `${label}${itSide(side)} assorbe energia!`,
  recoil: (label, side) =>
    `${label}${itSide(side)} subisce il contraccolpo!`,

  charge: {
    underground: (label, side) => `${label}${itSide(side)} si è sotterrato!`,
    airborne: (label, side) => `${label}${itSide(side)} è volato in alto!`,
    underwater: (label, side) =>
      `${label}${itSide(side)} si è immerso sott'acqua!`,
    vanished: (label, side) =>
      `${label}${itSide(side)} è sparito all'improvviso!`,
    charging: (label, side) => `${label}${itSide(side)} sta accumulando energia!`,
  },
  avoided: (label, side) => `${label}${itSide(side)} ha evitato l'attacco!`,
};

const it: typeof es = {
  engine: itEngine,

  metaTitle: "Modalità Lotta",
  metaDescription:
    "Lotta Pokémon contro un Allenatore generato dall'IA: arena 3D, dialoghi in tempo reale e decisioni tattiche turno per turno.",

  noTeamTitle: "MODALITÀ LOTTA",
  noTeamBody:
    "Ti serve almeno un Pokémon in squadra per entrare nell'arena.",
  noTeamCta: "Crea la mia squadra",

  backToDex: "← Torna al Pokédex",
  backToDexShort: "Pokédex",
  loadingTitle: "Generazione del rivale e preparazione dell'arena…",
  loadingHint: "L'IA sta creando una squadra alla tua altezza.",
  retry: "Riprova",
  changeRival: "Cambia rivale",
  setupFailed: "Impossibile preparare la lotta.",
  noServer: "Nessuna connessione al server di lotta.",

  challenge: (name: string) => `${name} ti sfida!`,
  trainerSendsOut: (trainer: string, label: string) =>
    `${trainer} manda in campo ${label}!`,
  fallbackRival: "Il rivale",
  whatWillDo: (label: string) => `Cosa farà ${label}?`,
  whichItem: "Quale strumento vuoi usare?",
  whichSwitch: "Quale Pokémon mandi in campo ora?",
  recall: (label, side) =>
    side === "player" ? `${label}, torna qui!` : `Il rivale richiama ${label}!`,

  dialogueDefault: "Andiamo!",
  dialogueFallback: "Non ti renderò le cose facili!",

  introChallenge: "Un Allenatore vuole lottare!",
  motto: (lema: string) => `«${lema}»`,
  fight: "Alla lotta!",

  fleeConfirm: "Vuoi davvero fuggire dalla lotta?",
  fleeYes: "Fuggi",
  fleeNo: "Continua a lottare",
  fledMsg: "Sei fuggito dalla lotta…",

  overFled: "LOTTA ABBANDONATA",
  victory: "VITTORIA!",
  defeat: "SCONFITTA",
  victoryBody: (name: string) =>
    `Hai sconfitto ${name}. La tua squadra può farcela contro tutto!`,
  defeatBody: (name: string) =>
    `${name} si aggiudica la lotta. Allenati e torna per la rivincita!`,
  yourRivalLower: "il tuo rivale",
  yourRivalUpper: "Il tuo rivale",
  rematch: "Rivincita",
  backToDexPlain: "Torna al Pokédex",

  hp: "PS",
  lvShort: "Lv.",
  abilityShort: "Abil.",
  menuFight: "Lotta",
  menuPokemon: "Pokémon",
  menuBag: "Borsa",
  menuFlee: "Fuga",
  hintNoEffect: "Nessun effetto",
  comboLabel: "Combo",
  koStinger: "K.O.!",
  hintSuper: "Superefficace!",
  hintNotVery: "Poco efficace",
  hintNeutral: "Efficace",
  classStatus: "Stato",
  classPhysical: "Fisico",
  classSpecial: "Speciale",
  powerShort: "PB",
  sfxLabel: "SFX",
  sfxGroupAria: "Effetti sonori della lotta",
  sfxOnAria: "Attiva gli effetti sonori",
  sfxOffAria: "Disattiva gli effetti sonori",
  sfxVolumeAria: "Volume degli effetti sonori",
  back: "← Indietro",
  potionItem: "Pozione",
  potionDesc: "Ripristina 60 PS. Consuma il turno.",
  choosePokemon: "Scegli un Pokémon.",
  statusFainted: "Esausto",
  statusActive: "In lotta",

  builder: {
    closePickerAria: "Chiudi il selettore",
    pickerDialogAria: (slot: number) =>
      `Scegli un Pokémon rivale per lo slot ${slot}`,
    pickerTitle: "SCEGLI UN POKÉMON RIVALE",
    pickerSlot: (slot: number) => `Slot ${slot}`,
    filterPlaceholder: "Filtra per nome (es. pikachu)…",
    filterAria: "Filtra i Pokémon per nome",
    indexFailedClose:
      "Impossibile caricare l'indice delle specie. Chiudi e riprova.",
    loadingSpecies: "Caricamento delle specie…",
    noResultsFor: (query: string) =>
      `Nessun risultato per «${query}» (i nomi sono in inglese).`,
    slotChoose: "Scegli",
    slotChooseTitle: "Scegli un Pokémon rivale",
    removeAria: (name: string) => `Rimuovi ${name} dalla squadra rivale`,
    levelAria: (name: string) => `Livello di ${name}`,
    title: "SQUADRA RIVALE",
    clear: "Svuota",
    randomTitle:
      "L'IA inventa un allenatore e la sua squadra, alla tua altezza",
    random: "Rivale casuale",
    coachNote: "Squadra rivale generata dal Coach Bot",
    coachAskTitle: "Nessun rivale? Chiedilo all'IA con un messaggio",
    coachAskBody:
      "Descrivi la squadra rivale che vuoi e il Coach Bot ne creerà una di 6 Pokémon.",
    wishPlaceholder:
      "Es.: una squadra di draghi leggendari, o i sei starter di Kanto…",
    wishAria: "Descrivi la squadra rivale che vuoi generare",
    generating: "Creazione del rivale…",
    generateCta: "✨ Genera rivale con l'IA",
    coachFail: "Il Coach Bot non risponde. Riprova.",
    coachOffline: "Nessuna connessione al Coach Bot…",
    searchPlaceholder: "Cerca qualsiasi Pokémon per il rivale (es. mewtwo)…",
    searchAria: "Cerca un Pokémon da aggiungere alla squadra rivale",
    indexFailedReload:
      "Impossibile caricare l'indice delle specie. Ricarica e riprova.",
    emptyHint:
      "Premi «+» su uno slot, cerca qui sopra, chiedilo con un messaggio… o lancia un rivale casuale.",
    slotEmpty: "Slot vuoto",
    slotPick: "+ Scegli un rivale",
    changeAria: (name) => `Sostituisci ${name} con un altro Pokémon`,
    consoleTitle: "Coach-Bot · terminale",
    presetsLabel: "Preset rapidi",
    presetChampions: "Squadre da Campione",
    presetDragon: "Monotipo Drago",
    presetRain: "Squadra Pioggia",
    presetRandom: "6 casuali",
    presetIndexLoading: "Caricamento dell'indice delle specie…",
    launchCta: "In battaglia!",
    launchEmpty: "Scegli almeno un rivale",
    launchReady: "Squadra rivale completa · 6 contro 6",
    launchPartial: (filled) => `Solo ${filled} rivali su 6`,
    launchConfirm: "Premi di nuovo per combattere così",
  },

  api: {
    errNoKey: "OPENAI_API_KEY manca sul server.",
    errBadJson: "JSON non valido.",
    errNeedTeam: "Ti serve almeno un Pokémon in squadra per lottare.",
    errLoadout:
      "Impossibile preparare le squadre di lotta. Riprova.",
    errIncompleteState: "Stato della lotta incompleto.",
    answerIn:
      "IMPORTANTE: scrivi tutti i testi del JSON (nome, motto, stile, battuta…) in italiano.",
    levelWord: "Livello",
    fallbackStyle: "allenatore misterioso dall'estetica neon",
    cannedRivals: [
      {
        nombre: "Neo, il Domatore del Circuito",
        lema: "I miei circuiti hanno già calcolato la tua sconfitta!",
        estilo: "allenatore cyberpunk con visiera al neon e trench",
      },
      {
        nombre: "Askal, l'Ombra di Kanto",
        lema: "Nell'oscurità dell'arena brillerà solo la mia vittoria.",
        estilo: "allenatrice misteriosa con mantello scuro e occhi luminosi",
      },
    ],
    turnFallbackDialogue: "Continua ad attaccare, non dargli tregua!",
    turnDefaultDialogue: "Addosso!",
  },
};

/* ------------------------------------------------------------------ */
/* Japanese                                                            */
/* ------------------------------------------------------------------ */

/** JA marks the foe by prefixing 「あいての X」, classic hiragana style. */
const jaName = (label: string, side: Side) =>
  side === "player" ? label : `あいての ${label}`;

const jaEngine: EngineTexts = {
  useMove: (label, side, moveLabel) =>
    `${jaName(label, side)}の ${moveLabel}！`,
  miss: (label, side) => `${jaName(label, side)}の こうげきは はずれた！`,
  noEffect: (label, side) =>
    `${jaName(label, side)}には こうかが ない ようだ…`,
  crit: "きゅうしょに あたった！",
  superEffective: "こうかは ばつぐんだ！",
  notVeryEffective: "こうかは いまひとつの ようだ…",
  faint: (label, side) => `${jaName(label, side)}は たおれた！`,
  win: "しょうぶに かった！",
  lose: "たたかえる ポケモンが いなくなった… しょうぶに まけた！",
  sendOut: (label, side) =>
    side === "player"
      ? `ゆけっ！ ${label}！`
      : `あいては ${label}を くりだした！`,
  potion: (label, side, amount) =>
    side === "player"
      ? `キズぐすりを つかった！ ${label}の HPが ${amount} かいふくした。`
      : `あいては キズぐすりを つかった！ ${label}の HPが ${amount} かいふくした！`,

  statNames: {
    atk: "こうげき",
    def: "ぼうぎょ",
    spa: "とくこう",
    spd: "とくぼう",
    spe: "すばやさ",
    acc: "めいちゅう",
    eva: "かいひ",
  },
  statRose: (label, side, stat, sharply) =>
    `${jaName(label, side)}の ${stat}が ${sharply ? "ぐーんと " : ""}あがった！`,
  statFell: (label, side, stat, sharply) =>
    `${jaName(label, side)}の ${stat}が ${sharply ? "がくっと " : ""}さがった！`,
  statNoHigher: (label, side, stat) =>
    `${jaName(label, side)}の ${stat}は もう あがらない！`,
  statNoLower: (label, side, stat) =>
    `${jaName(label, side)}の ${stat}は もう さがらない！`,
  healed: (label, side) => `${jaName(label, side)}は HPを かいふくした！`,
  healFull: (label, side) => `${jaName(label, side)}の HPは まんたんだ…`,
  fail: "しかし うまく きまらなかった！",
  inflicted: {
    paralysis: (label, side) =>
      `${jaName(label, side)}は まひして わざが でにくくなった！`,
    burn: (label, side) => `${jaName(label, side)}は やけどを おった！`,
    poison: (label, side) => `${jaName(label, side)}は どくを あびた！`,
    sleep: (label, side) => `${jaName(label, side)}は ねむってしまった！`,
    freeze: (label, side) => `${jaName(label, side)}は こおりついた！`,
    confusion: (label, side) => `${jaName(label, side)}は こんらんした！`,
  },
  noEffectGeneric: "しかし こうかが なかった！",
  fullyParalyzed: (label, side) =>
    `${jaName(label, side)}は からだが しびれて うごけない！`,
  asleep: (label, side) => `${jaName(label, side)}は ぐうぐう ねむっている…`,
  wokeUp: (label, side) => `${jaName(label, side)}は めを さました！`,
  frozenSolid: (label, side) =>
    `${jaName(label, side)}は こおって しまって うごかない！`,
  thawed: (label, side) => `${jaName(label, side)}の こおりが とけた！`,
  hurtByBurn: (label, side) =>
    `${jaName(label, side)}は やけどの ダメージを うけている！`,
  hurtByPoison: (label, side) =>
    `${jaName(label, side)}は どくの ダメージを うけている！`,
  confusedCheck: (label, side) =>
    `${jaName(label, side)}は こんらんしている…`,
  hurtItself: "わけも わからず じぶんを こうげきした！",
  snappedOut: (label, side) =>
    `${jaName(label, side)}の こんらんが とけた！`,
  drained: (label, side) =>
    `${jaName(label, side)}は たいりょくを すいとった！`,
  recoil: (label, side) =>
    `${jaName(label, side)}は はんどうによる ダメージを うけた！`,

  charge: {
    underground: (label, side) => `${jaName(label, side)}は じめんに もぐった！`,
    airborne: (label, side) => `${jaName(label, side)}は そらたかく とびあがった！`,
    underwater: (label, side) => `${jaName(label, side)}は すいちゅうに もぐった！`,
    vanished: (label, side) => `${jaName(label, side)}は すがたを けした！`,
    charging: (label, side) => `${jaName(label, side)}は ちからを ためている！`,
  },
  avoided: (label, side) => `${jaName(label, side)}は こうげきを かわした！`,
};

const ja: typeof es = {
  engine: jaEngine,

  metaTitle: "バトルモード",
  metaDescription:
    "AIが生成したトレーナーとのポケモンバトル。3Dアリーナ、リアルタイムの会話、ターンごとの戦術的な判断が楽しめます。",

  noTeamTitle: "バトルモード",
  noTeamBody:
    "アリーナに入るには、手持ちに少なくとも1匹のポケモンが必要です。",
  noTeamCta: "手持ちをつくる",

  backToDex: "← ポケモン図鑑に戻る",
  backToDexShort: "図鑑",
  loadingTitle: "ライバルを生成してアリーナを準備中…",
  loadingHint: "AIがあなたに見合ったチームを編成しています。",
  retry: "リトライ",
  changeRival: "ライバルを変える",
  setupFailed: "バトルの準備ができませんでした。",
  noServer: "バトルサーバーに接続できません。",

  challenge: (name: string) => `${name}が しょうぶを しかけてきた！`,
  trainerSendsOut: (trainer: string, label: string) =>
    `${trainer}は ${label}を くりだした！`,
  fallbackRival: "ライバル",
  whatWillDo: (label: string) => `${label}は どうする？`,
  whichItem: "どの どうぐを つかう？",
  whichSwitch: "つぎに どの ポケモンを だす？",
  recall: (label, side) =>
    side === "player" ? `${label}、もどれ！` : `あいては ${label}を もどした！`,

  dialogueDefault: "いくぞ！",
  dialogueFallback: "かんたんには かたせないぞ！",

  introChallenge: "トレーナーが しょうぶを しかけてきた！",
  motto: (lema: string) => `「${lema}」`,
  fight: "いざ しょうぶ！",

  fleeConfirm: "本当にバトルから逃げますか？",
  fleeYes: "逃げる",
  fleeNo: "戦い続ける",
  fledMsg: "バトルから 逃げだした…",

  overFled: "バトル放棄",
  victory: "勝利！",
  defeat: "敗北",
  victoryBody: (name: string) =>
    `${name}に勝利した。君のチームなら何でも倒せる！`,
  defeatBody: (name: string) =>
    `${name}の勝ちだ。特訓して再戦しに来よう！`,
  yourRivalLower: "ライバル",
  yourRivalUpper: "ライバル",
  rematch: "再戦",
  backToDexPlain: "ポケモン図鑑に戻る",

  hp: "HP",
  lvShort: "Lv.",
  abilityShort: "特性",
  menuFight: "たたかう",
  menuPokemon: "ポケモン",
  menuBag: "バッグ",
  menuFlee: "にげる",
  hintNoEffect: "こうかなし",
  comboLabel: "コンボ",
  koStinger: "ひんし！",
  hintSuper: "こうかばつぐん！",
  hintNotVery: "こうかいまひとつ",
  hintNeutral: "こうかふつう",
  classStatus: "へんか",
  classPhysical: "ぶつり",
  classSpecial: "とくしゅ",
  powerShort: "いりょく",
  sfxLabel: "SFX",
  sfxGroupAria: "バトルの効果音",
  sfxOnAria: "効果音をオンにする",
  sfxOffAria: "効果音をミュートする",
  sfxVolumeAria: "効果音の音量",
  back: "← もどる",
  potionItem: "キズぐすり",
  potionDesc: "HPを60回復する。ターンを消費する。",
  choosePokemon: "ポケモンを選んでください。",
  statusFainted: "ひんし",
  statusActive: "バトル中",

  builder: {
    closePickerAria: "セレクターを閉じる",
    pickerDialogAria: (slot: number) =>
      `スロット${slot}のライバルポケモンを選ぶ`,
    pickerTitle: "ライバルポケモンを選ぼう",
    pickerSlot: (slot: number) => `スロット${slot}`,
    filterPlaceholder: "名前で絞り込む（例: pikachu）…",
    filterAria: "ポケモンを名前で絞り込む",
    indexFailedClose:
      "種族インデックスを読み込めませんでした。閉じてからもう一度お試しください。",
    loadingSpecies: "種族を読み込み中…",
    noResultsFor: (query: string) =>
      `「${query}」に該当なし（名前は英語で入力してください）。`,
    slotChoose: "選ぶ",
    slotChooseTitle: "ライバルポケモンを選ぶ",
    removeAria: (name: string) => `${name}をライバルチームから外す`,
    levelAria: (name: string) => `${name}のレベル`,
    title: "ライバルチーム",
    clear: "空にする",
    randomTitle: "AIがあなたに見合ったトレーナーとチームを考えます",
    random: "ランダムなライバル",
    coachNote: "コーチボットが生成したライバルチーム",
    coachAskTitle: "ライバルがいない？ メッセージでAIに頼もう",
    coachAskBody:
      "ほしいライバルチームを説明すると、コーチボットが6匹のチームを編成します。",
    wishPlaceholder:
      "例: 伝説のドラゴンのチーム、カントーの御三家6匹など…",
    wishAria: "生成したいライバルチームを説明する",
    generating: "ライバルを編成中…",
    generateCta: "✨ AIでライバルを生成",
    coachFail: "コーチボットが応答しません。もう一度お試しください。",
    coachOffline: "コーチボットに接続できません…",
    searchPlaceholder: "ライバル用のポケモンを検索（例: mewtwo）…",
    searchAria: "ライバルチームに加えるポケモンを検索",
    indexFailedReload:
      "種族インデックスを読み込めませんでした。再読み込みしてもう一度お試しください。",
    emptyHint:
      "スロットの「+」を押す、上で検索する、メッセージで頼む…またはランダムなライバルを呼び出そう。",
    slotEmpty: "空きスロット",
    slotPick: "＋ ライバルを選ぶ",
    changeAria: (name) => `${name}を別のポケモンに変える`,
    consoleTitle: "コーチボット・ターミナル",
    presetsLabel: "クイックプリセット",
    presetChampions: "チャンピオンのパーティ",
    presetDragon: "ドラゴン統一",
    presetRain: "雨パーティ",
    presetRandom: "ランダム6匹",
    presetIndexLoading: "種族インデックスを読み込み中…",
    launchCta: "バトルへ！",
    launchEmpty: "ライバルを1匹以上選ぼう",
    launchReady: "ライバルのパーティ完成 · 6対6",
    launchPartial: (filled) => `6匹中${filled}匹しかいません`,
    launchConfirm: "もう一度押すとこのまま戦います",
  },

  api: {
    errNoKey: "サーバーに OPENAI_API_KEY が設定されていません。",
    errBadJson: "無効なJSONです。",
    errNeedTeam: "バトルには少なくとも1匹のポケモンが必要です。",
    errLoadout:
      "バトルチームを準備できませんでした。もう一度お試しください。",
    errIncompleteState: "バトルの状態が不完全です。",
    answerIn:
      "重要: JSONのすべてのテキスト値（名前、モットー、スタイル、セリフなど）を日本語で書いてください。",
    levelWord: "レベル",
    fallbackStyle: "ネオンの雰囲気をまとった謎のトレーナー",
    cannedRivals: [
      {
        nombre: "サーキットの調教師ネオ",
        lema: "ぼくの回路はもう君の敗北を計算済みさ！",
        estilo: "ネオンバイザーとトレンチコートのサイバーパンクトレーナー",
      },
      {
        nombre: "カントーの影アスカル",
        lema: "アリーナの闇の中で輝くのは、わたしの勝利だけ。",
        estilo: "暗いマントと光る瞳の謎めいた女性トレーナー",
      },
    ],
    turnFallbackDialogue: "攻撃の手を緩めるな！",
    turnDefaultDialogue: "行け！",
  },
};

/* ------------------------------------------------------------------ */
/* Korean                                                              */
/* ------------------------------------------------------------------ */

/** KO marks the foe by prefixing "상대 X". */
const koName = (label: string, side: Side) =>
  side === "player" ? label : `상대 ${label}`;

const koEngine: EngineTexts = {
  useMove: (label, side, moveLabel) =>
    `${koName(label, side)}의 ${moveLabel}!`,
  miss: (label, side) => `${koName(label, side)}의 공격은 빗나갔다!`,
  noEffect: (label, side) =>
    `${koName(label, side)}에게는 효과가 없는 것 같다…`,
  crit: "급소에 맞았다!",
  superEffective: "효과가 굉장했다!",
  notVeryEffective: "효과가 별로인 듯하다…",
  faint: (label, side) => `${koName(label, side)}은(는) 쓰러졌다!`,
  win: "승부에서 이겼다!",
  lose: "싸울 수 있는 포켓몬이 없다… 승부에서 졌다!",
  sendOut: (label, side) =>
    side === "player"
      ? `가랏! ${label}!`
      : `상대는 ${label}을(를) 내보냈다!`,
  potion: (label, side, amount) =>
    side === "player"
      ? `상처약을 사용했다: ${label}의 HP가 ${amount} 회복됐다.`
      : `상대는 상처약을 사용했다! ${label}의 HP가 ${amount} 회복됐다!`,

  statNames: {
    atk: "공격",
    def: "방어",
    spa: "특수공격",
    spd: "특수방어",
    spe: "스피드",
    acc: "명중률",
    eva: "회피율",
  },
  statRose: (label, side, stat, sharply) =>
    `${koName(label, side)}의 ${stat}이(가) ${sharply ? "크게 " : ""}올라갔다!`,
  statFell: (label, side, stat, sharply) =>
    `${koName(label, side)}의 ${stat}이(가) ${sharply ? "크게 " : ""}떨어졌다!`,
  statNoHigher: (label, side, stat) =>
    `${koName(label, side)}의 ${stat}은(는) 더 이상 올라가지 않는다!`,
  statNoLower: (label, side, stat) =>
    `${koName(label, side)}의 ${stat}은(는) 더 이상 떨어지지 않는다!`,
  healed: (label, side) => `${koName(label, side)}의 HP가 회복되었다!`,
  healFull: (label, side) =>
    `${koName(label, side)}의 HP는 이미 가득 찼다…`,
  fail: "하지만 실패했다!",
  inflicted: {
    paralysis: (label, side) =>
      `${koName(label, side)}은(는) 마비되어 기술이 나오기 어려워졌다!`,
    burn: (label, side) => `${koName(label, side)}은(는) 화상을 입었다!`,
    poison: (label, side) => `${koName(label, side)}은(는) 독에 당했다!`,
    sleep: (label, side) => `${koName(label, side)}은(는) 잠들어 버렸다!`,
    freeze: (label, side) => `${koName(label, side)}은(는) 얼어붙었다!`,
    confusion: (label, side) =>
      `${koName(label, side)}은(는) 혼란에 빠졌다!`,
  },
  noEffectGeneric: "하지만 효과가 없었다!",
  fullyParalyzed: (label, side) =>
    `${koName(label, side)}은(는) 몸이 저려서 움직일 수 없다!`,
  asleep: (label, side) =>
    `${koName(label, side)}은(는) 쿨쿨 잠들어 있다…`,
  wokeUp: (label, side) => `${koName(label, side)}은(는) 눈을 떴다!`,
  frozenSolid: (label, side) =>
    `${koName(label, side)}은(는) 얼어붙어서 움직일 수 없다!`,
  thawed: (label, side) => `${koName(label, side)}의 얼음이 녹았다!`,
  hurtByBurn: (label, side) =>
    `${koName(label, side)}은(는) 화상 데미지를 입고 있다!`,
  hurtByPoison: (label, side) =>
    `${koName(label, side)}은(는) 독 데미지를 입고 있다!`,
  confusedCheck: (label, side) =>
    `${koName(label, side)}은(는) 혼란에 빠져 있다…`,
  hurtItself: "영문도 모른 채 자신을 공격했다!",
  snappedOut: (label, side) => `${koName(label, side)}의 혼란이 풀렸다!`,
  drained: (label, side) =>
    `${koName(label, side)}은(는) 체력을 흡수했다!`,
  recoil: (label, side) =>
    `${koName(label, side)}은(는) 반동으로 데미지를 입었다!`,

  charge: {
    underground: (label, side) => `${koName(label, side)}은(는) 땅속으로 파고들었다!`,
    airborne: (label, side) => `${koName(label, side)}은(는) 하늘 높이 날아올랐다!`,
    underwater: (label, side) => `${koName(label, side)}은(는) 물속으로 숨었다!`,
    vanished: (label, side) => `${koName(label, side)}은(는) 갑자기 모습을 감췄다!`,
    charging: (label, side) => `${koName(label, side)}은(는) 힘을 모으고 있다!`,
  },
  avoided: (label, side) => `${koName(label, side)}은(는) 공격을 피했다!`,
};

const ko: typeof es = {
  engine: koEngine,

  metaTitle: "배틀 모드",
  metaDescription:
    "AI가 생성한 트레이너와의 포켓몬 배틀: 3D 아레나, 실시간 대화, 턴마다 이어지는 전술적 선택.",

  noTeamTitle: "배틀 모드",
  noTeamBody:
    "아레나에 입장하려면 팀에 포켓몬이 최소 한 마리 필요합니다.",
  noTeamCta: "내 팀 만들기",

  backToDex: "← 포켓몬 도감으로 돌아가기",
  backToDexShort: "도감",
  loadingTitle: "라이벌을 생성하고 아레나를 준비하는 중…",
  loadingHint: "AI가 당신에게 걸맞은 팀을 짜고 있습니다.",
  retry: "다시 시도",
  changeRival: "라이벌 변경",
  setupFailed: "배틀을 준비하지 못했습니다.",
  noServer: "배틀 서버에 연결할 수 없습니다.",

  challenge: (name: string) => `${name}이(가) 승부를 걸어왔다!`,
  trainerSendsOut: (trainer: string, label: string) =>
    `${trainer}은(는) ${label}을(를) 내보냈다!`,
  fallbackRival: "라이벌",
  whatWillDo: (label: string) => `${label}은(는) 무엇을 할까?`,
  whichItem: "어떤 도구를 사용할까?",
  whichSwitch: "다음에 어느 포켓몬을 내보낼까?",
  recall: (label, side) =>
    side === "player"
      ? `${label}, 돌아와!`
      : `상대가 ${label}을(를) 거두어들였다!`,

  dialogueDefault: "가자!",
  dialogueFallback: "쉽게 이기게 두지는 않겠어!",

  introChallenge: "트레이너가 승부를 걸어왔다!",
  motto: (lema: string) => `“${lema}”`,
  fight: "배틀 시작!",

  fleeConfirm: "정말 배틀에서 도망치시겠습니까?",
  fleeYes: "도망친다",
  fleeNo: "계속 싸운다",
  fledMsg: "배틀에서 도망쳤다…",

  overFled: "배틀 포기",
  victory: "승리!",
  defeat: "패배",
  victoryBody: (name: string) =>
    `${name}을(를) 쓰러뜨렸다. 당신의 팀은 무엇이든 해낼 수 있다!`,
  defeatBody: (name: string) =>
    `${name}이(가) 승부에서 이겼다. 단련해서 다시 도전하자!`,
  yourRivalLower: "라이벌",
  yourRivalUpper: "라이벌",
  rematch: "재대결",
  backToDexPlain: "포켓몬 도감으로 돌아가기",

  hp: "HP",
  lvShort: "Lv.",
  abilityShort: "특성",
  menuFight: "싸운다",
  menuPokemon: "포켓몬",
  menuBag: "가방",
  menuFlee: "도망친다",
  hintNoEffect: "효과 없음",
  comboLabel: "콤보",
  koStinger: "다운!",
  hintSuper: "효과가 굉장하다!",
  hintNotVery: "효과가 별로다",
  hintNeutral: "효과 보통",
  classStatus: "변화",
  classPhysical: "물리",
  classSpecial: "특수",
  powerShort: "위력",
  sfxLabel: "SFX",
  sfxGroupAria: "배틀 효과음",
  sfxOnAria: "효과음 켜기",
  sfxOffAria: "효과음 음소거",
  sfxVolumeAria: "효과음 음량",
  back: "← 뒤로",
  potionItem: "상처약",
  potionDesc: "HP를 60 회복한다. 턴을 소비한다.",
  choosePokemon: "포켓몬을 선택하세요.",
  statusFainted: "기절",
  statusActive: "배틀 중",

  builder: {
    closePickerAria: "선택기 닫기",
    pickerDialogAria: (slot: number) =>
      `슬롯 ${slot}의 라이벌 포켓몬 선택`,
    pickerTitle: "라이벌 포켓몬을 선택하세요",
    pickerSlot: (slot: number) => `슬롯 ${slot}`,
    filterPlaceholder: "이름으로 필터 (예: pikachu)…",
    filterAria: "이름으로 포켓몬 필터링",
    indexFailedClose:
      "종족 인덱스를 불러오지 못했습니다. 닫고 다시 시도해 주세요.",
    loadingSpecies: "종족 불러오는 중…",
    noResultsFor: (query: string) =>
      `“${query}”에 대한 결과가 없습니다(이름은 영어로 입력).`,
    slotChoose: "선택",
    slotChooseTitle: "라이벌 포켓몬 선택",
    removeAria: (name: string) => `${name}을(를) 라이벌 팀에서 제거`,
    levelAria: (name: string) => `${name}의 레벨`,
    title: "라이벌 팀",
    clear: "비우기",
    randomTitle: "AI가 당신에게 걸맞은 트레이너와 팀을 만들어 냅니다",
    random: "랜덤 라이벌",
    coachNote: "코치 봇이 생성한 라이벌 팀",
    coachAskTitle: "라이벌이 없나요? 메시지로 AI에게 부탁하세요",
    coachAskBody:
      "원하는 라이벌 팀을 설명하면 코치 봇이 포켓몬 6마리로 팀을 짜 드립니다.",
    wishPlaceholder:
      "예: 전설의 드래곤 팀, 또는 관동 스타팅 여섯 마리…",
    wishAria: "생성하고 싶은 라이벌 팀을 설명하세요",
    generating: "라이벌 구성 중…",
    generateCta: "✨ AI로 라이벌 생성",
    coachFail: "코치 봇이 응답하지 않습니다. 다시 시도해 주세요.",
    coachOffline: "코치 봇에 연결할 수 없습니다…",
    searchPlaceholder: "라이벌용 포켓몬 검색 (예: mewtwo)…",
    searchAria: "라이벌 팀에 추가할 포켓몬 검색",
    indexFailedReload:
      "종족 인덱스를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.",
    emptyHint:
      "슬롯의 “+”를 누르거나, 위에서 검색하거나, 메시지로 부탁하거나… 랜덤 라이벌을 불러오세요.",
    slotEmpty: "빈 슬롯",
    slotPick: "+ 라이벌 고르기",
    changeAria: (name) => `${name}을(를) 다른 포켓몬으로 교체`,
    consoleTitle: "코치봇 · 터미널",
    presetsLabel: "빠른 프리셋",
    presetChampions: "챔피언의 팀",
    presetDragon: "드래곤 단일 타입",
    presetRain: "비 팀",
    presetRandom: "랜덤 6마리",
    presetIndexLoading: "종족 인덱스를 불러오는 중…",
    launchCta: "배틀 시작!",
    launchEmpty: "라이벌을 한 마리 이상 고르세요",
    launchReady: "라이벌 팀 완성 · 6 대 6",
    launchPartial: (filled) => `6마리 중 ${filled}마리만 준비됨`,
    launchConfirm: "다시 누르면 이대로 배틀합니다",
  },

  api: {
    errNoKey: "서버에 OPENAI_API_KEY가 없습니다.",
    errBadJson: "잘못된 JSON입니다.",
    errNeedTeam: "배틀하려면 팀에 포켓몬이 최소 한 마리 필요합니다.",
    errLoadout:
      "배틀 팀을 준비하지 못했습니다. 다시 시도해 주세요.",
    errIncompleteState: "배틀 상태가 불완전합니다.",
    answerIn:
      "중요: JSON의 모든 텍스트 값(이름, 좌우명, 스타일, 대사 등)을 한국어로 작성하세요.",
    levelWord: "레벨",
    fallbackStyle: "네온 감성의 미스터리한 트레이너",
    cannedRivals: [
      {
        nombre: "회로의 조련사 네오",
        lema: "내 회로는 이미 너의 패배를 계산해 두었어!",
        estilo: "네온 바이저와 트렌치코트를 걸친 사이버펑크 트레이너",
      },
      {
        nombre: "관동의 그림자 아스칼",
        lema: "아레나의 어둠 속에서 빛나는 것은 나의 승리뿐.",
        estilo: "어두운 망토와 빛나는 눈의 미스터리한 트레이너",
      },
    ],
    turnFallbackDialogue: "계속 공격해, 숨 돌릴 틈을 주지 마!",
    turnDefaultDialogue: "가라!",
  },
};

/* ------------------------------------------------------------------ */
/* Chinese (Simplified)                                                */
/* ------------------------------------------------------------------ */

/** zh-Hans marks the foe by prefixing "对手的X". */
const zhHansName = (label: string, side: Side) =>
  side === "player" ? label : `对手的${label}`;

const zhHansEngine: EngineTexts = {
  useMove: (label, side, moveLabel) =>
    `${zhHansName(label, side)}使用了${moveLabel}！`,
  miss: (label, side) => `${zhHansName(label, side)}的攻击没有命中！`,
  noEffect: (label, side) => `对${zhHansName(label, side)}没有效果……`,
  crit: "击中了要害！",
  superEffective: "效果绝佳！",
  notVeryEffective: "效果不太好……",
  faint: (label, side) => `${zhHansName(label, side)}倒下了！`,
  win: "你赢得了对战！",
  lose: "你没有可以战斗的宝可梦了……你输了！",
  sendOut: (label, side) =>
    side === "player" ? `上吧！${label}！` : `对手派出了${label}！`,
  potion: (label, side, amount) =>
    side === "player"
      ? `使用了伤药：${label}回复了${amount}点HP。`
      : `对手使用了伤药，${label}回复了${amount}点HP！`,

  statNames: {
    atk: "攻击",
    def: "防御",
    spa: "特攻",
    spd: "特防",
    spe: "速度",
    acc: "命中率",
    eva: "闪避率",
  },
  statRose: (label, side, stat, sharply) =>
    `${zhHansName(label, side)}的${stat}${sharply ? "大幅" : ""}提高了！`,
  statFell: (label, side, stat, sharply) =>
    `${zhHansName(label, side)}的${stat}${sharply ? "大幅" : ""}降低了！`,
  statNoHigher: (label, side, stat) =>
    `${zhHansName(label, side)}的${stat}已经无法再提高了！`,
  statNoLower: (label, side, stat) =>
    `${zhHansName(label, side)}的${stat}已经无法再降低了！`,
  healed: (label, side) => `${zhHansName(label, side)}回复了HP！`,
  healFull: (label, side) => `${zhHansName(label, side)}的HP已经满了……`,
  fail: "但是失败了！",
  inflicted: {
    paralysis: (label, side) =>
      `${zhHansName(label, side)}麻痹了，可能无法行动！`,
    burn: (label, side) => `${zhHansName(label, side)}被灼伤了！`,
    poison: (label, side) => `${zhHansName(label, side)}中毒了！`,
    sleep: (label, side) => `${zhHansName(label, side)}睡着了！`,
    freeze: (label, side) => `${zhHansName(label, side)}被冰冻了！`,
    confusion: (label, side) => `${zhHansName(label, side)}混乱了！`,
  },
  noEffectGeneric: "但是没有效果！",
  fullyParalyzed: (label, side) =>
    `${zhHansName(label, side)}麻痹了，无法行动！`,
  asleep: (label, side) => `${zhHansName(label, side)}正在呼呼大睡……`,
  wokeUp: (label, side) => `${zhHansName(label, side)}醒了过来！`,
  frozenSolid: (label, side) =>
    `${zhHansName(label, side)}被冻住了，无法行动！`,
  thawed: (label, side) => `${zhHansName(label, side)}身上的冰融化了！`,
  hurtByBurn: (label, side) =>
    `${zhHansName(label, side)}受到了灼伤的伤害！`,
  hurtByPoison: (label, side) =>
    `${zhHansName(label, side)}受到了毒的伤害！`,
  confusedCheck: (label, side) =>
    `${zhHansName(label, side)}正处于混乱之中……`,
  hurtItself: "在混乱中攻击了自己！",
  snappedOut: (label, side) => `${zhHansName(label, side)}的混乱解除了！`,
  drained: (label, side) => `${zhHansName(label, side)}吸取了体力！`,
  recoil: (label, side) =>
    `${zhHansName(label, side)}受到了反作用力的伤害！`,

  charge: {
    underground: (label, side) => `${zhHansName(label, side)}钻入了地下！`,
    airborne: (label, side) => `${zhHansName(label, side)}飞向了高空！`,
    underwater: (label, side) => `${zhHansName(label, side)}潜入了水中！`,
    vanished: (label, side) => `${zhHansName(label, side)}突然消失了！`,
    charging: (label, side) => `${zhHansName(label, side)}正在积蓄力量！`,
  },
  avoided: (label, side) => `${zhHansName(label, side)}躲开了攻击！`,
};

const zhHans: typeof es = {
  engine: zhHansEngine,

  metaTitle: "对战模式",
  metaDescription:
    "与AI生成的训练家进行宝可梦对战：3D竞技场、实时对话和逐回合的战术抉择。",

  noTeamTitle: "对战模式",
  noTeamBody: "队伍中至少需要一只宝可梦才能进入竞技场。",
  noTeamCta: "组建我的队伍",

  backToDex: "← 返回宝可梦图鉴",
  backToDexShort: "图鉴",
  loadingTitle: "正在生成对手并准备竞技场…",
  loadingHint: "AI正在组建一支与你旗鼓相当的队伍。",
  retry: "重试",
  changeRival: "更换对手",
  setupFailed: "无法准备对战。",
  noServer: "无法连接对战服务器。",

  challenge: (name: string) => `${name}向你发起挑战！`,
  trainerSendsOut: (trainer: string, label: string) =>
    `${trainer}派出了${label}！`,
  fallbackRival: "对手",
  whatWillDo: (label: string) => `${label}要怎么做？`,
  whichItem: "要使用哪个道具？",
  whichSwitch: "接下来派哪只宝可梦上场？",
  recall: (label, side) =>
    side === "player" ? `${label}，回来！` : `对手收回了${label}！`,

  dialogueDefault: "上吧！",
  dialogueFallback: "我可不会让你轻易取胜！",

  introChallenge: "有训练家想要对战！",
  motto: (lema: string) => `“${lema}”`,
  fight: "开始对战！",

  fleeConfirm: "确定要逃离对战吗？",
  fleeYes: "逃跑",
  fleeNo: "继续战斗",
  fledMsg: "你逃离了对战……",

  overFled: "对战已放弃",
  victory: "胜利！",
  defeat: "失败",
  victoryBody: (name: string) =>
    `你打败了${name}。你的队伍所向无敌！`,
  defeatBody: (name: string) =>
    `${name}赢得了这场对战。好好训练，回来复仇吧！`,
  yourRivalLower: "你的对手",
  yourRivalUpper: "你的对手",
  rematch: "再战",
  backToDexPlain: "返回宝可梦图鉴",

  hp: "HP",
  lvShort: "Lv.",
  abilityShort: "特性",
  menuFight: "战斗",
  menuPokemon: "宝可梦",
  menuBag: "背包",
  menuFlee: "逃跑",
  hintNoEffect: "没有效果",
  comboLabel: "连击",
  koStinger: "倒下！",
  hintSuper: "效果绝佳！",
  hintNotVery: "效果不太好",
  hintNeutral: "效果一般",
  classStatus: "变化",
  classPhysical: "物理",
  classSpecial: "特殊",
  powerShort: "威力",
  sfxLabel: "SFX",
  sfxGroupAria: "对战音效",
  sfxOnAria: "开启音效",
  sfxOffAria: "静音音效",
  sfxVolumeAria: "音效音量",
  back: "← 返回",
  potionItem: "伤药",
  potionDesc: "回复60点HP。消耗一回合。",
  choosePokemon: "请选择一只宝可梦。",
  statusFainted: "濒死",
  statusActive: "对战中",

  builder: {
    closePickerAria: "关闭选择器",
    pickerDialogAria: (slot: number) => `为第${slot}号位选择对手宝可梦`,
    pickerTitle: "选择一只对手宝可梦",
    pickerSlot: (slot: number) => `第${slot}号位`,
    filterPlaceholder: "按名称筛选（如 pikachu）…",
    filterAria: "按名称筛选宝可梦",
    indexFailedClose: "无法加载物种索引。请关闭后重试。",
    loadingSpecies: "正在加载物种…",
    noResultsFor: (query: string) =>
      `没有与“${query}”相关的结果（名称需用英文）。`,
    slotChoose: "选择",
    slotChooseTitle: "选择对手宝可梦",
    removeAria: (name: string) => `将${name}从对手队伍中移除`,
    levelAria: (name: string) => `${name}的等级`,
    title: "对手队伍",
    clear: "清空",
    randomTitle: "AI会构思一位与你旗鼓相当的训练家及其队伍",
    random: "随机对手",
    coachNote: "由教练机器人生成的对手队伍",
    coachAskTitle: "没有对手？发消息让AI来安排",
    coachAskBody:
      "描述你想要的对手队伍，教练机器人会组建一支6只宝可梦的队伍。",
    wishPlaceholder:
      "例如：一支传说中的龙系队伍，或关都的六只御三家…",
    wishAria: "描述你想生成的对手队伍",
    generating: "正在组建对手…",
    generateCta: "✨ 用AI生成对手",
    coachFail: "教练机器人没有响应。请重试。",
    coachOffline: "无法连接教练机器人…",
    searchPlaceholder: "搜索任意宝可梦作为对手（如 mewtwo）…",
    searchAria: "搜索要加入对手队伍的宝可梦",
    indexFailedReload: "无法加载物种索引。请刷新后重试。",
    emptyHint:
      "点击某个位置上的“+”、在上方搜索、发消息请求…或召唤一个随机对手。",
    slotEmpty: "空位",
    slotPick: "+ 选择对手",
    changeAria: (name) => `把${name}换成其他宝可梦`,
    consoleTitle: "教练机器人 · 终端",
    presetsLabel: "快速预设",
    presetChampions: "冠军队伍",
    presetDragon: "龙系单属性",
    presetRain: "下雨队",
    presetRandom: "随机6只",
    presetIndexLoading: "正在加载物种索引…",
    launchCta: "开始对战！",
    launchEmpty: "至少选择一名对手",
    launchReady: "对手队伍已满 · 6 对 6",
    launchPartial: (filled) => `6 只中只准备了 ${filled} 只`,
    launchConfirm: "再按一次就这样开战",
  },

  api: {
    errNoKey: "服务器缺少 OPENAI_API_KEY。",
    errBadJson: "无效的JSON。",
    errNeedTeam: "队伍中至少需要一只宝可梦才能对战。",
    errLoadout: "无法准备对战队伍。请重试。",
    errIncompleteState: "对战状态不完整。",
    answerIn:
      "重要：JSON中的所有文本值（名字、口号、风格、台词等）都要用简体中文书写。",
    levelWord: "等级",
    fallbackStyle: "霓虹风格的神秘训练家",
    cannedRivals: [
      {
        nombre: "电路驯服者尼奥",
        lema: "我的电路早已算出你的败局！",
        estilo: "戴霓虹面罩、穿风衣的赛博朋克训练家",
      },
      {
        nombre: "关都之影阿斯卡尔",
        lema: "在竞技场的黑暗中，只有我的胜利会闪耀。",
        estilo: "披着黑斗篷、双眼发光的神秘女训练家",
      },
    ],
    turnFallbackDialogue: "继续进攻，别给他们喘息的机会！",
    turnDefaultDialogue: "上啊！",
  },
};

/* ------------------------------------------------------------------ */
/* Chinese (Traditional)                                               */
/* ------------------------------------------------------------------ */

/** zh-Hant marks the foe by prefixing "對手的X". */
const zhHantName = (label: string, side: Side) =>
  side === "player" ? label : `對手的${label}`;

const zhHantEngine: EngineTexts = {
  useMove: (label, side, moveLabel) =>
    `${zhHantName(label, side)}使用了${moveLabel}！`,
  miss: (label, side) => `${zhHantName(label, side)}的攻擊沒有命中！`,
  noEffect: (label, side) => `對${zhHantName(label, side)}沒有效果……`,
  crit: "擊中了要害！",
  superEffective: "效果絕佳！",
  notVeryEffective: "效果不太好……",
  faint: (label, side) => `${zhHantName(label, side)}倒下了！`,
  win: "你贏得了對戰！",
  lose: "你沒有可以戰鬥的寶可夢了……你輸了！",
  sendOut: (label, side) =>
    side === "player" ? `上吧！${label}！` : `對手派出了${label}！`,
  potion: (label, side, amount) =>
    side === "player"
      ? `使用了傷藥：${label}回復了${amount}點HP。`
      : `對手使用了傷藥，${label}回復了${amount}點HP！`,

  statNames: {
    atk: "攻擊",
    def: "防禦",
    spa: "特攻",
    spd: "特防",
    spe: "速度",
    acc: "命中率",
    eva: "閃避率",
  },
  statRose: (label, side, stat, sharply) =>
    `${zhHantName(label, side)}的${stat}${sharply ? "大幅" : ""}提高了！`,
  statFell: (label, side, stat, sharply) =>
    `${zhHantName(label, side)}的${stat}${sharply ? "大幅" : ""}降低了！`,
  statNoHigher: (label, side, stat) =>
    `${zhHantName(label, side)}的${stat}已經無法再提高了！`,
  statNoLower: (label, side, stat) =>
    `${zhHantName(label, side)}的${stat}已經無法再降低了！`,
  healed: (label, side) => `${zhHantName(label, side)}回復了HP！`,
  healFull: (label, side) => `${zhHantName(label, side)}的HP已經滿了……`,
  fail: "但是失敗了！",
  inflicted: {
    paralysis: (label, side) =>
      `${zhHantName(label, side)}麻痺了，可能無法行動！`,
    burn: (label, side) => `${zhHantName(label, side)}被灼傷了！`,
    poison: (label, side) => `${zhHantName(label, side)}中毒了！`,
    sleep: (label, side) => `${zhHantName(label, side)}睡著了！`,
    freeze: (label, side) => `${zhHantName(label, side)}被冰凍了！`,
    confusion: (label, side) => `${zhHantName(label, side)}混亂了！`,
  },
  noEffectGeneric: "但是沒有效果！",
  fullyParalyzed: (label, side) =>
    `${zhHantName(label, side)}麻痺了，無法行動！`,
  asleep: (label, side) => `${zhHantName(label, side)}正在呼呼大睡……`,
  wokeUp: (label, side) => `${zhHantName(label, side)}醒了過來！`,
  frozenSolid: (label, side) =>
    `${zhHantName(label, side)}被凍住了，無法行動！`,
  thawed: (label, side) => `${zhHantName(label, side)}身上的冰融化了！`,
  hurtByBurn: (label, side) =>
    `${zhHantName(label, side)}受到了灼傷的傷害！`,
  hurtByPoison: (label, side) =>
    `${zhHantName(label, side)}受到了毒的傷害！`,
  confusedCheck: (label, side) =>
    `${zhHantName(label, side)}正處於混亂之中……`,
  hurtItself: "在混亂中攻擊了自己！",
  snappedOut: (label, side) => `${zhHantName(label, side)}的混亂解除了！`,
  drained: (label, side) => `${zhHantName(label, side)}吸取了體力！`,
  recoil: (label, side) =>
    `${zhHantName(label, side)}受到了反作用力的傷害！`,

  charge: {
    underground: (label, side) => `${zhHantName(label, side)}鑽入了地下！`,
    airborne: (label, side) => `${zhHantName(label, side)}飛向了高空！`,
    underwater: (label, side) => `${zhHantName(label, side)}潛入了水中！`,
    vanished: (label, side) => `${zhHantName(label, side)}突然消失了！`,
    charging: (label, side) => `${zhHantName(label, side)}正在積蓄力量！`,
  },
  avoided: (label, side) => `${zhHantName(label, side)}躲開了攻擊！`,
};

const zhHant: typeof es = {
  engine: zhHantEngine,

  metaTitle: "對戰模式",
  metaDescription:
    "與AI生成的訓練家進行寶可夢對戰：3D競技場、即時對話和逐回合的戰術抉擇。",

  noTeamTitle: "對戰模式",
  noTeamBody: "隊伍中至少需要一隻寶可夢才能進入競技場。",
  noTeamCta: "組建我的隊伍",

  backToDex: "← 返回寶可夢圖鑑",
  backToDexShort: "圖鑑",
  loadingTitle: "正在生成對手並準備競技場…",
  loadingHint: "AI正在組建一支與你旗鼓相當的隊伍。",
  retry: "重試",
  changeRival: "更換對手",
  setupFailed: "無法準備對戰。",
  noServer: "無法連接對戰伺服器。",

  challenge: (name: string) => `${name}向你發起挑戰！`,
  trainerSendsOut: (trainer: string, label: string) =>
    `${trainer}派出了${label}！`,
  fallbackRival: "對手",
  whatWillDo: (label: string) => `${label}要怎麼做？`,
  whichItem: "要使用哪個道具？",
  whichSwitch: "接下來派哪隻寶可夢上場？",
  recall: (label, side) =>
    side === "player" ? `${label}，回來！` : `對手收回了${label}！`,

  dialogueDefault: "上吧！",
  dialogueFallback: "我可不會讓你輕易獲勝！",

  introChallenge: "有訓練家想要對戰！",
  motto: (lema: string) => `「${lema}」`,
  fight: "開始對戰！",

  fleeConfirm: "確定要逃離對戰嗎？",
  fleeYes: "逃跑",
  fleeNo: "繼續戰鬥",
  fledMsg: "你逃離了對戰……",

  overFled: "對戰已放棄",
  victory: "勝利！",
  defeat: "敗北",
  victoryBody: (name: string) =>
    `你打敗了${name}。你的隊伍所向無敵！`,
  defeatBody: (name: string) =>
    `${name}贏得了這場對戰。好好訓練，回來復仇吧！`,
  yourRivalLower: "你的對手",
  yourRivalUpper: "你的對手",
  rematch: "再戰",
  backToDexPlain: "返回寶可夢圖鑑",

  hp: "HP",
  lvShort: "Lv.",
  abilityShort: "特性",
  menuFight: "戰鬥",
  menuPokemon: "寶可夢",
  menuBag: "背包",
  menuFlee: "逃跑",
  hintNoEffect: "沒有效果",
  comboLabel: "連擊",
  koStinger: "倒下！",
  hintSuper: "效果絕佳！",
  hintNotVery: "效果不太好",
  hintNeutral: "效果一般",
  classStatus: "變化",
  classPhysical: "物理",
  classSpecial: "特殊",
  powerShort: "威力",
  sfxLabel: "SFX",
  sfxGroupAria: "對戰音效",
  sfxOnAria: "開啟音效",
  sfxOffAria: "靜音音效",
  sfxVolumeAria: "音效音量",
  back: "← 返回",
  potionItem: "傷藥",
  potionDesc: "回復60點HP。消耗一回合。",
  choosePokemon: "請選擇一隻寶可夢。",
  statusFainted: "瀕死",
  statusActive: "對戰中",

  builder: {
    closePickerAria: "關閉選擇器",
    pickerDialogAria: (slot: number) => `為第${slot}號位選擇對手寶可夢`,
    pickerTitle: "選擇一隻對手寶可夢",
    pickerSlot: (slot: number) => `第${slot}號位`,
    filterPlaceholder: "按名稱篩選（如 pikachu）…",
    filterAria: "按名稱篩選寶可夢",
    indexFailedClose: "無法載入物種索引。請關閉後重試。",
    loadingSpecies: "正在載入物種…",
    noResultsFor: (query: string) =>
      `沒有與「${query}」相關的結果（名稱需用英文）。`,
    slotChoose: "選擇",
    slotChooseTitle: "選擇對手寶可夢",
    removeAria: (name: string) => `將${name}從對手隊伍中移除`,
    levelAria: (name: string) => `${name}的等級`,
    title: "對手隊伍",
    clear: "清空",
    randomTitle: "AI會構思一位與你旗鼓相當的訓練家及其隊伍",
    random: "隨機對手",
    coachNote: "由教練機器人生成的對手隊伍",
    coachAskTitle: "沒有對手？發訊息讓AI來安排",
    coachAskBody:
      "描述你想要的對手隊伍，教練機器人會組建一支6隻寶可夢的隊伍。",
    wishPlaceholder:
      "例如：一支傳說中的龍系隊伍，或關都的六隻御三家…",
    wishAria: "描述你想生成的對手隊伍",
    generating: "正在組建對手…",
    generateCta: "✨ 用AI生成對手",
    coachFail: "教練機器人沒有回應。請重試。",
    coachOffline: "無法連接教練機器人…",
    searchPlaceholder: "搜尋任意寶可夢作為對手（如 mewtwo）…",
    searchAria: "搜尋要加入對手隊伍的寶可夢",
    indexFailedReload: "無法載入物種索引。請重新整理後重試。",
    emptyHint:
      "點擊某個位置上的「+」、在上方搜尋、發訊息請求…或召喚一個隨機對手。",
    slotEmpty: "空位",
    slotPick: "+ 選擇對手",
    changeAria: (name) => `把${name}換成其他寶可夢`,
    consoleTitle: "教練機器人 · 終端",
    presetsLabel: "快速預設",
    presetChampions: "冠軍隊伍",
    presetDragon: "龍系單屬性",
    presetRain: "下雨隊",
    presetRandom: "隨機6隻",
    presetIndexLoading: "正在載入物種索引…",
    launchCta: "開始對戰！",
    launchEmpty: "至少選擇一名對手",
    launchReady: "對手隊伍已滿 · 6 對 6",
    launchPartial: (filled) => `6 隻中只準備了 ${filled} 隻`,
    launchConfirm: "再按一次就這樣開戰",
  },

  api: {
    errNoKey: "伺服器缺少 OPENAI_API_KEY。",
    errBadJson: "無效的JSON。",
    errNeedTeam: "隊伍中至少需要一隻寶可夢才能對戰。",
    errLoadout: "無法準備對戰隊伍。請再試一次。",
    errIncompleteState: "對戰狀態不完整。",
    answerIn:
      "重要：JSON中的所有文字值（名字、口號、風格、台詞等）都要用繁體中文書寫。",
    levelWord: "等級",
    fallbackStyle: "霓虹風格的神祕訓練家",
    cannedRivals: [
      {
        nombre: "電路馴服者尼奧",
        lema: "我的電路早已算出你的敗局！",
        estilo: "戴霓虹面罩、穿風衣的賽博龐克訓練家",
      },
      {
        nombre: "關都之影阿斯卡爾",
        lema: "在競技場的黑暗中，只有我的勝利會閃耀。",
        estilo: "披著黑斗篷、雙眼發光的神祕女訓練家",
      },
    ],
    turnFallbackDialogue: "繼續進攻，別給他們喘息的機會！",
    turnDefaultDialogue: "上啊！",
  },
};

export const battleDict: Record<Lang, typeof es> = {
  es,
  en,
  fr,
  de,
  it,
  ja,
  ko,
  "zh-Hans": zhHans,
  "zh-Hant": zhHant,
};

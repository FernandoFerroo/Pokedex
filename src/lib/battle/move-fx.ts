/**
 * Qué animación le toca a cada movimiento.
 *
 * En los juegos la animación NO la decide el tipo: Lanzallamas es un chorro
 * sostenido y Bomba Lodo un orbe que vuela, aunque los dos sean ataques
 * especiales; Puño Fuego y Rayo Hielo comparten poco más que el color. El tipo
 * pone la paleta (eso vive en `TYPE_FX`, en la arena) y esto pone la
 * COREOGRAFÍA: de dónde sale, cómo viaja y qué pasa al llegar.
 *
 * Por eso el catálogo está escrito al revés de lo que se esperaría —una
 * sección por coreografía con los movimientos que la usan, en vez de un
 * movimiento por línea—: así se lee de un vistazo qué entra en «mordisco» y
 * salta a la vista cuando algo está en el cajón equivocado. Es también la
 * única forma de revisar los 937 movimientos de PokéAPI sin perderse.
 *
 * Lo que no esté listado cae en `patternFor` (familias por nombre: todo lo que
 * acabe en `-punch` puñetea) y, si tampoco, en el reparto por tipo y
 * categoría. Un movimiento nuevo de PokéAPI siempre sale animado.
 *
 * Para comprobar la cobertura entera:
 *
 *   node --import ./scripts/lib/alias-hook.mjs scripts/move-fx-audit.mts
 */

/**
 * Las coreografías que la arena sabe dibujar.
 *
 * Cada una es una animación distinta de verdad, no un ajuste de la anterior:
 * si dos entradas de esta lista se ven igual en pantalla, sobra una.
 */
export type Choreography =
  // — A distancia ———————————————————————————————————
  /** Chorro sostenido desde la boca. Lanzallamas, Rayo Hielo, Hidrobomba. */
  | "beam"
  /** Esferas concéntricas que viajan pulsando. Esfera Aural, Pulso Dragón. */
  | "pulse"
  /** Orbe con arco que revienta al llegar. Bola Sombra, Bomba Lodo. */
  | "orb"
  /** Ráfaga de proyectiles encadenados. Recurrente, Pedrada. */
  | "barrage"
  /** Descarga que cae del cielo. Rayo, Trueno. */
  | "bolt"
  /** Lluvia de cuerpos desde arriba. Cometa Draco, Avalancha. */
  | "meteor"
  /** Fogonazo de luz que baña el campo. Brillo Mágico, Destello. */
  | "gleam"
  // — Cuerpo a cuerpo ————————————————————————————————
  /** Embestida genérica: destello, tajos cruzados y polvareda. */
  | "contact"
  /** Filos limpios cruzándose. Corte, Tajo Umbrío, Tijera X. */
  | "slash"
  /** Puñetazo: nudillo, anillos de nudillo y una onda seca. */
  | "punch"
  /** Patada en arco, con el impacto abajo. Patada Baja, Patada Ígnea. */
  | "kick"
  /** Fauces que se cierran sobre el objetivo. Mordisco, Triturar. */
  | "bite"
  /** Punta que taladra. Pico Taladro, Cornada, Picotazo Venenoso. */
  | "pierce"
  /** El propio Pokémon gira y arrolla. Desenrollar, Giro Rápido. */
  | "spin"
  /** Golpe pesado que aplasta. Golpe Cuerpo, Cola Férrea, Derribo. */
  | "slam"
  /** Picado desde el cielo. Vuelo, Pájaro Osado, Ataque Aéreo. */
  | "dive"
  // — Campo —————————————————————————————————————————
  /** Se raja el suelo de lado a lado. Terremoto, Magnitud. */
  | "quake"
  /** Pared de agua que barre la arena. Surf, Agua Lodosa. */
  | "wave"
  /** Remolino que se cierra sobre el objetivo. Ciclón, Giro Fuego. */
  | "swirl"
  /** Púas que se levantan del suelo bajo los pies. Roca Afilada. */
  | "spire"
  /** El cielo entero cambia. Día Soleado, Danza Lluvia, Granizo. */
  | "weather"
  /** El suelo se enciende en rejilla. Campo Eléctrico, Campo de Hierba. */
  | "terrain"
  /** Trampa sembrada en el lado contrario. Púas, Trampa Rocas. */
  | "hazard"
  /** El espacio se retuerce. Espacio Raro, Gravedad, Teletransporte. */
  | "warp"
  /** Anillos de sonido que se expanden desde quien lo usa. Vozarrón, Canto. */
  | "sound"
  // — Golpes con firma propia ————————————————————————
  /** Haz que se lleva la pantalla a blanco. Hiperrayo, Gigaimpacto. */
  | "nuke"
  /** Estallido centrado en quien lo usa. Explosión, Autodestrucción. */
  | "explode"
  /** Zarcillos que roban energía y la devuelven. Absorber, Gigadrenado. */
  | "drain"
  /** El objetivo levitado y estrujado. Psíquico, Confusión. */
  | "psylift"
  /** Espectros que suben desde abajo. Tinieblas, Sombra Vil, Lengüetazo. */
  | "hex"
  /** Burbujeo y nube que se queda pegada. Tóxico, Ácido, Polución. */
  | "venom"
  /** Nube de esporas que se posa. Somnífero, Paralizador, Espora. */
  | "powder"
  /** Ataduras que se cierran alrededor. Atadura, Constricción, Infestación. */
  | "trap"
  // — Apoyo —————————————————————————————————————————
  /** Aura sobre uno mismo: columna de luz y anillos que suben. */
  | "buff"
  /** Aros que se cierran sobre el rival y polvillo cayendo. */
  | "debuff"
  /** Órbitas que giran alrededor de quien la baila. Danza Espada. */
  | "dance"
  /** Chispas verdes que suben y cierran heridas. Recuperación, Descanso. */
  | "heal"
  /** Panel translúcido que se levanta delante. Reflejo, Pantalla Luz. */
  | "screen"
  /** Burbuja hexagonal que se cierra de golpe. Protección, Sustituto. */
  | "shield";

/**
 * El catálogo: una sección por coreografía.
 *
 * Cada lista está ordenada por familias (los puñetazos por elemento, las
 * cuchillas por tipo…) y no por orden alfabético ni por número de Pokédex,
 * porque lo que hay que poder comprobar de un vistazo es que no falta ningún
 * hermano — si están Puño Fuego y Puño Hielo, Puño Trueno tiene que estar.
 */
const CATALOGUE: Record<Choreography, readonly string[]> = {
  /* — Chorros sostenidos ————————————————————————————— */
  beam: [
    // Alientos elementales, el chorro clásico salido de la boca.
    "flamethrower",
    "ember",
    "fire-blast",
    "heat-wave",
    "overheat",
    "lava-plume",
    "incinerate",
    "searing-shot",
    "burn-up",
    "torch-song",
    "blue-flare",
    "fusion-flare",
    "mystical-fire",
    "water-gun",
    "hydro-pump",
    "bubble-beam",
    "scald",
    "steam-eruption",
    "hydro-steam",
    "octazooka",
    "chilling-water",
    "ice-beam",
    "blizzard",
    "powder-snow",
    "frost-breath",
    "aurora-beam",
    "glaciate",
    "freeze-dry",
    "ice-burn",
    "freeze-shock",
    "psybeam",
    "signal-beam",
    "charge-beam",
    "flash-cannon",
    "steel-beam",
    "dragon-breath",
    "dragon-rage",
    "twin-beam",
    "moongeist-beam",
    "photon-geyser",
    "fleur-cannon",
    "dynamax-cannon",
    "chloroblast",
    "simple-beam",
    "techno-blast",
    "multi-attack",
    "judgment",
    "hidden-power",
    "revelation-dance",
    "tera-blast",
    "fickle-beam",
    "electro-shot",
    "aeroblast",
    "luster-purge",
    "secret-power",
    "nature-power",
    "weather-ball",
    "oblivion-wing",
    "shadow-chill",
    "shadow-fire",
    "spit-up",
    "sacred-fire",
    "inferno",
    "solar-beam",
    "freezy-frost",
    "sheer-cold",
  ],

  /* — Esferas concéntricas ————————————————————————— */
  pulse: [
    "water-pulse",
    "dragon-pulse",
    "dark-pulse",
    "aura-sphere",
    "origin-pulse",
    "heal-pulse",
    "shock-wave",
    "vacuum-wave",
    "sonic-boom",
    "night-daze",
    "core-enforcer",
    "seed-flare",
    "psywave",
    "synchronoise",
    "eerie-impulse",
    "eerie-spell",
    "expanding-force",
    "mystical-power",
    "power-gem",
    "ancient-power",
    "earth-power",
    "shadow-wave",
    "struggle-bug",
    "terrain-pulse",
  ],

  /* — Orbes con arco ————————————————————————————————— */
  orb: [
    "shadow-ball",
    "energy-ball",
    "focus-blast",
    "electro-ball",
    "sludge-bomb",
    "gunk-shot",
    "mud-bomb",
    "mud-shot",
    "mud-slap",
    "seed-bomb",
    "egg-bomb",
    "magnet-bomb",
    "pollen-puff",
    "syrup-bomb",
    "barb-barrage",
    "acid-spray",
    "flame-burst",
    "pyro-ball",
    "mist-ball",
    "moonblast",
    "shell-side-arm",
    "snipe-shot",
    "bonemerang",
    "bone-club",
    "rock-throw",
    "smack-down",
    "fling",
    "present",
    "natural-gift",
    "trump-card",
    "make-it-rain",
    "soak",
    "apple-acid",
    "grav-apple",
    "ivy-cudgel",
    "matcha-gotcha",
    "shadow-blast",
    "mirror-shot",
    "will-o-wisp",
    "rock-wrecker",
    "flower-trick",
  ],

  /* — Ráfagas encadenadas ————————————————————————— */
  barrage: [
    "bullet-seed",
    "rock-blast",
    "icicle-spear",
    "spike-cannon",
    "bone-rush",
    "barrage",
    "magical-leaf",
    "razor-leaf",
    "water-shuriken",
    "dragon-darts",
    "scale-shot",
    "population-bomb",
    "triple-arrows",
    "arm-thrust",
    "double-slap",
    "fury-swipes",
    "tail-slap",
    "gear-grind",
    "double-hit",
    "double-iron-bash",
    "twineedle",
    "beat-up",
    "pin-missile",
    "fury-attack",
    "triple-dive",
    "bullet-punch",
    "swift",
    "attack-order",
    "pay-day",
    "leafage",
    "bubble",
    "tri-attack",
  ],

  /* — Descargas del cielo ————————————————————————— */
  bolt: [
    "thunder-shock",
    "thunderbolt",
    "thunder",
    "thunder-wave",
    "zap-cannon",
    "discharge",
    "spark",
    "nuzzle",
    "volt-switch",
    "parabolic-charge",
    "ion-deluge",
    "electrify",
    "bolt-strike",
    "fusion-bolt",
    "plasma-fists",
    "rising-voltage",
    "wildbolt-storm",
    "thunderclap",
    "supercell-slam",
    "double-shock",
    "shadow-bolt",
    "zippy-zap",
    "buzzy-buzz",
    "10-000-000-volt-thunderbolt",
  ],

  /* — Lluvia desde arriba ————————————————————————— */
  meteor: [
    "draco-meteor",
    "meteor-beam",
    "rock-slide",
    "avalanche",
    "icicle-crash",
    "diamond-storm",
    "mountain-gale",
    "thousand-arrows",
    "petal-blizzard",
    "max-rockfall",
    "max-hailstorm",
    "max-starfall",
  ],

  /* — Fogonazos de luz ————————————————————————————— */
  gleam: [
    "dazzling-gleam",
    "flash",
    "glitzy-glow",
    "lumina-crash",
    "light-of-ruin",
    "magical-torque",
    "aromatic-mist",
    "fairy-lock",
    "happy-hour",
    "celebrate",
    "hold-hands",
    "lucky-chant",
    "max-flutterby",
  ],

  /* — Embestidas genéricas ————————————————————————— */
  contact: [
    "tackle",
    "pound",
    "quick-attack",
    "extreme-speed",
    "aqua-jet",
    "ice-shard",
    "shadow-sneak",
    "accelerock",
    "feint",
    "feint-attack",
    "sucker-punch",
    "fake-out",
    "first-impression",
    "u-turn",
    "flip-turn",
    "pursuit",
    "payback",
    "assurance",
    "revenge",
    "retaliate",
    "chip-away",
    "endeavor",
    "flail",
    "reversal",
    "struggle",
    "last-resort",
    "hold-back",
    "false-surrender",
    "lash-out",
    "power-trip",
    "stored-power",
    "punishment",
    "covet",
    "thief",
    "knock-off",
    "bestow",
    "pluck",
    "lunge",
    "pounce",
    "trailblaze",
    "grassy-glide",
    "veevee-volley",
    "pika-papow",
    "sappy-seed",
    "baddy-bad",
    "hyperspace-fury",
    "shadow-rush",
    "shadow-blitz",
    "shadow-half",
    "facade",
    "frustration",
    "return",
    "play-rough",
    "foul-play",
  ],

  /* — Filos ——————————————————————————————————————— */
  slash: [
    "cut",
    "scratch",
    "slash",
    "night-slash",
    "psycho-cut",
    "air-slash",
    "air-cutter",
    "aqua-cutter",
    "x-scissor",
    "cross-poison",
    "dire-claw",
    "fury-cutter",
    "false-swipe",
    "metal-claw",
    "crush-claw",
    "dragon-claw",
    "shadow-claw",
    "dual-chop",
    "cross-chop",
    "karate-chop",
    "brick-break",
    "sacred-sword",
    "secret-sword",
    "leaf-blade",
    "solar-blade",
    "psyblade",
    "bitter-blade",
    "razor-shell",
    "razor-wind",
    "stone-axe",
    "ceaseless-edge",
    "kowtow-cleave",
    "mighty-cleave",
    "tachyon-cutter",
    "esper-wing",
    "dual-wingbeat",
    "wing-attack",
    "steel-wing",
    "aerial-ace",
    "breaking-swipe",
    "brutal-swing",
    "skitter-smack",
    "darkest-lariat",
    "spectral-thief",
    "sinister-arrow-raid",
    "throat-chop",
    "spacial-rend",
    "shadow-break",
  ],

  /* — Puñetazos —————————————————————————————————— */
  punch: [
    "mega-punch",
    "comet-punch",
    "fire-punch",
    "ice-punch",
    "thunder-punch",
    "dizzy-punch",
    "mach-punch",
    "dynamic-punch",
    "shadow-punch",
    "focus-punch",
    "power-up-punch",
    "meteor-mash",
    "sky-uppercut",
    "hammer-arm",
    "ice-hammer",
    "dragon-hammer",
    "gigaton-hammer",
    "wood-hammer",
    "jet-punch",
    "rage-fist",
    "upper-hand",
    "wicked-blow",
    "surging-strikes",
    "storm-throw",
    "force-palm",
    "close-combat",
    "superpower",
    "counter",
    "comeuppance",
    "metal-burst",
    "mirror-coat",
    "wake-up-slap",
    "smelling-salts",
    "hard-press",
    "power-shift",
    "malicious-moonsault",
    "pulverizing-pancake",
    "lets-snuggle-forever",
    "soul-stealing-7-star-strike",
    "max-knuckle",
  ],

  /* — Patadas ———————————————————————————————————— */
  kick: [
    "double-kick",
    "mega-kick",
    "jump-kick",
    "high-jump-kick",
    "rolling-kick",
    "low-kick",
    "low-sweep",
    "blaze-kick",
    "triple-kick",
    "triple-axel",
    "trop-kick",
    "thunderous-kick",
    "axe-kick",
    "stomp",
    "high-horsepower",
    "flying-press",
    "submission",
    "vital-throw",
    "seismic-toss",
    "circle-throw",
  ],

  /* — Fauces ————————————————————————————————————— */
  bite: [
    "bite",
    "crunch",
    "hyper-fang",
    "super-fang",
    "poison-fang",
    "thunder-fang",
    "ice-fang",
    "fire-fang",
    "psychic-fangs",
    "bug-bite",
    "jaw-lock",
    "fishious-rend",
    "crush-grip",
    "wring-out",
    "vice-grip",
    "guillotine",
    "clamp",
  ],

  /* — Puntas que taladran ————————————————————————— */
  pierce: [
    "peck",
    "drill-peck",
    "drill-run",
    "hyper-drill",
    "horn-attack",
    "horn-drill",
    "megahorn",
    "horn-leech",
    "smart-strike",
    "branch-poke",
    "poison-sting",
    "poison-jab",
    "needle-arm",
    "fell-stinger",
    "bolt-beak",
    "beak-blast",
    "shadow-bone",
    "spirit-shackle",
    "anchor-shot",
    "sunsteel-strike",
    "behemoth-blade",
    "meteor-assault",
    "glaive-rush",
    "max-steelspike",
  ],

  /* — Girando sobre sí mismo ————————————————————— */
  spin: [
    "rollout",
    "ice-ball",
    "rapid-spin",
    "mortal-spin",
    "gyro-ball",
    "steamroller",
    "steel-roller",
    "spin-out",
    "ice-spinner",
    "aura-wheel",
    "flame-wheel",
    "flame-charge",
    "rototiller",
    "aqua-step",
    "victory-dance",
  ],

  /* — Golpes pesados ————————————————————————————— */
  slam: [
    "slam",
    "body-slam",
    "take-down",
    "double-edge",
    "headbutt",
    "zen-headbutt",
    "iron-head",
    "skull-bash",
    "head-smash",
    "head-charge",
    "heavy-slam",
    "heat-crash",
    "body-press",
    "behemoth-bash",
    "strength",
    "thrash",
    "rage",
    "raging-fury",
    "raging-bull",
    "wave-crash",
    "wild-charge",
    "volt-tackle",
    "flare-blitz",
    "brave-bird",
    "collision-course",
    "electro-drift",
    "headlong-rush",
    "heart-stamp",
    "iron-tail",
    "aqua-tail",
    "poison-tail",
    "dragon-tail",
    "power-whip",
    "vine-whip",
    "liquidation",
    "waterfall",
    "crabhammer",
    "rock-smash",
    "rock-climb",
    "dragon-rush",
    "zing-zap",
    "spirit-break",
    "psyshield-bash",
    "shadow-force",
    "phantom-force",
    "guardian-of-alola",
    "max-strike",
    "blazing-torque",
    "combat-torque",
    "wicked-torque",
    "drum-beating",
    "fire-lash",
    "outrage",
    "sizzly-slide",
  ],

  /* — Picados ————————————————————————————————————— */
  dive: [
    "fly",
    "bounce",
    "sky-attack",
    "sky-drop",
    "acrobatics",
    "dive",
    "dragon-ascent",
    "floaty-fall",
    "splishy-splash",
    "dig",
  ],

  /* — Sacudidas del campo ————————————————————————— */
  quake: [
    "earthquake",
    "magnitude",
    "bulldoze",
    "fissure",
    "stomping-tantrum",
    "lands-wrath",
    "thousand-waves",
    "scorching-sands",
    "max-quake",
    "tectonic-rage--physical",
    "tectonic-rage--special",
  ],

  /* — Paredes de agua ————————————————————————————— */
  wave: [
    "surf",
    "muddy-water",
    "water-spout",
    "brine",
    "sludge-wave",
    "bouncy-bubble",
    "water-pledge",
    "fire-pledge",
    "grass-pledge",
    "dragon-energy",
    "ruination",
    "natures-madness",
    "max-geyser",
    "max-overgrowth",
    "oceanic-operetta",
    "hydro-vortex--physical",
    "hydro-vortex--special",
  ],

  /* — Remolinos ——————————————————————————————————— */
  swirl: [
    "twister",
    "whirlwind",
    "gust",
    "hurricane",
    "fire-spin",
    "whirlpool",
    "sand-tomb",
    "magma-storm",
    "icy-wind",
    "silver-wind",
    "ominous-wind",
    "fairy-wind",
    "sparkly-swirl",
    "leaf-tornado",
    "leaf-storm",
    "petal-dance",
    "fiery-dance",
    "fiery-wrath",
    "bleakwind-storm",
    "sandsear-storm",
    "springtide-storm",
    "defog",
    "max-wyrmwind",
    "shadow-storm",
    "max-airstream",
    "max-flare",
    "max-lightning",
  ],

  /* — Púas que se levantan ————————————————————————— */
  spire: [
    "stone-edge",
    "rock-tomb",
    "precipice-blades",
    "splintered-stormshards",
    "glacial-lance",
    "continental-crush--physical",
    "continental-crush--special",
    "subzero-slammer--physical",
    "subzero-slammer--special",
  ],

  /* — El cielo entero ————————————————————————————— */
  weather: [
    "sunny-day",
    "rain-dance",
    "sandstorm",
    "hail",
    "snowscape",
    "chilly-reception",
    "shadow-sky",
  ],

  /* — El suelo encendido ————————————————————————— */
  terrain: [
    "electric-terrain",
    "grassy-terrain",
    "misty-terrain",
    "psychic-terrain",
    "mud-sport",
    "water-sport",
    "tailwind",
    "mat-block",
    "court-change",
    "tidy-up",
    "camouflage",
  ],

  /* — Trampas sembradas ————————————————————————— */
  hazard: [
    "spikes",
    "toxic-spikes",
    "stealth-rock",
    "sticky-web",
    "leech-seed",
    "salt-cure",
    "tar-shot",
    "corrosive-gas",
    "grass-knot",
  ],

  /* — El espacio retorcido ————————————————————————— */
  warp: [
    "teleport",
    "trick-room",
    "magic-room",
    "wonder-room",
    "gravity",
    "hyperspace-hole",
    "ally-switch",
    "topsy-turvy",
    "baton-pass",
    "shed-tail",
    "transform",
    "conversion",
    "conversion-2",
    "reflect-type",
    "doodle",
    "skill-swap",
    "heart-swap",
    "power-swap",
    "guard-swap",
    "speed-swap",
    "power-split",
    "guard-split",
    "power-trick",
    "switcheroo",
    "trick",
    "role-play",
    "entrainment",
    "mimic",
    "sketch",
    "copycat",
    "mirror-move",
    "me-first",
    "assist",
    "metronome",
    "sleep-talk",
    "recycle",
    "snatch",
    "magic-coat",
    "instruct",
    "after-you",
    "quash",
    "spotlight",
    "follow-me",
    "rage-powder",
    "genesis-supernova",
    "black-hole-eclipse--physical",
    "black-hole-eclipse--special",
  ],

  /* — Sonido ——————————————————————————————————————— */
  sound: [
    "growl",
    "roar",
    "sing",
    "supersonic",
    "screech",
    "snore",
    "uproar",
    "hyper-voice",
    "perish-song",
    "metal-sound",
    "grass-whistle",
    "bug-buzz",
    "chatter",
    "round",
    "echoed-voice",
    "relic-song",
    "snarl",
    "disarming-voice",
    "boomburst",
    "noble-roar",
    "confide",
    "overdrive",
    "clangorous-soul",
    "alluring-voice",
    "psychic-noise",
    "dragon-cheer",
    "howl",
    "order-up",
    "shadow-rave",
    "roar-of-time",
    "sparkling-aria",
    "clanging-scales",
    "heal-bell",
  ],

  /* — Pantalla en blanco ————————————————————————— */
  nuke: [
    "hyper-beam",
    "giga-impact",
    "blast-burn",
    "hydro-cannon",
    "frenzy-plant",
    "prismatic-laser",
    "eternabeam",
    "light-that-burns-the-sky",
    "psycho-boost",
    "doom-desire",
    "future-sight",
    "v-create",
    "eruption",
    "searing-sunraze-smash",
    "menacing-moonraze-maelstrom",
    "clangorous-soulblaze",
    "stoked-sparksurfer",
    "catastropika",
    "breakneck-blitz--physical",
    "breakneck-blitz--special",
    "all-out-pummeling--physical",
    "all-out-pummeling--special",
    "acid-downpour--physical",
    "acid-downpour--special",
    "never-ending-nightmare--physical",
    "never-ending-nightmare--special",
    "inferno-overdrive--physical",
    "inferno-overdrive--special",
    "bloom-doom--physical",
    "bloom-doom--special",
    "gigavolt-havoc--physical",
    "gigavolt-havoc--special",
    "shattered-psyche--physical",
    "shattered-psyche--special",
    "devastating-drake--physical",
    "devastating-drake--special",
    "twinkle-tackle--physical",
    "twinkle-tackle--special",
    "tera-starstorm",
    "blood-moon",
    "armor-cannon",
    "savage-spin-out--physical",
    "savage-spin-out--special",
    "corkscrew-crash--physical",
    "corkscrew-crash--special",
    "supersonic-skystrike--physical",
    "supersonic-skystrike--special",
  ],

  /* — Estallidos centrados en uno mismo ————————— */
  explode: [
    "explosion",
    "self-destruct",
    "misty-explosion",
    "final-gambit",
    "mind-blown",
    "memento",
    "shadow-end",
    "burning-jealousy",
    "temper-flare",
  ],

  /* — Robo de energía ————————————————————————————— */
  drain: [
    "absorb",
    "mega-drain",
    "giga-drain",
    "leech-life",
    "drain-punch",
    "dream-eater",
    "draining-kiss",
    "strength-sap",
    "bitter-malice",
    "infernal-parade",
    "last-respects",
    "pain-split",
    "max-phantasm",
  ],

  /* — Levitación psíquica ————————————————————————— */
  psylift: [
    "confusion",
    "psychic",
    "extrasensory",
    "psyshock",
    "psystrike",
    "telekinesis",
    "kinesis",
    "miracle-eye",
    "astral-barrage",
    "freezing-glare",
    "max-mindstorm",
  ],

  /* — Espectros ————————————————————————————————— */
  hex: [
    "night-shade",
    "lick",
    "astonish",
    "nightmare",
    "curse",
    "spite",
    "hex",
    "poltergeist",
    "trick-or-treat",
    "forests-curse",
    "shadow-hold",
    "max-darkness",
    "dark-void",
    "shadow-down",
  ],

  /* — Burbujeo y gas ————————————————————————————— */
  venom: [
    "toxic",
    "poison-gas",
    "smog",
    "sludge",
    "acid",
    "clear-smog",
    "venoshock",
    "venom-drench",
    "malignant-chain",
    "noxious-torque",
    "belch",
    "gastro-acid",
    "purify",
    "spicy-extract",
    "max-ooze",
  ],

  /* — Esporas ————————————————————————————————————— */
  powder: [
    "poison-powder",
    "stun-spore",
    "sleep-powder",
    "spore",
    "cotton-spore",
    "powder",
    "magic-powder",
    "sweet-scent",
    "smokescreen",
    "sand-attack",
    "string-shot",
    "worry-seed",
    "toxic-thread",
    "strange-steam",
    "shadow-mist",
  ],

  /* — Ataduras ————————————————————————————————————— */
  trap: [
    "bind",
    "wrap",
    "constrict",
    "infestation",
    "octolock",
    "thunder-cage",
    "snap-trap",
    "spider-web",
    "mean-look",
    "block",
    "electroweb",
    "embargo",
    "heal-block",
    "torment",
    "disable",
    "encore",
    "taunt",
  ],

  /* — Aura propia ————————————————————————————————— */
  buff: [
    "growth",
    "harden",
    "withdraw",
    "defense-curl",
    "focus-energy",
    "meditate",
    "agility",
    "amnesia",
    "acupressure",
    "bulk-up",
    "calm-mind",
    "cosmic-power",
    "iron-defense",
    "rock-polish",
    "autotomize",
    "shift-gear",
    "hone-claws",
    "coil",
    "work-up",
    "nasty-plot",
    "shell-smash",
    "stockpile",
    "belly-drum",
    "tail-glow",
    "charge",
    "ingrain",
    "magnet-rise",
    "laser-focus",
    "gear-up",
    "magnetic-flux",
    "geomancy",
    "extreme-evoboost",
    "stuff-cheeks",
    "coaching",
    "helping-hand",
    "psych-up",
    "refresh",
    "minimize",
    "double-team",
    "splash",
    "teatime",
    "flower-shield",
    "decorate",
    "take-heart",
    "shelter",
    "fillet-away",
    "sharpen",
    "quick-guard",
    "defend-order",
    "shadow-shed",
    "cotton-guard",
    "acid-armor",
    "bide",
    "destiny-bond",
    "grudge",
    "imprison",
    "no-retreat",
  ],

  /* — Aros sobre el rival ————————————————————————— */
  debuff: [
    "leer",
    "tail-whip",
    "glare",
    "scary-face",
    "charm",
    "captivate",
    "flatter",
    "swagger",
    "attract",
    "sweet-kiss",
    "lovely-kiss",
    "confuse-ray",
    "hypnosis",
    "teeter-dance",
    "play-nice",
    "baby-doll-eyes",
    "tearful-look",
    "fake-tears",
    "tickle",
    "odor-sleuth",
    "foresight",
    "mind-reader",
    "lock-on",
    "yawn",
    "psycho-shift",
    "parting-shot",
    "haze",
    "shadow-panic",
  ],

  /* — Danzas ————————————————————————————————————— */
  dance: [
    "swords-dance",
    "dragon-dance",
    "quiver-dance",
    "feather-dance",
    "lunar-dance",
  ],

  /* — Curación ————————————————————————————————————— */
  heal: [
    "recover",
    "soft-boiled",
    "rest",
    "milk-drink",
    "morning-sun",
    "synthesis",
    "moonlight",
    "roost",
    "wish",
    "heal-order",
    "slack-off",
    "shore-up",
    "floral-healing",
    "life-dew",
    "jungle-healing",
    "lunar-blessing",
    "healing-wish",
    "revival-blessing",
    "aqua-ring",
    "swallow",
    "aromatherapy",
  ],

  /* — Paneles ————————————————————————————————————— */
  screen: [
    "reflect",
    "light-screen",
    "safeguard",
    "mist",
    "aurora-veil",
    "barrier",
    "wide-guard",
    "crafty-shield",
  ],

  /* — Burbujas ————————————————————————————————————— */
  shield: [
    "protect",
    "detect",
    "endure",
    "kings-shield",
    "spiky-shield",
    "baneful-bunker",
    "obstruct",
    "substitute",
    "max-guard",
    "silk-trap",
    "burning-bulwark",
    "shell-trap",
  ],
};

/**
 * Índice plano del catálogo, construido una vez al cargar el módulo.
 *
 * Un movimiento repetido en dos secciones es un fallo de curación —dos
 * animaciones para el mismo ataque—, así que se detecta aquí y no meses
 * después viendo un Rayo que sale como un mordisco.
 */
const BY_SLUG: ReadonlyMap<string, Choreography> = (() => {
  const map = new Map<string, Choreography>();
  for (const [fx, slugs] of Object.entries(CATALOGUE) as [
    Choreography,
    readonly string[],
  ][]) {
    for (const slug of slugs) {
      const clash = map.get(slug);
      if (clash && clash !== fx) {
        throw new Error(
          `move-fx: "${slug}" está en dos coreografías (${clash} y ${fx})`,
        );
      }
      map.set(slug, fx);
    }
  }
  return map;
})();

/**
 * Familias por nombre, para lo que no esté en el catálogo.
 *
 * PokéAPI estrena movimientos con cada generación y el nombre casi siempre
 * dice cómo se ve: si acaba en `-punch` es un puñetazo y si lleva `-fang`
 * muerde. Es la red que hace que un movimiento nuevo salga animado el día
 * que aparezca, sin tocar nada.
 *
 * El orden importa: gana la primera que encaje, así que lo específico va
 * antes que lo general — `-drain-punch` es un drenaje y no un puñetazo.
 */
const PATTERNS: readonly (readonly [RegExp, Choreography])[] = [
  [/z-move|--(physical|special)$/, "nuke"],
  [/drain|leech|absorb|sap$/, "drain"],
  [/heal|recover|rest|blessing|soothe/, "heal"],
  [/spore|powder|scent|smoke/, "powder"],
  [/dance$/, "dance"],
  [/terrain$/, "terrain"],
  [/-punch$|^punch|fist|knuckle|hammer/, "punch"],
  [/kick|stomp|sweep|axel|trample/, "kick"],
  [/fang|bite|chomp|maul|jaw/, "bite"],
  [/slash|cut$|cutter|blade|claw|scissor|sword|edge$|swipe|cleave|lariat/, "slash"],
  [/drill|horn|peck|sting|spike$|lance|needle|impale/, "pierce"],
  [/spin|roll|wheel|whirl(?!wind|pool)|twirl/, "spin"],
  [/beam$|breath|flamethrower|cannon$|laser/, "beam"],
  [/pulse$|sphere|wave$(?!-crash)/, "pulse"],
  [/bolt|thunder|volt|shock|electr|spark|zap/, "bolt"],
  [/ball$|bomb$|shot$|orb|missile|projectile/, "orb"],
  [/storm$|tornado|cyclone|vortex|typhoon/, "swirl"],
  [/quake|fissure|tremor|earth/, "quake"],
  [/meteor|fall$|rain$|shower/, "meteor"],
  [/voice|song|cry|roar|screech|noise|sound|shout|buzz|chant/, "sound"],
  [/shield|bunker|guard$|protect|bulwark/, "shield"],
  [/screen|veil|reflect|barrier|safeguard/, "screen"],
  [/slam|smash|press|crash|charge$|rush$|tackle|bash|impact/, "slam"],
  [/curse|shadow|phantom|spectral|ghost|haunt|nightmare/, "hex"],
  [/toxic|poison|venom|acid|sludge|gas$|goo/, "venom"],
  [/psy|psych|mind|telekin/, "psylift"],
  [/gleam|shine|flash|glow|dazzl|light$|luster/, "gleam"],
  [/explo|detonat|burst$|self-destruct/, "explode"],
  [/bind|wrap|trap|lock$|cage|web|net|snare/, "trap"],
  [/surf|water-spout|deluge|flood|tide/, "wave"],
  [/dive|fly$|flight|aerial|sky|wing|soar/, "dive"],
];

/** Tipos que se leen como aliento y no como proyectil. */
const BREATH_TYPES = new Set(["fire", "water", "ice", "dragon", "normal", "steel"]);

/** Qué le toca a un movimiento que no está en ninguna lista. */
function fallbackFor(
  type: string,
  damageClass: string,
  selfTarget: boolean,
): Choreography {
  if (damageClass === "status") return selfTarget ? "buff" : "debuff";
  if (damageClass === "physical") return "contact";
  if (type === "electric") return "bolt";
  return BREATH_TYPES.has(type) ? "beam" : "orb";
}

/**
 * La coreografía de un movimiento: catálogo curado primero, familias por
 * nombre después y reparto por tipo como último recurso.
 *
 * `selfTarget` solo decide entre aura propia y aros sobre el rival cuando no
 * hay nada mejor: un movimiento del catálogo ya trae escrito a quién apunta.
 */
export function choreographyFor(
  slug: string,
  type: string,
  damageClass: string,
  selfTarget = false,
): Choreography {
  const curated = BY_SLUG.get(slug);
  if (curated) return curated;
  for (const [pattern, fx] of PATTERNS) {
    if (pattern.test(slug)) return fx;
  }
  return fallbackFor(type, damageClass, selfTarget);
}

/* ------------------------------------------------------------------ */
/* Firma propia de cada movimiento                                     */
/* ------------------------------------------------------------------ */

/**
 * Lo que hace que dos movimientos de la MISMA coreografía no se vean iguales.
 *
 * La coreografía dice «esto es un chorro que sale de la boca»; la firma dice
 * que Ascuas es un chorrillo corto y Llamarada un fogonazo que llena media
 * arena. Sin esto, Ascuas, Lanzallamas y Llamarada salían calcados, que es
 * justo lo que en los juegos no pasa.
 *
 * El peso NO se escribe aquí salvo excepción: sale de la potencia real del
 * movimiento, que el combate ya conoce (`BattleMove.power`). Aquí van solo
 * las tres cosas que no se pueden deducir de los números.
 */
export interface MoveSignature {
  /** Golpes que se ven, para los multigolpe. Doble Patada 2, Triple Axel 3. */
  hits?: number;
  /**
   * Paleta propia, para los que en los juegos NO van del color de su tipo.
   *
   * Es la corrección de fidelidad que más se nota: Hiperrayo es Normal, y de
   * ir del gris de su tipo saldría un chorro de ceniza en vez del haz naranja
   * que todo el mundo tiene en la cabeza.
   */
  tint?: Tint;
  /** Ritmo: <1 va más seco (prioridad), >1 más pesado y lento. */
  tempo?: number;
  /** Peso visual, solo cuando la potencia listada no lo refleja. */
  power?: number;
}

type Tint = readonly [string, string, string];

/**
 * Las paletas que se repiten, oscuro → medio → caliente, igual que `TYPE_FX`.
 * Tenerlas con nombre evita que el mismo naranja de Hiperrayo se escriba
 * distinto en Gigaimpacto.
 */
const TINT = {
  white: ["#64748b", "#e2e8f0", "#ffffff"],
  gold: ["#b45309", "#fbbf24", "#fffbeb"],
  orange: ["#c2410c", "#fb923c", "#ffedd5"],
  blueFire: ["#1e3a8a", "#60a5fa", "#dbeafe"],
  crimson: ["#7f1d1d", "#ef4444", "#fee2e2"],
  violet: ["#4c1d95", "#a78bfa", "#f5f3ff"],
  void: ["#020617", "#312e81", "#818cf8"],
  prism: ["#7c3aed", "#22d3ee", "#ffffff"],
  emerald: ["#065f46", "#34d399", "#ecfdf5"],
  rose: ["#9d174d", "#fb7185", "#fff1f2"],
  cyan: ["#0e7490", "#22d3ee", "#ecfeff"],
} as const satisfies Record<string, Tint>;

/** Prioridad: entran y salen antes de que te dé tiempo a verlos. */
const SNAP = 0.7;
/** Los que se toman su tiempo: carga larga o remate de combate. */
const HEAVY = 1.3;

/**
 * Multigolpe, con el número de golpes que dan en los juegos.
 *
 * Son los de `max_hits` de PokéAPI (los 2-5 se animan a 5, que es como se
 * recuerdan) más los que la API no marca pero golpean varias veces.
 */
const HITS: Record<string, number> = {
  "double-slap": 5,
  "comet-punch": 5,
  "fury-attack": 5,
  "fury-swipes": 5,
  "pin-missile": 5,
  "spike-cannon": 5,
  barrage: 5,
  "arm-thrust": 5,
  "bullet-seed": 5,
  "icicle-spear": 5,
  "rock-blast": 5,
  "bone-rush": 5,
  "tail-slap": 5,
  "water-shuriken": 5,
  "scale-shot": 5,
  "beat-up": 6,
  "population-bomb": 10,
  "triple-kick": 3,
  "triple-axel": 3,
  "triple-dive": 3,
  "triple-arrows": 3,
  "surging-strikes": 3,
  "double-kick": 2,
  twineedle: 2,
  bonemerang: 2,
  "double-hit": 2,
  "dual-chop": 2,
  "dual-wingbeat": 2,
  "gear-grind": 2,
  "double-iron-bash": 2,
  "dragon-darts": 2,
  "twin-beam": 2,
  "double-shock": 2,
};

/**
 * Los que en los juegos no van del color de su tipo, y el ritmo de los que
 * no van a velocidad normal.
 *
 * Esta lista es puro cotejo con los juegos: Fuego Fatuo es fuego AZUL, Golpe
 * Umbrío sale blanco y no morado, y Meteoro Draco cae naranja aunque sea de
 * tipo Dragón.
 */
const SIGNATURES: Record<string, MoveSignature> = {
  /* — Remates que no son del color de su tipo ————————— */
  "hyper-beam": { tint: TINT.orange, tempo: HEAVY },
  "giga-impact": { tint: TINT.violet, tempo: HEAVY },
  "blast-burn": { tint: TINT.orange, tempo: HEAVY },
  "hydro-cannon": { tint: TINT.cyan, tempo: HEAVY },
  "frenzy-plant": { tint: TINT.emerald, tempo: HEAVY },
  "prismatic-laser": { tint: TINT.prism, tempo: HEAVY },
  "roar-of-time": { tint: TINT.violet, tempo: HEAVY },
  "spacial-rend": { tint: TINT.rose },
  eternabeam: { tint: TINT.violet, tempo: HEAVY },
  "light-that-burns-the-sky": { tint: TINT.prism, tempo: HEAVY },
  "searing-sunraze-smash": { tint: TINT.gold, tempo: HEAVY },
  "menacing-moonraze-maelstrom": { tint: TINT.violet, tempo: HEAVY },
  "photon-geyser": { tint: TINT.white },
  "moongeist-beam": { tint: TINT.white },
  "sunsteel-strike": { tint: TINT.gold },
  "v-create": { tint: TINT.crimson },
  "doom-desire": { tint: TINT.gold, tempo: HEAVY },
  "future-sight": { tint: TINT.violet, tempo: HEAVY },
  "final-gambit": { tint: TINT.white },
  "mind-blown": { tint: TINT.prism },
  "steel-beam": { tint: TINT.white },
  "armor-cannon": { tint: TINT.orange },
  "blood-moon": { tint: TINT.crimson, tempo: HEAVY },
  "tera-starstorm": { tint: TINT.prism, tempo: HEAVY },
  "10-000-000-volt-thunderbolt": { tint: TINT.prism },
  catastropika: { tint: TINT.gold },

  /* — Fuego que no es naranja —————————————————————— */
  "will-o-wisp": { tint: TINT.blueFire },
  "blue-flare": { tint: TINT.blueFire },
  "dragon-rage": { tint: TINT.blueFire },
  "sacred-fire": { tint: TINT.gold },
  "mystical-fire": { tint: TINT.rose },
  "fiery-dance": { tint: TINT.crimson },
  "torch-song": { tint: TINT.rose },
  "burn-up": { tint: TINT.crimson },
  "searing-shot": { tint: TINT.crimson },

  /* — Normales que salen de colores ————————————————— */
  swift: { tint: TINT.gold },
  "tri-attack": { tint: TINT.prism, hits: 3 },
  "extreme-speed": { tint: TINT.white, tempo: SNAP },
  "quick-attack": { tint: TINT.white, tempo: SNAP },
  "hyper-voice": { tint: TINT.white },
  boomburst: { tint: TINT.white },
  "echoed-voice": { tint: TINT.white },
  round: { tint: TINT.white },
  uproar: { tint: TINT.white },
  "metal-sound": { tint: TINT.white },
  screech: { tint: TINT.white },
  "perish-song": { tint: TINT.void },
  judgment: { tint: TINT.white },
  "techno-blast": { tint: TINT.prism },
  "multi-attack": { tint: TINT.prism },
  "hidden-power": { tint: TINT.white },
  "weather-ball": { tint: TINT.white },
  "pay-day": { tint: TINT.gold },
  present: { tint: TINT.prism },
  metronome: { tint: TINT.white },
  celebrate: { tint: TINT.prism },
  "happy-hour": { tint: TINT.gold },
  "hold-hands": { tint: TINT.prism },
  splash: { tint: TINT.cyan },
  struggle: { tint: TINT.white },
  explosion: { tint: TINT.gold, tempo: HEAVY },
  "self-destruct": { tint: TINT.gold, tempo: HEAVY },
  "sacred-sword": { tint: TINT.white },
  "secret-sword": { tint: TINT.white },
  "close-combat": { tint: TINT.white },
  "aerial-ace": { tint: TINT.white },
  "aura-sphere": { tint: TINT.cyan },
  "vacuum-wave": { tint: TINT.cyan, tempo: SNAP },
  "focus-blast": { tint: TINT.gold },
  "night-daze": { tint: TINT.crimson },
  "dark-void": { tint: TINT.void },
  memento: { tint: TINT.void },
  "destiny-bond": { tint: TINT.void },
  curse: { tint: TINT.void },
  nightmare: { tint: TINT.void },
  "shadow-force": { tint: TINT.void },
  "phantom-force": { tint: TINT.void },
  "draco-meteor": { tint: TINT.orange, tempo: HEAVY },
  aeroblast: { tint: TINT.white },
  "sheer-cold": { tint: TINT.white },
  "luster-purge": { tint: TINT.white },
  "mist-ball": { tint: TINT.rose },
  "seed-flare": { tint: TINT.emerald },
  "solar-beam": { tint: TINT.gold, tempo: HEAVY },
  "solar-blade": { tint: TINT.gold, tempo: HEAVY },
  "leaf-blade": { tint: TINT.emerald },
  "confuse-ray": { tint: TINT.gold },
  hypnosis: { tint: TINT.violet },
  supersonic: { tint: TINT.violet },
  sing: { tint: TINT.rose },
  charm: { tint: TINT.rose },
  attract: { tint: TINT.rose },
  "sweet-kiss": { tint: TINT.rose },
  "lovely-kiss": { tint: TINT.rose },
  leer: { tint: TINT.crimson },
  glare: { tint: TINT.crimson },
  swagger: { tint: TINT.crimson },
  "scary-face": { tint: TINT.violet },

  /* — Apoyo: pantallas, barreras y auras ————————————— */
  reflect: { tint: TINT.cyan },
  "light-screen": { tint: TINT.gold },
  "aurora-veil": { tint: TINT.prism },
  safeguard: { tint: TINT.emerald },
  mist: { tint: TINT.white },
  protect: { tint: TINT.cyan },
  detect: { tint: TINT.cyan },
  "kings-shield": { tint: TINT.cyan },
  "spiky-shield": { tint: TINT.emerald },
  "baneful-bunker": { tint: TINT.emerald },
  obstruct: { tint: TINT.crimson },
  substitute: { tint: TINT.white },
  endure: { tint: TINT.gold },
  counter: { tint: TINT.white },
  "mirror-coat": { tint: TINT.white },
  bide: { tint: TINT.white },
  wish: { tint: TINT.gold },
  aromatherapy: { tint: TINT.emerald },
  "heal-bell": { tint: TINT.gold },
  "healing-wish": { tint: TINT.rose },
  "lunar-dance": { tint: TINT.rose },
  "trick-room": { tint: TINT.rose },
  "wonder-room": { tint: TINT.rose },
  "magic-room": { tint: TINT.rose },
  gravity: { tint: TINT.gold },
  teleport: { tint: TINT.cyan },
  transform: { tint: TINT.prism },
  "thunder-wave": { tint: TINT.gold },

  /* — Prioridad: se ven un pestañeo ————————————————— */
  "aqua-jet": { tempo: SNAP },
  "ice-shard": { tempo: SNAP },
  "bullet-punch": { tempo: SNAP },
  "mach-punch": { tempo: SNAP },
  "shadow-sneak": { tempo: SNAP },
  accelerock: { tempo: SNAP },
  "sucker-punch": { tempo: SNAP },
  "first-impression": { tempo: SNAP },
  "fake-out": { tempo: SNAP },
  "jet-punch": { tempo: SNAP },
  thunderclap: { tempo: SNAP },
  "upper-hand": { tempo: SNAP },
  "grassy-glide": { tempo: SNAP },
  "water-shuriken": { tempo: SNAP },
  "feint": { tempo: SNAP },
  "quick-guard": { tempo: SNAP },
  "baby-doll-eyes": { tempo: SNAP },

  /* — Los que se toman su tiempo ————————————————————— */
  "focus-punch": { tempo: HEAVY },
  "skull-bash": { tempo: HEAVY },
  "sky-attack": { tempo: HEAVY },
  "meteor-beam": { tempo: HEAVY },
  "electro-shot": { tempo: HEAVY },
  geomancy: { tempo: HEAVY },
  "shell-trap": { tempo: HEAVY },
  "beak-blast": { tempo: HEAVY },
  eruption: { tempo: HEAVY },
  "water-spout": { tempo: HEAVY },
};

/**
 * La firma de un movimiento: su número de golpes, su color propio si lo
 * tiene y su ritmo. Devuelve un objeto vacío para los que van con lo que les
 * toque por tipo y potencia, que son la mayoría.
 */
export function signatureFor(slug: string): MoveSignature {
  const sig = SIGNATURES[slug];
  const hits = HITS[slug];
  if (!sig) return hits ? { hits } : EMPTY_SIGNATURE;
  return hits && sig.hits === undefined ? { ...sig, hits } : sig;
}

/** Compartido para no crear basura en cada fotograma de cada combate. */
const EMPTY_SIGNATURE: MoveSignature = {};

/** Si el movimiento está curado a mano (lo usa la auditoría de cobertura). */
export function isCurated(slug: string): boolean {
  return BY_SLUG.has(slug);
}

/** Cuántos movimientos llevan firma propia (para la auditoría). */
export function signatureCount(): { tinted: number; timed: number; multi: number } {
  const vals = Object.values(SIGNATURES);
  return {
    tinted: vals.filter((s) => s.tint).length,
    timed: vals.filter((s) => s.tempo).length,
    multi: Object.keys(HITS).length,
  };
}

/** Cuántos movimientos lleva cada coreografía (para la auditoría). */
export function catalogueSizes(): Record<string, number> {
  return Object.fromEntries(
    Object.entries(CATALOGUE).map(([fx, slugs]) => [fx, slugs.length]),
  );
}

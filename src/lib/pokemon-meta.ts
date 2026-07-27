/** Presentation metadata: type colors/labels, generation labels, sprite URLs. */

import { DEFAULT_LANG, type Lang } from "@/lib/i18n/config";

export const TYPE_LABELS_ES: Record<string, string> = {
  normal: "Normal",
  fire: "Fuego",
  water: "Agua",
  electric: "Eléctrico",
  grass: "Planta",
  ice: "Hielo",
  fighting: "Lucha",
  poison: "Veneno",
  ground: "Tierra",
  flying: "Volador",
  psychic: "Psíquico",
  bug: "Bicho",
  rock: "Roca",
  ghost: "Fantasma",
  dragon: "Dragón",
  dark: "Siniestro",
  steel: "Acero",
  fairy: "Hada",
};

/** PokéAPI slug -> Spanish label for every filterable species attribute. */
export const COLOR_LABELS_ES: Record<string, string> = {
  black: "Negro",
  blue: "Azul",
  brown: "Marrón",
  gray: "Gris",
  green: "Verde",
  pink: "Rosa",
  purple: "Morado",
  red: "Rojo",
  white: "Blanco",
  yellow: "Amarillo",
};

/** Species color slug -> swatch hex, brightened to read on the dark HUD. */
export const COLOR_SWATCH_HEX: Record<string, string> = {
  black: "#475569",
  blue: "#3b82f6",
  brown: "#b45309",
  gray: "#94a3b8",
  green: "#22c55e",
  pink: "#f472b6",
  purple: "#a855f7",
  red: "#ef4444",
  white: "#f1f5f9",
  yellow: "#facc15",
};

export const HABITAT_LABELS_ES: Record<string, string> = {
  cave: "Cueva",
  forest: "Bosque",
  grassland: "Pradera",
  mountain: "Montaña",
  rare: "Raro",
  "rough-terrain": "Terreno agreste",
  sea: "Mar",
  urban: "Urbano",
  "waters-edge": "Ribera",
};

export const SHAPE_LABELS_ES: Record<string, string> = {
  ball: "Cabeza",
  squiggle: "Serpentino",
  fish: "Pez",
  arms: "Cabeza y brazos",
  blob: "Cabeza y base",
  upright: "Bípedo con cola",
  legs: "Cabeza y piernas",
  quadruped: "Cuadrúpedo",
  wings: "Dos alas",
  tentacles: "Tentáculos",
  heads: "Varios cuerpos",
  humanoid: "Humanoide",
  "bug-wings": "Insecto alado",
  armor: "Insectoide",
};

export const EGG_GROUP_LABELS_ES: Record<string, string> = {
  monster: "Monstruo",
  water1: "Agua 1",
  water2: "Agua 2",
  water3: "Agua 3",
  bug: "Bicho",
  flying: "Volador",
  ground: "Campo",
  fairy: "Hada",
  plant: "Planta",
  humanshape: "Humanoide",
  mineral: "Mineral",
  indeterminate: "Amorfo",
  ditto: "Ditto",
  dragon: "Dragón",
  "no-eggs": "Desconocido",
};

export const CATEGORY_LABELS_ES: Record<string, string> = {
  normal: "Normal",
  baby: "Bebé",
  legendary: "Legendario",
  mythical: "Singular",
};

export const STAGE_LABELS_ES: Record<string, string> = {
  "1": "Básico",
  "2": "1ª evolución",
  "3": "2ª evolución",
  final: "Forma final",
};

export const GROWTH_LABELS_ES: Record<string, string> = {
  slow: "Lento",
  medium: "Medio",
  fast: "Rápido",
  "medium-slow": "Medio-lento",
  "slow-then-very-fast": "Errático",
  "fast-then-very-slow": "Fluctuante",
};

/** Spanish titles of the main-series games, keyed by PokéAPI version slug. */
export const VERSION_LABELS_ES: Record<string, string> = {
  red: "Rojo",
  blue: "Azul",
  yellow: "Amarillo",
  gold: "Oro",
  silver: "Plata",
  crystal: "Cristal",
  ruby: "Rubí",
  sapphire: "Zafiro",
  emerald: "Esmeralda",
  firered: "Rojo Fuego",
  leafgreen: "Verde Hoja",
  diamond: "Diamante",
  pearl: "Perla",
  platinum: "Platino",
  heartgold: "HeartGold",
  soulsilver: "SoulSilver",
  black: "Negro",
  white: "Blanco",
  "black-2": "Negro 2",
  "white-2": "Blanco 2",
  x: "X",
  y: "Y",
  "omega-ruby": "Rubí Omega",
  "alpha-sapphire": "Zafiro Alfa",
  sun: "Sol",
  moon: "Luna",
  "ultra-sun": "Ultrasol",
  "ultra-moon": "Ultraluna",
  "lets-go-pikachu": "Let's Go, Pikachu!",
  "lets-go-eevee": "Let's Go, Eevee!",
  sword: "Espada",
  shield: "Escudo",
  "brilliant-diamond": "Diamante Brillante",
  "shining-pearl": "Perla Reluciente",
  "legends-arceus": "Leyendas: Arceus",
  scarlet: "Escarlata",
  violet: "Púrpura",
  "legends-za": "Leyendas: Z-A",
};

/* ==========================================================================
 * English label sets. Same keys as the *_ES maps; helpers below pick per lang.
 * ========================================================================== */

export const TYPE_LABELS_EN: Record<string, string> = {
  normal: "Normal",
  fire: "Fire",
  water: "Water",
  electric: "Electric",
  grass: "Grass",
  ice: "Ice",
  fighting: "Fighting",
  poison: "Poison",
  ground: "Ground",
  flying: "Flying",
  psychic: "Psychic",
  bug: "Bug",
  rock: "Rock",
  ghost: "Ghost",
  dragon: "Dragon",
  dark: "Dark",
  steel: "Steel",
  fairy: "Fairy",
};

export const COLOR_LABELS_EN: Record<string, string> = {
  black: "Black",
  blue: "Blue",
  brown: "Brown",
  gray: "Gray",
  green: "Green",
  pink: "Pink",
  purple: "Purple",
  red: "Red",
  white: "White",
  yellow: "Yellow",
};

export const HABITAT_LABELS_EN: Record<string, string> = {
  cave: "Cave",
  forest: "Forest",
  grassland: "Grassland",
  mountain: "Mountain",
  rare: "Rare",
  "rough-terrain": "Rough terrain",
  sea: "Sea",
  urban: "Urban",
  "waters-edge": "Water's edge",
};

export const SHAPE_LABELS_EN: Record<string, string> = {
  ball: "Head",
  squiggle: "Serpentine",
  fish: "Fish",
  arms: "Head and arms",
  blob: "Head and base",
  upright: "Bipedal, tailed",
  legs: "Head and legs",
  quadruped: "Quadruped",
  wings: "Two wings",
  tentacles: "Tentacles",
  heads: "Multiple bodies",
  humanoid: "Humanoid",
  "bug-wings": "Winged insect",
  armor: "Insectoid",
};

export const EGG_GROUP_LABELS_EN: Record<string, string> = {
  monster: "Monster",
  water1: "Water 1",
  water2: "Water 2",
  water3: "Water 3",
  bug: "Bug",
  flying: "Flying",
  ground: "Field",
  fairy: "Fairy",
  plant: "Grass",
  humanshape: "Human-Like",
  mineral: "Mineral",
  indeterminate: "Amorphous",
  ditto: "Ditto",
  dragon: "Dragon",
  "no-eggs": "Undiscovered",
};

export const CATEGORY_LABELS_EN: Record<string, string> = {
  normal: "Normal",
  baby: "Baby",
  legendary: "Legendary",
  mythical: "Mythical",
};

export const STAGE_LABELS_EN: Record<string, string> = {
  "1": "Basic",
  "2": "Stage 1",
  "3": "Stage 2",
  final: "Final form",
};

export const GROWTH_LABELS_EN: Record<string, string> = {
  slow: "Slow",
  medium: "Medium",
  fast: "Fast",
  "medium-slow": "Medium slow",
  "slow-then-very-fast": "Erratic",
  "fast-then-very-slow": "Fluctuating",
};

/** English titles of the main-series games, keyed by PokéAPI version slug. */
export const VERSION_LABELS_EN: Record<string, string> = {
  red: "Red",
  blue: "Blue",
  yellow: "Yellow",
  gold: "Gold",
  silver: "Silver",
  crystal: "Crystal",
  ruby: "Ruby",
  sapphire: "Sapphire",
  emerald: "Emerald",
  firered: "FireRed",
  leafgreen: "LeafGreen",
  diamond: "Diamond",
  pearl: "Pearl",
  platinum: "Platinum",
  heartgold: "HeartGold",
  soulsilver: "SoulSilver",
  black: "Black",
  white: "White",
  "black-2": "Black 2",
  "white-2": "White 2",
  x: "X",
  y: "Y",
  "omega-ruby": "Omega Ruby",
  "alpha-sapphire": "Alpha Sapphire",
  sun: "Sun",
  moon: "Moon",
  "ultra-sun": "Ultra Sun",
  "ultra-moon": "Ultra Moon",
  "lets-go-pikachu": "Let's Go, Pikachu!",
  "lets-go-eevee": "Let's Go, Eevee!",
  sword: "Sword",
  shield: "Shield",
  "brilliant-diamond": "Brilliant Diamond",
  "shining-pearl": "Shining Pearl",
  "legends-arceus": "Legends: Arceus",
  scarlet: "Scarlet",
  violet: "Violet",
  "legends-za": "Legends: Z-A",
};

/* ==========================================================================
 * French label sets.
 * ========================================================================== */

export const TYPE_LABELS_FR: Record<string, string> = {
  normal: "Normal",
  fire: "Feu",
  water: "Eau",
  electric: "Électrik",
  grass: "Plante",
  ice: "Glace",
  fighting: "Combat",
  poison: "Poison",
  ground: "Sol",
  flying: "Vol",
  psychic: "Psy",
  bug: "Insecte",
  rock: "Roche",
  ghost: "Spectre",
  dragon: "Dragon",
  dark: "Ténèbres",
  steel: "Acier",
  fairy: "Fée",
};

export const COLOR_LABELS_FR: Record<string, string> = {
  black: "Noir",
  blue: "Bleu",
  brown: "Brun",
  gray: "Gris",
  green: "Vert",
  pink: "Rose",
  purple: "Violet",
  red: "Rouge",
  white: "Blanc",
  yellow: "Jaune",
};

export const HABITAT_LABELS_FR: Record<string, string> = {
  cave: "Grotte",
  forest: "Forêt",
  grassland: "Prairie",
  mountain: "Montagne",
  rare: "Rare",
  "rough-terrain": "Terrain accidenté",
  sea: "Mer",
  urban: "Urbain",
  "waters-edge": "Bord de l'eau",
};

export const SHAPE_LABELS_FR: Record<string, string> = {
  ball: "Tête",
  squiggle: "Serpentin",
  fish: "Poisson",
  arms: "Tête et bras",
  blob: "Tête et base",
  upright: "Bipède à queue",
  legs: "Tête et jambes",
  quadruped: "Quadrupède",
  wings: "Deux ailes",
  tentacles: "Tentacules",
  heads: "Corps multiples",
  humanoid: "Humanoïde",
  "bug-wings": "Insecte ailé",
  armor: "Insectoïde",
};

export const EGG_GROUP_LABELS_FR: Record<string, string> = {
  monster: "Monstrueux",
  water1: "Aquatique 1",
  water2: "Aquatique 2",
  water3: "Aquatique 3",
  bug: "Insectoïde",
  flying: "Aérien",
  ground: "Terrestre",
  fairy: "Féerique",
  plant: "Végétal",
  humanshape: "Humanoïde",
  mineral: "Minéral",
  indeterminate: "Amorphe",
  ditto: "Métamorph",
  dragon: "Draconique",
  "no-eggs": "Inconnu",
};

export const CATEGORY_LABELS_FR: Record<string, string> = {
  normal: "Normal",
  baby: "Bébé",
  legendary: "Légendaire",
  mythical: "Fabuleux",
};

export const STAGE_LABELS_FR: Record<string, string> = {
  "1": "De base",
  "2": "1re évolution",
  "3": "2e évolution",
  final: "Forme finale",
};

export const GROWTH_LABELS_FR: Record<string, string> = {
  slow: "Lente",
  medium: "Moyenne",
  fast: "Rapide",
  "medium-slow": "Parabolique",
  "slow-then-very-fast": "Erratique",
  "fast-then-very-slow": "Fluctuante",
};

/** French titles of the main-series games, keyed by PokéAPI version slug. */
export const VERSION_LABELS_FR: Record<string, string> = {
  red: "Rouge",
  blue: "Bleue",
  yellow: "Jaune",
  gold: "Or",
  silver: "Argent",
  crystal: "Cristal",
  ruby: "Rubis",
  sapphire: "Saphir",
  emerald: "Émeraude",
  firered: "Rouge Feu",
  leafgreen: "Vert Feuille",
  diamond: "Diamant",
  pearl: "Perle",
  platinum: "Platine",
  heartgold: "Or HeartGold",
  soulsilver: "Argent SoulSilver",
  black: "Noire",
  white: "Blanche",
  "black-2": "Noire 2",
  "white-2": "Blanche 2",
  x: "X",
  y: "Y",
  "omega-ruby": "Rubis Oméga",
  "alpha-sapphire": "Saphir Alpha",
  sun: "Soleil",
  moon: "Lune",
  "ultra-sun": "Ultra-Soleil",
  "ultra-moon": "Ultra-Lune",
  "lets-go-pikachu": "Let's Go, Pikachu",
  "lets-go-eevee": "Let's Go, Évoli",
  sword: "Épée",
  shield: "Bouclier",
  "brilliant-diamond": "Diamant Étincelant",
  "shining-pearl": "Perle Scintillante",
  "legends-arceus": "Légendes : Arceus",
  scarlet: "Écarlate",
  violet: "Violet",
  "legends-za": "Légendes : Z-A",
};

/* ==========================================================================
 * German label sets.
 * ========================================================================== */

export const TYPE_LABELS_DE: Record<string, string> = {
  normal: "Normal",
  fire: "Feuer",
  water: "Wasser",
  electric: "Elektro",
  grass: "Pflanze",
  ice: "Eis",
  fighting: "Kampf",
  poison: "Gift",
  ground: "Boden",
  flying: "Flug",
  psychic: "Psycho",
  bug: "Käfer",
  rock: "Gestein",
  ghost: "Geist",
  dragon: "Drache",
  dark: "Unlicht",
  steel: "Stahl",
  fairy: "Fee",
};

export const COLOR_LABELS_DE: Record<string, string> = {
  black: "Schwarz",
  blue: "Blau",
  brown: "Braun",
  gray: "Grau",
  green: "Grün",
  pink: "Rosa",
  purple: "Violett",
  red: "Rot",
  white: "Weiß",
  yellow: "Gelb",
};

export const HABITAT_LABELS_DE: Record<string, string> = {
  cave: "Höhle",
  forest: "Wald",
  grassland: "Grasland",
  mountain: "Gebirge",
  rare: "Selten",
  "rough-terrain": "Unwegsames Gelände",
  sea: "Meer",
  urban: "Stadt",
  "waters-edge": "Ufer",
};

export const SHAPE_LABELS_DE: Record<string, string> = {
  ball: "Kopf",
  squiggle: "Schlangenförmig",
  fish: "Fisch",
  arms: "Kopf und Arme",
  blob: "Kopf und Basis",
  upright: "Zweibeinig mit Schweif",
  legs: "Kopf und Beine",
  quadruped: "Vierbeiner",
  wings: "Zwei Flügel",
  tentacles: "Tentakel",
  heads: "Mehrere Körper",
  humanoid: "Humanoid",
  "bug-wings": "Geflügeltes Insekt",
  armor: "Insektoid",
};

export const EGG_GROUP_LABELS_DE: Record<string, string> = {
  monster: "Monster",
  water1: "Wasser 1",
  water2: "Wasser 2",
  water3: "Wasser 3",
  bug: "Käfer",
  flying: "Flug",
  ground: "Feld",
  fairy: "Fee",
  plant: "Pflanze",
  humanshape: "Humanotyp",
  mineral: "Mineral",
  indeterminate: "Amorph",
  ditto: "Ditto",
  dragon: "Drache",
  "no-eggs": "Unbekannt",
};

export const CATEGORY_LABELS_DE: Record<string, string> = {
  normal: "Normal",
  baby: "Baby",
  legendary: "Legendär",
  mythical: "Mysteriös",
};

export const STAGE_LABELS_DE: Record<string, string> = {
  "1": "Basis",
  "2": "1. Entwicklung",
  "3": "2. Entwicklung",
  final: "Endform",
};

export const GROWTH_LABELS_DE: Record<string, string> = {
  slow: "Langsam",
  medium: "Mittelschnell",
  fast: "Schnell",
  "medium-slow": "Mittellangsam",
  "slow-then-very-fast": "Unregelmäßig",
  "fast-then-very-slow": "Schwankend",
};

/** German titles of the main-series games, keyed by PokéAPI version slug. */
export const VERSION_LABELS_DE: Record<string, string> = {
  red: "Rot",
  blue: "Blau",
  yellow: "Gelb",
  gold: "Gold",
  silver: "Silber",
  crystal: "Kristall",
  ruby: "Rubin",
  sapphire: "Saphir",
  emerald: "Smaragd",
  firered: "Feuerrot",
  leafgreen: "Blattgrün",
  diamond: "Diamant",
  pearl: "Perl",
  platinum: "Platin",
  heartgold: "HeartGold",
  soulsilver: "SoulSilver",
  black: "Schwarz",
  white: "Weiß",
  "black-2": "Schwarz 2",
  "white-2": "Weiß 2",
  x: "X",
  y: "Y",
  "omega-ruby": "Omega Rubin",
  "alpha-sapphire": "Alpha Saphir",
  sun: "Sonne",
  moon: "Mond",
  "ultra-sun": "Ultrasonne",
  "ultra-moon": "Ultramond",
  "lets-go-pikachu": "Let's Go, Pikachu!",
  "lets-go-eevee": "Let's Go, Evoli!",
  sword: "Schwert",
  shield: "Schild",
  "brilliant-diamond": "Strahlender Diamant",
  "shining-pearl": "Leuchtende Perle",
  "legends-arceus": "Legenden: Arceus",
  scarlet: "Karmesin",
  violet: "Purpur",
  "legends-za": "Legenden: Z-A",
};

/* ==========================================================================
 * Italian label sets.
 * ========================================================================== */

export const TYPE_LABELS_IT: Record<string, string> = {
  normal: "Normale",
  fire: "Fuoco",
  water: "Acqua",
  electric: "Elettro",
  grass: "Erba",
  ice: "Ghiaccio",
  fighting: "Lotta",
  poison: "Veleno",
  ground: "Terra",
  flying: "Volante",
  psychic: "Psico",
  bug: "Coleottero",
  rock: "Roccia",
  ghost: "Spettro",
  dragon: "Drago",
  dark: "Buio",
  steel: "Acciaio",
  fairy: "Folletto",
};

export const COLOR_LABELS_IT: Record<string, string> = {
  black: "Nero",
  blue: "Blu",
  brown: "Marrone",
  gray: "Grigio",
  green: "Verde",
  pink: "Rosa",
  purple: "Viola",
  red: "Rosso",
  white: "Bianco",
  yellow: "Giallo",
};

export const HABITAT_LABELS_IT: Record<string, string> = {
  cave: "Grotta",
  forest: "Foresta",
  grassland: "Prateria",
  mountain: "Montagna",
  rare: "Raro",
  "rough-terrain": "Terreno impervio",
  sea: "Mare",
  urban: "Urbano",
  "waters-edge": "Riva",
};

export const SHAPE_LABELS_IT: Record<string, string> = {
  ball: "Testa",
  squiggle: "Serpentino",
  fish: "Pesce",
  arms: "Testa e braccia",
  blob: "Testa e base",
  upright: "Bipede con coda",
  legs: "Testa e gambe",
  quadruped: "Quadrupede",
  wings: "Due ali",
  tentacles: "Tentacoli",
  heads: "Corpi multipli",
  humanoid: "Umanoide",
  "bug-wings": "Insetto alato",
  armor: "Insettoide",
};

export const EGG_GROUP_LABELS_IT: Record<string, string> = {
  monster: "Mostro",
  water1: "Acqua 1",
  water2: "Acqua 2",
  water3: "Acqua 3",
  bug: "Coleottero",
  flying: "Volante",
  ground: "Campo",
  fairy: "Magico",
  plant: "Erba",
  humanshape: "Umanoide",
  mineral: "Minerale",
  indeterminate: "Amorfo",
  ditto: "Ditto",
  dragon: "Drago",
  "no-eggs": "Sconosciuto",
};

export const CATEGORY_LABELS_IT: Record<string, string> = {
  normal: "Normale",
  baby: "Baby",
  legendary: "Leggendario",
  mythical: "Misterioso",
};

export const STAGE_LABELS_IT: Record<string, string> = {
  "1": "Base",
  "2": "1ª evoluzione",
  "3": "2ª evoluzione",
  final: "Forma finale",
};

export const GROWTH_LABELS_IT: Record<string, string> = {
  slow: "Lenta",
  medium: "Media",
  fast: "Veloce",
  "medium-slow": "Medio-lenta",
  "slow-then-very-fast": "Erratica",
  "fast-then-very-slow": "Fluttuante",
};

/** Italian titles of the main-series games, keyed by PokéAPI version slug. */
export const VERSION_LABELS_IT: Record<string, string> = {
  red: "Rosso",
  blue: "Blu",
  yellow: "Giallo",
  gold: "Oro",
  silver: "Argento",
  crystal: "Cristallo",
  ruby: "Rubino",
  sapphire: "Zaffiro",
  emerald: "Smeraldo",
  firered: "Rosso Fuoco",
  leafgreen: "Verde Foglia",
  diamond: "Diamante",
  pearl: "Perla",
  platinum: "Platino",
  heartgold: "HeartGold",
  soulsilver: "SoulSilver",
  black: "Nero",
  white: "Bianco",
  "black-2": "Nero 2",
  "white-2": "Bianco 2",
  x: "X",
  y: "Y",
  "omega-ruby": "Rubino Omega",
  "alpha-sapphire": "Zaffiro Alpha",
  sun: "Sole",
  moon: "Luna",
  "ultra-sun": "Ultrasole",
  "ultra-moon": "Ultraluna",
  "lets-go-pikachu": "Let's Go, Pikachu!",
  "lets-go-eevee": "Let's Go, Eevee!",
  sword: "Spada",
  shield: "Scudo",
  "brilliant-diamond": "Diamante Lucente",
  "shining-pearl": "Perla Splendente",
  "legends-arceus": "Leggende: Arceus",
  scarlet: "Scarlatto",
  violet: "Violetto",
  "legends-za": "Leggende: Z-A",
};

/* ==========================================================================
 * Japanese label sets.
 * ========================================================================== */

export const TYPE_LABELS_JA: Record<string, string> = {
  normal: "ノーマル",
  fire: "ほのお",
  water: "みず",
  electric: "でんき",
  grass: "くさ",
  ice: "こおり",
  fighting: "かくとう",
  poison: "どく",
  ground: "じめん",
  flying: "ひこう",
  psychic: "エスパー",
  bug: "むし",
  rock: "いわ",
  ghost: "ゴースト",
  dragon: "ドラゴン",
  dark: "あく",
  steel: "はがね",
  fairy: "フェアリー",
};

export const COLOR_LABELS_JA: Record<string, string> = {
  black: "くろ",
  blue: "あお",
  brown: "ちゃいろ",
  gray: "はいいろ",
  green: "みどり",
  pink: "ピンク",
  purple: "むらさき",
  red: "あか",
  white: "しろ",
  yellow: "きいろ",
};

export const HABITAT_LABELS_JA: Record<string, string> = {
  cave: "洞窟",
  forest: "森",
  grassland: "草原",
  mountain: "山",
  rare: "珍しい",
  "rough-terrain": "荒れ地",
  sea: "海",
  urban: "街",
  "waters-edge": "水辺",
};

export const SHAPE_LABELS_JA: Record<string, string> = {
  ball: "頭だけ",
  squiggle: "ヘビ型",
  fish: "魚型",
  arms: "頭と腕",
  blob: "頭と胴",
  upright: "尻尾のある二足",
  legs: "頭と足",
  quadruped: "四足",
  wings: "二枚の翼",
  tentacles: "触手",
  heads: "複数の体",
  humanoid: "人型",
  "bug-wings": "羽のある虫",
  armor: "昆虫型",
};

export const EGG_GROUP_LABELS_JA: Record<string, string> = {
  monster: "怪獣",
  water1: "水中1",
  water2: "水中2",
  water3: "水中3",
  bug: "虫",
  flying: "飛行",
  ground: "陸上",
  fairy: "妖精",
  plant: "植物",
  humanshape: "人型",
  mineral: "鉱物",
  indeterminate: "不定形",
  ditto: "メタモン",
  dragon: "ドラゴン",
  "no-eggs": "未発見",
};

export const CATEGORY_LABELS_JA: Record<string, string> = {
  normal: "通常",
  baby: "ベイビィ",
  legendary: "伝説",
  mythical: "幻",
};

export const STAGE_LABELS_JA: Record<string, string> = {
  "1": "基本",
  "2": "1進化",
  "3": "2進化",
  final: "最終形態",
};

export const GROWTH_LABELS_JA: Record<string, string> = {
  slow: "遅い",
  medium: "普通",
  fast: "速い",
  "medium-slow": "やや遅い",
  "slow-then-very-fast": "不安定",
  "fast-then-very-slow": "変動",
};

/** Japanese titles of the main-series games, keyed by PokéAPI version slug. */
export const VERSION_LABELS_JA: Record<string, string> = {
  red: "赤",
  blue: "緑",
  yellow: "ピカチュウ",
  gold: "金",
  silver: "銀",
  crystal: "クリスタル",
  ruby: "ルビー",
  sapphire: "サファイア",
  emerald: "エメラルド",
  firered: "ファイアレッド",
  leafgreen: "リーフグリーン",
  diamond: "ダイヤモンド",
  pearl: "パール",
  platinum: "プラチナ",
  heartgold: "ハートゴールド",
  soulsilver: "ソウルシルバー",
  black: "ブラック",
  white: "ホワイト",
  "black-2": "ブラック2",
  "white-2": "ホワイト2",
  x: "X",
  y: "Y",
  "omega-ruby": "オメガルビー",
  "alpha-sapphire": "アルファサファイア",
  sun: "サン",
  moon: "ムーン",
  "ultra-sun": "ウルトラサン",
  "ultra-moon": "ウルトラムーン",
  "lets-go-pikachu": "Let's Go! ピカチュウ",
  "lets-go-eevee": "Let's Go! イーブイ",
  sword: "ソード",
  shield: "シールド",
  "brilliant-diamond": "ブリリアントダイヤモンド",
  "shining-pearl": "シャイニングパール",
  "legends-arceus": "LEGENDS アルセウス",
  scarlet: "スカーレット",
  violet: "バイオレット",
  "legends-za": "LEGENDS Z-A",
};

/* ==========================================================================
 * Korean label sets.
 * ========================================================================== */

export const TYPE_LABELS_KO: Record<string, string> = {
  normal: "노말",
  fire: "불꽃",
  water: "물",
  electric: "전기",
  grass: "풀",
  ice: "얼음",
  fighting: "격투",
  poison: "독",
  ground: "땅",
  flying: "비행",
  psychic: "에스퍼",
  bug: "벌레",
  rock: "바위",
  ghost: "고스트",
  dragon: "드래곤",
  dark: "악",
  steel: "강철",
  fairy: "페어리",
};

export const COLOR_LABELS_KO: Record<string, string> = {
  black: "검은색",
  blue: "파란색",
  brown: "갈색",
  gray: "회색",
  green: "초록색",
  pink: "분홍색",
  purple: "보라색",
  red: "빨간색",
  white: "하얀색",
  yellow: "노란색",
};

export const HABITAT_LABELS_KO: Record<string, string> = {
  cave: "동굴",
  forest: "숲",
  grassland: "초원",
  mountain: "산",
  rare: "희귀",
  "rough-terrain": "거친 지형",
  sea: "바다",
  urban: "도시",
  "waters-edge": "물가",
};

export const SHAPE_LABELS_KO: Record<string, string> = {
  ball: "머리",
  squiggle: "뱀 형태",
  fish: "물고기",
  arms: "머리와 팔",
  blob: "머리와 몸통",
  upright: "꼬리 있는 두 발",
  legs: "머리와 다리",
  quadruped: "네 발",
  wings: "두 날개",
  tentacles: "촉수",
  heads: "여러 개의 몸",
  humanoid: "인간형",
  "bug-wings": "날개 달린 곤충",
  armor: "곤충형",
};

export const EGG_GROUP_LABELS_KO: Record<string, string> = {
  monster: "괴수",
  water1: "수중1",
  water2: "수중2",
  water3: "수중3",
  bug: "벌레",
  flying: "비행",
  ground: "육상",
  fairy: "요정",
  plant: "식물",
  humanshape: "인간형",
  mineral: "광물",
  indeterminate: "부정형",
  ditto: "메타몽",
  dragon: "드래곤",
  "no-eggs": "미발견",
};

export const CATEGORY_LABELS_KO: Record<string, string> = {
  normal: "일반",
  baby: "아기",
  legendary: "전설",
  mythical: "환상",
};

export const STAGE_LABELS_KO: Record<string, string> = {
  "1": "기본",
  "2": "1차 진화",
  "3": "2차 진화",
  final: "최종 형태",
};

export const GROWTH_LABELS_KO: Record<string, string> = {
  slow: "느림",
  medium: "보통",
  fast: "빠름",
  "medium-slow": "약간 느림",
  "slow-then-very-fast": "불규칙",
  "fast-then-very-slow": "변동",
};

/** Korean titles of the main-series games, keyed by PokéAPI version slug. */
export const VERSION_LABELS_KO: Record<string, string> = {
  red: "레드",
  blue: "그린",
  yellow: "피카츄",
  gold: "골드",
  silver: "실버",
  crystal: "크리스탈",
  ruby: "루비",
  sapphire: "사파이어",
  emerald: "에메랄드",
  firered: "파이어레드",
  leafgreen: "리프그린",
  diamond: "다이아몬드",
  pearl: "펄",
  platinum: "플라티나",
  heartgold: "하트골드",
  soulsilver: "소울실버",
  black: "블랙",
  white: "화이트",
  "black-2": "블랙2",
  "white-2": "화이트2",
  x: "X",
  y: "Y",
  "omega-ruby": "오메가루비",
  "alpha-sapphire": "알파사파이어",
  sun: "썬",
  moon: "문",
  "ultra-sun": "울트라썬",
  "ultra-moon": "울트라문",
  "lets-go-pikachu": "레츠고! 피카츄",
  "lets-go-eevee": "레츠고! 이브이",
  sword: "소드",
  shield: "실드",
  "brilliant-diamond": "브릴리언트 다이아몬드",
  "shining-pearl": "샤이닝 펄",
  "legends-arceus": "레전드 아르세우스",
  scarlet: "스칼렛",
  violet: "바이올렛",
  "legends-za": "레전드 Z-A",
};

/* ==========================================================================
 * Simplified Chinese label sets.
 * ========================================================================== */

export const TYPE_LABELS_ZH_HANS: Record<string, string> = {
  normal: "一般",
  fire: "火",
  water: "水",
  electric: "电",
  grass: "草",
  ice: "冰",
  fighting: "格斗",
  poison: "毒",
  ground: "地面",
  flying: "飞行",
  psychic: "超能力",
  bug: "虫",
  rock: "岩石",
  ghost: "幽灵",
  dragon: "龙",
  dark: "恶",
  steel: "钢",
  fairy: "妖精",
};

export const COLOR_LABELS_ZH_HANS: Record<string, string> = {
  black: "黑色",
  blue: "蓝色",
  brown: "棕色",
  gray: "灰色",
  green: "绿色",
  pink: "粉色",
  purple: "紫色",
  red: "红色",
  white: "白色",
  yellow: "黄色",
};

export const HABITAT_LABELS_ZH_HANS: Record<string, string> = {
  cave: "洞窟",
  forest: "森林",
  grassland: "草原",
  mountain: "山地",
  rare: "稀有",
  "rough-terrain": "崎岖地带",
  sea: "海洋",
  urban: "城市",
  "waters-edge": "水边",
};

export const SHAPE_LABELS_ZH_HANS: Record<string, string> = {
  ball: "头部",
  squiggle: "蛇形",
  fish: "鱼形",
  arms: "头和手臂",
  blob: "头和躯干",
  upright: "有尾两足",
  legs: "头和腿",
  quadruped: "四足",
  wings: "双翼",
  tentacles: "触手",
  heads: "多个躯体",
  humanoid: "人形",
  "bug-wings": "有翅昆虫",
  armor: "昆虫形",
};

export const EGG_GROUP_LABELS_ZH_HANS: Record<string, string> = {
  monster: "怪兽",
  water1: "水中1",
  water2: "水中2",
  water3: "水中3",
  bug: "虫",
  flying: "飞行",
  ground: "陆上",
  fairy: "妖精",
  plant: "植物",
  humanshape: "人型",
  mineral: "矿物",
  indeterminate: "不定形",
  ditto: "百变怪",
  dragon: "龙",
  "no-eggs": "未发现",
};

export const CATEGORY_LABELS_ZH_HANS: Record<string, string> = {
  normal: "一般",
  baby: "宝宝",
  legendary: "传说",
  mythical: "幻之",
};

export const STAGE_LABELS_ZH_HANS: Record<string, string> = {
  "1": "基础",
  "2": "一次进化",
  "3": "二次进化",
  final: "最终形态",
};

export const GROWTH_LABELS_ZH_HANS: Record<string, string> = {
  slow: "慢",
  medium: "中等",
  fast: "快",
  "medium-slow": "中等偏慢",
  "slow-then-very-fast": "不规则",
  "fast-then-very-slow": "波动",
};

/** Simplified Chinese game titles, keyed by PokéAPI version slug. */
export const VERSION_LABELS_ZH_HANS: Record<string, string> = {
  red: "红",
  blue: "蓝",
  yellow: "皮卡丘",
  gold: "金",
  silver: "银",
  crystal: "水晶",
  ruby: "红宝石",
  sapphire: "蓝宝石",
  emerald: "绿宝石",
  firered: "火红",
  leafgreen: "叶绿",
  diamond: "钻石",
  pearl: "珍珠",
  platinum: "白金",
  heartgold: "心金",
  soulsilver: "魂银",
  black: "黑",
  white: "白",
  "black-2": "黑2",
  "white-2": "白2",
  x: "X",
  y: "Y",
  "omega-ruby": "终极红宝石",
  "alpha-sapphire": "始源蓝宝石",
  sun: "太阳",
  moon: "月亮",
  "ultra-sun": "究极之日",
  "ultra-moon": "究极之月",
  "lets-go-pikachu": "Let's Go！皮卡丘",
  "lets-go-eevee": "Let's Go！伊布",
  sword: "剑",
  shield: "盾",
  "brilliant-diamond": "晶灿钻石",
  "shining-pearl": "明亮珍珠",
  "legends-arceus": "传说 阿尔宙斯",
  scarlet: "朱",
  violet: "紫",
  "legends-za": "传说 Z-A",
};

/* ==========================================================================
 * Traditional Chinese label sets.
 * ========================================================================== */

export const TYPE_LABELS_ZH_HANT: Record<string, string> = {
  normal: "一般",
  fire: "火",
  water: "水",
  electric: "電",
  grass: "草",
  ice: "冰",
  fighting: "格鬥",
  poison: "毒",
  ground: "地面",
  flying: "飛行",
  psychic: "超能力",
  bug: "蟲",
  rock: "岩石",
  ghost: "幽靈",
  dragon: "龍",
  dark: "惡",
  steel: "鋼",
  fairy: "妖精",
};

export const COLOR_LABELS_ZH_HANT: Record<string, string> = {
  black: "黑色",
  blue: "藍色",
  brown: "棕色",
  gray: "灰色",
  green: "綠色",
  pink: "粉紅色",
  purple: "紫色",
  red: "紅色",
  white: "白色",
  yellow: "黃色",
};

export const HABITAT_LABELS_ZH_HANT: Record<string, string> = {
  cave: "洞窟",
  forest: "森林",
  grassland: "草原",
  mountain: "山地",
  rare: "稀有",
  "rough-terrain": "崎嶇地帶",
  sea: "海洋",
  urban: "城市",
  "waters-edge": "水邊",
};

export const SHAPE_LABELS_ZH_HANT: Record<string, string> = {
  ball: "頭部",
  squiggle: "蛇形",
  fish: "魚形",
  arms: "頭和手臂",
  blob: "頭和軀幹",
  upright: "有尾兩足",
  legs: "頭和腿",
  quadruped: "四足",
  wings: "雙翼",
  tentacles: "觸手",
  heads: "多個軀體",
  humanoid: "人形",
  "bug-wings": "有翅昆蟲",
  armor: "昆蟲形",
};

export const EGG_GROUP_LABELS_ZH_HANT: Record<string, string> = {
  monster: "怪獸",
  water1: "水中1",
  water2: "水中2",
  water3: "水中3",
  bug: "蟲",
  flying: "飛行",
  ground: "陸上",
  fairy: "妖精",
  plant: "植物",
  humanshape: "人型",
  mineral: "礦物",
  indeterminate: "不定形",
  ditto: "百變怪",
  dragon: "龍",
  "no-eggs": "未發現",
};

export const CATEGORY_LABELS_ZH_HANT: Record<string, string> = {
  normal: "一般",
  baby: "寶寶",
  legendary: "傳說",
  mythical: "幻之",
};

export const STAGE_LABELS_ZH_HANT: Record<string, string> = {
  "1": "基礎",
  "2": "一次進化",
  "3": "二次進化",
  final: "最終形態",
};

export const GROWTH_LABELS_ZH_HANT: Record<string, string> = {
  slow: "慢",
  medium: "中等",
  fast: "快",
  "medium-slow": "中等偏慢",
  "slow-then-very-fast": "不規則",
  "fast-then-very-slow": "波動",
};

/** Traditional Chinese game titles, keyed by PokéAPI version slug. */
export const VERSION_LABELS_ZH_HANT: Record<string, string> = {
  red: "紅",
  blue: "藍",
  yellow: "皮卡丘",
  gold: "金",
  silver: "銀",
  crystal: "水晶",
  ruby: "紅寶石",
  sapphire: "藍寶石",
  emerald: "綠寶石",
  firered: "火紅",
  leafgreen: "葉綠",
  diamond: "鑽石",
  pearl: "珍珠",
  platinum: "白金",
  heartgold: "心金",
  soulsilver: "魂銀",
  black: "黑",
  white: "白",
  "black-2": "黑2",
  "white-2": "白2",
  x: "X",
  y: "Y",
  "omega-ruby": "終極紅寶石",
  "alpha-sapphire": "始源藍寶石",
  sun: "太陽",
  moon: "月亮",
  "ultra-sun": "究極之日",
  "ultra-moon": "究極之月",
  "lets-go-pikachu": "Let's Go！皮卡丘",
  "lets-go-eevee": "Let's Go！伊布",
  sword: "劍",
  shield: "盾",
  "brilliant-diamond": "晶燦鑽石",
  "shining-pearl": "明亮珍珠",
  "legends-arceus": "傳說 阿爾宙斯",
  scarlet: "朱",
  violet: "紫",
  "legends-za": "傳說 Z-A",
};

/** Per-language map of every filterable species attribute. */
export const TYPE_LABELS: Record<Lang, Record<string, string>> = {
  es: TYPE_LABELS_ES,
  en: TYPE_LABELS_EN,
  fr: TYPE_LABELS_FR,
  de: TYPE_LABELS_DE,
  it: TYPE_LABELS_IT,
  ja: TYPE_LABELS_JA,
  ko: TYPE_LABELS_KO,
  "zh-Hans": TYPE_LABELS_ZH_HANS,
  "zh-Hant": TYPE_LABELS_ZH_HANT,
};
export const COLOR_LABELS: Record<Lang, Record<string, string>> = {
  es: COLOR_LABELS_ES,
  en: COLOR_LABELS_EN,
  fr: COLOR_LABELS_FR,
  de: COLOR_LABELS_DE,
  it: COLOR_LABELS_IT,
  ja: COLOR_LABELS_JA,
  ko: COLOR_LABELS_KO,
  "zh-Hans": COLOR_LABELS_ZH_HANS,
  "zh-Hant": COLOR_LABELS_ZH_HANT,
};
export const HABITAT_LABELS: Record<Lang, Record<string, string>> = {
  es: HABITAT_LABELS_ES,
  en: HABITAT_LABELS_EN,
  fr: HABITAT_LABELS_FR,
  de: HABITAT_LABELS_DE,
  it: HABITAT_LABELS_IT,
  ja: HABITAT_LABELS_JA,
  ko: HABITAT_LABELS_KO,
  "zh-Hans": HABITAT_LABELS_ZH_HANS,
  "zh-Hant": HABITAT_LABELS_ZH_HANT,
};
export const SHAPE_LABELS: Record<Lang, Record<string, string>> = {
  es: SHAPE_LABELS_ES,
  en: SHAPE_LABELS_EN,
  fr: SHAPE_LABELS_FR,
  de: SHAPE_LABELS_DE,
  it: SHAPE_LABELS_IT,
  ja: SHAPE_LABELS_JA,
  ko: SHAPE_LABELS_KO,
  "zh-Hans": SHAPE_LABELS_ZH_HANS,
  "zh-Hant": SHAPE_LABELS_ZH_HANT,
};
export const EGG_GROUP_LABELS: Record<Lang, Record<string, string>> = {
  es: EGG_GROUP_LABELS_ES,
  en: EGG_GROUP_LABELS_EN,
  fr: EGG_GROUP_LABELS_FR,
  de: EGG_GROUP_LABELS_DE,
  it: EGG_GROUP_LABELS_IT,
  ja: EGG_GROUP_LABELS_JA,
  ko: EGG_GROUP_LABELS_KO,
  "zh-Hans": EGG_GROUP_LABELS_ZH_HANS,
  "zh-Hant": EGG_GROUP_LABELS_ZH_HANT,
};
export const CATEGORY_LABELS: Record<Lang, Record<string, string>> = {
  es: CATEGORY_LABELS_ES,
  en: CATEGORY_LABELS_EN,
  fr: CATEGORY_LABELS_FR,
  de: CATEGORY_LABELS_DE,
  it: CATEGORY_LABELS_IT,
  ja: CATEGORY_LABELS_JA,
  ko: CATEGORY_LABELS_KO,
  "zh-Hans": CATEGORY_LABELS_ZH_HANS,
  "zh-Hant": CATEGORY_LABELS_ZH_HANT,
};
export const STAGE_LABELS: Record<Lang, Record<string, string>> = {
  es: STAGE_LABELS_ES,
  en: STAGE_LABELS_EN,
  fr: STAGE_LABELS_FR,
  de: STAGE_LABELS_DE,
  it: STAGE_LABELS_IT,
  ja: STAGE_LABELS_JA,
  ko: STAGE_LABELS_KO,
  "zh-Hans": STAGE_LABELS_ZH_HANS,
  "zh-Hant": STAGE_LABELS_ZH_HANT,
};
export const GROWTH_LABELS: Record<Lang, Record<string, string>> = {
  es: GROWTH_LABELS_ES,
  en: GROWTH_LABELS_EN,
  fr: GROWTH_LABELS_FR,
  de: GROWTH_LABELS_DE,
  it: GROWTH_LABELS_IT,
  ja: GROWTH_LABELS_JA,
  ko: GROWTH_LABELS_KO,
  "zh-Hans": GROWTH_LABELS_ZH_HANS,
  "zh-Hant": GROWTH_LABELS_ZH_HANT,
};
export const VERSION_LABELS: Record<Lang, Record<string, string>> = {
  es: VERSION_LABELS_ES,
  en: VERSION_LABELS_EN,
  fr: VERSION_LABELS_FR,
  de: VERSION_LABELS_DE,
  it: VERSION_LABELS_IT,
  ja: VERSION_LABELS_JA,
  ko: VERSION_LABELS_KO,
  "zh-Hans": VERSION_LABELS_ZH_HANS,
  "zh-Hant": VERSION_LABELS_ZH_HANT,
};

export function versionLabel(slug: string, lang: Lang = DEFAULT_LANG): string {
  return VERSION_LABELS[lang][slug] ?? formatName(slug);
}

export function growthLabel(
  slug: string | undefined,
  lang: Lang = DEFAULT_LANG,
): string {
  return (slug && GROWTH_LABELS[lang][slug]) || "—";
}

export function habitatLabel(
  slug: string | undefined,
  lang: Lang = DEFAULT_LANG,
): string | undefined {
  return slug ? HABITAT_LABELS[lang][slug] : undefined;
}

/**
 * Muted "soft badge" palette per type (tinted background + ring + readable
 * text in both themes). Full class strings so Tailwind can extract them.
 */
export const TYPE_COLORS: Record<string, string> = {
  normal:
    "bg-neutral-500/10 text-neutral-700 ring-neutral-500/25 dark:bg-neutral-400/10 dark:text-neutral-300 dark:ring-neutral-400/25",
  fire: "bg-orange-500/10 text-orange-700 ring-orange-600/25 dark:bg-orange-400/10 dark:text-orange-300 dark:ring-orange-400/25",
  water:
    "bg-blue-500/10 text-blue-700 ring-blue-600/25 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/25",
  electric:
    "bg-yellow-500/10 text-yellow-700 ring-yellow-600/25 dark:bg-yellow-400/10 dark:text-yellow-300 dark:ring-yellow-400/25",
  grass:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-600/25 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25",
  ice: "bg-cyan-500/10 text-cyan-700 ring-cyan-600/25 dark:bg-cyan-400/10 dark:text-cyan-300 dark:ring-cyan-400/25",
  fighting:
    "bg-red-500/10 text-red-700 ring-red-600/25 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/25",
  poison:
    "bg-fuchsia-500/10 text-fuchsia-700 ring-fuchsia-600/25 dark:bg-fuchsia-400/10 dark:text-fuchsia-300 dark:ring-fuchsia-400/25",
  ground:
    "bg-amber-500/10 text-amber-700 ring-amber-600/25 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25",
  flying:
    "bg-sky-500/10 text-sky-700 ring-sky-600/25 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/25",
  psychic:
    "bg-pink-500/10 text-pink-700 ring-pink-600/25 dark:bg-pink-400/10 dark:text-pink-300 dark:ring-pink-400/25",
  bug: "bg-lime-500/10 text-lime-700 ring-lime-600/25 dark:bg-lime-400/10 dark:text-lime-300 dark:ring-lime-400/25",
  rock: "bg-stone-500/10 text-stone-700 ring-stone-600/25 dark:bg-stone-400/10 dark:text-stone-300 dark:ring-stone-400/25",
  ghost:
    "bg-violet-500/10 text-violet-700 ring-violet-600/25 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/25",
  dragon:
    "bg-indigo-500/10 text-indigo-700 ring-indigo-600/25 dark:bg-indigo-400/10 dark:text-indigo-300 dark:ring-indigo-400/25",
  dark: "bg-gray-500/10 text-gray-700 ring-gray-600/25 dark:bg-gray-400/10 dark:text-gray-300 dark:ring-gray-400/25",
  steel:
    "bg-zinc-500/10 text-zinc-700 ring-zinc-600/25 dark:bg-zinc-400/10 dark:text-zinc-300 dark:ring-zinc-400/25",
  fairy:
    "bg-rose-500/10 text-rose-700 ring-rose-600/25 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/25",
};

/**
 * Chart accent per type: a `text-*` pair so SVG marks can draw with
 * `currentColor` in both themes. Same hue family as TYPE_COLORS, one step
 * deeper in light mode so 2px strokes stay visible on white.
 */
export const TYPE_ACCENTS: Record<string, string> = {
  normal: "text-neutral-500 dark:text-neutral-400",
  fire: "text-orange-600 dark:text-orange-400",
  water: "text-blue-600 dark:text-blue-400",
  electric: "text-yellow-600 dark:text-yellow-400",
  grass: "text-emerald-600 dark:text-emerald-400",
  ice: "text-cyan-600 dark:text-cyan-400",
  fighting: "text-red-600 dark:text-red-400",
  poison: "text-fuchsia-600 dark:text-fuchsia-400",
  ground: "text-amber-600 dark:text-amber-400",
  flying: "text-sky-600 dark:text-sky-400",
  psychic: "text-pink-600 dark:text-pink-400",
  bug: "text-lime-600 dark:text-lime-400",
  rock: "text-stone-500 dark:text-stone-400",
  ghost: "text-violet-600 dark:text-violet-400",
  dragon: "text-indigo-600 dark:text-indigo-400",
  dark: "text-gray-600 dark:text-gray-400",
  steel: "text-zinc-500 dark:text-zinc-400",
  fairy: "text-rose-500 dark:text-rose-400",
};

export function typeAccent(type: string): string {
  return TYPE_ACCENTS[type] ?? "text-slate-500 dark:text-slate-400";
}

/**
 * Neon aura color per type, used as the `--aura` CSS variable that the
 * `.aura-card` class turns into a glow (see globals.css). Hand-picked neon
 * hues that read on both the near-black and the light background.
 */
export const TYPE_AURA: Record<string, string> = {
  normal: "#d6d3d1",
  fire: "#ff6b2b",
  water: "#22d3ee",
  electric: "#fde047",
  grass: "#34d399",
  ice: "#a5f3fc",
  fighting: "#ef4444",
  poison: "#d946ef",
  ground: "#f59e0b",
  flying: "#38bdf8",
  psychic: "#f472b6",
  bug: "#a3e635",
  rock: "#b8a038",
  ghost: "#8b5cf6",
  dragon: "#a855f7",
  dark: "#6d28d9",
  steel: "#94a3b8",
  fairy: "#fb7185",
};

/** Aura color for a Pokémon's primary type (neutral steel-gray fallback). */
export function typeAura(type: string | undefined): string {
  return (type && TYPE_AURA[type]) || "#94a3b8";
}

/** WCAG 2.1 relative luminance of an opaque `#rrggbb` color. */
function relativeLuminance(hex: string): number {
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
  );
}

/**
 * Legible foreground + surface tint for a solid, type-colored control (the
 * move pills of the battle HUD).
 *
 * The aura palette spans almost the whole luminance range — hielo and
 * eléctrico are near-white, siniestro is a deep violet — so no single ink
 * color clears the 4.5:1 minimum (WCAG 1.4.3) on all eighteen types. Bright
 * types therefore take near-black ink over the raw aura; dark ones keep white
 * ink over an aura deepened toward black, which reads *more* neon, not less.
 */
export function typeSurface(type: string | undefined): {
  /** Text color to use on `base`. */
  ink: string;
  /** Solid background that guarantees the contrast ratio with `ink`. */
  base: string;
  /** Companion text-shadow that keeps the game-style outline readable. */
  inkShadow: string;
} {
  const color = typeAura(type);
  if (relativeLuminance(color) >= 0.3) {
    return {
      ink: "#0b1220",
      base: color,
      inkShadow: "0 1px 0 rgba(255,255,255,0.35)",
    };
  }
  return {
    ink: "#ffffff",
    base: `color-mix(in srgb, ${color} 62%, #000)`,
    inkShadow: "0 1px 2px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.5)",
  };
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export function generationLabel(generation: number): string {
  return `Gen ${ROMAN[generation - 1] ?? generation}`;
}

/** "generation-iv" -> 4 */
export function generationFromName(name: string): number {
  const roman = name.replace("generation-", "").toUpperCase();
  const index = ROMAN.indexOf(roman);
  return index === -1 ? 0 : index + 1;
}

export function typeLabel(type: string, lang: Lang = DEFAULT_LANG): string {
  return TYPE_LABELS[lang][type] ?? formatName(type);
}

export function typeColor(type: string): string {
  return (
    TYPE_COLORS[type] ??
    "bg-slate-500/10 text-slate-700 ring-slate-600/25 dark:bg-slate-400/10 dark:text-slate-300 dark:ring-slate-400/25"
  );
}

/** Official artwork hosted by the PokeAPI sprites repo, keyed by pokemon id. */
export function artworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

/**
 * Front-facing pixel sprite, keyed by pokemon id. Tiny (a few KB) next to the
 * official artwork, so it is what the lobby uses for its mystery silhouettes.
 */
export function spriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

/** "mr-mime" -> "Mr Mime" */
export function formatName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** "#0025" style National Pokédex number. */
export function formatDexNumber(id: number): string {
  return `#${String(id).padStart(4, "0")}`;
}

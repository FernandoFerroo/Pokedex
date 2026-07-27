import type { Lang } from "../config";

/** Pokémon detail page: hero, panels, tabs, moves, cards, evolution chain. */
const es = {
  // Metadata
  metaDescription: (name: string) =>
    `Ficha completa de ${name}: tipos, estadísticas, debilidades y resistencias, habilidades, crianza, evoluciones y cartas del JCC.`,

  // Back button
  backToDex: "Volver a la Pokédex",

  // Cry button
  cryAria: (name: string) => `Reproducir el grito de ${name}`,
  cry: "Grito",

  // Sprite viewer
  modeArt: "Arte",
  mode3d: "3D",
  mode2d: "2D",
  spriteSideAria: "Lado del sprite",
  front: "Frente",
  back: "Espalda",
  spriteAlt: (name: string, side: "front" | "back") =>
    `${name} (${side === "back" ? "espalda" : "frente"})`,
  dragToRotate: "Arrastra para girar",
  viewModeAria: "Modo de visualización",
  shinyToggleTitle: "Alternar forma shiny",
  noShinyTitle: "Sin sprite shiny",
  shiny: "Shiny",
  loadingModel: "Cargando modelo…",

  // Hero / dex entry
  dexEntry: "Registro de la Pokédex",
  height: "Altura",
  weight: "Peso",
  baseExp: "Exp. base",
  growth: "Crecimiento",
  capture: "Captura",
  happiness: "Felicidad",
  captureVeryEasy: "Muy fácil",
  captureEasy: "Fácil",
  captureMedium: "Media",
  captureHard: "Difícil",
  captureVeryHard: "Muy difícil",

  // Detail tabs
  tabsAria: "Secciones de la ficha",
  tabGeneral: "General & Stats",
  tabCompetitive: "Competitivo & Movimientos",
  tabBreeding: "Crianza & Localización",

  // Panel titles
  baseStats: "Estadísticas base",
  combatAnalysis: "Análisis de combate",
  abilities: "Habilidades",
  moves: "Movimientos",
  breedingProfile: "Crianza y perfil",

  // Abilities
  hiddenBadge: "● Oculta",
  untilGenBadge: (gen: string) => `● Hasta ${gen}`,
  uniqueBadge: "◆ Única",
  lineExclusiveBadge: "◆ Exclusiva de su línea",
  holdersLabel: (count: number): string =>
    count === 1 ? "portador" : "portadores",

  // Breeding & profile
  gender: "Género",
  genderless: "Sin género",
  eggGroups: "Grupos huevo",
  eggCycles: "Ciclos de huevo",
  cyclesCount: (cycles: number) => `${cycles} ciclos`,
  stepsApprox: (steps: string) => `· ~${steps} pasos`,
  wildItems: "Objetos en estado salvaje",
  habitat: "Hábitat",
  unknownHabitat: "Desconocido",
  bodyShape: "Forma corporal",
  color: "Color",

  // Stats dashboard
  statsAria: (list: string, total: number) =>
    `Estadísticas base: ${list}. Total ${total}.`,
  bestStat: "Mejor estadística",
  total: "Total",
  evYield: "EV al derrotarlo",
  realRanges: "Rangos reales",
  realRangesNote: "(IV 0–31 · EV 0–252 · naturaleza incluida)",
  levelLabel: "Nivel",
  levelSliderAria: "Nivel para calcular las estadísticas",
  statMin: "Mín",
  statMax: "Máx",

  // Type matchups
  noTypeData: "Sin datos de tipos.",
  matchupX4: "Debilidad crítica",
  matchupX2: "Debilidad",
  matchupX05: "Resistencia",
  matchupX025: "Gran resistencia",
  matchupX0: "Inmunidad",

  // Pro insights
  competitiveRead: "Lectura competitiva",
  baseTotal: "Total base",
  starStat: "Stat estrella",
  speedLv100: "Velocidad · Nv. 100",
  baseOf: (value: number) => `(base ${value})`,
  danger: (factor: string) => `Peligro ${factor}`,
  noWeaknesses: "Sin debilidades",
  immunities: "Inmunidades",
  none: "Ninguna",

  // Moves panel
  learnsetPrefix: "Repertorio completo en ",
  learnsetSuffix: ".",
  learnMethodAria: "Método de aprendizaje",
  tabLevelUp: "Por nivel",
  tabMachine: "MT/MO",
  tabEgg: "Huevo",
  tabTutor: "Tutor",
  damagePhysical: "Físico",
  damageSpecial: "Especial",
  damageStatus: "Estado",
  levelShort: (level: number) => `Nv. ${level}`,
  evolveShort: "Evol.",
  moveMeta: (power: string, accuracy: string, pp: string) =>
    `Pot. ${power} · Prec. ${accuracy} · PP ${pp}`,

  // Evolution chain
  evolutionChain: "Cadena evolutiva",
  noEvolution: "Este Pokémon no evoluciona.",

  // TCG cards
  tcgCards: "Cartas del JCC",
  tcgGalleryAria: "Galería de cartas del JCC",
  tcgLoadError:
    "No se ha podido cargar la galería de cartas. Inténtalo más tarde.",
  tcgEmpty: (name: string) =>
    `No se han encontrado cartas del JCC para ${name}.`,
  tcgShowing: (shown: number, total: number) =>
    `Mostrando ${shown} de ${total} cartas.`,
};

const en: typeof es = {
  // Metadata
  metaDescription: (name: string) =>
    `Complete ${name} entry: types, stats, weaknesses and resistances, abilities, breeding, evolutions and TCG cards.`,

  // Back button
  backToDex: "Back to the Pokédex",

  // Cry button
  cryAria: (name: string) => `Play ${name}'s cry`,
  cry: "Cry",

  // Sprite viewer
  modeArt: "Art",
  mode3d: "3D",
  mode2d: "2D",
  spriteSideAria: "Sprite side",
  front: "Front",
  back: "Back",
  spriteAlt: (name: string, side: "front" | "back") =>
    `${name} (${side === "back" ? "back" : "front"})`,
  dragToRotate: "Drag to rotate",
  viewModeAria: "Display mode",
  shinyToggleTitle: "Toggle shiny form",
  noShinyTitle: "No shiny sprite",
  shiny: "Shiny",
  loadingModel: "Loading model…",

  // Hero / dex entry
  dexEntry: "Pokédex entry",
  height: "Height",
  weight: "Weight",
  baseExp: "Base EXP",
  growth: "Growth",
  capture: "Catch rate",
  happiness: "Friendship",
  captureVeryEasy: "Very easy",
  captureEasy: "Easy",
  captureMedium: "Medium",
  captureHard: "Hard",
  captureVeryHard: "Very hard",

  // Detail tabs
  tabsAria: "Sheet sections",
  tabGeneral: "General & Stats",
  tabCompetitive: "Competitive & Moves",
  tabBreeding: "Breeding & Location",

  // Panel titles
  baseStats: "Base stats",
  combatAnalysis: "Combat analysis",
  abilities: "Abilities",
  moves: "Moves",
  breedingProfile: "Breeding & profile",

  // Abilities
  hiddenBadge: "● Hidden",
  untilGenBadge: (gen: string) => `● Until ${gen}`,
  uniqueBadge: "◆ Unique",
  lineExclusiveBadge: "◆ Exclusive to its line",
  holdersLabel: (count: number) => (count === 1 ? "holder" : "holders"),

  // Breeding & profile
  gender: "Gender",
  genderless: "Genderless",
  eggGroups: "Egg groups",
  eggCycles: "Egg cycles",
  cyclesCount: (cycles: number) => `${cycles} cycles`,
  stepsApprox: (steps: string) => `· ~${steps} steps`,
  wildItems: "Wild held items",
  habitat: "Habitat",
  unknownHabitat: "Unknown",
  bodyShape: "Body shape",
  color: "Color",

  // Stats dashboard
  statsAria: (list: string, total: number) =>
    `Base stats: ${list}. Total ${total}.`,
  bestStat: "Best stat",
  total: "Total",
  evYield: "EV yield",
  realRanges: "Real ranges",
  realRangesNote: "(IV 0–31 · EV 0–252 · nature included)",
  levelLabel: "Level",
  levelSliderAria: "Level used to compute the stats",
  statMin: "Min",
  statMax: "Max",

  // Type matchups
  noTypeData: "No type data.",
  matchupX4: "Double weakness",
  matchupX2: "Weakness",
  matchupX05: "Resistance",
  matchupX025: "Double resistance",
  matchupX0: "Immunity",

  // Pro insights
  competitiveRead: "Competitive overview",
  baseTotal: "Base total",
  starStat: "Star stat",
  speedLv100: "Speed · Lv. 100",
  baseOf: (value: number) => `(base ${value})`,
  danger: (factor: string) => `Danger ${factor}`,
  noWeaknesses: "No weaknesses",
  immunities: "Immunities",
  none: "None",

  // Moves panel
  learnsetPrefix: "Full learnset in ",
  learnsetSuffix: ".",
  learnMethodAria: "Learn method",
  tabLevelUp: "Level up",
  tabMachine: "TM/HM",
  tabEgg: "Egg",
  tabTutor: "Tutor",
  damagePhysical: "Physical",
  damageSpecial: "Special",
  damageStatus: "Status",
  levelShort: (level: number) => `Lv. ${level}`,
  evolveShort: "Evo.",
  moveMeta: (power: string, accuracy: string, pp: string) =>
    `Pwr. ${power} · Acc. ${accuracy} · PP ${pp}`,

  // Evolution chain
  evolutionChain: "Evolution chain",
  noEvolution: "This Pokémon does not evolve.",

  // TCG cards
  tcgCards: "TCG cards",
  tcgGalleryAria: "TCG card gallery",
  tcgLoadError: "The card gallery could not be loaded. Try again later.",
  tcgEmpty: (name: string) => `No TCG cards found for ${name}.`,
  tcgShowing: (shown: number, total: number) =>
    `Showing ${shown} of ${total} cards.`,
};

const fr: typeof es = {
  // Metadata
  metaDescription: (name: string) =>
    `Fiche complète de ${name} : types, statistiques, faiblesses et résistances, talents, reproduction, évolutions et cartes du JCC.`,

  // Back button
  backToDex: "Retour au Pokédex",

  // Cry button
  cryAria: (name: string) => `Jouer le cri de ${name}`,
  cry: "Cri",

  // Sprite viewer
  modeArt: "Illustration",
  mode3d: "3D",
  mode2d: "2D",
  spriteSideAria: "Face du sprite",
  front: "Face",
  back: "Dos",
  spriteAlt: (name: string, side: "front" | "back") =>
    `${name} (${side === "back" ? "dos" : "face"})`,
  dragToRotate: "Faites glisser pour pivoter",
  viewModeAria: "Mode d'affichage",
  shinyToggleTitle: "Basculer la forme chromatique",
  noShinyTitle: "Pas de sprite chromatique",
  shiny: "Chromatique",
  loadingModel: "Chargement du modèle…",

  // Hero / dex entry
  dexEntry: "Entrée du Pokédex",
  height: "Taille",
  weight: "Poids",
  baseExp: "Exp. de base",
  growth: "Croissance",
  capture: "Capture",
  happiness: "Bonheur",
  captureVeryEasy: "Très facile",
  captureEasy: "Facile",
  captureMedium: "Moyenne",
  captureHard: "Difficile",
  captureVeryHard: "Très difficile",

  // Detail tabs
  tabsAria: "Sections de la fiche",
  tabGeneral: "Général & Stats",
  tabCompetitive: "Compétitif & Capacités",
  tabBreeding: "Reproduction & Localisation",

  // Panel titles
  baseStats: "Statistiques de base",
  combatAnalysis: "Analyse de combat",
  abilities: "Talents",
  moves: "Capacités",
  breedingProfile: "Reproduction et profil",

  // Abilities
  hiddenBadge: "● Caché",
  untilGenBadge: (gen: string) => `● Jusqu'à ${gen}`,
  uniqueBadge: "◆ Unique",
  lineExclusiveBadge: "◆ Exclusif à sa lignée",
  holdersLabel: (count: number): string =>
    count === 1 ? "porteur" : "porteurs",

  // Breeding & profile
  gender: "Genre",
  genderless: "Asexué",
  eggGroups: "Groupes d'Œuf",
  eggCycles: "Cycles d'Œuf",
  cyclesCount: (cycles: number) => `${cycles} cycles`,
  stepsApprox: (steps: string) => `· ~${steps} pas`,
  wildItems: "Objets tenus à l'état sauvage",
  habitat: "Habitat",
  unknownHabitat: "Inconnu",
  bodyShape: "Silhouette",
  color: "Couleur",

  // Stats dashboard
  statsAria: (list: string, total: number) =>
    `Statistiques de base : ${list}. Total ${total}.`,
  bestStat: "Meilleure stat",
  total: "Total",
  evYield: "EV donnés",
  realRanges: "Plages réelles",
  realRangesNote: "(IV 0–31 · EV 0–252 · nature incluse)",
  levelLabel: "Niveau",
  levelSliderAria: "Niveau utilisé pour calculer les statistiques",
  statMin: "Min",
  statMax: "Max",

  // Type matchups
  noTypeData: "Aucune donnée de type.",
  matchupX4: "Faiblesse critique",
  matchupX2: "Faiblesse",
  matchupX05: "Résistance",
  matchupX025: "Grande résistance",
  matchupX0: "Immunité",

  // Pro insights
  competitiveRead: "Lecture compétitive",
  baseTotal: "Total de base",
  starStat: "Stat vedette",
  speedLv100: "Vitesse · N. 100",
  baseOf: (value: number) => `(base ${value})`,
  danger: (factor: string) => `Danger ${factor}`,
  noWeaknesses: "Aucune faiblesse",
  immunities: "Immunités",
  none: "Aucune",

  // Moves panel
  learnsetPrefix: "Répertoire complet sur ",
  learnsetSuffix: ".",
  learnMethodAria: "Méthode d'apprentissage",
  tabLevelUp: "Par niveau",
  tabMachine: "CT/CS",
  tabEgg: "Œuf",
  tabTutor: "Tuteur",
  damagePhysical: "Physique",
  damageSpecial: "Spécial",
  damageStatus: "Statut",
  levelShort: (level: number) => `N. ${level}`,
  evolveShort: "Évo.",
  moveMeta: (power: string, accuracy: string, pp: string) =>
    `Puis. ${power} · Préc. ${accuracy} · PP ${pp}`,

  // Evolution chain
  evolutionChain: "Chaîne d'évolution",
  noEvolution: "Ce Pokémon n'évolue pas.",

  // TCG cards
  tcgCards: "Cartes du JCC",
  tcgGalleryAria: "Galerie de cartes du JCC",
  tcgLoadError:
    "Impossible de charger la galerie de cartes. Réessayez plus tard.",
  tcgEmpty: (name: string) => `Aucune carte du JCC trouvée pour ${name}.`,
  tcgShowing: (shown: number, total: number) =>
    `Affichage de ${shown} cartes sur ${total}.`,
};

const de: typeof es = {
  // Metadata
  metaDescription: (name: string) =>
    `Vollständiger Eintrag zu ${name}: Typen, Statuswerte, Schwächen und Resistenzen, Fähigkeiten, Zucht, Entwicklungen und Sammelkarten.`,

  // Back button
  backToDex: "Zurück zum Pokédex",

  // Cry button
  cryAria: (name: string) => `Ruf von ${name} abspielen`,
  cry: "Ruf",

  // Sprite viewer
  modeArt: "Artwork",
  mode3d: "3D",
  mode2d: "2D",
  spriteSideAria: "Sprite-Seite",
  front: "Vorne",
  back: "Hinten",
  spriteAlt: (name: string, side: "front" | "back") =>
    `${name} (${side === "back" ? "Rückansicht" : "Vorderansicht"})`,
  dragToRotate: "Zum Drehen ziehen",
  viewModeAria: "Anzeigemodus",
  shinyToggleTitle: "Schillernde Form umschalten",
  noShinyTitle: "Kein schillernder Sprite",
  shiny: "Schillernd",
  loadingModel: "Modell wird geladen…",

  // Hero / dex entry
  dexEntry: "Pokédex-Eintrag",
  height: "Größe",
  weight: "Gewicht",
  baseExp: "Basis-EP",
  growth: "Wachstum",
  capture: "Fangrate",
  happiness: "Freundschaft",
  captureVeryEasy: "Sehr leicht",
  captureEasy: "Leicht",
  captureMedium: "Mittel",
  captureHard: "Schwer",
  captureVeryHard: "Sehr schwer",

  // Detail tabs
  tabsAria: "Bereiche des Eintrags",
  tabGeneral: "Allgemein & Werte",
  tabCompetitive: "Kompetitiv & Attacken",
  tabBreeding: "Zucht & Fundorte",

  // Panel titles
  baseStats: "Basiswerte",
  combatAnalysis: "Kampfanalyse",
  abilities: "Fähigkeiten",
  moves: "Attacken",
  breedingProfile: "Zucht & Profil",

  // Abilities
  hiddenBadge: "● Versteckt",
  untilGenBadge: (gen: string) => `● Bis ${gen}`,
  uniqueBadge: "◆ Einzigartig",
  lineExclusiveBadge: "◆ Exklusiv für seine Linie",
  holdersLabel: (count: number): string =>
    count === 1 ? "Träger" : "Träger",

  // Breeding & profile
  gender: "Geschlecht",
  genderless: "Geschlechtslos",
  eggGroups: "Ei-Gruppen",
  eggCycles: "Ei-Zyklen",
  cyclesCount: (cycles: number) => `${cycles} Zyklen`,
  stepsApprox: (steps: string) => `· ~${steps} Schritte`,
  wildItems: "Getragene Items in freier Wildbahn",
  habitat: "Lebensraum",
  unknownHabitat: "Unbekannt",
  bodyShape: "Körperform",
  color: "Farbe",

  // Stats dashboard
  statsAria: (list: string, total: number) =>
    `Basiswerte: ${list}. Gesamt ${total}.`,
  bestStat: "Bester Wert",
  total: "Gesamt",
  evYield: "EV-Ausbeute",
  realRanges: "Reale Spannen",
  realRangesNote: "(IV 0–31 · EV 0–252 · Wesen inklusive)",
  levelLabel: "Level",
  levelSliderAria: "Level für die Berechnung der Statuswerte",
  statMin: "Min",
  statMax: "Max",

  // Type matchups
  noTypeData: "Keine Typdaten.",
  matchupX4: "Kritische Schwäche",
  matchupX2: "Schwäche",
  matchupX05: "Resistenz",
  matchupX025: "Starke Resistenz",
  matchupX0: "Immunität",

  // Pro insights
  competitiveRead: "Kompetitive Einschätzung",
  baseTotal: "Basis-Gesamtwert",
  starStat: "Paradewert",
  speedLv100: "Initiative · Lv. 100",
  baseOf: (value: number) => `(Basis ${value})`,
  danger: (factor: string) => `Gefahr ${factor}`,
  noWeaknesses: "Keine Schwächen",
  immunities: "Immunitäten",
  none: "Keine",

  // Moves panel
  learnsetPrefix: "Vollständige Attackenliste auf ",
  learnsetSuffix: ".",
  learnMethodAria: "Lernmethode",
  tabLevelUp: "Per Level",
  tabMachine: "TM/VM",
  tabEgg: "Ei",
  tabTutor: "Lehrer",
  damagePhysical: "Physisch",
  damageSpecial: "Spezial",
  damageStatus: "Status",
  levelShort: (level: number) => `Lv. ${level}`,
  evolveShort: "Entw.",
  moveMeta: (power: string, accuracy: string, pp: string) =>
    `Stärke ${power} · Gen. ${accuracy} · AP ${pp}`,

  // Evolution chain
  evolutionChain: "Entwicklungsreihe",
  noEvolution: "Dieses Pokémon entwickelt sich nicht.",

  // TCG cards
  tcgCards: "Sammelkarten",
  tcgGalleryAria: "Sammelkarten-Galerie",
  tcgLoadError:
    "Die Kartengalerie konnte nicht geladen werden. Versuche es später erneut.",
  tcgEmpty: (name: string) => `Keine Sammelkarten für ${name} gefunden.`,
  tcgShowing: (shown: number, total: number) =>
    `${shown} von ${total} Karten werden angezeigt.`,
};

const it: typeof es = {
  // Metadata
  metaDescription: (name: string) =>
    `Scheda completa di ${name}: tipi, statistiche, debolezze e resistenze, abilità, accoppiamento, evoluzioni e carte del GCC.`,

  // Back button
  backToDex: "Torna al Pokédex",

  // Cry button
  cryAria: (name: string) => `Riproduci il verso di ${name}`,
  cry: "Verso",

  // Sprite viewer
  modeArt: "Artwork",
  mode3d: "3D",
  mode2d: "2D",
  spriteSideAria: "Lato dello sprite",
  front: "Fronte",
  back: "Retro",
  spriteAlt: (name: string, side: "front" | "back") =>
    `${name} (${side === "back" ? "retro" : "fronte"})`,
  dragToRotate: "Trascina per ruotare",
  viewModeAria: "Modalità di visualizzazione",
  shinyToggleTitle: "Attiva/disattiva la forma cromatica",
  noShinyTitle: "Nessuno sprite cromatico",
  shiny: "Cromatico",
  loadingModel: "Caricamento del modello…",

  // Hero / dex entry
  dexEntry: "Voce del Pokédex",
  height: "Altezza",
  weight: "Peso",
  baseExp: "Esp. base",
  growth: "Crescita",
  capture: "Cattura",
  happiness: "Amicizia",
  captureVeryEasy: "Molto facile",
  captureEasy: "Facile",
  captureMedium: "Media",
  captureHard: "Difficile",
  captureVeryHard: "Molto difficile",

  // Detail tabs
  tabsAria: "Sezioni della scheda",
  tabGeneral: "Generale & Statistiche",
  tabCompetitive: "Competitivo & Mosse",
  tabBreeding: "Accoppiamento & Luoghi",

  // Panel titles
  baseStats: "Statistiche di base",
  combatAnalysis: "Analisi di lotta",
  abilities: "Abilità",
  moves: "Mosse",
  breedingProfile: "Accoppiamento e profilo",

  // Abilities
  hiddenBadge: "● Nascosta",
  untilGenBadge: (gen: string) => `● Fino a ${gen}`,
  uniqueBadge: "◆ Unica",
  lineExclusiveBadge: "◆ Esclusiva della sua linea",
  holdersLabel: (count: number): string =>
    count === 1 ? "portatore" : "portatori",

  // Breeding & profile
  gender: "Sesso",
  genderless: "Senza sesso",
  eggGroups: "Gruppi Uova",
  eggCycles: "Cicli delle Uova",
  cyclesCount: (cycles: number) => `${cycles} cicli`,
  stepsApprox: (steps: string) => `· ~${steps} passi`,
  wildItems: "Strumenti allo stato selvatico",
  habitat: "Habitat",
  unknownHabitat: "Sconosciuto",
  bodyShape: "Corporatura",
  color: "Colore",

  // Stats dashboard
  statsAria: (list: string, total: number) =>
    `Statistiche di base: ${list}. Totale ${total}.`,
  bestStat: "Statistica migliore",
  total: "Totale",
  evYield: "EV ottenuti",
  realRanges: "Intervalli reali",
  realRangesNote: "(IV 0–31 · EV 0–252 · natura inclusa)",
  levelLabel: "Livello",
  levelSliderAria: "Livello usato per calcolare le statistiche",
  statMin: "Min",
  statMax: "Max",

  // Type matchups
  noTypeData: "Nessun dato sui tipi.",
  matchupX4: "Debolezza critica",
  matchupX2: "Debolezza",
  matchupX05: "Resistenza",
  matchupX025: "Grande resistenza",
  matchupX0: "Immunità",

  // Pro insights
  competitiveRead: "Lettura competitiva",
  baseTotal: "Totale base",
  starStat: "Statistica di punta",
  speedLv100: "Velocità · Liv. 100",
  baseOf: (value: number) => `(base ${value})`,
  danger: (factor: string) => `Pericolo ${factor}`,
  noWeaknesses: "Nessuna debolezza",
  immunities: "Immunità",
  none: "Nessuna",

  // Moves panel
  learnsetPrefix: "Elenco completo delle mosse su ",
  learnsetSuffix: ".",
  learnMethodAria: "Metodo di apprendimento",
  tabLevelUp: "Per livello",
  tabMachine: "MT/MN",
  tabEgg: "Uovo",
  tabTutor: "Insegnamosse",
  damagePhysical: "Fisico",
  damageSpecial: "Speciale",
  damageStatus: "Stato",
  levelShort: (level: number) => `Liv. ${level}`,
  evolveShort: "Evo.",
  moveMeta: (power: string, accuracy: string, pp: string) =>
    `Pot. ${power} · Prec. ${accuracy} · PP ${pp}`,

  // Evolution chain
  evolutionChain: "Catena evolutiva",
  noEvolution: "Questo Pokémon non si evolve.",

  // TCG cards
  tcgCards: "Carte del GCC",
  tcgGalleryAria: "Galleria di carte del GCC",
  tcgLoadError:
    "Impossibile caricare la galleria delle carte. Riprova più tardi.",
  tcgEmpty: (name: string) => `Nessuna carta del GCC trovata per ${name}.`,
  tcgShowing: (shown: number, total: number) =>
    `${shown} carte su ${total} visualizzate.`,
};

const ja: typeof es = {
  // Metadata
  metaDescription: (name: string) =>
    `${name}の完全データ：タイプ、種族値、弱点と耐性、特性、タマゴ、進化、ポケカのカード情報。`,

  // Back button
  backToDex: "ポケモン図鑑に戻る",

  // Cry button
  cryAria: (name: string) => `${name}の鳴き声を再生`,
  cry: "鳴き声",

  // Sprite viewer
  modeArt: "アート",
  mode3d: "3D",
  mode2d: "2D",
  spriteSideAria: "スプライトの向き",
  front: "正面",
  back: "背面",
  spriteAlt: (name: string, side: "front" | "back") =>
    `${name}（${side === "back" ? "背面" : "正面"}）`,
  dragToRotate: "ドラッグで回転",
  viewModeAria: "表示モード",
  shinyToggleTitle: "色違いの切り替え",
  noShinyTitle: "色違いスプライトなし",
  shiny: "色違い",
  loadingModel: "モデルを読み込み中…",

  // Hero / dex entry
  dexEntry: "図鑑データ",
  height: "高さ",
  weight: "重さ",
  baseExp: "基礎経験値",
  growth: "経験値タイプ",
  capture: "捕まえやすさ",
  happiness: "なつき度",
  captureVeryEasy: "とても簡単",
  captureEasy: "簡単",
  captureMedium: "普通",
  captureHard: "難しい",
  captureVeryHard: "とても難しい",

  // Detail tabs
  tabsAria: "データのセクション",
  tabGeneral: "基本 & 種族値",
  tabCompetitive: "対戦 & わざ",
  tabBreeding: "タマゴ & 生息地",

  // Panel titles
  baseStats: "種族値",
  combatAnalysis: "バトル分析",
  abilities: "特性",
  moves: "わざ",
  breedingProfile: "タマゴとプロフィール",

  // Abilities
  hiddenBadge: "● 隠れ特性",
  untilGenBadge: (gen: string) => `● ${gen}まで`,
  uniqueBadge: "◆ 唯一",
  lineExclusiveBadge: "◆ 系統限定",
  holdersLabel: (count: number): string => "所持者",

  // Breeding & profile
  gender: "性別",
  genderless: "性別不明",
  eggGroups: "タマゴグループ",
  eggCycles: "タマゴのサイクル",
  cyclesCount: (cycles: number) => `${cycles}サイクル`,
  stepsApprox: (steps: string) => `· 約${steps}歩`,
  wildItems: "野生時の持ち物",
  habitat: "生息地",
  unknownHabitat: "不明",
  bodyShape: "体形",
  color: "色",

  // Stats dashboard
  statsAria: (list: string, total: number) =>
    `種族値：${list}。合計 ${total}。`,
  bestStat: "最高の種族値",
  total: "合計",
  evYield: "獲得努力値",
  realRanges: "実数値の範囲",
  realRangesNote: "（個体値 0–31 · 努力値 0–252 · 性格補正込み）",
  levelLabel: "レベル",
  levelSliderAria: "能力値を計算するレベル",
  statMin: "最小",
  statMax: "最大",

  // Type matchups
  noTypeData: "タイプデータなし。",
  matchupX4: "致命的な弱点",
  matchupX2: "弱点",
  matchupX05: "耐性",
  matchupX025: "強い耐性",
  matchupX0: "無効",

  // Pro insights
  competitiveRead: "対戦での評価",
  baseTotal: "種族値合計",
  starStat: "看板ステータス",
  speedLv100: "すばやさ · Lv.100",
  baseOf: (value: number) => `（種族値 ${value}）`,
  danger: (factor: string) => `危険度 ${factor}`,
  noWeaknesses: "弱点なし",
  immunities: "無効タイプ",
  none: "なし",

  // Moves panel
  learnsetPrefix: "全わざリストは",
  learnsetSuffix: "で確認。",
  learnMethodAria: "習得方法",
  tabLevelUp: "レベルアップ",
  tabMachine: "わざマシン",
  tabEgg: "タマゴ",
  tabTutor: "教え技",
  damagePhysical: "物理",
  damageSpecial: "特殊",
  damageStatus: "変化",
  levelShort: (level: number) => `Lv.${level}`,
  evolveShort: "進化",
  moveMeta: (power: string, accuracy: string, pp: string) =>
    `威力 ${power} · 命中 ${accuracy} · PP ${pp}`,

  // Evolution chain
  evolutionChain: "進化の流れ",
  noEvolution: "このポケモンは進化しない。",

  // TCG cards
  tcgCards: "ポケカのカード",
  tcgGalleryAria: "ポケカのカードギャラリー",
  tcgLoadError:
    "カードギャラリーを読み込めませんでした。後でもう一度お試しください。",
  tcgEmpty: (name: string) => `${name}のポケカのカードは見つかりませんでした。`,
  tcgShowing: (shown: number, total: number) =>
    `全${total}枚中${shown}枚を表示中。`,
};

const ko: typeof es = {
  // Metadata
  metaDescription: (name: string) =>
    `${name} 완전 도감: 타입, 종족값, 약점과 저항, 특성, 알 낳기, 진화, TCG 카드 정보.`,

  // Back button
  backToDex: "포켓몬 도감으로 돌아가기",

  // Cry button
  cryAria: (name: string) => `${name}의 울음소리 재생`,
  cry: "울음소리",

  // Sprite viewer
  modeArt: "아트",
  mode3d: "3D",
  mode2d: "2D",
  spriteSideAria: "스프라이트 방향",
  front: "앞면",
  back: "뒷면",
  spriteAlt: (name: string, side: "front" | "back") =>
    `${name} (${side === "back" ? "뒷면" : "앞면"})`,
  dragToRotate: "드래그해서 회전",
  viewModeAria: "표시 모드",
  shinyToggleTitle: "색이 다른 모습 전환",
  noShinyTitle: "색이 다른 스프라이트 없음",
  shiny: "색이 다른",
  loadingModel: "모델 로딩 중…",

  // Hero / dex entry
  dexEntry: "도감 정보",
  height: "키",
  weight: "몸무게",
  baseExp: "기초 경험치",
  growth: "성장 속도",
  capture: "포획률",
  happiness: "친밀도",
  captureVeryEasy: "매우 쉬움",
  captureEasy: "쉬움",
  captureMedium: "보통",
  captureHard: "어려움",
  captureVeryHard: "매우 어려움",

  // Detail tabs
  tabsAria: "도감 섹션",
  tabGeneral: "일반 & 종족값",
  tabCompetitive: "배틀 & 기술",
  tabBreeding: "알 낳기 & 서식지",

  // Panel titles
  baseStats: "종족값",
  combatAnalysis: "배틀 분석",
  abilities: "특성",
  moves: "기술",
  breedingProfile: "알 낳기와 프로필",

  // Abilities
  hiddenBadge: "● 숨겨진 특성",
  untilGenBadge: (gen: string) => `● ${gen}까지`,
  uniqueBadge: "◆ 유일",
  lineExclusiveBadge: "◆ 계통 전용",
  holdersLabel: (count: number): string => "보유자",

  // Breeding & profile
  gender: "성별",
  genderless: "무성",
  eggGroups: "알그룹",
  eggCycles: "알 부화 사이클",
  cyclesCount: (cycles: number) => `${cycles}사이클`,
  stepsApprox: (steps: string) => `· 약 ${steps}걸음`,
  wildItems: "야생에서 지닌 도구",
  habitat: "서식지",
  unknownHabitat: "알 수 없음",
  bodyShape: "체형",
  color: "색",

  // Stats dashboard
  statsAria: (list: string, total: number) =>
    `종족값: ${list}. 합계 ${total}.`,
  bestStat: "최고 종족값",
  total: "합계",
  evYield: "획득 노력치",
  realRanges: "실능치 범위",
  realRangesNote: "(개체값 0–31 · 노력치 0–252 · 성격 보정 포함)",
  levelLabel: "레벨",
  levelSliderAria: "능력치를 계산할 레벨",
  statMin: "최소",
  statMax: "최대",

  // Type matchups
  noTypeData: "타입 데이터 없음.",
  matchupX4: "치명적 약점",
  matchupX2: "약점",
  matchupX05: "저항",
  matchupX025: "강한 저항",
  matchupX0: "무효",

  // Pro insights
  competitiveRead: "배틀 평가",
  baseTotal: "종족값 합계",
  starStat: "간판 스탯",
  speedLv100: "스피드 · Lv. 100",
  baseOf: (value: number) => `(종족값 ${value})`,
  danger: (factor: string) => `위험도 ${factor}`,
  noWeaknesses: "약점 없음",
  immunities: "무효 타입",
  none: "없음",

  // Moves panel
  learnsetPrefix: "전체 기술 목록은 ",
  learnsetSuffix: "에서 확인.",
  learnMethodAria: "습득 방법",
  tabLevelUp: "레벨 업",
  tabMachine: "기술머신",
  tabEgg: "알",
  tabTutor: "가르침 기술",
  damagePhysical: "물리",
  damageSpecial: "특수",
  damageStatus: "변화",
  levelShort: (level: number) => `Lv. ${level}`,
  evolveShort: "진화",
  moveMeta: (power: string, accuracy: string, pp: string) =>
    `위력 ${power} · 명중 ${accuracy} · PP ${pp}`,

  // Evolution chain
  evolutionChain: "진화 계보",
  noEvolution: "이 포켓몬은 진화하지 않는다.",

  // TCG cards
  tcgCards: "TCG 카드",
  tcgGalleryAria: "TCG 카드 갤러리",
  tcgLoadError:
    "카드 갤러리를 불러오지 못했습니다. 나중에 다시 시도해 주세요.",
  tcgEmpty: (name: string) => `${name}의 TCG 카드를 찾지 못했습니다.`,
  tcgShowing: (shown: number, total: number) =>
    `전체 ${total}장 중 ${shown}장 표시 중.`,
};

const zhHans: typeof es = {
  // Metadata
  metaDescription: (name: string) =>
    `${name}的完整图鉴：属性、种族值、弱点与抗性、特性、培育、进化及集换式卡牌。`,

  // Back button
  backToDex: "返回宝可梦图鉴",

  // Cry button
  cryAria: (name: string) => `播放${name}的叫声`,
  cry: "叫声",

  // Sprite viewer
  modeArt: "原画",
  mode3d: "3D",
  mode2d: "2D",
  spriteSideAria: "精灵图方向",
  front: "正面",
  back: "背面",
  spriteAlt: (name: string, side: "front" | "back") =>
    `${name}（${side === "back" ? "背面" : "正面"}）`,
  dragToRotate: "拖动以旋转",
  viewModeAria: "显示模式",
  shinyToggleTitle: "切换异色形态",
  noShinyTitle: "无异色精灵图",
  shiny: "异色",
  loadingModel: "模型加载中…",

  // Hero / dex entry
  dexEntry: "图鉴记录",
  height: "身高",
  weight: "体重",
  baseExp: "基础经验值",
  growth: "成长速度",
  capture: "捕获率",
  happiness: "亲密度",
  captureVeryEasy: "非常容易",
  captureEasy: "容易",
  captureMedium: "中等",
  captureHard: "困难",
  captureVeryHard: "非常困难",

  // Detail tabs
  tabsAria: "图鉴分区",
  tabGeneral: "综合 & 种族值",
  tabCompetitive: "对战 & 招式",
  tabBreeding: "培育 & 栖息地",

  // Panel titles
  baseStats: "种族值",
  combatAnalysis: "对战分析",
  abilities: "特性",
  moves: "招式",
  breedingProfile: "培育与档案",

  // Abilities
  hiddenBadge: "● 隐藏特性",
  untilGenBadge: (gen: string) => `● 截至${gen}`,
  uniqueBadge: "◆ 唯一",
  lineExclusiveBadge: "◆ 系谱专属",
  holdersLabel: (count: number): string => "个拥有者",

  // Breeding & profile
  gender: "性别",
  genderless: "无性别",
  eggGroups: "蛋群",
  eggCycles: "孵化周期",
  cyclesCount: (cycles: number) => `${cycles} 个周期`,
  stepsApprox: (steps: string) => `· 约 ${steps} 步`,
  wildItems: "野生携带道具",
  habitat: "栖息地",
  unknownHabitat: "未知",
  bodyShape: "体形",
  color: "颜色",

  // Stats dashboard
  statsAria: (list: string, total: number) =>
    `种族值：${list}。总和 ${total}。`,
  bestStat: "最强种族值",
  total: "总和",
  evYield: "击败可得努力值",
  realRanges: "实际数值范围",
  realRangesNote: "（个体值 0–31 · 努力值 0–252 · 含性格修正）",
  levelLabel: "等级",
  levelSliderAria: "用于计算能力值的等级",
  statMin: "最小",
  statMax: "最大",

  // Type matchups
  noTypeData: "暂无属性数据。",
  matchupX4: "致命弱点",
  matchupX2: "弱点",
  matchupX05: "抗性",
  matchupX025: "强抗性",
  matchupX0: "免疫",

  // Pro insights
  competitiveRead: "对战解读",
  baseTotal: "种族值总和",
  starStat: "王牌数值",
  speedLv100: "速度 · Lv. 100",
  baseOf: (value: number) => `（种族值 ${value}）`,
  danger: (factor: string) => `危险度 ${factor}`,
  noWeaknesses: "没有弱点",
  immunities: "免疫",
  none: "无",

  // Moves panel
  learnsetPrefix: "完整招式表见 ",
  learnsetSuffix: "。",
  learnMethodAria: "学习方式",
  tabLevelUp: "升级",
  tabMachine: "招式学习器",
  tabEgg: "蛋",
  tabTutor: "教授招式",
  damagePhysical: "物理",
  damageSpecial: "特殊",
  damageStatus: "变化",
  levelShort: (level: number) => `Lv. ${level}`,
  evolveShort: "进化",
  moveMeta: (power: string, accuracy: string, pp: string) =>
    `威力 ${power} · 命中 ${accuracy} · PP ${pp}`,

  // Evolution chain
  evolutionChain: "进化链",
  noEvolution: "这只宝可梦不会进化。",

  // TCG cards
  tcgCards: "集换式卡牌",
  tcgGalleryAria: "集换式卡牌图库",
  tcgLoadError: "无法加载卡牌图库，请稍后再试。",
  tcgEmpty: (name: string) => `未找到${name}的集换式卡牌。`,
  tcgShowing: (shown: number, total: number) =>
    `正在显示 ${shown} / ${total} 张卡牌。`,
};

const zhHant: typeof es = {
  // Metadata
  metaDescription: (name: string) =>
    `${name}的完整圖鑑：屬性、種族值、弱點與抗性、特性、培育、進化及集換式卡牌。`,

  // Back button
  backToDex: "返回寶可夢圖鑑",

  // Cry button
  cryAria: (name: string) => `播放${name}的叫聲`,
  cry: "叫聲",

  // Sprite viewer
  modeArt: "原畫",
  mode3d: "3D",
  mode2d: "2D",
  spriteSideAria: "精靈圖方向",
  front: "正面",
  back: "背面",
  spriteAlt: (name: string, side: "front" | "back") =>
    `${name}（${side === "back" ? "背面" : "正面"}）`,
  dragToRotate: "拖曳以旋轉",
  viewModeAria: "顯示模式",
  shinyToggleTitle: "切換異色形態",
  noShinyTitle: "無異色精靈圖",
  shiny: "異色",
  loadingModel: "模型載入中…",

  // Hero / dex entry
  dexEntry: "圖鑑紀錄",
  height: "身高",
  weight: "體重",
  baseExp: "基礎經驗值",
  growth: "成長速度",
  capture: "捕獲率",
  happiness: "親密度",
  captureVeryEasy: "非常容易",
  captureEasy: "容易",
  captureMedium: "中等",
  captureHard: "困難",
  captureVeryHard: "非常困難",

  // Detail tabs
  tabsAria: "圖鑑分區",
  tabGeneral: "綜合 & 種族值",
  tabCompetitive: "對戰 & 招式",
  tabBreeding: "培育 & 棲息地",

  // Panel titles
  baseStats: "種族值",
  combatAnalysis: "對戰分析",
  abilities: "特性",
  moves: "招式",
  breedingProfile: "培育與檔案",

  // Abilities
  hiddenBadge: "● 隱藏特性",
  untilGenBadge: (gen: string) => `● 截至${gen}`,
  uniqueBadge: "◆ 唯一",
  lineExclusiveBadge: "◆ 系譜專屬",
  holdersLabel: (count: number): string => "個擁有者",

  // Breeding & profile
  gender: "性別",
  genderless: "無性別",
  eggGroups: "蛋群",
  eggCycles: "孵化週期",
  cyclesCount: (cycles: number) => `${cycles} 個週期`,
  stepsApprox: (steps: string) => `· 約 ${steps} 步`,
  wildItems: "野生攜帶道具",
  habitat: "棲息地",
  unknownHabitat: "未知",
  bodyShape: "體形",
  color: "顏色",

  // Stats dashboard
  statsAria: (list: string, total: number) =>
    `種族值：${list}。總和 ${total}。`,
  bestStat: "最強種族值",
  total: "總和",
  evYield: "擊敗可得努力值",
  realRanges: "實際數值範圍",
  realRangesNote: "（個體值 0–31 · 努力值 0–252 · 含性格修正）",
  levelLabel: "等級",
  levelSliderAria: "用於計算能力值的等級",
  statMin: "最小",
  statMax: "最大",

  // Type matchups
  noTypeData: "暫無屬性資料。",
  matchupX4: "致命弱點",
  matchupX2: "弱點",
  matchupX05: "抗性",
  matchupX025: "強抗性",
  matchupX0: "免疫",

  // Pro insights
  competitiveRead: "對戰解讀",
  baseTotal: "種族值總和",
  starStat: "王牌數值",
  speedLv100: "速度 · Lv. 100",
  baseOf: (value: number) => `（種族值 ${value}）`,
  danger: (factor: string) => `危險度 ${factor}`,
  noWeaknesses: "沒有弱點",
  immunities: "免疫",
  none: "無",

  // Moves panel
  learnsetPrefix: "完整招式表見 ",
  learnsetSuffix: "。",
  learnMethodAria: "學習方式",
  tabLevelUp: "升級",
  tabMachine: "招式學習器",
  tabEgg: "蛋",
  tabTutor: "傳授招式",
  damagePhysical: "物理",
  damageSpecial: "特殊",
  damageStatus: "變化",
  levelShort: (level: number) => `Lv. ${level}`,
  evolveShort: "進化",
  moveMeta: (power: string, accuracy: string, pp: string) =>
    `威力 ${power} · 命中 ${accuracy} · PP ${pp}`,

  // Evolution chain
  evolutionChain: "進化鏈",
  noEvolution: "這隻寶可夢不會進化。",

  // TCG cards
  tcgCards: "集換式卡牌",
  tcgGalleryAria: "集換式卡牌圖庫",
  tcgLoadError: "無法載入卡牌圖庫，請稍後再試。",
  tcgEmpty: (name: string) => `找不到${name}的集換式卡牌。`,
  tcgShowing: (shown: number, total: number) =>
    `正在顯示 ${shown} / ${total} 張卡牌。`,
};

export const detailDict: Record<Lang, typeof es> = {
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

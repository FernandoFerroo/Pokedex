import type { MovePreset } from "@/lib/battle/move-presets";
import type { Lang } from "../config";

/** Team builder: gold CTA banner, header chip, drawer, species picker,
 * inline search, coverage analysis, AI coach/generator and build editor. */
const es = {
  // Drawer header (the CTA banner and header chip live in home/layout dicts)
  myTeam: "MI EQUIPO",
  clear: "Vaciar",

  // Shared entry rows / quick-add button
  alreadyInTeam: "Ya está en el equipo",
  teamFull: "Equipo completo (6/6)",
  addName: (name: string) => `Añadir a ${name}`,
  addNameToTeam: (name: string) => `Añadir a ${name} al equipo`,
  removeNameFromTeam: (name: string) => `Quitar a ${name} del equipo`,
  addToMyTeam: "Añadir a mi equipo",
  removeFromMyTeam: "Quitar de mi equipo",

  // Species picker (modal)
  closePicker: "Cerrar selector",
  pickerDialogAria: (slot: number) =>
    `Elegir Pokémon para la ranura ${slot}`,
  pickerTitle: "ELIGE UN POKÉMON",
  pickerSlot: (slot: number) => `Ranura ${slot}`,
  pickerPlaceholder: "Filtra por nombre (ej. pikachu)…",
  pickerFilterAria: "Filtrar Pokémon por nombre",
  onScreenNow: "En pantalla ahora",
  indexErrorRetryClose:
    "No se pudo cargar el índice de especies. Cierra y vuelve a intentarlo.",
  loadingSpecies: "Cargando especies…",
  noResultsEnglishNames: (query: string) =>
    `Sin resultados para «${query}» (los nombres van en inglés).`,

  // Roster slots
  choosePokemon: "Elegir Pokémon",
  choose: "Elegir",
  levelAbbr: "Nv.",
  levelOfAria: (name: string) => `Nivel de ${name}`,
  buildConfigureAria: (name: string) =>
    `Configurar habilidad y movimientos de ${name}`,
  buildCustomTitle: "Build personalizada — habilidad y movimientos",
  buildChooseTitle: "Elegir habilidad y movimientos",
  buildChooseHint: "Habilidades",
  buildEditHint: "Habilidades",
  buildChooseForAria: (name: string) =>
    `Elegir habilidad y movimientos de ${name}`,
  viewEntryTitle: (name: string) => `Ver la ficha de ${name}`,

  // Inline search
  searchPlaceholder: "Busca cualquier Pokémon para ficharlo (ej. pikachu)…",
  searchAria: "Buscar Pokémon para añadir al equipo",
  indexErrorRetryReload:
    "No se pudo cargar el índice de especies. Recarga e inténtalo de nuevo.",

  // Coach report
  coachReportTitle: "Informe del Coach Bot",
  suggestedSwaps: "Cambios sugeridos",
  swapApplied: "✓ Aplicado",
  apply: "Aplicar",
  swapUnavailable: "No se pudo localizar la especie sugerida",
  swapTitle: (outName: string, inName: string) =>
    `Cambiar ${outName} por ${inName}`,

  // Drawer chrome
  drawerAria: "Creador de equipos",
  closeTeamAria: "Cerrar el equipo",

  // AI errors (client-side fallbacks)
  coachNoReply: "El Coach Bot no responde. Inténtalo de nuevo.",
  coachOffline: "Sin conexión con el Coach Bot…",

  // AI generator
  generatedByCoach: "Equipo generado por el Coach Bot",
  aiTitleEmpty: "¿Sin equipo? Pídeselo a la IA",
  aiTitleModify: "Modifica tu equipo con IA",
  aiBodyEmpty:
    "Describe el equipo que quieres y el Coach Bot montará uno optimizado de 6 Pokémon.",
  aiBodyModify:
    "Describe los cambios que quieres (o un equipo nuevo) y el Coach Bot reajustará el roster completo de 6 Pokémon.",
  aiPlaceholderEmpty:
    "Ej.: un equipo equilibrado de la Gen I con Charizard de estrella, o un equipo de tipo Agua resistente…",
  aiPlaceholderModify:
    "Ej.: cambia los débiles a Tierra por tipos Agua, o hazlo más ofensivo sin quitar a Charizard…",
  aiWishAria:
    "Describe el equipo que quieres generar o los cambios que quieres aplicar",
  aiBuilding: "Montando equipo…",
  aiRequestUpdate: "✨ Solicitar actualización",
  clearAria: "Vaciar el equipo",
  aiGenerate: "✨ Generar equipo con IA",

  // Coverage analysis
  criticalWeaknesses: "Debilidades críticas",
  noCriticalWeaknesses: (threshold: number) =>
    `Ninguna: ningún tipo golpea a ${threshold}+ miembros.`,
  memberCount: (count: number, total: number) => `${count} de ${total}`,
  strongResistances: "Resistencias fuertes",
  noStrongResistances: (threshold: number) =>
    `Aún ninguna resistencia compartida por ${threshold}+ miembros.`,
  missingCoverage: "Sin cobertura ofensiva",
  fullCoverage: "Tu STAB golpea con eficacia a los 18 tipos.",

  // AI coach controls
  analyzing: "Analizando…",
  analyzeAgain: "🤖 Volver a analizar",
  analyzeWithAi: "🤖 Analizar con IA",
  staleReport: "El equipo cambió desde este informe: vuelve a analizar.",
  emptyTeamHint:
    "También puedes pulsar «+» en una ranura, buscar arriba, o fichar desde cualquier tarjeta del listado.",

  // Build editor
  damageClass: {
    physical: "Físico",
    special: "Especial",
    status: "Estado",
  } as Record<string, string>,
  movePower: (value: string | number) => `Potencia ${value}`,
  moveAccuracy: (value: string | number) => `Precisión ${value}`,
  movePp: (value: string | number) => `PP ${value}`,
  movePowerAbbr: (value: string | number) => `Pot. ${value}`,
  moveAccuracyAbbr: (value: string | number) => `· Prec. ${value}`,
  removeMoveAria: (label: string) => `Quitar ${label}`,
  emptyMoveSlot: "Elige un movimiento de la lista…",
  loadingMoves: "Cargando movimientos…",
  moveNoResults: (query: string) => `Sin resultados para «${query}».`,
  movesFullTitle: "Ya tienes 4 movimientos: quita uno para cambiarlo",
  buildCloseAria: "Cerrar configuración",
  buildDialogAria: (name: string) => `Configuración de combate de ${name}`,
  buildTitle: "CONFIGURACIÓN DE COMBATE",
  buildOptionsError:
    "No se pudieron cargar las habilidades y movimientos de esta especie. Cierra y vuelve a intentarlo.",
  ability: "Habilidad",
  abilityAuto: "Automática (habilidad principal)",
  abilityHiddenSuffix: " · Oculta",
  abilityHiddenBadge: "Oculta",
  movesHeading: (chosen: number) => `Movimientos elegidos (${chosen}/4)`,
  buildLevel: "Nivel",
  buildLevelAria: (name: string) => `Nivel de combate de ${name}`,
  learnLevel: (level: number) => `Nv. ${level}`,
  learnStart: "Inicial",
  learnMachine: "MT/MO",
  learnEgg: "Huevo",
  learnTutor: "Tutor",
  moveSourceAria: "Origen del movimiento",
  sourceLevel: "Por nivel",
  sourceMachine: "Por MT/MO",
  sourceLevelHint: (level: number) =>
    `Movimientos que aprende al subir de nivel. A Nv. ${level} solo puedes elegir los que ya ha desbloqueado.`,
  sourceMachineHint:
    "Máquinas técnicas compatibles con esta especie. No piden nivel, pero solo aparecen las que puede usar.",
  onlyKnown: (level: number) => `Solo Nv. ${level}`,
  onlyKnownTitle: (level: number) =>
    `Muestra solo los movimientos que ya conoce a Nv. ${level}`,
  notYetTitle: (level: number) =>
    `Todavía no lo conoce: lo aprende a Nv. ${level}`,
  prunedByLevel: (names: string, level: number) =>
    `Quitados por no conocerlos a Nv. ${level}: ${names}.`,
  movesHelpLevel: (level: number) =>
    `Elige hasta 4 movimientos entre los que aprende por nivel (los que ya tiene a Nv. ${level}) y las MT/MO que puede usar. Las ranuras vacías se completan solas al empezar el combate.`,
  allMovesHeading: "Todos los movimientos",
  allMovesCount: (shown: number, total: number) => ` (${shown}/${total})`,
  movesFilterPlaceholder: "Filtra por nombre (ej. lanzallamas)…",
  movesFilterAria: "Filtrar movimientos por nombre",
  catalogueNote:
    "Se listan los movimientos del juego más reciente que la especie aprende por nivel o por MT/MO; nada más es elegible. Los ataques de potencia variable se calculan en combate y los movimientos de estado aplican sus cambios de stats, estados alterados y curación (de forma simplificada).",
  reset: "Restablecer",
  saveBuild: "Guardar build",

  // Build editor: AI move coach
  coachMoveTitle: "Entrenador IA",
  coachMoveHint: (level: number) =>
    `Pide el set que quieras y te llena las 4 ranuras. Solo elige entre lo que esta especie ya puede usar a Nv. ${level}: por nivel o por MT/MO.`,
  coachMovePresets: "Sugerencias",
  coachMovePreset: {
    competitive: "Set competitivo",
    physical: "Máximo ataque físico",
    special: "Máximo ataque especial",
    coverage: "Cobertura de tipos",
    status: "Estados y control",
    bulky: "Aguante y desgaste",
  } as Record<MovePreset, string>,
  coachMovePlaceholder: "Ej.: ofensivo, pero con algo para los tipo agua…",
  coachMoveAria: "Describe los movimientos que quieres",
  coachMoveRun: "Pedir a la IA",
  coachMoveRunning: "Eligiendo movimientos…",
  coachMoveToppedUp:
    "La IA no llenó las 4 ranuras: los huecos se han completado con sus mejores ataques.",
  coachMoveErrEmpty: "Escribe qué movimientos buscas o pulsa una sugerencia.",
  coachMoveErrNoMoves:
    "Esta especie no tiene movimientos elegibles a este nivel.",
  coachMoveErrFailed:
    "La IA no ha podido elegir los movimientos. Inténtalo otra vez.",

  // /api/battle/build-options errors
  apiInvalidSpecies: "Especie inválida.",
  apiOptionsError: "No se pudieron cargar las opciones de esa especie.",
};

const en: typeof es = {
  // Drawer header (the CTA banner and header chip live in home/layout dicts)
  myTeam: "MY TEAM",
  clear: "Clear",

  // Shared entry rows / quick-add button
  alreadyInTeam: "Already on the team",
  teamFull: "Team full (6/6)",
  addName: (name: string) => `Add ${name}`,
  addNameToTeam: (name: string) => `Add ${name} to the team`,
  removeNameFromTeam: (name: string) => `Remove ${name} from the team`,
  addToMyTeam: "Add to my team",
  removeFromMyTeam: "Remove from my team",

  // Species picker (modal)
  closePicker: "Close picker",
  pickerDialogAria: (slot: number) => `Choose a Pokémon for slot ${slot}`,
  pickerTitle: "CHOOSE A POKÉMON",
  pickerSlot: (slot: number) => `Slot ${slot}`,
  pickerPlaceholder: "Filter by name (e.g. pikachu)…",
  pickerFilterAria: "Filter Pokémon by name",
  onScreenNow: "On screen now",
  indexErrorRetryClose:
    "Couldn't load the species index. Close and try again.",
  loadingSpecies: "Loading species…",
  noResultsEnglishNames: (query: string) =>
    `No results for "${query}" (names are in English).`,

  // Roster slots
  choosePokemon: "Choose a Pokémon",
  choose: "Choose",
  levelAbbr: "Lv.",
  levelOfAria: (name: string) => `Level of ${name}`,
  buildConfigureAria: (name: string) => `Set ${name}'s ability and moves`,
  buildCustomTitle: "Custom build — ability and moves",
  buildChooseTitle: "Choose ability and moves",
  buildChooseHint: "Moves",
  buildEditHint: "Moves",
  buildChooseForAria: (name: string) =>
    `Choose ${name}'s ability and moves`,
  viewEntryTitle: (name: string) => `View ${name}'s Pokédex entry`,

  // Inline search
  searchPlaceholder: "Search any Pokémon to recruit it (e.g. pikachu)…",
  searchAria: "Search for a Pokémon to add to the team",
  indexErrorRetryReload:
    "Couldn't load the species index. Reload and try again.",

  // Coach report
  coachReportTitle: "Coach Bot report",
  suggestedSwaps: "Suggested swaps",
  swapApplied: "✓ Applied",
  apply: "Apply",
  swapUnavailable: "Couldn't find the suggested species",
  swapTitle: (outName: string, inName: string) =>
    `Swap ${outName} for ${inName}`,

  // Drawer chrome
  drawerAria: "Team builder",
  closeTeamAria: "Close the team",

  // AI errors (client-side fallbacks)
  coachNoReply: "The Coach Bot isn't responding. Try again.",
  coachOffline: "No connection to the Coach Bot…",

  // AI generator
  generatedByCoach: "Team generated by the Coach Bot",
  aiTitleEmpty: "No team? Ask the AI",
  aiTitleModify: "Tweak your team with AI",
  aiBodyEmpty:
    "Describe the team you want and the Coach Bot will put together an optimized roster of 6 Pokémon.",
  aiBodyModify:
    "Describe the changes you want (or a brand-new team) and the Coach Bot will rework the full 6-Pokémon roster.",
  aiPlaceholderEmpty:
    "E.g.: a balanced Gen I team with Charizard as the star, or a sturdy Water-type team…",
  aiPlaceholderModify:
    "E.g.: swap the Ground-weak members for Water types, or make it more offensive without dropping Charizard…",
  aiWishAria:
    "Describe the team you want to generate or the changes you want to apply",
  aiBuilding: "Building team…",
  aiRequestUpdate: "✨ Request an update",
  clearAria: "Clear the team",
  aiGenerate: "✨ Generate team with AI",

  // Coverage analysis
  criticalWeaknesses: "Critical weaknesses",
  noCriticalWeaknesses: (threshold: number) =>
    `None: no type hits ${threshold}+ members.`,
  memberCount: (count: number, total: number) => `${count} of ${total}`,
  strongResistances: "Strong resistances",
  noStrongResistances: (threshold: number) =>
    `No resistance shared by ${threshold}+ members yet.`,
  missingCoverage: "No offensive coverage",
  fullCoverage: "Your STAB hits all 18 types effectively.",

  // AI coach controls
  analyzing: "Analyzing…",
  analyzeAgain: "🤖 Analyze again",
  analyzeWithAi: "🤖 Analyze with AI",
  staleReport: "The team changed since this report: analyze again.",
  emptyTeamHint:
    'You can also press "+" on a slot, search above, or recruit from any card in the list.',

  // Build editor
  damageClass: {
    physical: "Physical",
    special: "Special",
    status: "Status",
  } as Record<string, string>,
  movePower: (value: string | number) => `Power ${value}`,
  moveAccuracy: (value: string | number) => `Accuracy ${value}`,
  movePp: (value: string | number) => `PP ${value}`,
  movePowerAbbr: (value: string | number) => `Pwr ${value}`,
  moveAccuracyAbbr: (value: string | number) => `· Acc ${value}`,
  removeMoveAria: (label: string) => `Remove ${label}`,
  emptyMoveSlot: "Pick a move from the list…",
  loadingMoves: "Loading moves…",
  moveNoResults: (query: string) => `No results for "${query}".`,
  movesFullTitle: "You already have 4 moves: remove one to swap it",
  buildCloseAria: "Close settings",
  buildDialogAria: (name: string) => `Battle settings for ${name}`,
  buildTitle: "BATTLE SETTINGS",
  buildOptionsError:
    "Couldn't load this species' abilities and moves. Close and try again.",
  ability: "Ability",
  abilityAuto: "Automatic (primary ability)",
  abilityHiddenSuffix: " · Hidden",
  abilityHiddenBadge: "Hidden",
  movesHeading: (chosen: number) => `Chosen moves (${chosen}/4)`,
  buildLevel: "Level",
  buildLevelAria: (name: string) => `Battle level of ${name}`,
  learnLevel: (level: number) => `Lv. ${level}`,
  learnStart: "Start",
  learnMachine: "TM/HM",
  learnEgg: "Egg",
  learnTutor: "Tutor",
  moveSourceAria: "Move source",
  sourceLevel: "By level",
  sourceMachine: "By TM/HM",
  sourceLevelHint: (level: number) =>
    `Moves it unlocks as it levels up. At Lv. ${level} you can only pick the ones it has already learned.`,
  sourceMachineHint:
    "Technical machines this species is compatible with. No level requirement, and only the ones it can actually use are listed.",
  onlyKnown: (level: number) => `Lv. ${level} only`,
  onlyKnownTitle: (level: number) =>
    `Show only the moves it already knows at Lv. ${level}`,
  notYetTitle: (level: number) =>
    `Not known yet: it learns this at Lv. ${level}`,
  prunedByLevel: (names: string, level: number) =>
    `Removed — not known at Lv. ${level}: ${names}.`,
  movesHelpLevel: (level: number) =>
    `Pick up to 4 moves between the ones it learns by level (those it already has at Lv. ${level}) and the TM/HMs it can use. Empty slots fill themselves when the battle starts.`,
  allMovesHeading: "All moves",
  allMovesCount: (shown: number, total: number) => ` (${shown}/${total})`,
  movesFilterPlaceholder: "Filter by name (e.g. flamethrower)…",
  movesFilterAria: "Filter moves by name",
  catalogueNote:
    "Only the newest game's moves this species learns by level-up or TM/HM are listed; nothing else is selectable. Variable-power attacks are computed in battle, and status moves apply their stat changes, conditions and healing (in simplified form).",
  reset: "Reset",
  saveBuild: "Save build",

  // Build editor: AI move coach
  coachMoveTitle: "AI coach",
  coachMoveHint: (level: number) =>
    `Ask for the set you want and it fills all 4 slots. It only picks from what this species can already use at Lv. ${level}: level-up moves or TMs/HMs.`,
  coachMovePresets: "Suggestions",
  coachMovePreset: {
    competitive: "Competitive set",
    physical: "Max physical attack",
    special: "Max special attack",
    coverage: "Type coverage",
    status: "Status and control",
    bulky: "Bulky and stall",
  } as Record<MovePreset, string>,
  coachMovePlaceholder: "e.g. offensive, but with an answer to Water types…",
  coachMoveAria: "Describe the moves you want",
  coachMoveRun: "Ask the AI",
  coachMoveRunning: "Picking moves…",
  coachMoveToppedUp:
    "The AI didn't fill all 4 slots: the gaps were topped up with its strongest attacks.",
  coachMoveErrEmpty: "Type what you're after, or tap a suggestion.",
  coachMoveErrNoMoves: "This species has no eligible moves at this level.",
  coachMoveErrFailed: "The AI couldn't pick the moves. Try again.",

  // /api/battle/build-options errors
  apiInvalidSpecies: "Invalid species.",
  apiOptionsError: "Couldn't load that species' options.",
};

const fr: typeof es = {
  // Drawer header (the CTA banner and header chip live in home/layout dicts)
  myTeam: "MON ÉQUIPE",
  clear: "Vider",

  // Shared entry rows / quick-add button
  alreadyInTeam: "Déjà dans l'équipe",
  teamFull: "Équipe complète (6/6)",
  addName: (name: string) => `Ajouter ${name}`,
  addNameToTeam: (name: string) => `Ajouter ${name} à l'équipe`,
  removeNameFromTeam: (name: string) => `Retirer ${name} de l'équipe`,
  addToMyTeam: "Ajouter à mon équipe",
  removeFromMyTeam: "Retirer de mon équipe",

  // Species picker (modal)
  closePicker: "Fermer le sélecteur",
  pickerDialogAria: (slot: number) =>
    `Choisir un Pokémon pour l'emplacement ${slot}`,
  pickerTitle: "CHOISIS UN POKÉMON",
  pickerSlot: (slot: number) => `Emplacement ${slot}`,
  pickerPlaceholder: "Filtre par nom (ex. pikachu)…",
  pickerFilterAria: "Filtrer les Pokémon par nom",
  onScreenNow: "À l'écran en ce moment",
  indexErrorRetryClose:
    "Impossible de charger l'index des espèces. Ferme et réessaie.",
  loadingSpecies: "Chargement des espèces…",
  noResultsEnglishNames: (query: string) =>
    `Aucun résultat pour « ${query} » (les noms sont en anglais).`,

  // Roster slots
  choosePokemon: "Choisir un Pokémon",
  choose: "Choisir",
  levelAbbr: "N.",
  levelOfAria: (name: string) => `Niveau de ${name}`,
  buildConfigureAria: (name: string) =>
    `Configurer le talent et les capacités de ${name}`,
  buildCustomTitle: "Build personnalisé — talent et capacités",
  buildChooseTitle: "Choisir le talent et les capacités",
  buildChooseHint: "Choisir les capacités",
  buildEditHint: "Modifier les capacités",
  buildChooseForAria: (name: string) =>
    `Choisir le talent et les capacités de ${name}`,
  viewEntryTitle: (name: string) => `Voir la fiche de ${name}`,

  // Inline search
  searchPlaceholder:
    "Cherche n'importe quel Pokémon à recruter (ex. pikachu)…",
  searchAria: "Chercher un Pokémon à ajouter à l'équipe",
  indexErrorRetryReload:
    "Impossible de charger l'index des espèces. Recharge et réessaie.",

  // Coach report
  coachReportTitle: "Rapport du Coach Bot",
  suggestedSwaps: "Échanges suggérés",
  swapApplied: "✓ Appliqué",
  apply: "Appliquer",
  swapUnavailable: "Impossible de trouver l'espèce suggérée",
  swapTitle: (outName: string, inName: string) =>
    `Échanger ${outName} contre ${inName}`,

  // Drawer chrome
  drawerAria: "Créateur d'équipes",
  closeTeamAria: "Fermer l'équipe",

  // AI errors (client-side fallbacks)
  coachNoReply: "Le Coach Bot ne répond pas. Réessaie.",
  coachOffline: "Pas de connexion avec le Coach Bot…",

  // AI generator
  generatedByCoach: "Équipe générée par le Coach Bot",
  aiTitleEmpty: "Pas d'équipe ? Demande à l'IA",
  aiTitleModify: "Modifie ton équipe avec l'IA",
  aiBodyEmpty:
    "Décris l'équipe que tu veux et le Coach Bot montera un roster optimisé de 6 Pokémon.",
  aiBodyModify:
    "Décris les changements souhaités (ou une équipe toute neuve) et le Coach Bot réajustera le roster complet de 6 Pokémon.",
  aiPlaceholderEmpty:
    "Ex. : une équipe équilibrée de la 1re Gén avec Dracaufeu en vedette, ou une équipe de type Eau bien solide…",
  aiPlaceholderModify:
    "Ex. : remplace les membres faibles au Sol par des types Eau, ou rends-la plus offensive sans lâcher Dracaufeu…",
  aiWishAria:
    "Décris l'équipe à générer ou les changements à appliquer",
  aiBuilding: "Montage de l'équipe…",
  aiRequestUpdate: "✨ Demander une mise à jour",
  clearAria: "Vider l'équipe",
  aiGenerate: "✨ Générer une équipe avec l'IA",

  // Coverage analysis
  criticalWeaknesses: "Faiblesses critiques",
  noCriticalWeaknesses: (threshold: number) =>
    `Aucune : aucun type ne touche ${threshold}+ membres.`,
  memberCount: (count: number, total: number) => `${count} sur ${total}`,
  strongResistances: "Résistances fortes",
  noStrongResistances: (threshold: number) =>
    `Encore aucune résistance partagée par ${threshold}+ membres.`,
  missingCoverage: "Sans couverture offensive",
  fullCoverage: "Ton STAB touche efficacement les 18 types.",

  // AI coach controls
  analyzing: "Analyse en cours…",
  analyzeAgain: "🤖 Analyser à nouveau",
  analyzeWithAi: "🤖 Analyser avec l'IA",
  staleReport: "L'équipe a changé depuis ce rapport : relance l'analyse.",
  emptyTeamHint:
    "Tu peux aussi appuyer sur « + » sur un emplacement, chercher ci-dessus, ou recruter depuis n'importe quelle carte de la liste.",

  // Build editor
  damageClass: {
    physical: "Physique",
    special: "Spécial",
    status: "Statut",
  } as Record<string, string>,
  movePower: (value: string | number) => `Puissance ${value}`,
  moveAccuracy: (value: string | number) => `Précision ${value}`,
  movePp: (value: string | number) => `PP ${value}`,
  movePowerAbbr: (value: string | number) => `Puis. ${value}`,
  moveAccuracyAbbr: (value: string | number) => `· Préc. ${value}`,
  removeMoveAria: (label: string) => `Retirer ${label}`,
  emptyMoveSlot: "Choisis une capacité dans la liste…",
  loadingMoves: "Chargement des capacités…",
  moveNoResults: (query: string) => `Aucun résultat pour « ${query} ».`,
  movesFullTitle:
    "Tu as déjà 4 capacités : retires-en une pour la remplacer",
  buildCloseAria: "Fermer la configuration",
  buildDialogAria: (name: string) => `Configuration de combat de ${name}`,
  buildTitle: "CONFIGURATION DE COMBAT",
  buildOptionsError:
    "Impossible de charger les talents et capacités de cette espèce. Ferme et réessaie.",
  ability: "Talent",
  abilityAuto: "Automatique (talent principal)",
  abilityHiddenSuffix: " · Caché",
  abilityHiddenBadge: "Caché",
  movesHeading: (chosen: number) => `Capacités choisies (${chosen}/4)`,
  buildLevel: "Niveau",
  buildLevelAria: (name: string) => `Niveau de combat de ${name}`,
  learnLevel: (level: number) => `Nv. ${level}`,
  learnStart: "Départ",
  learnMachine: "CT/CS",
  learnEgg: "Œuf",
  learnTutor: "Tuteur",
  moveSourceAria: "Origine de la capacité",
  sourceLevel: "Par niveau",
  sourceMachine: "Par CT/CS",
  sourceLevelHint: (level: number) =>
    `Capacités apprises en montant de niveau. Au Nv. ${level}, tu ne peux choisir que celles déjà débloquées.`,
  sourceMachineHint:
    "Capsules techniques compatibles avec cette espèce. Aucun niveau requis, et seules celles qu'elle peut utiliser sont listées.",
  onlyKnown: (level: number) => `Nv. ${level} seulement`,
  onlyKnownTitle: (level: number) =>
    `N'afficher que les capacités déjà connues au Nv. ${level}`,
  notYetTitle: (level: number) =>
    `Pas encore connue : apprise au Nv. ${level}`,
  prunedByLevel: (names: string, level: number) =>
    `Retirées, inconnues au Nv. ${level} : ${names}.`,
  movesHelpLevel: (level: number) =>
    `Choisis jusqu'à 4 capacités parmi celles apprises par niveau (celles qu'il a déjà au Nv. ${level}) et les CT/CS qu'il peut utiliser. Les emplacements vides se remplissent seuls au début du combat.`,
  allMovesHeading: "Toutes les capacités",
  allMovesCount: (shown: number, total: number) => ` (${shown}/${total})`,
  movesFilterPlaceholder: "Filtre par nom (ex. lance-flammes)…",
  movesFilterAria: "Filtrer les capacités par nom",
  catalogueNote:
    "Seules les capacités du jeu le plus récent apprises par niveau ou par CT/CS sont listées ; rien d'autre n'est sélectionnable. Les attaques à puissance variable sont calculées en combat et les capacités de statut appliquent leurs changements de stats, altérations d'état et soins (de façon simplifiée).",
  reset: "Réinitialiser",
  saveBuild: "Enregistrer le build",

  // Build editor: AI move coach
  coachMoveTitle: "Coach IA",
  coachMoveHint: (level: number) =>
    `Demandez le set que vous voulez : les 4 emplacements se remplissent avec ce que cette espèce peut déjà utiliser au N. ${level}, par niveau ou par CT/CS.`,
  coachMovePresets: "Suggestions",
  coachMovePreset: {
    competitive: "Set compétitif",
    physical: "Attaque physique max",
    special: "Attaque spéciale max",
    coverage: "Couverture de types",
    status: "Statut et contrôle",
    bulky: "Endurance et usure",
  } as Record<MovePreset, string>,
  coachMovePlaceholder: "Ex. : offensif, mais avec une réponse aux types Eau…",
  coachMoveAria: "Décrivez les capacités que vous voulez",
  coachMoveRun: "Demander à l'IA",
  coachMoveRunning: "Sélection en cours…",
  coachMoveToppedUp:
    "L'IA n'a pas rempli les 4 emplacements : les trous ont été complétés avec ses attaques les plus fortes.",
  coachMoveErrEmpty: "Écrivez ce que vous cherchez ou touchez une suggestion.",
  coachMoveErrNoMoves: "Cette espèce n'a aucune capacité éligible à ce niveau.",
  coachMoveErrFailed:
    "L'IA n'a pas pu choisir les capacités. Réessayez.",

  // /api/battle/build-options errors
  apiInvalidSpecies: "Espèce invalide.",
  apiOptionsError: "Impossible de charger les options de cette espèce.",
};

const de: typeof es = {
  // Drawer header (the CTA banner and header chip live in home/layout dicts)
  myTeam: "MEIN TEAM",
  clear: "Leeren",

  // Shared entry rows / quick-add button
  alreadyInTeam: "Schon im Team",
  teamFull: "Team voll (6/6)",
  addName: (name: string) => `${name} hinzufügen`,
  addNameToTeam: (name: string) => `${name} zum Team hinzufügen`,
  removeNameFromTeam: (name: string) => `${name} aus dem Team entfernen`,
  addToMyTeam: "Zu meinem Team hinzufügen",
  removeFromMyTeam: "Aus meinem Team entfernen",

  // Species picker (modal)
  closePicker: "Auswahl schließen",
  pickerDialogAria: (slot: number) => `Pokémon für Platz ${slot} wählen`,
  pickerTitle: "WÄHLE EIN POKÉMON",
  pickerSlot: (slot: number) => `Platz ${slot}`,
  pickerPlaceholder: "Nach Name filtern (z. B. pikachu)…",
  pickerFilterAria: "Pokémon nach Name filtern",
  onScreenNow: "Gerade auf dem Bildschirm",
  indexErrorRetryClose:
    "Der Arten-Index konnte nicht geladen werden. Schließen und erneut versuchen.",
  loadingSpecies: "Arten werden geladen…",
  noResultsEnglishNames: (query: string) =>
    `Keine Treffer für „${query}“ (Namen sind auf Englisch).`,

  // Roster slots
  choosePokemon: "Pokémon wählen",
  choose: "Wählen",
  levelAbbr: "Lv.",
  levelOfAria: (name: string) => `Level von ${name}`,
  buildConfigureAria: (name: string) =>
    `Fähigkeit und Attacken von ${name} einstellen`,
  buildCustomTitle: "Eigenes Build — Fähigkeit und Attacken",
  buildChooseTitle: "Fähigkeit und Attacken wählen",
  buildChooseHint: "Attacken wählen",
  buildEditHint: "Attacken bearbeiten",
  buildChooseForAria: (name: string) =>
    `Fähigkeit und Attacken von ${name} wählen`,
  viewEntryTitle: (name: string) => `Pokédex-Eintrag von ${name} ansehen`,

  // Inline search
  searchPlaceholder:
    "Such ein beliebiges Pokémon zum Anwerben (z. B. pikachu)…",
  searchAria: "Pokémon suchen, um es zum Team hinzuzufügen",
  indexErrorRetryReload:
    "Der Arten-Index konnte nicht geladen werden. Neu laden und erneut versuchen.",

  // Coach report
  coachReportTitle: "Bericht des Coach-Bots",
  suggestedSwaps: "Vorgeschlagene Wechsel",
  swapApplied: "✓ Übernommen",
  apply: "Übernehmen",
  swapUnavailable: "Die vorgeschlagene Art wurde nicht gefunden",
  swapTitle: (outName: string, inName: string) =>
    `${outName} gegen ${inName} tauschen`,

  // Drawer chrome
  drawerAria: "Team-Baukasten",
  closeTeamAria: "Team schließen",

  // AI errors (client-side fallbacks)
  coachNoReply: "Der Coach-Bot antwortet nicht. Versuch es noch mal.",
  coachOffline: "Keine Verbindung zum Coach-Bot…",

  // AI generator
  generatedByCoach: "Vom Coach-Bot generiertes Team",
  aiTitleEmpty: "Kein Team? Frag die KI",
  aiTitleModify: "Optimiere dein Team mit KI",
  aiBodyEmpty:
    "Beschreib das Team, das du willst, und der Coach-Bot stellt ein optimiertes Team aus 6 Pokémon zusammen.",
  aiBodyModify:
    "Beschreib die gewünschten Änderungen (oder ein ganz neues Team) und der Coach-Bot überarbeitet das komplette 6er-Team.",
  aiPlaceholderEmpty:
    "Z. B.: ein ausgewogenes Team aus Gen I mit Glurak als Star, oder ein robustes Wasser-Team…",
  aiPlaceholderModify:
    "Z. B.: tausch die Boden-schwachen Mitglieder gegen Wasser-Typen, oder mach es offensiver, ohne Glurak aufzugeben…",
  aiWishAria:
    "Beschreib das Team, das generiert werden soll, oder die gewünschten Änderungen",
  aiBuilding: "Team wird zusammengestellt…",
  aiRequestUpdate: "✨ Aktualisierung anfordern",
  clearAria: "Team leeren",
  aiGenerate: "✨ Team mit KI generieren",

  // Coverage analysis
  criticalWeaknesses: "Kritische Schwächen",
  noCriticalWeaknesses: (threshold: number) =>
    `Keine: Kein Typ trifft ${threshold}+ Mitglieder.`,
  memberCount: (count: number, total: number) => `${count} von ${total}`,
  strongResistances: "Starke Resistenzen",
  noStrongResistances: (threshold: number) =>
    `Noch keine Resistenz, die ${threshold}+ Mitglieder teilen.`,
  missingCoverage: "Keine offensive Abdeckung",
  fullCoverage: "Dein STAB trifft alle 18 Typen effektiv.",

  // AI coach controls
  analyzing: "Analyse läuft…",
  analyzeAgain: "🤖 Erneut analysieren",
  analyzeWithAi: "🤖 Mit KI analysieren",
  staleReport:
    "Das Team hat sich seit diesem Bericht geändert: erneut analysieren.",
  emptyTeamHint:
    "Du kannst auch auf „+“ bei einem Platz tippen, oben suchen oder von jeder Karte in der Liste anwerben.",

  // Build editor
  damageClass: {
    physical: "Physisch",
    special: "Spezial",
    status: "Status",
  } as Record<string, string>,
  movePower: (value: string | number) => `Stärke ${value}`,
  moveAccuracy: (value: string | number) => `Genauigkeit ${value}`,
  movePp: (value: string | number) => `AP ${value}`,
  movePowerAbbr: (value: string | number) => `Stk. ${value}`,
  moveAccuracyAbbr: (value: string | number) => `· Gen. ${value}`,
  removeMoveAria: (label: string) => `${label} entfernen`,
  emptyMoveSlot: "Wähle eine Attacke aus der Liste…",
  loadingMoves: "Attacken werden geladen…",
  moveNoResults: (query: string) => `Keine Treffer für „${query}“.`,
  movesFullTitle:
    "Du hast schon 4 Attacken: Entferne eine, um zu tauschen",
  buildCloseAria: "Einstellungen schließen",
  buildDialogAria: (name: string) => `Kampfeinstellungen für ${name}`,
  buildTitle: "KAMPFEINSTELLUNGEN",
  buildOptionsError:
    "Fähigkeiten und Attacken dieser Art konnten nicht geladen werden. Schließen und erneut versuchen.",
  ability: "Fähigkeit",
  abilityAuto: "Automatisch (Hauptfähigkeit)",
  abilityHiddenSuffix: " · Versteckt",
  abilityHiddenBadge: "Versteckt",
  movesHeading: (chosen: number) => `Gewählte Attacken (${chosen}/4)`,
  buildLevel: "Level",
  buildLevelAria: (name: string) => `Kampflevel von ${name}`,
  learnLevel: (level: number) => `Lv. ${level}`,
  learnStart: "Start",
  learnMachine: "TM/VM",
  learnEgg: "Ei",
  learnTutor: "Lehrer",
  moveSourceAria: "Herkunft der Attacke",
  sourceLevel: "Nach Level",
  sourceMachine: "Nach TM/VM",
  sourceLevelHint: (level: number) =>
    `Attacken, die es beim Aufleveln erlernt. Auf Lv. ${level} kannst du nur bereits freigeschaltete wählen.`,
  sourceMachineHint:
    "Mit dieser Spezies kompatible Technische Maschinen. Ohne Levelanforderung, und gelistet werden nur die, die sie wirklich nutzen kann.",
  onlyKnown: (level: number) => `Nur Lv. ${level}`,
  onlyKnownTitle: (level: number) =>
    `Nur Attacken zeigen, die es auf Lv. ${level} schon kennt`,
  notYetTitle: (level: number) =>
    `Noch nicht bekannt: wird auf Lv. ${level} erlernt`,
  prunedByLevel: (names: string, level: number) =>
    `Entfernt, auf Lv. ${level} nicht bekannt: ${names}.`,
  movesHelpLevel: (level: number) =>
    `Wähle bis zu 4 Attacken aus denen, die es per Level erlernt (die es auf Lv. ${level} schon hat), und den TM/VM, die es nutzen kann. Leere Plätze füllen sich zu Kampfbeginn von selbst.`,
  allMovesHeading: "Alle Attacken",
  allMovesCount: (shown: number, total: number) => ` (${shown}/${total})`,
  movesFilterPlaceholder: "Nach Name filtern (z. B. flammenwurf)…",
  movesFilterAria: "Attacken nach Name filtern",
  catalogueNote:
    "Gelistet sind nur die Attacken des neuesten Spiels, die diese Spezies per Level oder TM/VM erlernt; mehr ist nicht wählbar. Attacken mit variabler Stärke werden im Kampf berechnet, und Status-Attacken wenden ihre Statuswert-Änderungen, Statusprobleme und Heilung an (vereinfacht).",
  reset: "Zurücksetzen",
  saveBuild: "Build speichern",

  // Build editor: AI move coach
  coachMoveTitle: "KI-Trainer",
  coachMoveHint: (level: number) =>
    `Sag, welches Set du willst — alle 4 Plätze werden gefüllt. Gewählt wird nur, was diese Art auf Lv. ${level} schon einsetzen kann: durch Level oder per TM/VM.`,
  coachMovePresets: "Vorschläge",
  coachMovePreset: {
    competitive: "Kompetitives Set",
    physical: "Maximaler physischer Angriff",
    special: "Maximaler Spezial-Angriff",
    coverage: "Typabdeckung",
    status: "Status und Kontrolle",
    bulky: "Robust und zermürbend",
  } as Record<MovePreset, string>,
  coachMovePlaceholder: "z. B. offensiv, aber mit einer Antwort auf Wasser…",
  coachMoveAria: "Beschreibe die gewünschten Attacken",
  coachMoveRun: "KI fragen",
  coachMoveRunning: "Attacken werden gewählt…",
  coachMoveToppedUp:
    "Die KI hat nicht alle 4 Plätze gefüllt: die Lücken wurden mit den stärksten Attacken aufgefüllt.",
  coachMoveErrEmpty: "Schreib, was du suchst, oder tippe einen Vorschlag an.",
  coachMoveErrNoMoves:
    "Diese Art hat auf diesem Level keine wählbaren Attacken.",
  coachMoveErrFailed:
    "Die KI konnte die Attacken nicht wählen. Versuch es erneut.",

  // /api/battle/build-options errors
  apiInvalidSpecies: "Ungültige Art.",
  apiOptionsError:
    "Die Optionen dieser Art konnten nicht geladen werden.",
};

const it: typeof es = {
  // Drawer header (the CTA banner and header chip live in home/layout dicts)
  myTeam: "LA MIA SQUADRA",
  clear: "Svuota",

  // Shared entry rows / quick-add button
  alreadyInTeam: "Già in squadra",
  teamFull: "Squadra al completo (6/6)",
  addName: (name: string) => `Aggiungi ${name}`,
  addNameToTeam: (name: string) => `Aggiungi ${name} alla squadra`,
  removeNameFromTeam: (name: string) => `Rimuovi ${name} dalla squadra`,
  addToMyTeam: "Aggiungi alla mia squadra",
  removeFromMyTeam: "Rimuovi dalla mia squadra",

  // Species picker (modal)
  closePicker: "Chiudi il selettore",
  pickerDialogAria: (slot: number) =>
    `Scegli un Pokémon per lo slot ${slot}`,
  pickerTitle: "SCEGLI UN POKÉMON",
  pickerSlot: (slot: number) => `Slot ${slot}`,
  pickerPlaceholder: "Filtra per nome (es. pikachu)…",
  pickerFilterAria: "Filtra i Pokémon per nome",
  onScreenNow: "Ora sullo schermo",
  indexErrorRetryClose:
    "Impossibile caricare l'indice delle specie. Chiudi e riprova.",
  loadingSpecies: "Caricamento specie…",
  noResultsEnglishNames: (query: string) =>
    `Nessun risultato per «${query}» (i nomi sono in inglese).`,

  // Roster slots
  choosePokemon: "Scegli un Pokémon",
  choose: "Scegli",
  levelAbbr: "Liv.",
  levelOfAria: (name: string) => `Livello di ${name}`,
  buildConfigureAria: (name: string) =>
    `Configura abilità e mosse di ${name}`,
  buildCustomTitle: "Build personalizzata — abilità e mosse",
  buildChooseTitle: "Scegli abilità e mosse",
  buildChooseHint: "Scegli le mosse",
  buildEditHint: "Modifica le mosse",
  buildChooseForAria: (name: string) =>
    `Scegli abilità e mosse di ${name}`,
  viewEntryTitle: (name: string) => `Vedi la scheda di ${name}`,

  // Inline search
  searchPlaceholder:
    "Cerca un Pokémon qualsiasi da reclutare (es. pikachu)…",
  searchAria: "Cerca un Pokémon da aggiungere alla squadra",
  indexErrorRetryReload:
    "Impossibile caricare l'indice delle specie. Ricarica e riprova.",

  // Coach report
  coachReportTitle: "Rapporto del Coach Bot",
  suggestedSwaps: "Scambi suggeriti",
  swapApplied: "✓ Applicato",
  apply: "Applica",
  swapUnavailable: "Impossibile trovare la specie suggerita",
  swapTitle: (outName: string, inName: string) =>
    `Scambia ${outName} con ${inName}`,

  // Drawer chrome
  drawerAria: "Costruttore di squadre",
  closeTeamAria: "Chiudi la squadra",

  // AI errors (client-side fallbacks)
  coachNoReply: "Il Coach Bot non risponde. Riprova.",
  coachOffline: "Nessuna connessione con il Coach Bot…",

  // AI generator
  generatedByCoach: "Squadra generata dal Coach Bot",
  aiTitleEmpty: "Niente squadra? Chiedi all'IA",
  aiTitleModify: "Modifica la tua squadra con l'IA",
  aiBodyEmpty:
    "Descrivi la squadra che vuoi e il Coach Bot ne monterà una ottimizzata di 6 Pokémon.",
  aiBodyModify:
    "Descrivi le modifiche che vuoi (o una squadra tutta nuova) e il Coach Bot sistemerà il roster completo di 6 Pokémon.",
  aiPlaceholderEmpty:
    "Es.: una squadra bilanciata di 1ª generazione con Charizard come stella, o una squadra di tipo Acqua bella solida…",
  aiPlaceholderModify:
    "Es.: sostituisci i membri deboli a Terra con tipi Acqua, o rendila più offensiva senza togliere Charizard…",
  aiWishAria:
    "Descrivi la squadra da generare o le modifiche da applicare",
  aiBuilding: "Montaggio squadra…",
  aiRequestUpdate: "✨ Richiedi aggiornamento",
  clearAria: "Svuota la squadra",
  aiGenerate: "✨ Genera squadra con l'IA",

  // Coverage analysis
  criticalWeaknesses: "Debolezze critiche",
  noCriticalWeaknesses: (threshold: number) =>
    `Nessuna: nessun tipo colpisce ${threshold}+ membri.`,
  memberCount: (count: number, total: number) => `${count} su ${total}`,
  strongResistances: "Resistenze forti",
  noStrongResistances: (threshold: number) =>
    `Ancora nessuna resistenza condivisa da ${threshold}+ membri.`,
  missingCoverage: "Senza copertura offensiva",
  fullCoverage: "Il tuo STAB colpisce con efficacia tutti i 18 tipi.",

  // AI coach controls
  analyzing: "Analisi in corso…",
  analyzeAgain: "🤖 Analizza di nuovo",
  analyzeWithAi: "🤖 Analizza con l'IA",
  staleReport:
    "La squadra è cambiata dopo questo rapporto: analizza di nuovo.",
  emptyTeamHint:
    "Puoi anche premere «+» su uno slot, cercare qui sopra, o reclutare da qualsiasi carta dell'elenco.",

  // Build editor
  damageClass: {
    physical: "Fisico",
    special: "Speciale",
    status: "Stato",
  } as Record<string, string>,
  movePower: (value: string | number) => `Potenza ${value}`,
  moveAccuracy: (value: string | number) => `Precisione ${value}`,
  movePp: (value: string | number) => `PP ${value}`,
  movePowerAbbr: (value: string | number) => `Pot. ${value}`,
  moveAccuracyAbbr: (value: string | number) => `· Prec. ${value}`,
  removeMoveAria: (label: string) => `Rimuovi ${label}`,
  emptyMoveSlot: "Scegli una mossa dall'elenco…",
  loadingMoves: "Caricamento mosse…",
  moveNoResults: (query: string) => `Nessun risultato per «${query}».`,
  movesFullTitle: "Hai già 4 mosse: rimuovine una per cambiarla",
  buildCloseAria: "Chiudi la configurazione",
  buildDialogAria: (name: string) => `Configurazione di lotta di ${name}`,
  buildTitle: "CONFIGURAZIONE DI LOTTA",
  buildOptionsError:
    "Impossibile caricare abilità e mosse di questa specie. Chiudi e riprova.",
  ability: "Abilità",
  abilityAuto: "Automatica (abilità principale)",
  abilityHiddenSuffix: " · Nascosta",
  abilityHiddenBadge: "Nascosta",
  movesHeading: (chosen: number) => `Mosse scelte (${chosen}/4)`,
  buildLevel: "Livello",
  buildLevelAria: (name: string) => `Livello di lotta di ${name}`,
  learnLevel: (level: number) => `Lv. ${level}`,
  learnStart: "Iniziale",
  learnMachine: "MT/MN",
  learnEgg: "Uovo",
  learnTutor: "Tutor",
  moveSourceAria: "Origine della mossa",
  sourceLevel: "Per livello",
  sourceMachine: "Per MT/MN",
  sourceLevelHint: (level: number) =>
    `Mosse che impara salendo di livello. Al Lv. ${level} puoi scegliere solo quelle già sbloccate.`,
  sourceMachineHint:
    "Macchine tecniche compatibili con questa specie. Non richiedono livello e sono elencate solo quelle che può davvero usare.",
  onlyKnown: (level: number) => `Solo Lv. ${level}`,
  onlyKnownTitle: (level: number) =>
    `Mostra solo le mosse che conosce già al Lv. ${level}`,
  notYetTitle: (level: number) =>
    `Non ancora conosciuta: la impara al Lv. ${level}`,
  prunedByLevel: (names: string, level: number) =>
    `Rimosse, non conosciute al Lv. ${level}: ${names}.`,
  movesHelpLevel: (level: number) =>
    `Scegli fino a 4 mosse tra quelle che impara per livello (quelle che ha già al Lv. ${level}) e le MT/MN che può usare. Gli spazi vuoti si riempiono da soli all'inizio della lotta.`,
  allMovesHeading: "Tutte le mosse",
  allMovesCount: (shown: number, total: number) => ` (${shown}/${total})`,
  movesFilterPlaceholder: "Filtra per nome (es. lanciafiamme)…",
  movesFilterAria: "Filtra le mosse per nome",
  catalogueNote:
    "Sono elencate solo le mosse del gioco più recente apprese per livello o con MT/MN; nient'altro è selezionabile. Gli attacchi a potenza variabile vengono calcolati in lotta e le mosse di stato applicano le loro modifiche alle statistiche, i problemi di stato e le cure (in forma semplificata).",
  reset: "Ripristina",
  saveBuild: "Salva build",

  // Build editor: AI move coach
  coachMoveTitle: "Allenatore IA",
  coachMoveHint: (level: number) =>
    `Chiedi il set che vuoi: riempie tutti e 4 gli spazi scegliendo solo tra ciò che questa specie può già usare al Lv. ${level}, per livello o con MT/MN.`,
  coachMovePresets: "Suggerimenti",
  coachMovePreset: {
    competitive: "Set competitivo",
    physical: "Massimo attacco fisico",
    special: "Massimo attacco speciale",
    coverage: "Copertura di tipi",
    status: "Stati e controllo",
    bulky: "Resistenza e logoramento",
  } as Record<MovePreset, string>,
  coachMovePlaceholder: "Es.: offensivo, ma con una risposta ai tipi Acqua…",
  coachMoveAria: "Descrivi le mosse che vuoi",
  coachMoveRun: "Chiedi all'IA",
  coachMoveRunning: "Sto scegliendo le mosse…",
  coachMoveToppedUp:
    "L'IA non ha riempito tutti e 4 gli spazi: i vuoti sono stati completati con i suoi attacchi migliori.",
  coachMoveErrEmpty: "Scrivi cosa cerchi o tocca un suggerimento.",
  coachMoveErrNoMoves:
    "Questa specie non ha mosse selezionabili a questo livello.",
  coachMoveErrFailed: "L'IA non è riuscita a scegliere le mosse. Riprova.",

  // /api/battle/build-options errors
  apiInvalidSpecies: "Specie non valida.",
  apiOptionsError: "Impossibile caricare le opzioni di quella specie.",
};

const ja: typeof es = {
  // Drawer header (the CTA banner and header chip live in home/layout dicts)
  myTeam: "マイチーム",
  clear: "クリア",

  // Shared entry rows / quick-add button
  alreadyInTeam: "すでにチームにいます",
  teamFull: "チームは満員（6/6）",
  addName: (name: string) => `${name}を追加`,
  addNameToTeam: (name: string) => `${name}をチームに追加`,
  removeNameFromTeam: (name: string) => `${name}をチームから外す`,
  addToMyTeam: "マイチームに追加",
  removeFromMyTeam: "マイチームから外す",

  // Species picker (modal)
  closePicker: "セレクターを閉じる",
  pickerDialogAria: (slot: number) => `スロット${slot}のポケモンを選ぶ`,
  pickerTitle: "ポケモンをえらぼう",
  pickerSlot: (slot: number) => `スロット${slot}`,
  pickerPlaceholder: "名前でしぼり込み（例：pikachu）…",
  pickerFilterAria: "ポケモンを名前でしぼり込む",
  onScreenNow: "いま画面に表示中",
  indexErrorRetryClose:
    "種族インデックスを読み込めませんでした。閉じてもう一度お試しください。",
  loadingSpecies: "種族を読み込み中…",
  noResultsEnglishNames: (query: string) =>
    `「${query}」に一致なし（名前は英語表記です）。`,

  // Roster slots
  choosePokemon: "ポケモンを選ぶ",
  choose: "選ぶ",
  levelAbbr: "Lv.",
  levelOfAria: (name: string) => `${name}のレベル`,
  buildConfigureAria: (name: string) =>
    `${name}のとくせいとわざを設定`,
  buildCustomTitle: "カスタムビルド — とくせいとわざ",
  buildChooseTitle: "とくせいとわざを選ぶ",
  buildChooseHint: "わざを選ぶ",
  buildEditHint: "わざを編集",
  buildChooseForAria: (name: string) =>
    `${name}のとくせいとわざを選ぶ`,
  viewEntryTitle: (name: string) => `${name}の図鑑ページを見る`,

  // Inline search
  searchPlaceholder: "スカウトしたいポケモンを検索（例：pikachu）…",
  searchAria: "チームに追加するポケモンを検索",
  indexErrorRetryReload:
    "種族インデックスを読み込めませんでした。再読み込みしてもう一度お試しください。",

  // Coach report
  coachReportTitle: "コーチボットのレポート",
  suggestedSwaps: "入れ替えの提案",
  swapApplied: "✓ 適用済み",
  apply: "適用",
  swapUnavailable: "提案された種族が見つかりませんでした",
  swapTitle: (outName: string, inName: string) =>
    `${outName}を${inName}と入れ替える`,

  // Drawer chrome
  drawerAria: "チームビルダー",
  closeTeamAria: "チームを閉じる",

  // AI errors (client-side fallbacks)
  coachNoReply: "コーチボットが応答しません。もう一度お試しください。",
  coachOffline: "コーチボットに接続できません…",

  // AI generator
  generatedByCoach: "コーチボットが生成したチーム",
  aiTitleEmpty: "チームがない？AIにおまかせ",
  aiTitleModify: "AIでチームを調整",
  aiBodyEmpty:
    "ほしいチームを説明すれば、コーチボットが最適化された6匹のチームを組み上げます。",
  aiBodyModify:
    "変えたい点（またはまったく新しいチーム）を説明すれば、コーチボットが6匹のロースター全体を組み直します。",
  aiPlaceholderEmpty:
    "例：リザードンが主役のバランス型第1世代チーム、タフなみずタイプチーム など…",
  aiPlaceholderModify:
    "例：じめん弱点のメンバーをみずタイプに交代、リザードンは残して攻撃寄りに など…",
  aiWishAria:
    "生成したいチームや適用したい変更を説明してください",
  aiBuilding: "チームを編成中…",
  aiRequestUpdate: "✨ 更新をリクエスト",
  clearAria: "チームを空にする",
  aiGenerate: "✨ AIでチームを生成",

  // Coverage analysis
  criticalWeaknesses: "致命的な弱点",
  noCriticalWeaknesses: (threshold: number) =>
    `なし：${threshold}匹以上に刺さるタイプはありません。`,
  memberCount: (count: number, total: number) =>
    `${total}匹中${count}匹`,
  strongResistances: "強い耐性",
  noStrongResistances: (threshold: number) =>
    `${threshold}匹以上が共有する耐性はまだありません。`,
  missingCoverage: "攻撃範囲の穴",
  fullCoverage: "STABで18タイプすべてを効果的に攻撃できます。",

  // AI coach controls
  analyzing: "分析中…",
  analyzeAgain: "🤖 もう一度分析",
  analyzeWithAi: "🤖 AIで分析",
  staleReport:
    "このレポート以降にチームが変わりました：もう一度分析してください。",
  emptyTeamHint:
    "スロットの「+」を押す、上で検索する、一覧のカードからスカウトすることもできます。",

  // Build editor
  damageClass: {
    physical: "ぶつり",
    special: "とくしゅ",
    status: "へんか",
  } as Record<string, string>,
  movePower: (value: string | number) => `いりょく ${value}`,
  moveAccuracy: (value: string | number) => `めいちゅう ${value}`,
  movePp: (value: string | number) => `PP ${value}`,
  movePowerAbbr: (value: string | number) => `威力 ${value}`,
  moveAccuracyAbbr: (value: string | number) => `· 命中 ${value}`,
  removeMoveAria: (label: string) => `${label}を外す`,
  emptyMoveSlot: "リストからわざを選んでください…",
  loadingMoves: "わざを読み込み中…",
  moveNoResults: (query: string) => `「${query}」に一致なし。`,
  movesFullTitle:
    "わざはすでに4つ：入れ替えるには1つ外してください",
  buildCloseAria: "設定を閉じる",
  buildDialogAria: (name: string) => `${name}のバトル設定`,
  buildTitle: "バトル設定",
  buildOptionsError:
    "この種族のとくせいとわざを読み込めませんでした。閉じてもう一度お試しください。",
  ability: "とくせい",
  abilityAuto: "おまかせ（メインのとくせい）",
  abilityHiddenSuffix: " · 隠れ特性",
  abilityHiddenBadge: "隠れ特性",
  movesHeading: (chosen: number) => `選んだわざ（${chosen}/4）`,
  buildLevel: "レベル",
  buildLevelAria: (name: string) => `${name}のバトルレベル`,
  learnLevel: (level: number) => `Lv.${level}`,
  learnStart: "初期",
  learnMachine: "わざマシン",
  learnEgg: "タマゴ",
  learnTutor: "教え技",
  moveSourceAria: "わざの入手方法",
  sourceLevel: "レベルアップ",
  sourceMachine: "わざマシン",
  sourceLevelHint: (level: number) =>
    `レベルアップで おぼえる わざ。Lv.${level}では すでに 習得した ものだけ えらべます。`,
  sourceMachineHint:
    "この ポケモンが 使える わざマシン。レベルの 条件は ありませんが、使えるものしか 表示されません。",
  onlyKnown: (level: number) => `Lv.${level}まで`,
  onlyKnownTitle: (level: number) =>
    `Lv.${level}で すでに おぼえている わざだけを 表示する`,
  notYetTitle: (level: number) =>
    `まだ おぼえていない：Lv.${level}で おぼえる`,
  prunedByLevel: (names: string, level: number) =>
    `Lv.${level}では おぼえていないので はずしました：${names}`,
  movesHelpLevel: (level: number) =>
    `レベルアップで おぼえる わざ（Lv.${level}で 習得ずみ）と 使える わざマシンから 最大4つ えらべます。空きスロットは バトル開始時に 自動で うまります。`,
  allMovesHeading: "すべてのわざ",
  allMovesCount: (shown: number, total: number) =>
    `（${shown}/${total}）`,
  movesFilterPlaceholder: "名前でしぼり込み（例：かえんほうしゃ）…",
  movesFilterAria: "わざを名前でしぼり込む",
  catalogueNote:
    "最新作で レベルアップ または わざマシンで おぼえる わざのみ 掲載（それ以外は 選べません）。威力が変動する攻撃はバトル中に計算され、変化わざは能力変化・状態異常・回復を（簡略化した形で）適用します。",
  reset: "リセット",
  saveBuild: "ビルドを保存",

  // Build editor: AI move coach
  coachMoveTitle: "AIトレーナー",
  coachMoveHint: (level: number) =>
    `ほしい構成を伝えると、4つのわざをすべて埋めます。選ぶのはこのポケモンがLv.${level}ですでに使えるわざだけ（レベルアップまたはわざマシン）。`,
  coachMovePresets: "おすすめ",
  coachMovePreset: {
    competitive: "対戦向け構成",
    physical: "物理アタッカー",
    special: "特殊アタッカー",
    coverage: "タイプ相性重視",
    status: "変化技で搦め手",
    bulky: "耐久・削り",
  } as Record<MovePreset, string>,
  coachMovePlaceholder: "例：攻撃的だけど みずタイプ対策も…",
  coachMoveAria: "ほしいわざを説明してください",
  coachMoveRun: "AIに任せる",
  coachMoveRunning: "わざを選んでいます…",
  coachMoveToppedUp:
    "AIが4つ埋められなかったため、残りは最も強いわざで補いました。",
  coachMoveErrEmpty: "ほしいわざを入力するか、おすすめを選んでください。",
  coachMoveErrNoMoves: "このポケモンはこのレベルで選べるわざがありません。",
  coachMoveErrFailed:
    "AIがわざを選べませんでした。もう一度お試しください。",

  // /api/battle/build-options errors
  apiInvalidSpecies: "無効な種族です。",
  apiOptionsError: "その種族のオプションを読み込めませんでした。",
};

const ko: typeof es = {
  // Drawer header (the CTA banner and header chip live in home/layout dicts)
  myTeam: "내 팀",
  clear: "비우기",

  // Shared entry rows / quick-add button
  alreadyInTeam: "이미 팀에 있습니다",
  teamFull: "팀이 가득 참 (6/6)",
  addName: (name: string) => `${name} 추가`,
  addNameToTeam: (name: string) => `${name}을(를) 팀에 추가`,
  removeNameFromTeam: (name: string) => `${name}을(를) 팀에서 제외`,
  addToMyTeam: "내 팀에 추가",
  removeFromMyTeam: "내 팀에서 제외",

  // Species picker (modal)
  closePicker: "선택 창 닫기",
  pickerDialogAria: (slot: number) =>
    `${slot}번 슬롯에 넣을 포켓몬 선택`,
  pickerTitle: "포켓몬을 선택하세요",
  pickerSlot: (slot: number) => `슬롯 ${slot}`,
  pickerPlaceholder: "이름으로 검색 (예: pikachu)…",
  pickerFilterAria: "이름으로 포켓몬 필터링",
  onScreenNow: "지금 화면에 표시 중",
  indexErrorRetryClose:
    "종족 인덱스를 불러오지 못했습니다. 닫고 다시 시도해 주세요.",
  loadingSpecies: "종족 불러오는 중…",
  noResultsEnglishNames: (query: string) =>
    `"${query}"에 대한 결과가 없습니다 (이름은 영어로 입력).`,

  // Roster slots
  choosePokemon: "포켓몬 선택",
  choose: "선택",
  levelAbbr: "Lv.",
  levelOfAria: (name: string) => `${name}의 레벨`,
  buildConfigureAria: (name: string) =>
    `${name}의 특성과 기술 설정`,
  buildCustomTitle: "커스텀 빌드 — 특성과 기술",
  buildChooseTitle: "특성과 기술 선택",
  buildChooseHint: "기술 선택",
  buildEditHint: "기술 편집",
  buildChooseForAria: (name: string) =>
    `${name}의 특성과 기술 선택`,
  viewEntryTitle: (name: string) => `${name}의 도감 페이지 보기`,

  // Inline search
  searchPlaceholder: "영입할 포켓몬을 검색하세요 (예: pikachu)…",
  searchAria: "팀에 추가할 포켓몬 검색",
  indexErrorRetryReload:
    "종족 인덱스를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.",

  // Coach report
  coachReportTitle: "코치 봇 리포트",
  suggestedSwaps: "추천 교체",
  swapApplied: "✓ 적용됨",
  apply: "적용",
  swapUnavailable: "추천된 종족을 찾지 못했습니다",
  swapTitle: (outName: string, inName: string) =>
    `${outName}을(를) ${inName}(으)로 교체`,

  // Drawer chrome
  drawerAria: "팀 빌더",
  closeTeamAria: "팀 닫기",

  // AI errors (client-side fallbacks)
  coachNoReply: "코치 봇이 응답하지 않습니다. 다시 시도해 주세요.",
  coachOffline: "코치 봇에 연결할 수 없습니다…",

  // AI generator
  generatedByCoach: "코치 봇이 생성한 팀",
  aiTitleEmpty: "팀이 없다면? AI에게 맡겨 보세요",
  aiTitleModify: "AI로 팀 다듬기",
  aiBodyEmpty:
    "원하는 팀을 설명하면 코치 봇이 최적화된 포켓몬 6마리 팀을 짜 드립니다.",
  aiBodyModify:
    "원하는 변경 사항(또는 완전히 새로운 팀)을 설명하면 코치 봇이 6마리 로스터 전체를 재구성합니다.",
  aiPlaceholderEmpty:
    "예: 리자몽이 주역인 균형 잡힌 1세대 팀, 단단한 물타입 팀 등…",
  aiPlaceholderModify:
    "예: 땅에 약한 멤버를 물타입으로 교체, 리자몽은 남기고 더 공격적으로 등…",
  aiWishAria: "생성할 팀이나 적용할 변경 사항을 설명해 주세요",
  aiBuilding: "팀 구성 중…",
  aiRequestUpdate: "✨ 업데이트 요청",
  clearAria: "팀 비우기",
  aiGenerate: "✨ AI로 팀 생성",

  // Coverage analysis
  criticalWeaknesses: "치명적인 약점",
  noCriticalWeaknesses: (threshold: number) =>
    `없음: ${threshold}마리 이상을 위협하는 타입이 없습니다.`,
  memberCount: (count: number, total: number) =>
    `${total}마리 중 ${count}마리`,
  strongResistances: "강한 내성",
  noStrongResistances: (threshold: number) =>
    `아직 ${threshold}마리 이상이 공유하는 내성이 없습니다.`,
  missingCoverage: "공격 커버리지 없음",
  fullCoverage: "당신의 STAB가 18개 타입 전부를 효과적으로 공략합니다.",

  // AI coach controls
  analyzing: "분석 중…",
  analyzeAgain: "🤖 다시 분석",
  analyzeWithAi: "🤖 AI로 분석",
  staleReport: "이 리포트 이후 팀이 바뀌었습니다: 다시 분석하세요.",
  emptyTeamHint:
    '슬롯의 "+"를 누르거나, 위에서 검색하거나, 목록의 카드에서 바로 영입할 수도 있습니다.',

  // Build editor
  damageClass: {
    physical: "물리",
    special: "특수",
    status: "변화",
  } as Record<string, string>,
  movePower: (value: string | number) => `위력 ${value}`,
  moveAccuracy: (value: string | number) => `명중률 ${value}`,
  movePp: (value: string | number) => `PP ${value}`,
  movePowerAbbr: (value: string | number) => `위력 ${value}`,
  moveAccuracyAbbr: (value: string | number) => `· 명중 ${value}`,
  removeMoveAria: (label: string) => `${label} 제거`,
  emptyMoveSlot: "목록에서 기술을 선택하세요…",
  loadingMoves: "기술 불러오는 중…",
  moveNoResults: (query: string) =>
    `"${query}"에 대한 결과가 없습니다.`,
  movesFullTitle: "이미 기술이 4개입니다: 바꾸려면 하나를 제거하세요",
  buildCloseAria: "설정 닫기",
  buildDialogAria: (name: string) => `${name}의 배틀 설정`,
  buildTitle: "배틀 설정",
  buildOptionsError:
    "이 종족의 특성과 기술을 불러오지 못했습니다. 닫고 다시 시도해 주세요.",
  ability: "특성",
  abilityAuto: "자동 (기본 특성)",
  abilityHiddenSuffix: " · 숨겨진 특성",
  abilityHiddenBadge: "숨겨진 특성",
  movesHeading: (chosen: number) => `선택한 기술 (${chosen}/4)`,
  buildLevel: "레벨",
  buildLevelAria: (name: string) => `${name}의 배틀 레벨`,
  learnLevel: (level: number) => `Lv.${level}`,
  learnStart: "기본",
  learnMachine: "기술머신",
  learnEgg: "유전",
  learnTutor: "교전",
  moveSourceAria: "기술 습득 방법",
  sourceLevel: "레벨업",
  sourceMachine: "기술머신",
  sourceLevelHint: (level: number) =>
    `레벨이 오르며 배우는 기술입니다. Lv.${level}에서는 이미 습득한 기술만 고를 수 있습니다.`,
  sourceMachineHint:
    "이 포켓몬이 사용할 수 있는 기술머신입니다. 레벨 제한은 없지만, 쓸 수 있는 것만 표시됩니다.",
  onlyKnown: (level: number) => `Lv.${level}까지`,
  onlyKnownTitle: (level: number) =>
    `Lv.${level}에서 이미 배운 기술만 표시`,
  notYetTitle: (level: number) =>
    `아직 모르는 기술: Lv.${level}에서 배운다`,
  prunedByLevel: (names: string, level: number) =>
    `Lv.${level}에서는 모르기 때문에 제외했습니다: ${names}`,
  movesHelpLevel: (level: number) =>
    `레벨업으로 배우는 기술(Lv.${level}에서 이미 습득한 것)과 사용할 수 있는 기술머신 중에서 최대 4개를 고르세요. 빈 칸은 대전 시작 시 자동으로 채워집니다.`,
  allMovesHeading: "모든 기술",
  allMovesCount: (shown: number, total: number) =>
    ` (${shown}/${total})`,
  movesFilterPlaceholder: "이름으로 검색 (예: 화염방사)…",
  movesFilterAria: "이름으로 기술 필터링",
  catalogueNote:
    "최신작에서 레벨업 또는 기술머신으로 배우는 기술만 표시됩니다(그 외에는 선택할 수 없습니다). 위력이 변하는 공격은 배틀 중에 계산되며, 변화 기술은 능력치 변화·상태 이상·회복을 (간략화된 형태로) 적용합니다.",
  reset: "초기화",
  saveBuild: "빌드 저장",

  // Build editor: AI move coach
  coachMoveTitle: "AI 트레이너",
  coachMoveHint: (level: number) =>
    `원하는 구성을 말하면 기술 4칸을 모두 채웁니다. Lv.${level}에서 이미 쓸 수 있는 기술(레벨업 또는 기술머신)만 고릅니다.`,
  coachMovePresets: "추천",
  coachMovePreset: {
    competitive: "대전용 구성",
    physical: "물리 공격 최대",
    special: "특수 공격 최대",
    coverage: "타입 상성 보완",
    status: "상태이상과 견제",
    bulky: "내구와 소모전",
  } as Record<MovePreset, string>,
  coachMovePlaceholder: "예: 공격적이지만 물타입 대책도…",
  coachMoveAria: "원하는 기술을 설명하세요",
  coachMoveRun: "AI에게 맡기기",
  coachMoveRunning: "기술을 고르는 중…",
  coachMoveToppedUp:
    "AI가 4칸을 다 채우지 못해 빈칸은 가장 강한 기술로 채웠습니다.",
  coachMoveErrEmpty: "원하는 기술을 입력하거나 추천을 눌러 주세요.",
  coachMoveErrNoMoves: "이 포켓몬은 이 레벨에서 선택할 수 있는 기술이 없습니다.",
  coachMoveErrFailed: "AI가 기술을 고르지 못했습니다. 다시 시도해 주세요.",

  // /api/battle/build-options errors
  apiInvalidSpecies: "잘못된 종족입니다.",
  apiOptionsError: "해당 종족의 옵션을 불러오지 못했습니다.",
};

const zhHans: typeof es = {
  // Drawer header (the CTA banner and header chip live in home/layout dicts)
  myTeam: "我的队伍",
  clear: "清空",

  // Shared entry rows / quick-add button
  alreadyInTeam: "已在队伍中",
  teamFull: "队伍已满（6/6）",
  addName: (name: string) => `添加${name}`,
  addNameToTeam: (name: string) => `将${name}加入队伍`,
  removeNameFromTeam: (name: string) => `将${name}移出队伍`,
  addToMyTeam: "加入我的队伍",
  removeFromMyTeam: "移出我的队伍",

  // Species picker (modal)
  closePicker: "关闭选择器",
  pickerDialogAria: (slot: number) =>
    `为第${slot}号位置选择宝可梦`,
  pickerTitle: "选择一只宝可梦",
  pickerSlot: (slot: number) => `位置${slot}`,
  pickerPlaceholder: "按名称筛选（例：pikachu）…",
  pickerFilterAria: "按名称筛选宝可梦",
  onScreenNow: "当前显示在屏幕上",
  indexErrorRetryClose: "无法加载种族索引。请关闭后重试。",
  loadingSpecies: "正在加载种族…",
  noResultsEnglishNames: (query: string) =>
    `没有与“${query}”匹配的结果（名称为英文）。`,

  // Roster slots
  choosePokemon: "选择宝可梦",
  choose: "选择",
  levelAbbr: "Lv.",
  levelOfAria: (name: string) => `${name}的等级`,
  buildConfigureAria: (name: string) =>
    `设置${name}的特性和招式`,
  buildCustomTitle: "自定义配置 — 特性和招式",
  buildChooseTitle: "选择特性和招式",
  buildChooseHint: "选择招式",
  buildEditHint: "编辑招式",
  buildChooseForAria: (name: string) =>
    `选择${name}的特性和招式`,
  viewEntryTitle: (name: string) => `查看${name}的图鉴页面`,

  // Inline search
  searchPlaceholder: "搜索任意宝可梦并招入队伍（例：pikachu）…",
  searchAria: "搜索要加入队伍的宝可梦",
  indexErrorRetryReload: "无法加载种族索引。请刷新后重试。",

  // Coach report
  coachReportTitle: "教练机器人报告",
  suggestedSwaps: "建议的替换",
  swapApplied: "✓ 已应用",
  apply: "应用",
  swapUnavailable: "找不到建议的种族",
  swapTitle: (outName: string, inName: string) =>
    `用${inName}替换${outName}`,

  // Drawer chrome
  drawerAria: "队伍编辑器",
  closeTeamAria: "关闭队伍",

  // AI errors (client-side fallbacks)
  coachNoReply: "教练机器人没有响应。请重试。",
  coachOffline: "无法连接教练机器人…",

  // AI generator
  generatedByCoach: "由教练机器人生成的队伍",
  aiTitleEmpty: "还没有队伍？交给AI吧",
  aiTitleModify: "用AI调整你的队伍",
  aiBodyEmpty:
    "描述你想要的队伍，教练机器人会组建一支优化过的6只宝可梦队伍。",
  aiBodyModify:
    "描述你想要的改动（或一支全新的队伍），教练机器人会重新调整整支6只宝可梦的阵容。",
  aiPlaceholderEmpty:
    "例：以喷火龙为核心的均衡第一世代队伍，或一支耐打的水属性队伍…",
  aiPlaceholderModify:
    "例：把怕地面的成员换成水属性，或在保留喷火龙的前提下更偏进攻…",
  aiWishAria: "描述你想生成的队伍或想应用的改动",
  aiBuilding: "正在组建队伍…",
  aiRequestUpdate: "✨ 请求更新",
  clearAria: "清空队伍",
  aiGenerate: "✨ 用AI生成队伍",

  // Coverage analysis
  criticalWeaknesses: "致命弱点",
  noCriticalWeaknesses: (threshold: number) =>
    `无：没有任何属性能克制${threshold}名以上成员。`,
  memberCount: (count: number, total: number) =>
    `${total}名中的${count}名`,
  strongResistances: "强力抗性",
  noStrongResistances: (threshold: number) =>
    `尚无${threshold}名以上成员共有的抗性。`,
  missingCoverage: "缺少攻击覆盖",
  fullCoverage: "你的本系招式（STAB）能有效命中全部18种属性。",

  // AI coach controls
  analyzing: "分析中…",
  analyzeAgain: "🤖 重新分析",
  analyzeWithAi: "🤖 用AI分析",
  staleReport: "队伍在本报告之后有变动：请重新分析。",
  emptyTeamHint:
    "你也可以点击空位上的“+”、在上方搜索，或从列表中的任意卡片直接招募。",

  // Build editor
  damageClass: {
    physical: "物理",
    special: "特殊",
    status: "变化",
  } as Record<string, string>,
  movePower: (value: string | number) => `威力 ${value}`,
  moveAccuracy: (value: string | number) => `命中 ${value}`,
  movePp: (value: string | number) => `PP ${value}`,
  movePowerAbbr: (value: string | number) => `威力 ${value}`,
  moveAccuracyAbbr: (value: string | number) => `· 命中 ${value}`,
  removeMoveAria: (label: string) => `移除${label}`,
  emptyMoveSlot: "从列表中选择一个招式…",
  loadingMoves: "正在加载招式…",
  moveNoResults: (query: string) =>
    `没有与“${query}”匹配的结果。`,
  movesFullTitle: "已有4个招式：先移除一个才能替换",
  buildCloseAria: "关闭设置",
  buildDialogAria: (name: string) => `${name}的对战设置`,
  buildTitle: "对战设置",
  buildOptionsError: "无法加载该种族的特性和招式。请关闭后重试。",
  ability: "特性",
  abilityAuto: "自动（主要特性）",
  abilityHiddenSuffix: " · 隐藏",
  abilityHiddenBadge: "隐藏特性",
  movesHeading: (chosen: number) => `已选招式（${chosen}/4）`,
  buildLevel: "等级",
  buildLevelAria: (name: string) => `${name}的对战等级`,
  learnLevel: (level: number) => `Lv.${level}`,
  learnStart: "初始",
  learnMachine: "招式学习器",
  learnEgg: "遗传",
  learnTutor: "教学",
  moveSourceAria: "招式来源",
  sourceLevel: "升级习得",
  sourceMachine: "招式学习器",
  sourceLevelHint: (level: number) =>
    `随等级提升习得的招式。在Lv.${level}只能选择已经学会的那些。`,
  sourceMachineHint:
    "这只宝可梦兼容的招式学习器。没有等级要求，且只会列出它真正能使用的。",
  onlyKnown: (level: number) => `仅Lv.${level}`,
  onlyKnownTitle: (level: number) => `只显示在Lv.${level}已学会的招式`,
  notYetTitle: (level: number) => `尚未学会：在Lv.${level}学会`,
  prunedByLevel: (names: string, level: number) =>
    `因在Lv.${level}尚未学会而移除：${names}`,
  movesHelpLevel: (level: number) =>
    `可从升级习得的招式（Lv.${level}已学会的）与它能使用的招式学习器中，最多选择4个。空位会在对战开始时自动填入。`,
  allMovesHeading: "全部招式",
  allMovesCount: (shown: number, total: number) =>
    `（${shown}/${total}）`,
  movesFilterPlaceholder: "按名称筛选（例：喷射火焰）…",
  movesFilterAria: "按名称筛选招式",
  catalogueNote:
    "仅列出最新作品中通过升级或招式学习器习得的招式（其他一律无法选择）。威力可变的攻击会在对战中实时计算，变化招式会（以简化形式）应用其能力变化、异常状态和回复效果。",
  reset: "重置",
  saveBuild: "保存配置",

  // Build editor: AI move coach
  coachMoveTitle: "AI 训练家",
  coachMoveHint: (level: number) =>
    `说出你想要的配招，4 个技能格会一次填满。只会从该宝可梦在 Lv.${level} 已能使用的技能中挑选：升级技能或招式学习器。`,
  coachMovePresets: "推荐",
  coachMovePreset: {
    competitive: "对战配招",
    physical: "物理输出最大化",
    special: "特殊输出最大化",
    coverage: "属性覆盖",
    status: "异常状态与牵制",
    bulky: "耐久消耗",
  } as Record<MovePreset, string>,
  coachMovePlaceholder: "例如：主打输出，但要能应付水系…",
  coachMoveAria: "描述你想要的技能",
  coachMoveRun: "让 AI 挑选",
  coachMoveRunning: "正在挑选技能…",
  coachMoveToppedUp: "AI 没有填满 4 个技能格，空缺已用它最强的招式补齐。",
  coachMoveErrEmpty: "请输入你想要的技能，或点选一个推荐。",
  coachMoveErrNoMoves: "该宝可梦在此等级没有可选的技能。",
  coachMoveErrFailed: "AI 无法挑选技能，请再试一次。",

  // /api/battle/build-options errors
  apiInvalidSpecies: "无效的种族。",
  apiOptionsError: "无法加载该种族的选项。",
};

const zhHant: typeof es = {
  // Drawer header (the CTA banner and header chip live in home/layout dicts)
  myTeam: "我的隊伍",
  clear: "清空",

  // Shared entry rows / quick-add button
  alreadyInTeam: "已在隊伍中",
  teamFull: "隊伍已滿（6/6）",
  addName: (name: string) => `加入${name}`,
  addNameToTeam: (name: string) => `將${name}加入隊伍`,
  removeNameFromTeam: (name: string) => `將${name}移出隊伍`,
  addToMyTeam: "加入我的隊伍",
  removeFromMyTeam: "移出我的隊伍",

  // Species picker (modal)
  closePicker: "關閉選擇器",
  pickerDialogAria: (slot: number) =>
    `為第${slot}號位置選擇寶可夢`,
  pickerTitle: "選擇一隻寶可夢",
  pickerSlot: (slot: number) => `位置${slot}`,
  pickerPlaceholder: "依名稱篩選（例：pikachu）…",
  pickerFilterAria: "依名稱篩選寶可夢",
  onScreenNow: "目前顯示在畫面上",
  indexErrorRetryClose: "無法載入種族索引。請關閉後再試一次。",
  loadingSpecies: "正在載入種族…",
  noResultsEnglishNames: (query: string) =>
    `沒有符合「${query}」的結果（名稱為英文）。`,

  // Roster slots
  choosePokemon: "選擇寶可夢",
  choose: "選擇",
  levelAbbr: "Lv.",
  levelOfAria: (name: string) => `${name}的等級`,
  buildConfigureAria: (name: string) =>
    `設定${name}的特性和招式`,
  buildCustomTitle: "自訂配置 — 特性和招式",
  buildChooseTitle: "選擇特性和招式",
  buildChooseHint: "選擇招式",
  buildEditHint: "編輯招式",
  buildChooseForAria: (name: string) =>
    `選擇${name}的特性和招式`,
  viewEntryTitle: (name: string) => `查看${name}的圖鑑頁面`,

  // Inline search
  searchPlaceholder: "搜尋任何寶可夢並招入隊伍（例：pikachu）…",
  searchAria: "搜尋要加入隊伍的寶可夢",
  indexErrorRetryReload: "無法載入種族索引。請重新整理後再試一次。",

  // Coach report
  coachReportTitle: "教練機器人報告",
  suggestedSwaps: "建議的替換",
  swapApplied: "✓ 已套用",
  apply: "套用",
  swapUnavailable: "找不到建議的種族",
  swapTitle: (outName: string, inName: string) =>
    `用${inName}替換${outName}`,

  // Drawer chrome
  drawerAria: "隊伍編輯器",
  closeTeamAria: "關閉隊伍",

  // AI errors (client-side fallbacks)
  coachNoReply: "教練機器人沒有回應。請再試一次。",
  coachOffline: "無法連線至教練機器人…",

  // AI generator
  generatedByCoach: "由教練機器人生成的隊伍",
  aiTitleEmpty: "還沒有隊伍？交給AI吧",
  aiTitleModify: "用AI調整你的隊伍",
  aiBodyEmpty:
    "描述你想要的隊伍，教練機器人會組建一支最佳化的6隻寶可夢隊伍。",
  aiBodyModify:
    "描述你想要的變動（或一支全新的隊伍），教練機器人會重新調整整支6隻寶可夢的陣容。",
  aiPlaceholderEmpty:
    "例：以噴火龍為核心的均衡第一世代隊伍，或一支耐打的水屬性隊伍…",
  aiPlaceholderModify:
    "例：把怕地面的成員換成水屬性，或在保留噴火龍的前提下更偏進攻…",
  aiWishAria: "描述你想生成的隊伍或想套用的變動",
  aiBuilding: "正在組建隊伍…",
  aiRequestUpdate: "✨ 請求更新",
  clearAria: "清空隊伍",
  aiGenerate: "✨ 用AI生成隊伍",

  // Coverage analysis
  criticalWeaknesses: "致命弱點",
  noCriticalWeaknesses: (threshold: number) =>
    `無：沒有任何屬性能剋制${threshold}名以上成員。`,
  memberCount: (count: number, total: number) =>
    `${total}名中的${count}名`,
  strongResistances: "強力抗性",
  noStrongResistances: (threshold: number) =>
    `尚無${threshold}名以上成員共有的抗性。`,
  missingCoverage: "缺少攻擊覆蓋",
  fullCoverage: "你的本系招式（STAB）能有效命中全部18種屬性。",

  // AI coach controls
  analyzing: "分析中…",
  analyzeAgain: "🤖 重新分析",
  analyzeWithAi: "🤖 用AI分析",
  staleReport: "隊伍在本報告之後有變動：請重新分析。",
  emptyTeamHint:
    "你也可以點擊空位上的「+」、在上方搜尋，或從列表中的任一卡片直接招募。",

  // Build editor
  damageClass: {
    physical: "物理",
    special: "特殊",
    status: "變化",
  } as Record<string, string>,
  movePower: (value: string | number) => `威力 ${value}`,
  moveAccuracy: (value: string | number) => `命中 ${value}`,
  movePp: (value: string | number) => `PP ${value}`,
  movePowerAbbr: (value: string | number) => `威力 ${value}`,
  moveAccuracyAbbr: (value: string | number) => `· 命中 ${value}`,
  removeMoveAria: (label: string) => `移除${label}`,
  emptyMoveSlot: "從列表中選擇一個招式…",
  loadingMoves: "正在載入招式…",
  moveNoResults: (query: string) =>
    `沒有符合「${query}」的結果。`,
  movesFullTitle: "已有4個招式：先移除一個才能替換",
  buildCloseAria: "關閉設定",
  buildDialogAria: (name: string) => `${name}的對戰設定`,
  buildTitle: "對戰設定",
  buildOptionsError: "無法載入該種族的特性和招式。請關閉後再試一次。",
  ability: "特性",
  abilityAuto: "自動（主要特性）",
  abilityHiddenSuffix: " · 隱藏",
  abilityHiddenBadge: "隱藏特性",
  movesHeading: (chosen: number) => `已選招式（${chosen}/4）`,
  buildLevel: "等級",
  buildLevelAria: (name: string) => `${name}的對戰等級`,
  learnLevel: (level: number) => `Lv.${level}`,
  learnStart: "初始",
  learnMachine: "招式學習器",
  learnEgg: "遺傳",
  learnTutor: "教學",
  moveSourceAria: "招式來源",
  sourceLevel: "升級習得",
  sourceMachine: "招式學習器",
  sourceLevelHint: (level: number) =>
    `隨等級提升習得的招式。在Lv.${level}只能選擇已經學會的那些。`,
  sourceMachineHint:
    "這隻寶可夢相容的招式學習器。沒有等級要求，且只會列出牠真正能使用的。",
  onlyKnown: (level: number) => `僅Lv.${level}`,
  onlyKnownTitle: (level: number) => `只顯示在Lv.${level}已學會的招式`,
  notYetTitle: (level: number) => `尚未學會：在Lv.${level}學會`,
  prunedByLevel: (names: string, level: number) =>
    `因在Lv.${level}尚未學會而移除：${names}`,
  movesHelpLevel: (level: number) =>
    `可從升級習得的招式（Lv.${level}已學會的）與牠能使用的招式學習器中，最多選擇4個。空位會在對戰開始時自動填入。`,
  allMovesHeading: "全部招式",
  allMovesCount: (shown: number, total: number) =>
    `（${shown}/${total}）`,
  movesFilterPlaceholder: "依名稱篩選（例：噴射火焰）…",
  movesFilterAria: "依名稱篩選招式",
  catalogueNote:
    "僅列出最新作品中透過升級或招式學習器習得的招式（其他一律無法選擇）。威力可變的攻擊會在對戰中即時計算，變化招式會（以簡化形式）套用其能力變化、異常狀態和回復效果。",
  reset: "重設",
  saveBuild: "儲存配置",

  // Build editor: AI move coach
  coachMoveTitle: "AI 訓練家",
  coachMoveHint: (level: number) =>
    `說出你想要的配招，4 個技能格會一次填滿。只會從該寶可夢在 Lv.${level} 已能使用的技能中挑選：升級技能或招式學習器。`,
  coachMovePresets: "推薦",
  coachMovePreset: {
    competitive: "對戰配招",
    physical: "物理輸出最大化",
    special: "特殊輸出最大化",
    coverage: "屬性覆蓋",
    status: "異常狀態與牽制",
    bulky: "耐久消耗",
  } as Record<MovePreset, string>,
  coachMovePlaceholder: "例如：主打輸出，但要能應付水系…",
  coachMoveAria: "描述你想要的技能",
  coachMoveRun: "讓 AI 挑選",
  coachMoveRunning: "正在挑選技能…",
  coachMoveToppedUp: "AI 沒有填滿 4 個技能格，空缺已用它最強的招式補齊。",
  coachMoveErrEmpty: "請輸入你想要的技能，或點選一個推薦。",
  coachMoveErrNoMoves: "該寶可夢在此等級沒有可選的技能。",
  coachMoveErrFailed: "AI 無法挑選技能，請再試一次。",

  // /api/battle/build-options errors
  apiInvalidSpecies: "無效的種族。",
  apiOptionsError: "無法載入該種族的選項。",
};

export const teamDict: Record<Lang, typeof es> = {
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

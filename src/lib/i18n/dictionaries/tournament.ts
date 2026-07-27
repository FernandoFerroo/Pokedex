import type { Lang } from "../config";
import type {
  RivalTier,
  TournamentDifficulty,
  TournamentFormat,
} from "@/types/tournament";
import type { TrainerClassKey } from "@/lib/tournament/config";

/** The three canned lines a trainer says when no model wrote better ones. */
export interface TierLines {
  start: string;
  pinch: string;
  defeat: string;
}

/**
 * Tournament mode: the home banner, the lobby, the bracket, the rest phase
 * between rounds and the two endings. Trainer classes and the canned battle
 * lines live here too — the bracket route reads them when the language model
 * is unavailable, so a run never ships untranslated text.
 */
const es = {
  metaTitle: "Torneo IA",
  metaDescription:
    "Encadena combates contra Entrenadores de la IA en un cuadro de torneo, ronda tras ronda, hasta levantar la copa.",

  // Home banner
  ctaTitle: "TORNEO IA",
  ctaBadge: "COPA",
  ctaTagline: "Cuadro · Rondas · Campeón",
  ctaAria: (rounds: number) =>
    `Entrar al Torneo IA (${rounds} rondas hasta la final)`,
  ctaOpen: "Competir",
  ctaRounds: (rounds: number) => `${rounds} rondas`,
  ctaTitles: (titles: number) => `Títulos ${titles}`,

  backToDex: "← Volver a la Pokédex",
  noTeamTitle: "Necesitas un equipo",
  noTeamBody:
    "El torneo se disputa con tu equipo. Añade al menos un Pokémon antes de inscribirte.",
  noTeamCta: "Montar mi equipo",

  // Lobby
  lobbyTitle: "INSCRIPCIÓN AL TORNEO",
  lobbySubtitle:
    "Combates encadenados a nivel 50. Gana todas las rondas para levantar la copa.",
  formatLabel: "Elige tu copa",
  cupName: {
    3: "Copa Relámpago",
    4: "Copa Élite",
    5: "Copa Maestra",
  } as Record<TournamentFormat, string>,
  cupDesc: {
    3: "Ideal para calentar. Rivales con equipos base, sin legendarios y una IA permisiva.",
    4: "Para entrenadores experimentados. Equipos evolucionados con cobertura de tipos e IA adaptativa.",
    5: "El verdadero reto. Rivales con legendarios y una IA experta que castiga cada error.",
  } as Record<TournamentFormat, string>,
  difficultyBadge: {
    easy: "Fácil",
    medium: "Medio",
    hard: "Difícil",
  } as Record<TournamentDifficulty, string>,
  roundsWord: "Rondas",
  cupTrainers: (count: number) => `${count} Entrenadores`,
  cupPathLabel: "Recorrido",
  cupSelected: "Seleccionada",
  cupSelectAria: (name: string) => `Elegir la ${name}`,
  rulesLabel: "Reglas",
  healOn: "Modo Estándar",
  healOnHint: "Tu equipo se recupera al 100% tras cada victoria.",
  healOff: "Modo Desafío",
  healOffHint: "El desgaste y los PS perdidos se acumulan ronda tras ronda.",
  startCta: "Entrar al torneo",
  resumeTitle: "Torneo en curso",
  resumeBody: (round: number, total: number) =>
    `Te quedaste en la ronda ${round} de ${total}.`,
  resumeCta: "Continuar",
  discardCta: "Empezar de cero",

  loadingBracket: "Sorteando el cuadro…",
  loadingRound: "Preparando el combate…",
  errorTitle: "No se ha podido montar el torneo.",
  retry: "Reintentar",

  // Bracket
  bracketTitle: "CUADRO DEL TORNEO",
  bracketSubtitle: (round: number, total: number) =>
    `Ronda ${round} de ${total}`,
  roundPlain: (round: number) => `Ronda ${round}`,
  roundQuarter: "Cuartos",
  roundRound16: "Octavos",
  roundRound32: "Dieciseisavos",
  roundSemi: "Semifinal",
  roundFinal: "Final",
  bracketYou: "TÚ",
  bracketUnknown: "Por determinar",
  bracketWon: "Ganado",
  bracketNow: "Ahora",
  bracketLocked: "Bloqueado",
  trophyLabel: "COPA",
  nextRivalTitle: "Tu próximo rival",
  /** Under the six gold balls of the rival dossier. */
  sixVsSix: "Combate 6 vs 6",
  rivalRosterLabel: "Equipo rival",
  /** Warning shown while the player brings fewer than six Pokémon. */
  rosterNote: (count: number) =>
    `Cada Entrenador lucha con 6 Pokémon. Tu equipo lleva ${count}/6.`,
  fightCta: "¡Al combate!",
  saveExitCta: "Guardar y salir",
  bracketAria: "Cuadro del torneo",

  // Round banner + HUD
  bannerRound: (round: number) => `RONDA ${round}`,
  bannerVs: (trainer: string) => `¡VS ${trainer}!`,
  hudRound: (round: number, total: number) => `Ronda ${round}/${total}`,
  hudStreak: (wins: number) => `Racha ${wins}`,

  // Rest phase
  restTitle: "FASE DE DESCANSO",
  restBody: (round: number, total: number) =>
    `Ronda ${round} superada. Quedan ${total - round} para la copa.`,
  healCta: "Curar al equipo",
  healedNote: "Equipo curado por completo.",
  challengeNote: "Modo desafío: el equipo sigue como acabó el combate.",
  statsTitle: "Resumen del combate",
  statMvp: "MVP",
  statDamage: "Daño causado",
  statTurns: "Turnos",
  statNone: "—",
  continueCta: "Siguiente ronda",

  // Endings
  championTitle: "¡CAMPEÓN!",
  championBody: (trainer: string) =>
    `Has derrotado a ${trainer} en la final y levantas la copa.`,
  championRecord: (titles: number) =>
    `Títulos conseguidos: ${titles}. Tu trofeo queda registrado en la Pokédex.`,
  /** Ceremonia de campeón: vitrina del equipo y cifras de la carrera. */
  hallOfFame: "Salón de la Fama",
  championStatTitles: "Títulos",
  championStatStreak: "Mejor racha",
  championStatTrainers: "Entrenadores",
  eliminatedTitle: "ELIMINADO",
  eliminatedBody: (round: number, trainer: string) =>
    `Has caído en la ronda ${round} contra ${trainer}.`,
  eliminatedStreak: (wins: number) =>
    wins === 0
      ? "No has sumado ninguna victoria esta vez."
      : `Racha alcanzada: ${wins} ${wins === 1 ? "victoria" : "victorias"}.`,
  fledTitle: "TORNEO ABANDONADO",
  fledBody: "Huir de un combate te deja fuera del cuadro.",
  againCta: "Nuevo torneo",
  homeCta: "Volver a la Pokédex",
  recordLabel: (titles: number, best: number) =>
    `Títulos ${titles} · Mejor racha ${best}`,

  // Trainer classes
  trainerClass: {
    youngster: "Joven",
    bugCatcher: "Cazabichos",
    lass: "Chica",
    camper: "Acampador",
    coolTrainer: "Entrenadora Guay",
    veteran: "Veterano",
    ace: "As del Combate",
    blackBelt: "Cinturón Negro",
    champion: "Campeón",
    championF: "Campeona",
    eliteFour: "Alto Mando",
  } as Record<TrainerClassKey, string>,
  tierLabel: {
    rookie: "Novato",
    veteran: "Veterano",
    champion: "Campeón",
  } as Record<RivalTier, string>,
  tierHint: {
    rookie: "Ataca casi al azar y no lleva objetos.",
    veteran: "Busca la ventaja de tipo y usa pociones.",
    champion: "Cambia de Pokémon, usa estados y no perdona.",
  } as Record<RivalTier, string>,
  lines: {
    rookie: {
      start: "¡No pienso ponértelo fácil!",
      pinch: "¡Ay! ¿Y ahora qué hago?",
      defeat: "¡Jo! Aún me queda mucho por aprender.",
    },
    veteran: {
      start: "Vamos a ver de qué estás hecho.",
      pinch: "¡No he llegado hasta aquí para caer ahora!",
      defeat: "Buen combate. Te lo has ganado.",
    },
    champion: {
      start: "Solo uno de los dos levantará la copa.",
      pinch: "¡Ahora esto se pone interesante de verdad!",
      defeat: "Hoy la corona es tuya. Disfrútala.",
    },
  } as Record<RivalTier, TierLines>,
  defaultStyle: "entrenador de torneo con uniforme de competición",
};

const en: typeof es = {
  metaTitle: "AI Tournament",
  metaDescription:
    "Chain battles against AI trainers through a tournament bracket, round after round, until you lift the cup.",

  ctaTitle: "AI TOURNAMENT",
  ctaBadge: "CUP",
  ctaTagline: "Bracket · Rounds · Champion",
  ctaAria: (rounds) => `Enter the AI Tournament (${rounds} rounds to the final)`,
  ctaOpen: "Compete",
  ctaRounds: (rounds) => `${rounds} rounds`,
  ctaTitles: (titles) => `Titles ${titles}`,

  backToDex: "← Back to the Pokédex",
  noTeamTitle: "You need a team",
  noTeamBody:
    "The tournament is fought with your team. Add at least one Pokémon before entering.",
  noTeamCta: "Build my team",

  lobbyTitle: "TOURNAMENT ENTRY",
  lobbySubtitle:
    "Back-to-back battles at level 50. Win every round to lift the cup.",
  formatLabel: "Choose your cup",
  cupName: {
    3: "Lightning Cup",
    4: "Elite Cup",
    5: "Master Cup",
  } as Record<TournamentFormat, string>,
  cupDesc: {
    3: "A gentle warm-up. Rivals bring base teams, no legendaries and a forgiving AI.",
    4: "For seasoned trainers. Fully evolved teams with type coverage and an adaptive AI.",
    5: "The real deal. Rivals field legendaries and an expert AI that punishes every slip.",
  } as Record<TournamentFormat, string>,
  difficultyBadge: {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
  } as Record<TournamentDifficulty, string>,
  roundsWord: "Rounds",
  cupTrainers: (count: number) => `${count} Trainers`,
  cupPathLabel: "Path",
  cupSelected: "Selected",
  cupSelectAria: (name: string) => `Choose the ${name}`,
  rulesLabel: "Rules",
  healOn: "Standard Mode",
  healOnHint: "Your team is restored to 100% after every win.",
  healOff: "Challenge Mode",
  healOffHint: "Wear and lost HP pile up round after round.",
  startCta: "Enter the tournament",
  resumeTitle: "Tournament in progress",
  resumeBody: (round, total) => `You stopped at round ${round} of ${total}.`,
  resumeCta: "Continue",
  discardCta: "Start over",

  loadingBracket: "Drawing the bracket…",
  loadingRound: "Setting up the battle…",
  errorTitle: "The tournament could not be set up.",
  retry: "Retry",

  bracketTitle: "TOURNAMENT BRACKET",
  bracketSubtitle: (round, total) => `Round ${round} of ${total}`,
  roundPlain: (round) => `Round ${round}`,
  roundQuarter: "Quarter-final",
  roundRound16: "Round of 16",
  roundRound32: "Round of 32",
  roundSemi: "Semi-final",
  roundFinal: "Final",
  bracketYou: "YOU",
  bracketUnknown: "To be decided",
  bracketWon: "Won",
  bracketNow: "Now",
  bracketLocked: "Locked",
  trophyLabel: "CUP",
  nextRivalTitle: "Your next rival",
  sixVsSix: "6 vs 6 battle",
  rivalRosterLabel: "Rival team",
  rosterNote: (count) =>
    `Every trainer fights with 6 Pokémon. Your team brings ${count}/6.`,
  fightCta: "Fight!",
  saveExitCta: "Save and exit",
  bracketAria: "Tournament bracket",

  bannerRound: (round) => `ROUND ${round}`,
  bannerVs: (trainer) => `VS ${trainer}!`,
  hudRound: (round, total) => `Round ${round}/${total}`,
  hudStreak: (wins) => `Streak ${wins}`,

  restTitle: "REST PHASE",
  restBody: (round, total) =>
    `Round ${round} cleared. ${total - round} to go for the cup.`,
  healCta: "Heal the team",
  healedNote: "Team fully healed.",
  challengeNote: "Challenge mode: the team stays as the battle left it.",
  statsTitle: "Battle summary",
  statMvp: "MVP",
  statDamage: "Damage dealt",
  statTurns: "Turns",
  statNone: "—",
  continueCta: "Next round",

  championTitle: "CHAMPION!",
  championBody: (trainer) =>
    `You beat ${trainer} in the final and lift the cup.`,
  championRecord: (titles) =>
    `Titles won: ${titles}. Your trophy is recorded in the Pokédex.`,
  hallOfFame: "Hall of Fame",
  championStatTitles: "Titles",
  championStatStreak: "Best streak",
  championStatTrainers: "Trainers",
  eliminatedTitle: "ELIMINATED",
  eliminatedBody: (round, trainer) =>
    `You went down in round ${round} against ${trainer}.`,
  eliminatedStreak: (wins) =>
    wins === 0
      ? "No wins this time."
      : `Streak reached: ${wins} ${wins === 1 ? "win" : "wins"}.`,
  fledTitle: "TOURNAMENT FORFEITED",
  fledBody: "Running from a battle takes you out of the bracket.",
  againCta: "New tournament",
  homeCta: "Back to the Pokédex",
  recordLabel: (titles, best) => `Titles ${titles} · Best streak ${best}`,

  trainerClass: {
    youngster: "Youngster",
    bugCatcher: "Bug Catcher",
    lass: "Lass",
    camper: "Camper",
    coolTrainer: "Cool Trainer",
    veteran: "Veteran",
    ace: "Ace Trainer",
    blackBelt: "Black Belt",
    champion: "Champion",
    championF: "Champion",
    eliteFour: "Elite Four",
  },
  tierLabel: {
    rookie: "Rookie",
    veteran: "Veteran",
    champion: "Champion",
  },
  tierHint: {
    rookie: "Attacks almost at random and carries no items.",
    veteran: "Hunts for the type advantage and uses potions.",
    champion: "Switches, plays status moves and shows no mercy.",
  },
  lines: {
    rookie: {
      start: "I'm not making this easy for you!",
      pinch: "Uh-oh! What do I do now?",
      defeat: "Aw! I still have a lot to learn.",
    },
    veteran: {
      start: "Let's see what you're made of.",
      pinch: "I didn't come this far to fall now!",
      defeat: "Good battle. You earned it.",
    },
    champion: {
      start: "Only one of us lifts the cup.",
      pinch: "Now this is getting interesting!",
      defeat: "The crown is yours today. Wear it well.",
    },
  },
  defaultStyle: "tournament trainer in competition gear",
};

const fr: typeof es = {
  metaTitle: "Tournoi IA",
  metaDescription:
    "Enchaîne les combats contre des Dresseurs IA dans un tableau de tournoi, manche après manche, jusqu'à soulever la coupe.",

  ctaTitle: "TOURNOI IA",
  ctaBadge: "COUPE",
  ctaTagline: "Tableau · Manches · Champion",
  ctaAria: (rounds) => `Entrer dans le Tournoi IA (${rounds} manches)`,
  ctaOpen: "Concourir",
  ctaRounds: (rounds) => `${rounds} manches`,
  ctaTitles: (titles) => `Titres ${titles}`,

  backToDex: "← Retour au Pokédex",
  noTeamTitle: "Il te faut une équipe",
  noTeamBody:
    "Le tournoi se joue avec ton équipe. Ajoute au moins un Pokémon avant de t'inscrire.",
  noTeamCta: "Créer mon équipe",

  lobbyTitle: "INSCRIPTION AU TOURNOI",
  lobbySubtitle:
    "Combats enchaînés au niveau 50. Gagne toutes les manches pour soulever la coupe.",
  formatLabel: "Choisis ta coupe",
  cupName: {
    3: "Coupe Éclair",
    4: "Coupe Élite",
    5: "Coupe Maître",
  } as Record<TournamentFormat, string>,
  cupDesc: {
    3: "Parfait pour s'échauffer. Des équipes de base, aucun légendaire et une IA indulgente.",
    4: "Pour les dresseurs aguerris. Équipes pleinement évoluées, couverture de types et IA adaptative.",
    5: "Le vrai défi. Des légendaires en face et une IA experte qui punit la moindre erreur.",
  } as Record<TournamentFormat, string>,
  difficultyBadge: {
    easy: "Facile",
    medium: "Moyen",
    hard: "Difficile",
  } as Record<TournamentDifficulty, string>,
  roundsWord: "Manches",
  cupTrainers: (count: number) => `${count} Dresseurs`,
  cupPathLabel: "Parcours",
  cupSelected: "Sélectionnée",
  cupSelectAria: (name: string) => `Choisir la ${name}`,
  rulesLabel: "Règles",
  healOn: "Mode Standard",
  healOnHint: "Ton équipe récupère 100% de ses PV après chaque victoire.",
  healOff: "Mode Défi",
  healOffHint: "L'usure et les PV perdus s'accumulent manche après manche.",
  startCta: "Entrer dans le tournoi",
  resumeTitle: "Tournoi en cours",
  resumeBody: (round, total) =>
    `Tu t'es arrêté à la manche ${round} sur ${total}.`,
  resumeCta: "Continuer",
  discardCta: "Repartir de zéro",

  loadingBracket: "Tirage du tableau…",
  loadingRound: "Préparation du combat…",
  errorTitle: "Impossible de monter le tournoi.",
  retry: "Réessayer",

  bracketTitle: "TABLEAU DU TOURNOI",
  bracketSubtitle: (round, total) => `Manche ${round} sur ${total}`,
  roundPlain: (round) => `Manche ${round}`,
  roundQuarter: "Quarts",
  roundRound16: "Huitièmes",
  roundRound32: "Seizièmes",
  roundSemi: "Demi-finale",
  roundFinal: "Finale",
  bracketYou: "TOI",
  bracketUnknown: "À déterminer",
  bracketWon: "Gagné",
  bracketNow: "En cours",
  bracketLocked: "Verrouillé",
  trophyLabel: "COUPE",
  nextRivalTitle: "Ton prochain rival",
  sixVsSix: "Combat 6 contre 6",
  rivalRosterLabel: "Équipe rivale",
  rosterNote: (count) =>
    `Chaque Dresseur combat avec 6 Pokémon. Ton équipe en compte ${count}/6.`,
  fightCta: "Au combat !",
  saveExitCta: "Sauvegarder et quitter",
  bracketAria: "Tableau du tournoi",

  bannerRound: (round) => `MANCHE ${round}`,
  bannerVs: (trainer) => `VS ${trainer} !`,
  hudRound: (round, total) => `Manche ${round}/${total}`,
  hudStreak: (wins) => `Série ${wins}`,

  restTitle: "PHASE DE REPOS",
  restBody: (round, total) =>
    `Manche ${round} remportée. Encore ${total - round} avant la coupe.`,
  healCta: "Soigner l'équipe",
  healedNote: "Équipe entièrement soignée.",
  challengeNote: "Mode défi : l'équipe reste dans l'état du combat.",
  statsTitle: "Résumé du combat",
  statMvp: "MVP",
  statDamage: "Dégâts infligés",
  statTurns: "Tours",
  statNone: "—",
  continueCta: "Manche suivante",

  championTitle: "CHAMPION !",
  championBody: (trainer) =>
    `Tu as battu ${trainer} en finale et tu soulèves la coupe.`,
  championRecord: (titles) =>
    `Titres remportés : ${titles}. Ton trophée est inscrit au Pokédex.`,
  hallOfFame: "Panthéon",
  championStatTitles: "Titres",
  championStatStreak: "Meilleure série",
  championStatTrainers: "Dresseurs",
  eliminatedTitle: "ÉLIMINÉ",
  eliminatedBody: (round, trainer) =>
    `Tu es tombé à la manche ${round} face à ${trainer}.`,
  eliminatedStreak: (wins) =>
    wins === 0
      ? "Aucune victoire cette fois."
      : `Série atteinte : ${wins} ${wins === 1 ? "victoire" : "victoires"}.`,
  fledTitle: "TOURNOI ABANDONNÉ",
  fledBody: "Fuir un combat te sort du tableau.",
  againCta: "Nouveau tournoi",
  homeCta: "Retour au Pokédex",
  recordLabel: (titles, best) => `Titres ${titles} · Meilleure série ${best}`,

  trainerClass: {
    youngster: "Gamin",
    bugCatcher: "Scout",
    lass: "Fillette",
    camper: "Campeur",
    coolTrainer: "Dresseuse Chic",
    veteran: "Vétéran",
    ace: "Topdresseur",
    blackBelt: "Ceinture Noire",
    champion: "Maître",
    championF: "Maîtresse",
    eliteFour: "Conseil 4",
  },
  tierLabel: {
    rookie: "Débutant",
    veteran: "Vétéran",
    champion: "Maître",
  },
  tierHint: {
    rookie: "Attaque presque au hasard et n'a aucun objet.",
    veteran: "Cherche l'avantage de type et utilise des potions.",
    champion: "Change de Pokémon, joue les statuts et ne pardonne rien.",
  },
  lines: {
    rookie: {
      start: "Je ne vais pas te faciliter la tâche !",
      pinch: "Aïe ! Qu'est-ce que je fais maintenant ?",
      defeat: "Zut ! J'ai encore beaucoup à apprendre.",
    },
    veteran: {
      start: "Voyons de quoi tu es capable.",
      pinch: "Je ne suis pas venu jusqu'ici pour tomber !",
      defeat: "Beau combat. Tu l'as mérité.",
    },
    champion: {
      start: "Un seul de nous deux soulèvera la coupe.",
      pinch: "Là, ça devient vraiment intéressant !",
      defeat: "La couronne est à toi aujourd'hui. Profites-en.",
    },
  },
  defaultStyle: "dresseur de tournoi en tenue de compétition",
};

const de: typeof es = {
  metaTitle: "KI-Turnier",
  metaDescription:
    "Kämpfe dich Runde für Runde durch einen Turnierbaum voller KI-Trainer, bis du den Pokal hebst.",

  ctaTitle: "KI-TURNIER",
  ctaBadge: "POKAL",
  ctaTagline: "Turnierbaum · Runden · Champion",
  ctaAria: (rounds) => `Ins KI-Turnier einsteigen (${rounds} Runden)`,
  ctaOpen: "Antreten",
  ctaRounds: (rounds) => `${rounds} Runden`,
  ctaTitles: (titles) => `Titel ${titles}`,

  backToDex: "← Zurück zum Pokédex",
  noTeamTitle: "Du brauchst ein Team",
  noTeamBody:
    "Das Turnier wird mit deinem Team bestritten. Nimm mindestens ein Pokémon auf.",
  noTeamCta: "Mein Team aufstellen",

  lobbyTitle: "TURNIERANMELDUNG",
  lobbySubtitle:
    "Kämpfe am Stück auf Level 50. Gewinne jede Runde und hol dir den Pokal.",
  formatLabel: "Wähle deinen Pokal",
  cupName: {
    3: "Blitzpokal",
    4: "Elitepokal",
    5: "Meisterpokal",
  } as Record<TournamentFormat, string>,
  cupDesc: {
    3: "Ideal zum Aufwärmen. Gegner mit Basisteams, ohne Legendäre und mit nachsichtiger KI.",
    4: "Für erfahrene Trainer. Voll entwickelte Teams mit Typenabdeckung und anpassungsfähiger KI.",
    5: "Die echte Prüfung. Gegner mit Legendären und eine Experten-KI, die jeden Fehler bestraft.",
  } as Record<TournamentFormat, string>,
  difficultyBadge: {
    easy: "Leicht",
    medium: "Mittel",
    hard: "Schwer",
  } as Record<TournamentDifficulty, string>,
  roundsWord: "Runden",
  cupTrainers: (count: number) => `${count} Trainer`,
  cupPathLabel: "Weg",
  cupSelected: "Ausgewählt",
  cupSelectAria: (name: string) => `Den ${name} wählen`,
  rulesLabel: "Regeln",
  healOn: "Standardmodus",
  healOnHint: "Dein Team wird nach jedem Sieg zu 100% geheilt.",
  healOff: "Herausforderungsmodus",
  healOffHint: "Abnutzung und verlorene KP summieren sich Runde für Runde.",
  startCta: "Ins Turnier einsteigen",
  resumeTitle: "Laufendes Turnier",
  resumeBody: (round, total) =>
    `Du bist in Runde ${round} von ${total} stehen geblieben.`,
  resumeCta: "Fortsetzen",
  discardCta: "Neu anfangen",

  loadingBracket: "Turnierbaum wird ausgelost…",
  loadingRound: "Kampf wird vorbereitet…",
  errorTitle: "Das Turnier konnte nicht erstellt werden.",
  retry: "Erneut versuchen",

  bracketTitle: "TURNIERBAUM",
  bracketSubtitle: (round, total) => `Runde ${round} von ${total}`,
  roundPlain: (round) => `Runde ${round}`,
  roundQuarter: "Viertelfinale",
  roundRound16: "Achtelfinale",
  roundRound32: "Sechzehntelfinale",
  roundSemi: "Halbfinale",
  roundFinal: "Finale",
  bracketYou: "DU",
  bracketUnknown: "Noch offen",
  bracketWon: "Gewonnen",
  bracketNow: "Jetzt",
  bracketLocked: "Gesperrt",
  trophyLabel: "POKAL",
  nextRivalTitle: "Dein nächster Gegner",
  sixVsSix: "Kampf 6 gegen 6",
  rivalRosterLabel: "Gegnerteam",
  rosterNote: (count) =>
    `Jeder Trainer kämpft mit 6 Pokémon. Dein Team hat ${count}/6.`,
  fightCta: "In den Kampf!",
  saveExitCta: "Speichern und verlassen",
  bracketAria: "Turnierbaum",

  bannerRound: (round) => `RUNDE ${round}`,
  bannerVs: (trainer) => `VS ${trainer}!`,
  hudRound: (round, total) => `Runde ${round}/${total}`,
  hudStreak: (wins) => `Serie ${wins}`,

  restTitle: "RUHEPHASE",
  restBody: (round, total) =>
    `Runde ${round} geschafft. Noch ${total - round} bis zum Pokal.`,
  healCta: "Team heilen",
  healedNote: "Team vollständig geheilt.",
  challengeNote: "Herausforderungsmodus: Das Team bleibt, wie es war.",
  statsTitle: "Kampfbilanz",
  statMvp: "MVP",
  statDamage: "Verursachter Schaden",
  statTurns: "Runden",
  statNone: "—",
  continueCta: "Nächste Runde",

  championTitle: "CHAMPION!",
  championBody: (trainer) =>
    `Du hast ${trainer} im Finale besiegt und hebst den Pokal.`,
  championRecord: (titles) =>
    `Gewonnene Titel: ${titles}. Deine Trophäe ist im Pokédex vermerkt.`,
  hallOfFame: "Ruhmeshalle",
  championStatTitles: "Titel",
  championStatStreak: "Beste Serie",
  championStatTrainers: "Trainer",
  eliminatedTitle: "AUSGESCHIEDEN",
  eliminatedBody: (round, trainer) =>
    `Du bist in Runde ${round} gegen ${trainer} gescheitert.`,
  eliminatedStreak: (wins) =>
    wins === 0
      ? "Diesmal ohne Sieg."
      : `Erreichte Serie: ${wins} ${wins === 1 ? "Sieg" : "Siege"}.`,
  fledTitle: "TURNIER AUFGEGEBEN",
  fledBody: "Wer aus einem Kampf flieht, scheidet aus dem Turnierbaum aus.",
  againCta: "Neues Turnier",
  homeCta: "Zurück zum Pokédex",
  recordLabel: (titles, best) => `Titel ${titles} · Beste Serie ${best}`,

  trainerClass: {
    youngster: "Knirps",
    bugCatcher: "Käfersammler",
    lass: "Göre",
    camper: "Camper",
    coolTrainer: "Coole Trainerin",
    veteran: "Veteran",
    ace: "Ass-Trainer",
    blackBelt: "Schwarzgurt",
    champion: "Champ",
    championF: "Champ",
    eliteFour: "Top Vier",
  },
  tierLabel: {
    rookie: "Neuling",
    veteran: "Veteran",
    champion: "Champ",
  },
  tierHint: {
    rookie: "Greift fast zufällig an und hat keine Items dabei.",
    veteran: "Sucht den Typvorteil und setzt Tränke ein.",
    champion: "Wechselt, nutzt Statusattacken und kennt kein Erbarmen.",
  },
  lines: {
    rookie: {
      start: "Ich mache es dir nicht leicht!",
      pinch: "Oh nein! Was mache ich jetzt?",
      defeat: "Mann! Ich muss noch viel lernen.",
    },
    veteran: {
      start: "Mal sehen, aus welchem Holz du geschnitzt bist.",
      pinch: "Ich bin nicht so weit gekommen, um jetzt zu verlieren!",
      defeat: "Guter Kampf. Du hast ihn verdient.",
    },
    champion: {
      start: "Nur einer von uns hebt den Pokal.",
      pinch: "Jetzt wird es richtig spannend!",
      defeat: "Heute gehört die Krone dir. Genieße sie.",
    },
  },
  defaultStyle: "Turniertrainer in Wettkampfkleidung",
};

const it: typeof es = {
  metaTitle: "Torneo IA",
  metaDescription:
    "Incatena lotte contro Allenatori IA in un tabellone a eliminazione, turno dopo turno, fino ad alzare la coppa.",

  ctaTitle: "TORNEO IA",
  ctaBadge: "COPPA",
  ctaTagline: "Tabellone · Turni · Campione",
  ctaAria: (rounds) => `Entra nel Torneo IA (${rounds} turni)`,
  ctaOpen: "Competi",
  ctaRounds: (rounds) => `${rounds} turni`,
  ctaTitles: (titles) => `Titoli ${titles}`,

  backToDex: "← Torna al Pokédex",
  noTeamTitle: "Ti serve una squadra",
  noTeamBody:
    "Il torneo si gioca con la tua squadra. Aggiungi almeno un Pokémon prima di iscriverti.",
  noTeamCta: "Crea la mia squadra",

  lobbyTitle: "ISCRIZIONE AL TORNEO",
  lobbySubtitle:
    "Lotte consecutive al livello 50. Vinci ogni turno per alzare la coppa.",
  formatLabel: "Scegli la tua coppa",
  cupName: {
    3: "Coppa Lampo",
    4: "Coppa Élite",
    5: "Coppa Maestra",
  } as Record<TournamentFormat, string>,
  cupDesc: {
    3: "Perfetta per scaldarsi. Rivali con squadre base, niente leggendari e IA permissiva.",
    4: "Per allenatori esperti. Squadre completamente evolute con copertura di tipi e IA adattiva.",
    5: "La sfida vera. Rivali con leggendari e un'IA esperta che punisce ogni errore.",
  } as Record<TournamentFormat, string>,
  difficultyBadge: {
    easy: "Facile",
    medium: "Medio",
    hard: "Difficile",
  } as Record<TournamentDifficulty, string>,
  roundsWord: "Turni",
  cupTrainers: (count: number) => `${count} Allenatori`,
  cupPathLabel: "Percorso",
  cupSelected: "Selezionata",
  cupSelectAria: (name: string) => `Scegli la ${name}`,
  rulesLabel: "Regole",
  healOn: "Modalità Standard",
  healOnHint: "La squadra recupera il 100% dei PS dopo ogni vittoria.",
  healOff: "Modalità Sfida",
  healOffHint: "L'usura e i PS persi si accumulano turno dopo turno.",
  startCta: "Entra nel torneo",
  resumeTitle: "Torneo in corso",
  resumeBody: (round, total) => `Ti sei fermato al turno ${round} di ${total}.`,
  resumeCta: "Continua",
  discardCta: "Ricomincia",

  loadingBracket: "Sorteggio del tabellone…",
  loadingRound: "Preparazione della lotta…",
  errorTitle: "Non è stato possibile creare il torneo.",
  retry: "Riprova",

  bracketTitle: "TABELLONE DEL TORNEO",
  bracketSubtitle: (round, total) => `Turno ${round} di ${total}`,
  roundPlain: (round) => `Turno ${round}`,
  roundQuarter: "Quarti",
  roundRound16: "Ottavi",
  roundRound32: "Sedicesimi",
  roundSemi: "Semifinale",
  roundFinal: "Finale",
  bracketYou: "TU",
  bracketUnknown: "Da definire",
  bracketWon: "Vinto",
  bracketNow: "Ora",
  bracketLocked: "Bloccato",
  trophyLabel: "COPPA",
  nextRivalTitle: "Il tuo prossimo rivale",
  sixVsSix: "Lotta 6 contro 6",
  rivalRosterLabel: "Squadra rivale",
  rosterNote: (count) =>
    `Ogni Allenatore lotta con 6 Pokémon. La tua squadra ne ha ${count}/6.`,
  fightCta: "Alla lotta!",
  saveExitCta: "Salva ed esci",
  bracketAria: "Tabellone del torneo",

  bannerRound: (round) => `TURNO ${round}`,
  bannerVs: (trainer) => `VS ${trainer}!`,
  hudRound: (round, total) => `Turno ${round}/${total}`,
  hudStreak: (wins) => `Serie ${wins}`,

  restTitle: "FASE DI RIPOSO",
  restBody: (round, total) =>
    `Turno ${round} superato. Ne restano ${total - round} per la coppa.`,
  healCta: "Cura la squadra",
  healedNote: "Squadra curata completamente.",
  challengeNote: "Modalità sfida: la squadra resta come ha finito la lotta.",
  statsTitle: "Riepilogo della lotta",
  statMvp: "MVP",
  statDamage: "Danni inflitti",
  statTurns: "Turni",
  statNone: "—",
  continueCta: "Turno successivo",

  championTitle: "CAMPIONE!",
  championBody: (trainer) =>
    `Hai battuto ${trainer} in finale e alzi la coppa.`,
  championRecord: (titles) =>
    `Titoli conquistati: ${titles}. Il trofeo è registrato nel Pokédex.`,
  hallOfFame: "Sala d'Onore",
  championStatTitles: "Titoli",
  championStatStreak: "Serie migliore",
  championStatTrainers: "Allenatori",
  eliminatedTitle: "ELIMINATO",
  eliminatedBody: (round, trainer) =>
    `Sei caduto al turno ${round} contro ${trainer}.`,
  eliminatedStreak: (wins) =>
    wins === 0
      ? "Nessuna vittoria questa volta."
      : `Serie raggiunta: ${wins} ${wins === 1 ? "vittoria" : "vittorie"}.`,
  fledTitle: "TORNEO ABBANDONATO",
  fledBody: "Fuggire da una lotta ti esclude dal tabellone.",
  againCta: "Nuovo torneo",
  homeCta: "Torna al Pokédex",
  recordLabel: (titles, best) => `Titoli ${titles} · Serie migliore ${best}`,

  trainerClass: {
    youngster: "Giovincello",
    bugCatcher: "Cacciatore",
    lass: "Bimbieta",
    camper: "Campeggiatore",
    coolTrainer: "Fantallenatrice",
    veteran: "Veterano",
    ace: "Asso",
    blackBelt: "Cintura Nera",
    champion: "Campione",
    championF: "Campionessa",
    eliteFour: "Superquattro",
  },
  tierLabel: {
    rookie: "Novellino",
    veteran: "Veterano",
    champion: "Campione",
  },
  tierHint: {
    rookie: "Attacca quasi a caso e non porta strumenti.",
    veteran: "Cerca il vantaggio di tipo e usa le pozioni.",
    champion: "Cambia Pokémon, gioca gli stati e non perdona.",
  },
  lines: {
    rookie: {
      start: "Non te la renderò facile!",
      pinch: "Ahia! E adesso che faccio?",
      defeat: "Uffa! Ho ancora molto da imparare.",
    },
    veteran: {
      start: "Vediamo di che pasta sei fatto.",
      pinch: "Non sono arrivato fin qui per cadere ora!",
      defeat: "Bella lotta. Te la sei meritata.",
    },
    champion: {
      start: "Solo uno di noi alzerà la coppa.",
      pinch: "Ora sì che si fa interessante!",
      defeat: "Oggi la corona è tua. Godila.",
    },
  },
  defaultStyle: "allenatore da torneo in tenuta da gara",
};

const ja: typeof es = {
  metaTitle: "AIトーナメント",
  metaDescription:
    "AIトレーナーとのバトルをトーナメント表で勝ち上がり、優勝カップを目指そう。",

  ctaTitle: "AIトーナメント",
  ctaBadge: "カップ",
  ctaTagline: "トーナメント表 · ラウンド · 優勝",
  ctaAria: (rounds) => `AIトーナメントに挑戦する（全${rounds}回戦）`,
  ctaOpen: "挑戦する",
  ctaRounds: (rounds) => `全${rounds}回戦`,
  ctaTitles: (titles) => `優勝 ${titles}`,

  backToDex: "← ポケモン図鑑に戻る",
  noTeamTitle: "手持ちが必要だ",
  noTeamBody:
    "トーナメントは手持ちで戦う。参加する前にポケモンを1匹以上入れよう。",
  noTeamCta: "手持ちをつくる",

  lobbyTitle: "トーナメント参加",
  lobbySubtitle: "レベル50の連戦。全ラウンドを勝ち抜けば優勝だ。",
  formatLabel: "カップを えらぶ",
  cupName: {
    3: "ライトニングカップ",
    4: "エリートカップ",
    5: "マスターカップ",
  } as Record<TournamentFormat, string>,
  cupDesc: {
    3: "肩ならしに最適。進化前中心の手持ちで、伝説なし・AIも手加減してくれる。",
    4: "経験者向け。最終進化ぞろいでタイプ相性も考えた、適応するAI。",
    5: "本物の挑戦。伝説のポケモンと、ミスを見逃さない熟練AIが相手。",
  } as Record<TournamentFormat, string>,
  difficultyBadge: {
    easy: "かんたん",
    medium: "ふつう",
    hard: "むずかしい",
  } as Record<TournamentDifficulty, string>,
  roundsWord: "回戦",
  cupTrainers: (count: number) => `${count}人のトレーナー`,
  cupPathLabel: "コース",
  cupSelected: "選択中",
  cupSelectAria: (name: string) => `${name}を えらぶ`,
  rulesLabel: "ルール",
  healOn: "スタンダードモード",
  healOnHint: "勝つたびに手持ちのHPが100%回復する。",
  healOff: "チャレンジモード",
  healOffHint: "消耗と失ったHPはラウンドごとに積み重なる。",
  startCta: "トーナメントに参加",
  resumeTitle: "進行中のトーナメント",
  resumeBody: (round, total) => `${total}回戦中の第${round}回戦で中断している。`,
  resumeCta: "つづきから",
  discardCta: "はじめから",

  loadingBracket: "組み合わせを抽選中…",
  loadingRound: "バトルの準備中…",
  errorTitle: "トーナメントを準備できなかった。",
  retry: "もう一度",

  bracketTitle: "トーナメント表",
  bracketSubtitle: (round, total) => `第${round}回戦 / 全${total}回戦`,
  roundPlain: (round) => `第${round}回戦`,
  roundQuarter: "準々決勝",
  roundRound16: "3回戦",
  roundRound32: "2回戦",
  roundSemi: "準決勝",
  roundFinal: "決勝",
  bracketYou: "きみ",
  bracketUnknown: "未定",
  bracketWon: "勝利",
  bracketNow: "現在",
  bracketLocked: "未開放",
  trophyLabel: "優勝カップ",
  nextRivalTitle: "次の相手",
  sixVsSix: "6対6のバトル",
  rivalRosterLabel: "相手のチーム",
  rosterNote: (count) =>
    `どのトレーナーも6匹で戦う。きみのチームは${count}/6。`,
  fightCta: "たたかう！",
  saveExitCta: "セーブしてやめる",
  bracketAria: "トーナメント表",

  bannerRound: (round) => `第${round}回戦`,
  bannerVs: (trainer) => `VS ${trainer}！`,
  hudRound: (round, total) => `第${round}/${total}回戦`,
  hudStreak: (wins) => `連勝 ${wins}`,

  restTitle: "きゅうけいタイム",
  restBody: (round, total) =>
    `第${round}回戦突破。優勝まであと${total - round}回戦。`,
  healCta: "手持ちを回復する",
  healedNote: "手持ちは完全に回復した。",
  challengeNote: "チャレンジモード：手持ちはそのままだ。",
  statsTitle: "バトルの記録",
  statMvp: "MVP",
  statDamage: "与えたダメージ",
  statTurns: "ターン数",
  statNone: "—",
  continueCta: "次の回戦へ",

  championTitle: "ゆうしょう！",
  championBody: (trainer) => `決勝で${trainer}を破り、カップを掲げた。`,
  championRecord: (titles) => `優勝回数：${titles}。トロフィーが図鑑に記録された。`,
  hallOfFame: "殿堂入り",
  championStatTitles: "優勝回数",
  championStatStreak: "最高連勝",
  championStatTrainers: "参加人数",
  eliminatedTitle: "はいたい",
  eliminatedBody: (round, trainer) => `第${round}回戦で${trainer}に敗れた。`,
  eliminatedStreak: (wins) =>
    wins === 0 ? "今回は1勝もできなかった。" : `連勝記録：${wins}勝。`,
  fledTitle: "トーナメント棄権",
  fledBody: "バトルから逃げるとトーナメントから外れる。",
  againCta: "新しいトーナメント",
  homeCta: "ポケモン図鑑に戻る",
  recordLabel: (titles, best) => `優勝 ${titles} · 最高連勝 ${best}`,

  trainerClass: {
    youngster: "たんパンこぞう",
    bugCatcher: "むしとりしょうねん",
    lass: "ミニスカート",
    camper: "キャンプボーイ",
    coolTrainer: "エリートトレーナー",
    veteran: "ベテラントレーナー",
    ace: "エーストレーナー",
    blackBelt: "からておう",
    champion: "チャンピオン",
    championF: "チャンピオン",
    eliteFour: "してんのう",
  },
  tierLabel: {
    rookie: "しんじん",
    veteran: "ベテラン",
    champion: "チャンピオン",
  },
  tierHint: {
    rookie: "ほぼランダムに攻撃し、道具は持っていない。",
    veteran: "タイプ相性を狙い、キズぐすりを使う。",
    champion: "交代し、変化技を使い、容赦がない。",
  },
  lines: {
    rookie: {
      start: "簡単には勝たせないぞ！",
      pinch: "うわっ！どうすればいいんだ？",
      defeat: "くやしい！まだまだ修行が足りないな。",
    },
    veteran: {
      start: "お前の実力を見せてもらおう。",
      pinch: "ここまで来て負けるわけにはいかない！",
      defeat: "いい勝負だった。お前の勝ちだ。",
    },
    champion: {
      start: "カップを掲げるのはどちらか一人だ。",
      pinch: "ここからが本当におもしろい！",
      defeat: "今日の王冠はお前のものだ。誇るがいい。",
    },
  },
  defaultStyle: "大会用のユニフォームを着たトレーナー",
};

const ko: typeof es = {
  metaTitle: "AI 토너먼트",
  metaDescription:
    "토너먼트 대진표를 따라 AI 트레이너와 연전을 치르고 우승컵을 들어 올리자.",

  ctaTitle: "AI 토너먼트",
  ctaBadge: "컵",
  ctaTagline: "대진표 · 라운드 · 챔피언",
  ctaAria: (rounds) => `AI 토너먼트 참가 (총 ${rounds}라운드)`,
  ctaOpen: "도전하기",
  ctaRounds: (rounds) => `${rounds}라운드`,
  ctaTitles: (titles) => `우승 ${titles}`,

  backToDex: "← 도감으로 돌아가기",
  noTeamTitle: "팀이 필요해",
  noTeamBody:
    "토너먼트는 네 팀으로 치른다. 참가 전에 포켓몬을 최소 한 마리 넣자.",
  noTeamCta: "내 팀 만들기",

  lobbyTitle: "토너먼트 참가 신청",
  lobbySubtitle: "레벨 50 연전. 모든 라운드를 이기면 우승이다.",
  formatLabel: "컵을 선택하세요",
  cupName: {
    3: "라이트닝컵",
    4: "엘리트컵",
    5: "마스터컵",
  } as Record<TournamentFormat, string>,
  cupDesc: {
    3: "몸풀기에 딱. 진화 전 포켓몬 위주에 전설은 없고 AI도 관대하다.",
    4: "숙련된 트레이너용. 최종 진화형과 타입 상성을 갖춘 적응형 AI.",
    5: "진짜 도전. 전설의 포켓몬과 실수를 놓치지 않는 전문가 AI가 기다린다.",
  } as Record<TournamentFormat, string>,
  difficultyBadge: {
    easy: "쉬움",
    medium: "보통",
    hard: "어려움",
  } as Record<TournamentDifficulty, string>,
  roundsWord: "라운드",
  cupTrainers: (count: number) => `트레이너 ${count}명`,
  cupPathLabel: "경로",
  cupSelected: "선택됨",
  cupSelectAria: (name: string) => `${name} 선택`,
  rulesLabel: "규칙",
  healOn: "스탠다드 모드",
  healOnHint: "승리할 때마다 팀 HP가 100% 회복된다.",
  healOff: "챌린지 모드",
  healOffHint: "소모와 잃은 HP가 라운드마다 누적된다.",
  startCta: "토너먼트 참가",
  resumeTitle: "진행 중인 토너먼트",
  resumeBody: (round, total) => `${total}라운드 중 ${round}라운드에서 멈췄다.`,
  resumeCta: "이어하기",
  discardCta: "처음부터",

  loadingBracket: "대진 추첨 중…",
  loadingRound: "배틀 준비 중…",
  errorTitle: "토너먼트를 준비하지 못했다.",
  retry: "다시 시도",

  bracketTitle: "토너먼트 대진표",
  bracketSubtitle: (round, total) => `${total}라운드 중 ${round}라운드`,
  roundPlain: (round) => `${round}라운드`,
  roundQuarter: "8강",
  roundRound16: "16강",
  roundRound32: "32강",
  roundSemi: "준결승",
  roundFinal: "결승",
  bracketYou: "너",
  bracketUnknown: "미정",
  bracketWon: "승리",
  bracketNow: "현재",
  bracketLocked: "잠김",
  trophyLabel: "우승컵",
  nextRivalTitle: "다음 상대",
  sixVsSix: "6대6 배틀",
  rivalRosterLabel: "상대 팀",
  rosterNote: (count) =>
    `모든 트레이너는 6마리로 싸웁니다. 당신의 팀은 ${count}/6입니다.`,
  fightCta: "배틀 시작!",
  saveExitCta: "저장하고 나가기",
  bracketAria: "토너먼트 대진표",

  bannerRound: (round) => `${round}라운드`,
  bannerVs: (trainer) => `VS ${trainer}!`,
  hudRound: (round, total) => `라운드 ${round}/${total}`,
  hudStreak: (wins) => `연승 ${wins}`,

  restTitle: "휴식 단계",
  restBody: (round, total) =>
    `${round}라운드 통과. 우승까지 ${total - round}라운드 남았다.`,
  healCta: "팀 회복하기",
  healedNote: "팀이 완전히 회복되었다.",
  challengeNote: "챌린지 모드: 팀 상태는 그대로다.",
  statsTitle: "배틀 요약",
  statMvp: "MVP",
  statDamage: "가한 데미지",
  statTurns: "턴",
  statNone: "—",
  continueCta: "다음 라운드",

  championTitle: "챔피언!",
  championBody: (trainer) => `결승에서 ${trainer}을(를) 꺾고 우승컵을 들었다.`,
  championRecord: (titles) => `우승 횟수: ${titles}. 트로피가 도감에 기록되었다.`,
  hallOfFame: "명예의 전당",
  championStatTitles: "우승 횟수",
  championStatStreak: "최고 연승",
  championStatTrainers: "참가 인원",
  eliminatedTitle: "탈락",
  eliminatedBody: (round, trainer) =>
    `${round}라운드에서 ${trainer}에게 패했다.`,
  eliminatedStreak: (wins) =>
    wins === 0 ? "이번에는 승리가 없었다." : `달성 연승: ${wins}승.`,
  fledTitle: "토너먼트 기권",
  fledBody: "배틀에서 도망치면 대진에서 빠진다.",
  againCta: "새 토너먼트",
  homeCta: "도감으로 돌아가기",
  recordLabel: (titles, best) => `우승 ${titles} · 최고 연승 ${best}`,

  trainerClass: {
    youngster: "반바지꼬마",
    bugCatcher: "벌레잡이꼬마",
    lass: "미니스커트",
    camper: "캠프보이",
    coolTrainer: "엘리트트레이너",
    veteran: "베테랑트레이너",
    ace: "에이스트레이너",
    blackBelt: "가라테왕",
    champion: "챔피언",
    championF: "챔피언",
    eliteFour: "사천왕",
  },
  tierLabel: {
    rookie: "신인",
    veteran: "베테랑",
    champion: "챔피언",
  },
  tierHint: {
    rookie: "거의 무작위로 공격하고 도구가 없다.",
    veteran: "타입 상성을 노리고 상처약을 쓴다.",
    champion: "교체하고 변화기를 쓰며 봐주지 않는다.",
  },
  lines: {
    rookie: {
      start: "쉽게 이기게 두진 않아!",
      pinch: "이런! 이제 어쩌지?",
      defeat: "아쉽다! 아직 배울 게 많구나.",
    },
    veteran: {
      start: "네 실력을 보여줘.",
      pinch: "여기까지 와서 질 수는 없어!",
      defeat: "좋은 배틀이었다. 네가 이겼어.",
    },
    champion: {
      start: "우승컵을 드는 건 둘 중 하나뿐이다.",
      pinch: "이제부터가 진짜 재미있지!",
      defeat: "오늘의 왕관은 네 것이다. 마음껏 누려라.",
    },
  },
  defaultStyle: "대회 유니폼을 입은 트레이너",
};

const zhHans: typeof es = {
  metaTitle: "AI 锦标赛",
  metaDescription:
    "沿着对阵表连续挑战 AI 训练家，一轮又一轮，直到举起奖杯。",

  ctaTitle: "AI 锦标赛",
  ctaBadge: "奖杯",
  ctaTagline: "对阵表 · 轮次 · 冠军",
  ctaAria: (rounds) => `进入 AI 锦标赛（共 ${rounds} 轮）`,
  ctaOpen: "参赛",
  ctaRounds: (rounds) => `${rounds} 轮`,
  ctaTitles: (titles) => `冠军 ${titles}`,

  backToDex: "← 返回图鉴",
  noTeamTitle: "你需要一支队伍",
  noTeamBody: "锦标赛用你的队伍出战。报名前至少加入一只宝可梦。",
  noTeamCta: "组建我的队伍",

  lobbyTitle: "锦标赛报名",
  lobbySubtitle: "50 级连续对战。赢下每一轮即可夺杯。",
  formatLabel: "选择你的杯赛",
  cupName: {
    3: "闪电杯",
    4: "精英杯",
    5: "大师杯",
  } as Record<TournamentFormat, string>,
  cupDesc: {
    3: "适合热身。对手使用基础队伍，没有传说宝可梦，AI 也较为宽松。",
    4: "面向有经验的训练家。完全进化的队伍、属性互补，AI 会随战况调整。",
    5: "真正的考验。对手带着传说宝可梦，专家级 AI 不会放过任何失误。",
  } as Record<TournamentFormat, string>,
  difficultyBadge: {
    easy: "简单",
    medium: "中等",
    hard: "困难",
  } as Record<TournamentDifficulty, string>,
  roundsWord: "轮",
  cupTrainers: (count: number) => `${count} 位训练家`,
  cupPathLabel: "赛程",
  cupSelected: "已选择",
  cupSelectAria: (name: string) => `选择${name}`,
  rulesLabel: "规则",
  healOn: "标准模式",
  healOnHint: "每胜一轮，队伍HP恢复至100%。",
  healOff: "挑战模式",
  healOffHint: "消耗与失去的HP会一轮轮累积。",
  startCta: "进入锦标赛",
  resumeTitle: "进行中的锦标赛",
  resumeBody: (round, total) => `你停在第 ${round} 轮，共 ${total} 轮。`,
  resumeCta: "继续",
  discardCta: "重新开始",

  loadingBracket: "正在抽签…",
  loadingRound: "正在准备对战…",
  errorTitle: "无法创建锦标赛。",
  retry: "重试",

  bracketTitle: "锦标赛对阵表",
  bracketSubtitle: (round, total) => `第 ${round} / ${total} 轮`,
  roundPlain: (round) => `第 ${round} 轮`,
  roundQuarter: "四分之一决赛",
  roundRound16: "十六强",
  roundRound32: "三十二强",
  roundSemi: "半决赛",
  roundFinal: "决赛",
  bracketYou: "你",
  bracketUnknown: "待定",
  bracketWon: "已胜",
  bracketNow: "进行中",
  bracketLocked: "未解锁",
  trophyLabel: "奖杯",
  nextRivalTitle: "你的下一位对手",
  sixVsSix: "6对6对战",
  rivalRosterLabel: "对手队伍",
  rosterNote: (count) => `每位训练家都带6只宝可梦出战。你的队伍：${count}/6。`,
  fightCta: "开始对战！",
  saveExitCta: "保存并退出",
  bracketAria: "锦标赛对阵表",

  bannerRound: (round) => `第 ${round} 轮`,
  bannerVs: (trainer) => `VS ${trainer}！`,
  hudRound: (round, total) => `第 ${round}/${total} 轮`,
  hudStreak: (wins) => `连胜 ${wins}`,

  restTitle: "休息阶段",
  restBody: (round, total) =>
    `第 ${round} 轮通过，距离奖杯还剩 ${total - round} 轮。`,
  healCta: "回复队伍",
  healedNote: "队伍已完全回复。",
  challengeNote: "挑战模式：队伍保持对战结束时的状态。",
  statsTitle: "对战总结",
  statMvp: "MVP",
  statDamage: "造成伤害",
  statTurns: "回合",
  statNone: "—",
  continueCta: "下一轮",

  championTitle: "冠军！",
  championBody: (trainer) => `你在决赛击败了${trainer}，举起了奖杯。`,
  championRecord: (titles) => `夺冠次数：${titles}。奖杯已记入图鉴。`,
  hallOfFame: "光荣殿堂",
  championStatTitles: "夺冠次数",
  championStatStreak: "最佳连胜",
  championStatTrainers: "参赛人数",
  eliminatedTitle: "被淘汰",
  eliminatedBody: (round, trainer) => `你在第 ${round} 轮败给了${trainer}。`,
  eliminatedStreak: (wins) =>
    wins === 0 ? "这次没有取得胜利。" : `连胜纪录：${wins} 场。`,
  fledTitle: "退出锦标赛",
  fledBody: "从对战中逃走会让你退出对阵表。",
  againCta: "新的锦标赛",
  homeCta: "返回图鉴",
  recordLabel: (titles, best) => `冠军 ${titles} · 最佳连胜 ${best}`,

  trainerClass: {
    youngster: "短裤小子",
    bugCatcher: "捕虫少年",
    lass: "迷你裙",
    camper: "露营少年",
    coolTrainer: "精英训练家",
    veteran: "资深训练家",
    ace: "王牌训练家",
    blackBelt: "空手道王",
    champion: "冠军",
    championF: "冠军",
    eliteFour: "四天王",
  },
  tierLabel: {
    rookie: "新手",
    veteran: "老手",
    champion: "冠军",
  },
  tierHint: {
    rookie: "几乎随机出招，也不带道具。",
    veteran: "追求属性克制，会用伤药。",
    champion: "会换人、用变化招式，毫不留情。",
  },
  lines: {
    rookie: {
      start: "我可不会手下留情！",
      pinch: "糟了！现在该怎么办？",
      defeat: "唉！我还得多多学习。",
    },
    veteran: {
      start: "让我看看你有几分本事。",
      pinch: "我可不是走到这里来输的！",
      defeat: "好一场对战，这是你应得的。",
    },
    champion: {
      start: "举起奖杯的只会有一个人。",
      pinch: "现在才真正有意思！",
      defeat: "今天的王冠归你了，好好享受吧。",
    },
  },
  defaultStyle: "身穿比赛制服的锦标赛训练家",
};

const zhHant: typeof es = {
  metaTitle: "AI 錦標賽",
  metaDescription:
    "沿著對戰表連續挑戰 AI 訓練家，一輪又一輪，直到舉起獎盃。",

  ctaTitle: "AI 錦標賽",
  ctaBadge: "獎盃",
  ctaTagline: "對戰表 · 輪次 · 冠軍",
  ctaAria: (rounds) => `進入 AI 錦標賽（共 ${rounds} 輪）`,
  ctaOpen: "參賽",
  ctaRounds: (rounds) => `${rounds} 輪`,
  ctaTitles: (titles) => `冠軍 ${titles}`,

  backToDex: "← 返回圖鑑",
  noTeamTitle: "你需要一支隊伍",
  noTeamBody: "錦標賽用你的隊伍出戰。報名前至少加入一隻寶可夢。",
  noTeamCta: "組建我的隊伍",

  lobbyTitle: "錦標賽報名",
  lobbySubtitle: "50 級連續對戰。贏下每一輪即可奪盃。",
  formatLabel: "選擇你的盃賽",
  cupName: {
    3: "閃電盃",
    4: "菁英盃",
    5: "大師盃",
  } as Record<TournamentFormat, string>,
  cupDesc: {
    3: "適合熱身。對手使用基礎隊伍，沒有傳說寶可夢，AI 也較為寬鬆。",
    4: "面向有經驗的訓練家。完全進化的隊伍、屬性互補，AI 會隨戰況調整。",
    5: "真正的考驗。對手帶著傳說寶可夢，專家級 AI 不會放過任何失誤。",
  } as Record<TournamentFormat, string>,
  difficultyBadge: {
    easy: "簡單",
    medium: "中等",
    hard: "困難",
  } as Record<TournamentDifficulty, string>,
  roundsWord: "輪",
  cupTrainers: (count: number) => `${count} 位訓練家`,
  cupPathLabel: "賽程",
  cupSelected: "已選擇",
  cupSelectAria: (name: string) => `選擇${name}`,
  rulesLabel: "規則",
  healOn: "標準模式",
  healOnHint: "每勝一輪，隊伍HP恢復至100%。",
  healOff: "挑戰模式",
  healOffHint: "消耗與失去的HP會一輪輪累積。",
  startCta: "進入錦標賽",
  resumeTitle: "進行中的錦標賽",
  resumeBody: (round, total) => `你停在第 ${round} 輪，共 ${total} 輪。`,
  resumeCta: "繼續",
  discardCta: "重新開始",

  loadingBracket: "正在抽籤…",
  loadingRound: "正在準備對戰…",
  errorTitle: "無法建立錦標賽。",
  retry: "重試",

  bracketTitle: "錦標賽對戰表",
  bracketSubtitle: (round, total) => `第 ${round} / ${total} 輪`,
  roundPlain: (round) => `第 ${round} 輪`,
  roundQuarter: "八強",
  roundRound16: "十六強",
  roundRound32: "三十二強",
  roundSemi: "準決賽",
  roundFinal: "決賽",
  bracketYou: "你",
  bracketUnknown: "待定",
  bracketWon: "已勝",
  bracketNow: "進行中",
  bracketLocked: "未解鎖",
  trophyLabel: "獎盃",
  nextRivalTitle: "你的下一位對手",
  sixVsSix: "6對6對戰",
  rivalRosterLabel: "對手隊伍",
  rosterNote: (count) => `每位訓練家都帶6隻寶可夢出戰。你的隊伍：${count}/6。`,
  fightCta: "開始對戰！",
  saveExitCta: "儲存並離開",
  bracketAria: "錦標賽對戰表",

  bannerRound: (round) => `第 ${round} 輪`,
  bannerVs: (trainer) => `VS ${trainer}！`,
  hudRound: (round, total) => `第 ${round}/${total} 輪`,
  hudStreak: (wins) => `連勝 ${wins}`,

  restTitle: "休息階段",
  restBody: (round, total) =>
    `第 ${round} 輪通過，距離獎盃還剩 ${total - round} 輪。`,
  healCta: "回復隊伍",
  healedNote: "隊伍已完全回復。",
  challengeNote: "挑戰模式：隊伍保持對戰結束時的狀態。",
  statsTitle: "對戰總結",
  statMvp: "MVP",
  statDamage: "造成傷害",
  statTurns: "回合",
  statNone: "—",
  continueCta: "下一輪",

  championTitle: "冠軍！",
  championBody: (trainer) => `你在決賽擊敗了${trainer}，舉起了獎盃。`,
  championRecord: (titles) => `奪冠次數：${titles}。獎盃已記入圖鑑。`,
  hallOfFame: "光榮殿堂",
  championStatTitles: "奪冠次數",
  championStatStreak: "最佳連勝",
  championStatTrainers: "參賽人數",
  eliminatedTitle: "遭到淘汰",
  eliminatedBody: (round, trainer) => `你在第 ${round} 輪敗給了${trainer}。`,
  eliminatedStreak: (wins) =>
    wins === 0 ? "這次沒有取得勝利。" : `連勝紀錄：${wins} 場。`,
  fledTitle: "退出錦標賽",
  fledBody: "從對戰中逃走會讓你退出對戰表。",
  againCta: "新的錦標賽",
  homeCta: "返回圖鑑",
  recordLabel: (titles, best) => `冠軍 ${titles} · 最佳連勝 ${best}`,

  trainerClass: {
    youngster: "短褲小子",
    bugCatcher: "捕蟲少年",
    lass: "迷你裙",
    camper: "露營少年",
    coolTrainer: "精英訓練家",
    veteran: "資深訓練家",
    ace: "王牌訓練家",
    blackBelt: "空手道王",
    champion: "冠軍",
    championF: "冠軍",
    eliteFour: "四天王",
  },
  tierLabel: {
    rookie: "新手",
    veteran: "老手",
    champion: "冠軍",
  },
  tierHint: {
    rookie: "幾乎隨機出招，也不帶道具。",
    veteran: "追求屬性克制，會用傷藥。",
    champion: "會換人、用變化招式，毫不留情。",
  },
  lines: {
    rookie: {
      start: "我可不會手下留情！",
      pinch: "糟了！現在該怎麼辦？",
      defeat: "唉！我還得多多學習。",
    },
    veteran: {
      start: "讓我看看你有幾分本事。",
      pinch: "我可不是走到這裡來輸的！",
      defeat: "好一場對戰，這是你應得的。",
    },
    champion: {
      start: "舉起獎盃的只會有一個人。",
      pinch: "現在才真正有意思！",
      defeat: "今天的王冠歸你了，好好享受吧。",
    },
  },
  defaultStyle: "身穿比賽制服的錦標賽訓練家",
};

export const tournamentDict: Record<Lang, typeof es> = {
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

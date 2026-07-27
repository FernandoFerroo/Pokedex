import type { Lang } from "../config";
import type { PackType, PeReason, Rarity } from "@/types/tcg";

/**
 * Modo colección: el banner de la portada, el álbum de cartas del JCC, la
 * apertura de sobres, la tienda de Puntos de Entrenador y el botín que se
 * anuncia al levantar una copa.
 *
 * Los nombres de las cartas NO están aquí: vienen impresos en el escaneo real
 * de TCGdex, que está en inglés, y traducirlos sería contradecir la propia
 * ilustración que el jugador tiene delante.
 */
const es = {
  metaTitle: "Álbum JCC",
  metaDescription:
    "Abre sobres, consigue cartas reales del Juego de Cartas Coleccionables Pokémon y completa el álbum de las nueve generaciones.",

  // Banner de la portada
  ctaTitle: "ÁLBUM JCC",
  ctaBadge: "COLECCIÓN",
  ctaTagline: "Sobres · Cartas · Colección",
  ctaAria: (owned: number, total: number) =>
    `Abrir el álbum del JCC (${owned} de ${total} cartas conseguidas)`,
  ctaOpen: "Coleccionar",
  ctaProgress: (owned: number, total: number) => `${owned} / ${total}`,
  ctaPacks: (packs: number) =>
    packs === 1 ? "1 sobre sin abrir" : `${packs} sobres sin abrir`,

  backToDex: "← Volver a la Pokédex",

  // Vistas
  viewAlbum: "Álbum",
  viewPacks: "Sobres",
  viewShop: "Tienda",

  // Álbum
  albumTitle: "ÁLBUM DE COLECCIÓN",
  albumSubtitle:
    "Cartas reales del JCC Pokémon. Cada funda espera a su Pokémon, de Kanto a Paldea.",
  progressLabel: (owned: number, total: number, pct: string) =>
    `Colección completada: ${owned} / ${total} (${pct} %)`,
  progressCards: (cards: number) =>
    cards === 1 ? "1 carta distinta" : `${cards} cartas distintas`,
  progressLoading: "Cargando colección…",
  progressAria: "Progreso de la colección",
  unknownName: "???",
  slotAria: (dex: string, name: string, rarity: string) =>
    `${dex} ${name}, ${rarity}. Activa para ampliar.`,
  lockedAria: (dex: string) => `${dex}, sin conseguir.`,
  emptyTitle: "El álbum está vacío",
  emptyBody:
    "Gana copas en el Torneo IA para conseguir sobres, ábrelos y las cartas irán ocupando su funda.",
  emptyCta: "Ir al Torneo",

  // Filtros
  filterGeneration: "Generación",
  filterType: "Tipo",
  filterRarity: "Rareza",
  filterOwnership: "Estado",
  optionAll: "Todas",
  optionOwned: "Conseguidas",
  optionMissing: "Me faltan",
  clearFilters: "Limpiar filtros",
  filtersToggle: "Filtros",
  resultCount: (shown: number, total: number) =>
    `${shown} de ${total} fundas`,
  noResults: "Ninguna funda coincide con estos filtros.",

  // Navegación principal
  tabsAria: "Secciones del modo colección",
  tabAlbumLabel: "ÁLBUM DE COLECCIÓN",
  tabPacksLabel: "ABRIR SOBRES",
  tabShopLabel: "TIENDA DE SOBRES",

  // Hitos de la barra de progreso
  milestoneAria: "Hitos de la colección",
  milestoneLocked: (pct: number, reward: string) =>
    `Al llegar al ${pct} % desbloqueas gratis: ${reward}`,
  milestoneDone: (pct: number, reward: string) =>
    `${pct} % alcanzado: ${reward} desbloqueado`,
  milestoneNext: (pct: number, reward: string) =>
    `Próximo hito: al ${pct} % desbloqueas gratis ${reward}`,
  milestoneAllDone: "Todos los hitos desbloqueados. El álbum es tuyo.",

  // Archivador
  sheetAria: (page: number, total: number) => `Hoja ${page} de ${total}`,
  pageLabel: (page: number, total: number) => `Página ${page} de ${total}`,
  prevPage: "Página anterior",
  nextPage: "Página siguiente",
  sheetSizeLabel: "Fundas por hoja",

  // Rarezas
  rarityName: {
    common: "Común",
    uncommon: "Poco común",
    holo: "Holo Rara",
    ex: "Pokémon ex",
    fullArt: "Ilustración Rara",
    hyper: "Hyper Rara",
  } as Record<Rarity, string>,

  // Sobres
  packName: {
    bolt: "Sobre Relámpago",
    elite: "Sobre Élite",
    master: "Sobre Maestro",
    special: "Sobre Especial ex",
    god: "Sobre Divino",
  } as Record<PackType, string>,
  packDesc: {
    bolt: "Cinco cartas y una ranura final que nunca baja de Holo Rara.",
    elite:
      "Seis cartas, tres Holo Raras garantizadas y una ranura final que sale Pokémon ex o mejor casi la mitad de las veces.",
    master:
      "Siete cartas, cuatro Holo Raras garantizadas y una ranura final que nunca baja de Pokémon ex.",
    special:
      "Ocho cartas: cuatro Holo Raras, tres ranuras que no bajan de Pokémon ex y una final de Ilustración Rara o mejor.",
    god: "Ocho cartas y ninguna baja de Pokémon ex. No se compra: se gana.",
  } as Record<PackType, string>,
  /** Todos los sobres reparten las nueve generaciones: lo que cambia es esto. */
  packFloor: (count: number, rarity: string) => `${count}× ${rarity}+`,
  packCards: (cards: number) => `${cards} cartas`,

  // Estantería
  shelfTitle: "TUS SOBRES",
  shelfSubtitle: "Elige uno y ábrelo. Las cartas van directas al álbum.",
  shelfEmpty: "No te queda ningún sobre",
  shelfEmptyBody:
    "Los sobres se ganan levantando copas en el Torneo IA, o se compran con Puntos de Entrenador.",
  shelfEmptyCta: "Ir al Torneo",
  openCta: "Abrir",
  packCount: (packs: number) => `×${packs}`,

  // Apertura
  swipeHint: "Desliza para rasgar el sobre",
  tapToFlip: "Toca la carta para darle la vuelta",
  tapToContinue: "Toca para pasar a la siguiente",
  holoCta: "Ver en holograma",
  holoHint: "Arrastra sobre la carta para inclinarla",
  closeOpener: "Cerrar la apertura",
  nextCardAria: (name: string, rarity: string) =>
    `${name}, ${rarity}. Activa para pasar a la siguiente carta.`,
  openAria: (pack: string, cards: number) => `Abrir ${pack} (${cards} cartas)`,
  slotHiddenAria: (index: number, total: number) =>
    `Carta ${index} de ${total}, boca abajo. Activa para revelarla.`,
  slotRevealedAria: (name: string, rarity: string) =>
    `${name}, ${rarity}. Activa para ampliarla.`,
  revealAnnounce: (name: string, rarity: string) => `${name}, ${rarity}.`,
  revealAll: "Revelar todas",
  newBadge: "¡NUEVA!",
  dupeBadge: (pe: number) => `Repetida · +${pe} PE`,
  summaryTitle: "LO QUE TRAÍA EL SOBRE",
  summaryNew: (cards: number) =>
    cards === 1 ? "1 carta nueva" : `${cards} cartas nuevas`,
  summaryNothingNew: "Ninguna carta nueva esta vez",
  dustTally: (pe: number) => `+${pe} PE`,
  dustTallyLabel: "PE ganados con repetidas",
  summaryDust: (pe: number) => `+${pe} PE por repetidas`,
  backToShelf: "Volver a los sobres",
  openAnother: "Abrir otro",
  godPackTitle: "¡SOBRE DIVINO!",
  godPackBody: "Ocho cartas y ninguna baja de Pokémon ex.",
  zoomAria: (name: string) => `Ampliar la carta de ${name}`,
  closeZoom: "Cerrar",

  // Tienda
  shopTitle: "TIENDA DE SOBRES",
  shopSubtitle:
    "Los Puntos de Entrenador se ganan compitiendo — y con las cartas repetidas que salen de los sobres.",
  balance: (pe: number) => `${pe} PE`,
  balanceLabel: "Puntos de Entrenador",
  price: (pe: number) => `${pe} PE`,
  buyCta: "Comprar",
  cantAfford: "PE insuficientes",
  notForSale: "No está a la venta",
  ledgerTitle: "MOVIMIENTOS",
  ledgerEmpty: "Todavía no hay movimientos.",
  ledgerReason: {
    round: "Rondas ganadas",
    title: "Copa levantada",
    flawless: "Sin una sola baja",
    consolation: "Consolación",
    duplicate: "Cartas repetidas",
    purchase: "Compra de sobre",
  } as Record<PeReason, string>,

  // Botín del torneo
  rewardTitle: "BOTÍN DE LA COPA",
  rewardPe: (pe: number) => `+${pe} PE`,
  rewardFlawless: "SIN UNA SOLA BAJA",
  rewardGodPack: "¡Y un Sobre Divino!",
  rewardCta: "Abrir mis sobres",
  rewardConsolation: (pe: number) => `Te llevas ${pe} PE por lo disputado.`,
  /** Cartel del premio en la tarjeta de cada copa, antes de inscribirse. */
  rewardPreviewLabel: "Premio de la copa",
  /** La ceremonia ENTREGA el sobre, no lo promete: esto lo dice en voz alta. */
  rewardStored: "Ya está en tu estantería",
  /**
   * Pie del selector de ritmo. Los PE dependen de la copa además del ritmo, así
   * que cada tarjeta enseña su cifra y esta línea dice de qué copa hablan.
   */
  xpNote: (cup: string) => `PE al levantar la ${cup}`,

  // Reinicio
  resetTitle: "Reiniciar la colección",
  resetBody:
    "Se borran todas las cartas, los sobres y los Puntos de Entrenador. No hay vuelta atrás.",
  resetCta: "Reiniciar",
  resetConfirm: "Sí, borrarlo todo",
  resetCancel: "Cancelar",
};

const en: typeof es = {
  metaTitle: "TCG Album",
  metaDescription:
    "Open booster packs, collect real Pokémon Trading Card Game cards and complete the album across all nine generations.",

  ctaTitle: "TCG ALBUM",
  ctaBadge: "COLLECTION",
  ctaTagline: "Packs · Cards · Collection",
  ctaAria: (owned: number, total: number) =>
    `Open the TCG album (${owned} of ${total} cards collected)`,
  ctaOpen: "Collect",
  ctaProgress: (owned: number, total: number) => `${owned} / ${total}`,
  ctaPacks: (packs: number) =>
    packs === 1 ? "1 unopened pack" : `${packs} unopened packs`,

  backToDex: "← Back to the Pokédex",

  viewAlbum: "Album",
  viewPacks: "Packs",
  viewShop: "Shop",

  albumTitle: "COLLECTION ALBUM",
  albumSubtitle:
    "Real Pokémon TCG cards. Every sleeve is waiting for its Pokémon, from Kanto to Paldea.",
  progressLabel: (owned: number, total: number, pct: string) =>
    `Collection complete: ${owned} / ${total} (${pct}%)`,
  progressCards: (cards: number) =>
    cards === 1 ? "1 distinct card" : `${cards} distinct cards`,
  progressLoading: "Loading collection…",
  progressAria: "Collection progress",
  unknownName: "???",
  slotAria: (dex: string, name: string, rarity: string) =>
    `${dex} ${name}, ${rarity}. Activate to enlarge.`,
  lockedAria: (dex: string) => `${dex}, not collected yet.`,
  emptyTitle: "The album is empty",
  emptyBody:
    "Win cups in AI Tournament mode to earn packs, open them, and the cards will start filling their sleeves.",
  emptyCta: "Go to the Tournament",

  filterGeneration: "Generation",
  filterType: "Type",
  filterRarity: "Rarity",
  filterOwnership: "Status",
  optionAll: "All",
  optionOwned: "Collected",
  optionMissing: "Missing",
  clearFilters: "Clear filters",
  filtersToggle: "Filters",
  resultCount: (shown: number, total: number) => `${shown} of ${total} sleeves`,
  noResults: "No sleeve matches these filters.",

  tabsAria: "Collection mode sections",
  tabAlbumLabel: "COLLECTION ALBUM",
  tabPacksLabel: "OPEN PACKS",
  tabShopLabel: "PACK SHOP",

  milestoneAria: "Collection milestones",
  milestoneLocked: (pct: number, reward: string) =>
    `Reach ${pct}% to unlock for free: ${reward}`,
  milestoneDone: (pct: number, reward: string) =>
    `${pct}% reached: ${reward} unlocked`,
  milestoneNext: (pct: number, reward: string) =>
    `Next milestone: reach ${pct}% for a free ${reward}`,
  milestoneAllDone: "Every milestone unlocked. The album is yours.",

  sheetAria: (page: number, total: number) => `Sheet ${page} of ${total}`,
  pageLabel: (page: number, total: number) => `Page ${page} of ${total}`,
  prevPage: "Previous page",
  nextPage: "Next page",
  sheetSizeLabel: "Sleeves per sheet",

  rarityName: {
    common: "Common",
    uncommon: "Uncommon",
    holo: "Holo Rare",
    ex: "Pokémon ex",
    fullArt: "Illustration Rare",
    hyper: "Hyper Rare",
  } as Record<Rarity, string>,

  packName: {
    bolt: "Lightning Pack",
    elite: "Elite Pack",
    master: "Master Pack",
    special: "Special ex Pack",
    god: "God Pack",
  } as Record<PackType, string>,
  packDesc: {
    bolt: "Five cards and a final slot that never drops below Holo Rare.",
    elite:
      "Six cards, three guaranteed Holo Rares and a final slot that lands Pokémon ex or better almost half the time.",
    master:
      "Seven cards, four guaranteed Holo Rares and a final slot that never drops below Pokémon ex.",
    special:
      "Eight cards: four Holo Rares, three slots that never drop below Pokémon ex and a final Illustration Rare or better.",
    god: "Eight cards, none below Pokémon ex. Not for sale — it's earned.",
  } as Record<PackType, string>,
  packFloor: (count: number, rarity: string) => `${count}× ${rarity}+`,
  packCards: (cards: number) => `${cards} cards`,

  shelfTitle: "YOUR PACKS",
  shelfSubtitle: "Pick one and tear it open. The cards go straight to the album.",
  shelfEmpty: "You have no packs left",
  shelfEmptyBody:
    "Packs are earned by lifting cups in AI Tournament mode, or bought with Trainer Points.",
  shelfEmptyCta: "Go to the Tournament",
  openCta: "Open",
  packCount: (packs: number) => `×${packs}`,

  swipeHint: "Swipe to tear the pack open",
  tapToFlip: "Tap the card to flip it",
  tapToContinue: "Tap for the next card",
  holoCta: "Holo view",
  holoHint: "Drag across the card to tilt it",
  closeOpener: "Close the opening",
  nextCardAria: (name: string, rarity: string) =>
    `${name}, ${rarity}. Activate for the next card.`,
  openAria: (pack: string, cards: number) => `Open ${pack} (${cards} cards)`,
  slotHiddenAria: (index: number, total: number) =>
    `Card ${index} of ${total}, face down. Activate to reveal.`,
  slotRevealedAria: (name: string, rarity: string) =>
    `${name}, ${rarity}. Activate to enlarge.`,
  revealAnnounce: (name: string, rarity: string) => `${name}, ${rarity}.`,
  revealAll: "Reveal all",
  newBadge: "NEW!",
  dupeBadge: (pe: number) => `Duplicate · +${pe} TP`,
  summaryTitle: "WHAT THE PACK HELD",
  summaryNew: (cards: number) =>
    cards === 1 ? "1 new card" : `${cards} new cards`,
  summaryNothingNew: "No new cards this time",
  dustTally: (pe: number) => `+${pe} TP`,
  dustTallyLabel: "TP earned from duplicates",
  summaryDust: (pe: number) => `+${pe} TP from duplicates`,
  backToShelf: "Back to the packs",
  openAnother: "Open another",
  godPackTitle: "GOD PACK!",
  godPackBody: "Eight cards, none below Pokémon ex.",
  zoomAria: (name: string) => `Enlarge the ${name} card`,
  closeZoom: "Close",

  shopTitle: "PACK SHOP",
  shopSubtitle:
    "Trainer Points are earned by competing — and from the duplicates your packs turn up.",
  balance: (pe: number) => `${pe} TP`,
  balanceLabel: "Trainer Points",
  price: (pe: number) => `${pe} TP`,
  buyCta: "Buy",
  cantAfford: "Not enough TP",
  notForSale: "Not for sale",
  ledgerTitle: "ACTIVITY",
  ledgerEmpty: "No activity yet.",
  ledgerReason: {
    round: "Rounds won",
    title: "Cup lifted",
    flawless: "Without a single knockout",
    consolation: "Consolation",
    duplicate: "Duplicate cards",
    purchase: "Pack purchase",
  } as Record<PeReason, string>,

  rewardTitle: "CUP SPOILS",
  rewardPe: (pe: number) => `+${pe} TP`,
  rewardFlawless: "NOT A SINGLE KNOCKOUT",
  rewardGodPack: "And a God Pack!",
  rewardCta: "Open my packs",
  rewardConsolation: (pe: number) => `You take ${pe} TP for the fight you put up.`,
  rewardPreviewLabel: "Cup prize",
  rewardStored: "Already on your shelf",
  xpNote: (cup: string) => `TP for lifting the ${cup}`,

  resetTitle: "Reset the collection",
  resetBody:
    "Every card, pack and Trainer Point is wiped. There is no undo.",
  resetCta: "Reset",
  resetConfirm: "Yes, wipe it all",
  resetCancel: "Cancel",
};

const fr: typeof es = {
  metaTitle: "Album JCC",
  metaDescription:
    "Ouvre des boosters, collectionne de vraies cartes du Jeu de Cartes à Collectionner Pokémon et complète l'album des neuf générations.",

  ctaTitle: "ALBUM JCC",
  ctaBadge: "COLLECTION",
  ctaTagline: "Boosters · Cartes · Collection",
  ctaAria: (owned: number, total: number) =>
    `Ouvrir l'album JCC (${owned} cartes sur ${total})`,
  ctaOpen: "Collectionner",
  ctaProgress: (owned: number, total: number) => `${owned} / ${total}`,
  ctaPacks: (packs: number) =>
    packs === 1 ? "1 booster non ouvert" : `${packs} boosters non ouverts`,

  backToDex: "← Retour au Pokédex",

  viewAlbum: "Album",
  viewPacks: "Boosters",
  viewShop: "Boutique",

  albumTitle: "ALBUM DE COLLECTION",
  albumSubtitle:
    "De vraies cartes du JCC Pokémon. Chaque pochette attend son Pokémon, de Kanto à Paldea.",
  progressLabel: (owned: number, total: number, pct: string) =>
    `Collection complétée : ${owned} / ${total} (${pct} %)`,
  progressCards: (cards: number) =>
    cards === 1 ? "1 carte distincte" : `${cards} cartes distinctes`,
  progressLoading: "Chargement de la collection…",
  progressAria: "Progression de la collection",
  unknownName: "???",
  slotAria: (dex: string, name: string, rarity: string) =>
    `${dex} ${name}, ${rarity}. Activer pour agrandir.`,
  lockedAria: (dex: string) => `${dex}, pas encore obtenue.`,
  emptyTitle: "L'album est vide",
  emptyBody:
    "Remporte des coupes dans le Tournoi IA pour gagner des boosters, ouvre-les et les cartes rejoindront leur pochette.",
  emptyCta: "Aller au Tournoi",

  filterGeneration: "Génération",
  filterType: "Type",
  filterRarity: "Rareté",
  filterOwnership: "Statut",
  optionAll: "Toutes",
  optionOwned: "Obtenues",
  optionMissing: "Manquantes",
  clearFilters: "Effacer les filtres",
  filtersToggle: "Filtres",
  resultCount: (shown: number, total: number) =>
    `${shown} pochettes sur ${total}`,
  noResults: "Aucune pochette ne correspond à ces filtres.",

  tabsAria: "Sections du mode collection",
  tabAlbumLabel: "ALBUM DE COLLECTION",
  tabPacksLabel: "OUVRIR DES BOOSTERS",
  tabShopLabel: "BOUTIQUE DE BOOSTERS",

  milestoneAria: "Paliers de la collection",
  milestoneLocked: (pct: number, reward: string) =>
    `À ${pct} %, tu débloques gratuitement : ${reward}`,
  milestoneDone: (pct: number, reward: string) =>
    `${pct} % atteints : ${reward} débloqué`,
  milestoneNext: (pct: number, reward: string) =>
    `Prochain palier : à ${pct} %, ${reward} gratuit`,
  milestoneAllDone: "Tous les paliers sont débloqués. L'album est à toi.",

  sheetAria: (page: number, total: number) => `Feuille ${page} sur ${total}`,
  pageLabel: (page: number, total: number) => `Page ${page} sur ${total}`,
  prevPage: "Page précédente",
  nextPage: "Page suivante",
  sheetSizeLabel: "Pochettes par feuille",

  rarityName: {
    common: "Commune",
    uncommon: "Peu commune",
    holo: "Holo Rare",
    ex: "Pokémon ex",
    fullArt: "Illustration Rare",
    hyper: "Hyper Rare",
  } as Record<Rarity, string>,

  packName: {
    bolt: "Booster Éclair",
    elite: "Booster Élite",
    master: "Booster Maître",
    special: "Booster Spécial ex",
    god: "Booster Divin",
  } as Record<PackType, string>,
  packDesc: {
    bolt:
      "Cinq cartes et un emplacement final qui ne descend jamais sous Holo Rare.",
    elite:
      "Six cartes, trois Holo Rares garanties et un emplacement final qui sort Pokémon ex ou mieux près d'une fois sur deux.",
    master:
      "Sept cartes, quatre Holo Rares garanties et un emplacement final qui ne descend jamais sous Pokémon ex.",
    special:
      "Huit cartes : quatre Holo Rares, trois emplacements qui ne descendent pas sous Pokémon ex et un final en Illustration Rare ou mieux.",
    god: "Huit cartes, aucune en dessous de Pokémon ex. Il ne s'achète pas : il se mérite.",
  } as Record<PackType, string>,
  packFloor: (count: number, rarity: string) => `${count}× ${rarity}+`,
  packCards: (cards: number) => `${cards} cartes`,

  shelfTitle: "TES BOOSTERS",
  shelfSubtitle: "Choisis-en un et ouvre-le. Les cartes filent droit dans l'album.",
  shelfEmpty: "Il ne te reste aucun booster",
  shelfEmptyBody:
    "Les boosters se gagnent en remportant des coupes au Tournoi IA, ou s'achètent avec des Points de Dresseur.",
  shelfEmptyCta: "Aller au Tournoi",
  openCta: "Ouvrir",
  packCount: (packs: number) => `×${packs}`,

  swipeHint: "Glisse pour déchirer le booster",
  tapToFlip: "Touche la carte pour la retourner",
  tapToContinue: "Touche pour la carte suivante",
  holoCta: "Vue holo",
  holoHint: "Fais glisser sur la carte pour l'incliner",
  closeOpener: "Fermer l'ouverture",
  nextCardAria: (name: string, rarity: string) =>
    `${name}, ${rarity}. Activer pour la carte suivante.`,
  openAria: (pack: string, cards: number) => `Ouvrir ${pack} (${cards} cartes)`,
  slotHiddenAria: (index: number, total: number) =>
    `Carte ${index} sur ${total}, face cachée. Activer pour révéler.`,
  slotRevealedAria: (name: string, rarity: string) =>
    `${name}, ${rarity}. Activer pour agrandir.`,
  revealAnnounce: (name: string, rarity: string) => `${name}, ${rarity}.`,
  revealAll: "Tout révéler",
  newBadge: "NOUVELLE !",
  dupeBadge: (pe: number) => `Double · +${pe} PD`,
  summaryTitle: "CE QUE CONTENAIT LE BOOSTER",
  summaryNew: (cards: number) =>
    cards === 1 ? "1 nouvelle carte" : `${cards} nouvelles cartes`,
  summaryNothingNew: "Aucune nouvelle carte cette fois",
  dustTally: (pe: number) => `+${pe} PD`,
  dustTallyLabel: "PD gagnés grâce aux doubles",
  summaryDust: (pe: number) => `+${pe} PD grâce aux doubles`,
  backToShelf: "Retour aux boosters",
  openAnother: "En ouvrir un autre",
  godPackTitle: "BOOSTER DIVIN !",
  godPackBody: "Huit cartes, aucune en dessous de Pokémon ex.",
  zoomAria: (name: string) => `Agrandir la carte de ${name}`,
  closeZoom: "Fermer",

  shopTitle: "BOUTIQUE DE BOOSTERS",
  shopSubtitle:
    "Les Points de Dresseur se gagnent en compétition — et grâce aux doubles que sortent tes boosters.",
  balance: (pe: number) => `${pe} PD`,
  balanceLabel: "Points de Dresseur",
  price: (pe: number) => `${pe} PD`,
  buyCta: "Acheter",
  cantAfford: "PD insuffisants",
  notForSale: "Pas à vendre",
  ledgerTitle: "MOUVEMENTS",
  ledgerEmpty: "Aucun mouvement pour l'instant.",
  ledgerReason: {
    round: "Manches gagnées",
    title: "Coupe remportée",
    flawless: "Sans un seul K.O.",
    consolation: "Consolation",
    duplicate: "Cartes en double",
    purchase: "Achat de booster",
  } as Record<PeReason, string>,

  rewardTitle: "BUTIN DE LA COUPE",
  rewardPe: (pe: number) => `+${pe} PD`,
  rewardFlawless: "SANS UN SEUL K.O.",
  rewardGodPack: "Et un Booster Divin !",
  rewardCta: "Ouvrir mes boosters",
  rewardConsolation: (pe: number) => `Tu repars avec ${pe} PD pour la lutte.`,
  rewardPreviewLabel: "Prix de la coupe",
  rewardStored: "Il est déjà dans tes boosters",
  xpNote: (cup: string) => `PD en remportant la ${cup}`,

  resetTitle: "Réinitialiser la collection",
  resetBody:
    "Toutes les cartes, les boosters et les Points de Dresseur sont effacés. Aucun retour possible.",
  resetCta: "Réinitialiser",
  resetConfirm: "Oui, tout effacer",
  resetCancel: "Annuler",
};

const de: typeof es = {
  metaTitle: "Sammelalbum",
  metaDescription:
    "Öffne Boosterpacks, sammle echte Karten des Pokémon-Sammelkartenspiels und vervollständige das Album über alle neun Generationen.",

  ctaTitle: "SAMMELALBUM",
  ctaBadge: "SAMMLUNG",
  ctaTagline: "Packs · Karten · Sammlung",
  ctaAria: (owned: number, total: number) =>
    `Sammelalbum öffnen (${owned} von ${total} Karten gesammelt)`,
  ctaOpen: "Sammeln",
  ctaProgress: (owned: number, total: number) => `${owned} / ${total}`,
  ctaPacks: (packs: number) =>
    packs === 1 ? "1 ungeöffnetes Pack" : `${packs} ungeöffnete Packs`,

  backToDex: "← Zurück zum Pokédex",

  viewAlbum: "Album",
  viewPacks: "Packs",
  viewShop: "Shop",

  albumTitle: "SAMMELALBUM",
  albumSubtitle:
    "Echte Karten des Pokémon-Sammelkartenspiels. Jede Hülle wartet auf ihr Pokémon, von Kanto bis Paldea.",
  progressLabel: (owned: number, total: number, pct: string) =>
    `Sammlung vollständig: ${owned} / ${total} (${pct} %)`,
  progressCards: (cards: number) =>
    cards === 1 ? "1 verschiedene Karte" : `${cards} verschiedene Karten`,
  progressLoading: "Sammlung wird geladen…",
  progressAria: "Fortschritt der Sammlung",
  unknownName: "???",
  slotAria: (dex: string, name: string, rarity: string) =>
    `${dex} ${name}, ${rarity}. Aktivieren zum Vergrößern.`,
  lockedAria: (dex: string) => `${dex}, noch nicht gesammelt.`,
  emptyTitle: "Das Album ist leer",
  emptyBody:
    "Gewinne Pokale im KI-Turnier, um Packs zu erhalten. Öffne sie, und die Karten füllen nach und nach ihre Hüllen.",
  emptyCta: "Zum Turnier",

  filterGeneration: "Generation",
  filterType: "Typ",
  filterRarity: "Seltenheit",
  filterOwnership: "Status",
  optionAll: "Alle",
  optionOwned: "Gesammelt",
  optionMissing: "Fehlend",
  clearFilters: "Filter zurücksetzen",
  filtersToggle: "Filter",
  resultCount: (shown: number, total: number) =>
    `${shown} von ${total} Hüllen`,
  noResults: "Keine Hülle passt zu diesen Filtern.",

  tabsAria: "Bereiche des Sammelmodus",
  tabAlbumLabel: "SAMMELALBUM",
  tabPacksLabel: "PACKS ÖFFNEN",
  tabShopLabel: "PACK-SHOP",

  milestoneAria: "Meilensteine der Sammlung",
  milestoneLocked: (pct: number, reward: string) =>
    `Bei ${pct} % gibt es gratis: ${reward}`,
  milestoneDone: (pct: number, reward: string) =>
    `${pct} % erreicht: ${reward} freigeschaltet`,
  milestoneNext: (pct: number, reward: string) =>
    `Nächster Meilenstein: bei ${pct} % gratis ${reward}`,
  milestoneAllDone: "Alle Meilensteine freigeschaltet. Das Album gehört dir.",

  sheetAria: (page: number, total: number) => `Blatt ${page} von ${total}`,
  pageLabel: (page: number, total: number) => `Seite ${page} von ${total}`,
  prevPage: "Vorherige Seite",
  nextPage: "Nächste Seite",
  sheetSizeLabel: "Hüllen pro Blatt",

  rarityName: {
    common: "Häufig",
    uncommon: "Selten",
    holo: "Holo-Rar",
    ex: "Pokémon ex",
    fullArt: "Illustrationsrar",
    hyper: "Hyper-Rar",
  } as Record<Rarity, string>,

  packName: {
    bolt: "Blitz-Pack",
    elite: "Elite-Pack",
    master: "Meister-Pack",
    special: "Spezial-ex-Pack",
    god: "Götter-Pack",
  } as Record<PackType, string>,
  packDesc: {
    bolt: "Fünf Karten und ein letzter Platz, der nie unter Holo-Rar fällt.",
    elite:
      "Sechs Karten, drei garantierte Holo-Rare und ein letzter Platz, der fast jedes zweite Mal Pokémon ex oder besser bringt.",
    master:
      "Sieben Karten, vier garantierte Holo-Rare und ein letzter Platz, der nie unter Pokémon ex fällt.",
    special:
      "Acht Karten: vier Holo-Rare, drei Plätze, die nicht unter Pokémon ex fallen, und ein letzter ab Illustrationsrar.",
    god: "Acht Karten, keine unter Pokémon ex. Nicht käuflich — es wird verdient.",
  } as Record<PackType, string>,
  packFloor: (count: number, rarity: string) => `${count}× ${rarity}+`,
  packCards: (cards: number) => `${cards} Karten`,

  shelfTitle: "DEINE PACKS",
  shelfSubtitle: "Wähl eins aus und reiß es auf. Die Karten wandern direkt ins Album.",
  shelfEmpty: "Du hast kein Pack mehr",
  shelfEmptyBody:
    "Packs gibt es für gewonnene Pokale im KI-Turnier oder gegen Trainerpunkte im Shop.",
  shelfEmptyCta: "Zum Turnier",
  openCta: "Öffnen",
  packCount: (packs: number) => `×${packs}`,

  swipeHint: "Wische, um das Pack aufzureißen",
  tapToFlip: "Tippe auf die Karte, um sie umzudrehen",
  tapToContinue: "Tippe für die nächste Karte",
  holoCta: "Holo-Ansicht",
  holoHint: "Über die Karte ziehen, um sie zu neigen",
  closeOpener: "Öffnung schließen",
  nextCardAria: (name: string, rarity: string) =>
    `${name}, ${rarity}. Aktivieren für die nächste Karte.`,
  openAria: (pack: string, cards: number) => `${pack} öffnen (${cards} Karten)`,
  slotHiddenAria: (index: number, total: number) =>
    `Karte ${index} von ${total}, verdeckt. Aktivieren zum Aufdecken.`,
  slotRevealedAria: (name: string, rarity: string) =>
    `${name}, ${rarity}. Aktivieren zum Vergrößern.`,
  revealAnnounce: (name: string, rarity: string) => `${name}, ${rarity}.`,
  revealAll: "Alle aufdecken",
  newBadge: "NEU!",
  dupeBadge: (pe: number) => `Doppelt · +${pe} TP`,
  summaryTitle: "DAS WAR IM PACK",
  summaryNew: (cards: number) =>
    cards === 1 ? "1 neue Karte" : `${cards} neue Karten`,
  summaryNothingNew: "Diesmal keine neue Karte",
  dustTally: (pe: number) => `+${pe} TP`,
  dustTallyLabel: "TP aus Doppelten",
  summaryDust: (pe: number) => `+${pe} TP für Doppelte`,
  backToShelf: "Zurück zu den Packs",
  openAnother: "Noch eins öffnen",
  godPackTitle: "GÖTTER-PACK!",
  godPackBody: "Acht Karten, keine unter Pokémon ex.",
  zoomAria: (name: string) => `Karte von ${name} vergrößern`,
  closeZoom: "Schließen",

  shopTitle: "PACK-SHOP",
  shopSubtitle:
    "Trainerpunkte verdienst du im Wettkampf — und durch die Doppelten aus deinen Packs.",
  balance: (pe: number) => `${pe} TP`,
  balanceLabel: "Trainerpunkte",
  price: (pe: number) => `${pe} TP`,
  buyCta: "Kaufen",
  cantAfford: "Zu wenig TP",
  notForSale: "Nicht käuflich",
  ledgerTitle: "BEWEGUNGEN",
  ledgerEmpty: "Noch keine Bewegungen.",
  ledgerReason: {
    round: "Gewonnene Runden",
    title: "Pokal geholt",
    flawless: "Ohne einen einzigen Ausfall",
    consolation: "Trostpreis",
    duplicate: "Doppelte Karten",
    purchase: "Pack gekauft",
  } as Record<PeReason, string>,

  rewardTitle: "BEUTE DES POKALS",
  rewardPe: (pe: number) => `+${pe} TP`,
  rewardFlawless: "OHNE EINEN EINZIGEN AUSFALL",
  rewardGodPack: "Und ein Götter-Pack!",
  rewardCta: "Meine Packs öffnen",
  rewardConsolation: (pe: number) => `${pe} TP für den harten Kampf.`,
  rewardPreviewLabel: "Preis des Pokals",
  rewardStored: "Liegt schon in deinem Regal",
  xpNote: (cup: string) => `TP für den gewonnenen ${cup}`,

  resetTitle: "Sammlung zurücksetzen",
  resetBody:
    "Alle Karten, Packs und Trainerpunkte werden gelöscht. Das lässt sich nicht rückgängig machen.",
  resetCta: "Zurücksetzen",
  resetConfirm: "Ja, alles löschen",
  resetCancel: "Abbrechen",
};

const it: typeof es = {
  metaTitle: "Album GCC",
  metaDescription:
    "Apri bustine, colleziona vere carte del Gioco di Carte Collezionabili Pokémon e completa l'album di tutte e nove le generazioni.",

  ctaTitle: "ALBUM GCC",
  ctaBadge: "COLLEZIONE",
  ctaTagline: "Bustine · Carte · Collezione",
  ctaAria: (owned: number, total: number) =>
    `Apri l'album GCC (${owned} carte su ${total})`,
  ctaOpen: "Colleziona",
  ctaProgress: (owned: number, total: number) => `${owned} / ${total}`,
  ctaPacks: (packs: number) =>
    packs === 1 ? "1 bustina da aprire" : `${packs} bustine da aprire`,

  backToDex: "← Torna al Pokédex",

  viewAlbum: "Album",
  viewPacks: "Bustine",
  viewShop: "Negozio",

  albumTitle: "ALBUM DELLA COLLEZIONE",
  albumSubtitle:
    "Vere carte del GCC Pokémon. Ogni bustina protettiva aspetta il suo Pokémon, da Kanto a Paldea.",
  progressLabel: (owned: number, total: number, pct: string) =>
    `Collezione completata: ${owned} / ${total} (${pct} %)`,
  progressCards: (cards: number) =>
    cards === 1 ? "1 carta diversa" : `${cards} carte diverse`,
  progressLoading: "Caricamento della collezione…",
  progressAria: "Avanzamento della collezione",
  unknownName: "???",
  slotAria: (dex: string, name: string, rarity: string) =>
    `${dex} ${name}, ${rarity}. Attiva per ingrandire.`,
  lockedAria: (dex: string) => `${dex}, non ancora ottenuta.`,
  emptyTitle: "L'album è vuoto",
  emptyBody:
    "Vinci coppe nel Torneo IA per ottenere bustine, aprile e le carte inizieranno a riempire le loro custodie.",
  emptyCta: "Vai al Torneo",

  filterGeneration: "Generazione",
  filterType: "Tipo",
  filterRarity: "Rarità",
  filterOwnership: "Stato",
  optionAll: "Tutte",
  optionOwned: "Ottenute",
  optionMissing: "Mancanti",
  clearFilters: "Azzera i filtri",
  filtersToggle: "Filtri",
  resultCount: (shown: number, total: number) =>
    `${shown} custodie su ${total}`,
  noResults: "Nessuna custodia corrisponde a questi filtri.",

  tabsAria: "Sezioni della modalità collezione",
  tabAlbumLabel: "ALBUM DELLA COLLEZIONE",
  tabPacksLabel: "APRI BUSTINE",
  tabShopLabel: "NEGOZIO DI BUSTINE",

  milestoneAria: "Traguardi della collezione",
  milestoneLocked: (pct: number, reward: string) =>
    `Al ${pct} % sblocchi gratis: ${reward}`,
  milestoneDone: (pct: number, reward: string) =>
    `${pct} % raggiunto: ${reward} sbloccato`,
  milestoneNext: (pct: number, reward: string) =>
    `Prossimo traguardo: al ${pct} % ottieni gratis ${reward}`,
  milestoneAllDone: "Tutti i traguardi sbloccati. L'album è tuo.",

  sheetAria: (page: number, total: number) => `Foglio ${page} di ${total}`,
  pageLabel: (page: number, total: number) => `Pagina ${page} di ${total}`,
  prevPage: "Pagina precedente",
  nextPage: "Pagina successiva",
  sheetSizeLabel: "Custodie per foglio",

  rarityName: {
    common: "Comune",
    uncommon: "Non comune",
    holo: "Holo Rara",
    ex: "Pokémon ex",
    fullArt: "Illustrazione Rara",
    hyper: "Iper Rara",
  } as Record<Rarity, string>,

  packName: {
    bolt: "Bustina Fulmine",
    elite: "Bustina Élite",
    master: "Bustina Maestra",
    special: "Bustina Speciale ex",
    god: "Bustina Divina",
  } as Record<PackType, string>,
  packDesc: {
    bolt: "Cinque carte e un ultimo posto che non scende mai sotto Holo Rara.",
    elite:
      "Sei carte, tre Holo Rare garantite e un ultimo posto che esce Pokémon ex o meglio quasi una volta su due.",
    master:
      "Sette carte, quattro Holo Rare garantite e un ultimo posto che non scende mai sotto Pokémon ex.",
    special:
      "Otto carte: quattro Holo Rare, tre posti che non scendono sotto Pokémon ex e un finale da Illustrazione Rara in su.",
    god: "Otto carte, nessuna sotto Pokémon ex. Non si compra: si conquista.",
  } as Record<PackType, string>,
  packFloor: (count: number, rarity: string) => `${count}× ${rarity}+`,
  packCards: (cards: number) => `${cards} carte`,

  shelfTitle: "LE TUE BUSTINE",
  shelfSubtitle: "Scegline una e aprila. Le carte vanno dritte nell'album.",
  shelfEmpty: "Non ti resta nessuna bustina",
  shelfEmptyBody:
    "Le bustine si ottengono vincendo coppe nel Torneo IA, oppure si comprano con i Punti Allenatore.",
  shelfEmptyCta: "Vai al Torneo",
  openCta: "Apri",
  packCount: (packs: number) => `×${packs}`,

  swipeHint: "Scorri per strappare la bustina",
  tapToFlip: "Tocca la carta per girarla",
  tapToContinue: "Tocca per la carta successiva",
  holoCta: "Vista holo",
  holoHint: "Trascina sulla carta per inclinarla",
  closeOpener: "Chiudi l'apertura",
  nextCardAria: (name: string, rarity: string) =>
    `${name}, ${rarity}. Attiva per la carta successiva.`,
  openAria: (pack: string, cards: number) => `Apri ${pack} (${cards} carte)`,
  slotHiddenAria: (index: number, total: number) =>
    `Carta ${index} di ${total}, coperta. Attiva per scoprirla.`,
  slotRevealedAria: (name: string, rarity: string) =>
    `${name}, ${rarity}. Attiva per ingrandirla.`,
  revealAnnounce: (name: string, rarity: string) => `${name}, ${rarity}.`,
  revealAll: "Scopri tutte",
  newBadge: "NUOVA!",
  dupeBadge: (pe: number) => `Doppione · +${pe} PA`,
  summaryTitle: "COSA C'ERA NELLA BUSTINA",
  summaryNew: (cards: number) =>
    cards === 1 ? "1 carta nuova" : `${cards} carte nuove`,
  summaryNothingNew: "Nessuna carta nuova stavolta",
  dustTally: (pe: number) => `+${pe} PA`,
  dustTallyLabel: "PA guadagnati dai doppioni",
  summaryDust: (pe: number) => `+${pe} PA dai doppioni`,
  backToShelf: "Torna alle bustine",
  openAnother: "Aprine un'altra",
  godPackTitle: "BUSTINA DIVINA!",
  godPackBody: "Otto carte, nessuna sotto Pokémon ex.",
  zoomAria: (name: string) => `Ingrandisci la carta di ${name}`,
  closeZoom: "Chiudi",

  shopTitle: "NEGOZIO DI BUSTINE",
  shopSubtitle:
    "I Punti Allenatore si guadagnano gareggiando — e con i doppioni che escono dalle bustine.",
  balance: (pe: number) => `${pe} PA`,
  balanceLabel: "Punti Allenatore",
  price: (pe: number) => `${pe} PA`,
  buyCta: "Compra",
  cantAfford: "PA insufficienti",
  notForSale: "Non in vendita",
  ledgerTitle: "MOVIMENTI",
  ledgerEmpty: "Ancora nessun movimento.",
  ledgerReason: {
    round: "Turni vinti",
    title: "Coppa conquistata",
    flawless: "Senza un solo KO",
    consolation: "Consolazione",
    duplicate: "Carte doppie",
    purchase: "Acquisto di bustina",
  } as Record<PeReason, string>,

  rewardTitle: "BOTTINO DELLA COPPA",
  rewardPe: (pe: number) => `+${pe} PA`,
  rewardFlawless: "SENZA UN SOLO KO",
  rewardGodPack: "E una Bustina Divina!",
  rewardCta: "Apri le mie bustine",
  rewardConsolation: (pe: number) => `Ti porti ${pe} PA per la lotta.`,
  rewardPreviewLabel: "Premio della coppa",
  rewardStored: "È già sul tuo scaffale",
  xpNote: (cup: string) => `PA vincendo la ${cup}`,

  resetTitle: "Azzera la collezione",
  resetBody:
    "Vengono cancellati tutte le carte, le bustine e i Punti Allenatore. Non si torna indietro.",
  resetCta: "Azzera",
  resetConfirm: "Sì, cancella tutto",
  resetCancel: "Annulla",
};

const ja: typeof es = {
  metaTitle: "カードアルバム",
  metaDescription:
    "パックを開けて本物のポケモンカードゲームのカードを集め、第1世代から第9世代までのアルバムを完成させよう。",

  ctaTitle: "カードアルバム",
  ctaBadge: "コレクション",
  ctaTagline: "パック · カード · コレクション",
  ctaAria: (owned: number, total: number) =>
    `カードアルバムを開く（${total}枚中${owned}枚を収集済み）`,
  ctaOpen: "集める",
  ctaProgress: (owned: number, total: number) => `${owned} / ${total}`,
  ctaPacks: (packs: number) => `未開封パック${packs}個`,

  backToDex: "← ポケドexに戻る",

  viewAlbum: "アルバム",
  viewPacks: "パック",
  viewShop: "ショップ",

  albumTitle: "コレクションアルバム",
  albumSubtitle:
    "本物のポケモンカード。カントーからパルデアまで、それぞれのスリーブが持ち主を待っている。",
  progressLabel: (owned: number, total: number, pct: string) =>
    `コレクション達成度：${total}枚中${owned}枚（${pct}％）`,
  progressCards: (cards: number) => `異なるカード${cards}枚`,
  progressLoading: "コレクションを読み込み中…",
  progressAria: "コレクションの進捗",
  unknownName: "???",
  slotAria: (dex: string, name: string, rarity: string) =>
    `${dex} ${name}、${rarity}。実行すると拡大します。`,
  lockedAria: (dex: string) => `${dex}、未入手。`,
  emptyTitle: "アルバムは空です",
  emptyBody:
    "AIトーナメントで優勝するとパックが手に入ります。開ければ、カードが少しずつスリーブを埋めていきます。",
  emptyCta: "トーナメントへ",

  filterGeneration: "世代",
  filterType: "タイプ",
  filterRarity: "レアリティ",
  filterOwnership: "状態",
  optionAll: "すべて",
  optionOwned: "入手済み",
  optionMissing: "未入手",
  clearFilters: "フィルターを解除",
  filtersToggle: "フィルター",
  resultCount: (shown: number, total: number) =>
    `${total}枚中${shown}枚のスリーブ`,
  noResults: "この条件に合うスリーブはありません。",

  tabsAria: "コレクションモードのセクション",
  tabAlbumLabel: "コレクションアルバム",
  tabPacksLabel: "パックを開ける",
  tabShopLabel: "パックショップ",

  milestoneAria: "コレクションのマイルストーン",
  milestoneLocked: (pct: number, reward: string) =>
    `${pct}％に到達すると無料で解放：${reward}`,
  milestoneDone: (pct: number, reward: string) =>
    `${pct}％達成：${reward}を解放`,
  milestoneNext: (pct: number, reward: string) =>
    `次のマイルストーン：${pct}％で${reward}が無料`,
  milestoneAllDone: "マイルストーンをすべて解放しました。アルバムは君のものだ。",

  sheetAria: (page: number, total: number) => `${total}枚中${page}枚目のシート`,
  pageLabel: (page: number, total: number) => `${total}ページ中${page}ページ`,
  prevPage: "前のページ",
  nextPage: "次のページ",
  sheetSizeLabel: "1シートあたりのスリーブ数",

  rarityName: {
    common: "コモン",
    uncommon: "アンコモン",
    holo: "ホロレア",
    ex: "ポケモンex",
    fullArt: "イラストレア",
    hyper: "ハイパーレア",
  } as Record<Rarity, string>,

  packName: {
    bolt: "サンダーパック",
    elite: "エリートパック",
    master: "マスターパック",
    special: "スペシャルexパック",
    god: "ゴッドパック",
  } as Record<PackType, string>,
  packDesc: {
    bolt: "5枚入りで、最後の枠はホロレア以上が確定。",
    elite:
      "6枚入り、ホロレア3枚確定。最後の枠は半分近くの確率でポケモンex以上。",
    master: "7枚入り、ホロレア4枚確定で、最後の枠はポケモンex以上が確定。",
    special:
      "8枚入り。ホロレア4枚、ポケモンex以上が確定の枠3つ、そして最後はイラストレア以上。",
    god: "8枚すべてポケモンex以上。購入不可 — 勝ち取るもの。",
  } as Record<PackType, string>,
  packFloor: (count: number, rarity: string) => `${rarity}以上×${count}`,
  packCards: (cards: number) => `${cards}枚入り`,

  shelfTitle: "手持ちのパック",
  shelfSubtitle: "ひとつ選んで開けよう。カードはそのままアルバムへ。",
  shelfEmpty: "パックがありません",
  shelfEmptyBody:
    "パックはAIトーナメントで優勝するか、トレーナーポイントで購入すると手に入ります。",
  shelfEmptyCta: "トーナメントへ",
  openCta: "開ける",
  packCount: (packs: number) => `×${packs}`,

  swipeHint: "スワイプしてパックを開ける",
  tapToFlip: "カードをタップしてめくる",
  tapToContinue: "タップして次のカードへ",
  holoCta: "ホロ表示",
  holoHint: "カードをドラッグして傾ける",
  closeOpener: "開封を閉じる",
  nextCardAria: (name: string, rarity: string) =>
    `${name}、${rarity}。次のカードへ進みます。`,
  openAria: (pack: string, cards: number) => `${pack}を開ける（${cards}枚）`,
  slotHiddenAria: (index: number, total: number) =>
    `${total}枚中${index}枚目、裏向き。実行するとめくります。`,
  slotRevealedAria: (name: string, rarity: string) =>
    `${name}、${rarity}。実行すると拡大します。`,
  revealAnnounce: (name: string, rarity: string) => `${name}、${rarity}。`,
  revealAll: "すべてめくる",
  newBadge: "NEW！",
  dupeBadge: (pe: number) => `重複 · +${pe} TP`,
  summaryTitle: "パックの中身",
  summaryNew: (cards: number) => `新しいカード${cards}枚`,
  summaryNothingNew: "今回は新しいカードなし",
  dustTally: (pe: number) => `+${pe} TP`,
  dustTallyLabel: "重複カードで獲得したTP",
  summaryDust: (pe: number) => `重複で+${pe} TP`,
  backToShelf: "パックに戻る",
  openAnother: "もう一つ開ける",
  godPackTitle: "ゴッドパック！",
  godPackBody: "8枚すべてポケモンex以上。",
  zoomAria: (name: string) => `${name}のカードを拡大`,
  closeZoom: "閉じる",

  shopTitle: "パックショップ",
  shopSubtitle:
    "トレーナーポイントは対戦で貯まります — パックから出た重複カードでも。",
  balance: (pe: number) => `${pe} TP`,
  balanceLabel: "トレーナーポイント",
  price: (pe: number) => `${pe} TP`,
  buyCta: "購入",
  cantAfford: "TPが足りません",
  notForSale: "販売していません",
  ledgerTitle: "履歴",
  ledgerEmpty: "まだ履歴がありません。",
  ledgerReason: {
    round: "勝ったラウンド",
    title: "優勝",
    flawless: "一体も倒されず",
    consolation: "参加賞",
    duplicate: "重複カード",
    purchase: "パック購入",
  } as Record<PeReason, string>,

  rewardTitle: "優勝報酬",
  rewardPe: (pe: number) => `+${pe} TP`,
  rewardFlawless: "一体も倒されず",
  rewardGodPack: "さらにゴッドパック！",
  rewardCta: "パックを開ける",
  rewardConsolation: (pe: number) => `健闘賞として${pe} TP。`,
  rewardPreviewLabel: "優勝賞品",
  rewardStored: "もう手持ちに入っています",
  xpNote: (cup: string) => `${cup}優勝時のTP`,

  resetTitle: "コレクションをリセット",
  resetBody:
    "カード、パック、トレーナーポイントがすべて消えます。元には戻せません。",
  resetCta: "リセット",
  resetConfirm: "はい、すべて消す",
  resetCancel: "キャンセル",
};

const ko: typeof es = {
  metaTitle: "카드 앨범",
  metaDescription:
    "팩을 열어 진짜 포켓몬 카드 게임 카드를 모으고, 1세대부터 9세대까지 앨범을 완성하세요.",

  ctaTitle: "카드 앨범",
  ctaBadge: "컬렉션",
  ctaTagline: "팩 · 카드 · 컬렉션",
  ctaAria: (owned: number, total: number) =>
    `카드 앨범 열기 (${total}장 중 ${owned}장 수집)`,
  ctaOpen: "모으기",
  ctaProgress: (owned: number, total: number) => `${owned} / ${total}`,
  ctaPacks: (packs: number) => `열지 않은 팩 ${packs}개`,

  backToDex: "← 포켓몬 도감으로",

  viewAlbum: "앨범",
  viewPacks: "팩",
  viewShop: "상점",

  albumTitle: "컬렉션 앨범",
  albumSubtitle:
    "진짜 포켓몬 카드. 관동부터 팔데아까지, 모든 슬리브가 주인을 기다립니다.",
  progressLabel: (owned: number, total: number, pct: string) =>
    `컬렉션 달성도: ${total}장 중 ${owned}장 (${pct}%)`,
  progressCards: (cards: number) => `서로 다른 카드 ${cards}장`,
  progressLoading: "컬렉션을 불러오는 중…",
  progressAria: "컬렉션 진행도",
  unknownName: "???",
  slotAria: (dex: string, name: string, rarity: string) =>
    `${dex} ${name}, ${rarity}. 실행하면 확대합니다.`,
  lockedAria: (dex: string) => `${dex}, 아직 없음.`,
  emptyTitle: "앨범이 비어 있습니다",
  emptyBody:
    "AI 토너먼트에서 컵을 차지하면 팩을 얻습니다. 팩을 열면 카드가 하나씩 슬리브를 채워 갑니다.",
  emptyCta: "토너먼트로",

  filterGeneration: "세대",
  filterType: "타입",
  filterRarity: "레어도",
  filterOwnership: "상태",
  optionAll: "전체",
  optionOwned: "보유",
  optionMissing: "미보유",
  clearFilters: "필터 지우기",
  filtersToggle: "필터",
  resultCount: (shown: number, total: number) =>
    `${total}개 중 ${shown}개 슬리브`,
  noResults: "이 조건에 맞는 슬리브가 없습니다.",

  tabsAria: "컬렉션 모드 섹션",
  tabAlbumLabel: "컬렉션 앨범",
  tabPacksLabel: "팩 열기",
  tabShopLabel: "팩 상점",

  milestoneAria: "컬렉션 이정표",
  milestoneLocked: (pct: number, reward: string) =>
    `${pct}%에 도달하면 무료로 해금: ${reward}`,
  milestoneDone: (pct: number, reward: string) =>
    `${pct}% 달성: ${reward} 해금`,
  milestoneNext: (pct: number, reward: string) =>
    `다음 이정표: ${pct}%에서 ${reward} 무료 획득`,
  milestoneAllDone: "모든 이정표를 해금했습니다. 앨범은 당신의 것입니다.",

  sheetAria: (page: number, total: number) => `${total}장 중 ${page}번째 시트`,
  pageLabel: (page: number, total: number) => `${total}페이지 중 ${page}페이지`,
  prevPage: "이전 페이지",
  nextPage: "다음 페이지",
  sheetSizeLabel: "시트당 슬리브 수",

  rarityName: {
    common: "커먼",
    uncommon: "언커먼",
    holo: "홀로 레어",
    ex: "포켓몬 ex",
    fullArt: "일러스트 레어",
    hyper: "하이퍼 레어",
  } as Record<Rarity, string>,

  packName: {
    bolt: "번개 팩",
    elite: "엘리트 팩",
    master: "마스터 팩",
    special: "스페셜 ex 팩",
    god: "갓 팩",
  } as Record<PackType, string>,
  packDesc: {
    bolt: "5장이며 마지막 칸은 홀로 레어 이상 확정.",
    elite:
      "6장, 홀로 레어 3장 확정. 마지막 칸은 거의 절반 확률로 포켓몬 ex 이상.",
    master: "7장, 홀로 레어 4장 확정에 마지막 칸은 포켓몬 ex 이상 확정.",
    special:
      "8장: 홀로 레어 4장, 포켓몬 ex 이상 확정 칸 3개, 마지막은 일러스트 레어 이상.",
    god: "8장 모두 포켓몬 ex 이상. 살 수 없고, 쟁취하는 것.",
  } as Record<PackType, string>,
  packFloor: (count: number, rarity: string) => `${rarity} 이상 ${count}장`,
  packCards: (cards: number) => `${cards}장`,

  shelfTitle: "보유 팩",
  shelfSubtitle: "하나 골라 열어 보세요. 카드는 곧장 앨범으로 갑니다.",
  shelfEmpty: "남은 팩이 없습니다",
  shelfEmptyBody:
    "팩은 AI 토너먼트에서 컵을 차지하거나 트레이너 포인트로 구매해 얻습니다.",
  shelfEmptyCta: "토너먼트로",
  openCta: "열기",
  packCount: (packs: number) => `×${packs}`,

  swipeHint: "밀어서 팩을 뜯기",
  tapToFlip: "카드를 눌러 뒤집기",
  tapToContinue: "눌러서 다음 카드로",
  holoCta: "홀로그램 보기",
  holoHint: "카드를 드래그해 기울이기",
  closeOpener: "개봉 닫기",
  nextCardAria: (name: string, rarity: string) =>
    `${name}, ${rarity}. 다음 카드로 넘어갑니다.`,
  openAria: (pack: string, cards: number) => `${pack} 열기 (${cards}장)`,
  slotHiddenAria: (index: number, total: number) =>
    `${total}장 중 ${index}번째, 뒷면. 실행하면 뒤집습니다.`,
  slotRevealedAria: (name: string, rarity: string) =>
    `${name}, ${rarity}. 실행하면 확대합니다.`,
  revealAnnounce: (name: string, rarity: string) => `${name}, ${rarity}.`,
  revealAll: "전부 뒤집기",
  newBadge: "NEW!",
  dupeBadge: (pe: number) => `중복 · +${pe} TP`,
  summaryTitle: "팩에 들어 있던 것",
  summaryNew: (cards: number) => `새 카드 ${cards}장`,
  summaryNothingNew: "이번에는 새 카드가 없습니다",
  dustTally: (pe: number) => `+${pe} TP`,
  dustTallyLabel: "중복 카드로 얻은 TP",
  summaryDust: (pe: number) => `중복으로 +${pe} TP`,
  backToShelf: "팩으로 돌아가기",
  openAnother: "하나 더 열기",
  godPackTitle: "갓 팩!",
  godPackBody: "여덟 장 모두 포켓몬 ex 이상.",
  zoomAria: (name: string) => `${name} 카드 확대`,
  closeZoom: "닫기",

  shopTitle: "팩 상점",
  shopSubtitle:
    "트레이너 포인트는 대전으로 모입니다 — 팩에서 나온 중복 카드로도.",
  balance: (pe: number) => `${pe} TP`,
  balanceLabel: "트레이너 포인트",
  price: (pe: number) => `${pe} TP`,
  buyCta: "구매",
  cantAfford: "TP가 부족합니다",
  notForSale: "판매하지 않습니다",
  ledgerTitle: "내역",
  ledgerEmpty: "아직 내역이 없습니다.",
  ledgerReason: {
    round: "승리한 라운드",
    title: "우승",
    flawless: "한 마리도 쓰러지지 않음",
    consolation: "위로상",
    duplicate: "중복 카드",
    purchase: "팩 구매",
  } as Record<PeReason, string>,

  rewardTitle: "우승 보상",
  rewardPe: (pe: number) => `+${pe} TP`,
  rewardFlawless: "한 마리도 쓰러지지 않음",
  rewardGodPack: "게다가 갓 팩까지!",
  rewardCta: "내 팩 열기",
  rewardConsolation: (pe: number) => `분전의 대가로 ${pe} TP.`,
  rewardPreviewLabel: "우승 상품",
  rewardStored: "이미 보유 팩에 들어왔습니다",
  xpNote: (cup: string) => `${cup} 우승 시 TP`,

  resetTitle: "컬렉션 초기화",
  resetBody:
    "모든 카드와 팩, 트레이너 포인트가 지워집니다. 되돌릴 수 없습니다.",
  resetCta: "초기화",
  resetConfirm: "예, 모두 지웁니다",
  resetCancel: "취소",
};

const zhHans: typeof es = {
  metaTitle: "集换式卡册",
  metaDescription:
    "拆开卡包，收集真实的宝可梦集换式卡牌，集齐从第一世代到第九世代的整本卡册。",

  ctaTitle: "集换式卡册",
  ctaBadge: "收藏",
  ctaTagline: "卡包 · 卡牌 · 收藏",
  ctaAria: (owned: number, total: number) =>
    `打开集换式卡册（已收集 ${total} 张中的 ${owned} 张）`,
  ctaOpen: "开始收集",
  ctaProgress: (owned: number, total: number) => `${owned} / ${total}`,
  ctaPacks: (packs: number) => `${packs} 个未拆卡包`,

  backToDex: "← 返回宝可梦图鉴",

  viewAlbum: "卡册",
  viewPacks: "卡包",
  viewShop: "商店",

  albumTitle: "收藏卡册",
  albumSubtitle:
    "真实的宝可梦集换式卡牌。从关都到帕底亚，每一个卡套都在等它的主人。",
  progressLabel: (owned: number, total: number, pct: string) =>
    `收藏完成度：${total} 张中的 ${owned} 张（${pct}%）`,
  progressCards: (cards: number) => `${cards} 张不同的卡牌`,
  progressLoading: "正在载入收藏…",
  progressAria: "收藏进度",
  unknownName: "???",
  slotAria: (dex: string, name: string, rarity: string) =>
    `${dex} ${name}，${rarity}。启动以放大。`,
  lockedAria: (dex: string) => `${dex}，尚未获得。`,
  emptyTitle: "卡册还是空的",
  emptyBody:
    "在 AI 锦标赛中夺冠即可获得卡包，拆开后卡牌就会一张张填满卡套。",
  emptyCta: "前往锦标赛",

  filterGeneration: "世代",
  filterType: "属性",
  filterRarity: "稀有度",
  filterOwnership: "状态",
  optionAll: "全部",
  optionOwned: "已获得",
  optionMissing: "未获得",
  clearFilters: "清除筛选",
  filtersToggle: "筛选",
  resultCount: (shown: number, total: number) =>
    `${total} 个卡套中的 ${shown} 个`,
  noResults: "没有卡套符合这些筛选条件。",

  tabsAria: "收藏模式的分区",
  tabAlbumLabel: "收藏卡册",
  tabPacksLabel: "拆开卡包",
  tabShopLabel: "卡包商店",

  milestoneAria: "收藏里程碑",
  milestoneLocked: (pct: number, reward: string) =>
    `达到 ${pct}% 即可免费解锁：${reward}`,
  milestoneDone: (pct: number, reward: string) =>
    `已达 ${pct}%：${reward} 已解锁`,
  milestoneNext: (pct: number, reward: string) =>
    `下一个里程碑：达到 ${pct}% 免费获得 ${reward}`,
  milestoneAllDone: "所有里程碑都已解锁。这本卡册属于你了。",

  sheetAria: (page: number, total: number) =>
    `第 ${page} 页卡册，共 ${total} 页`,
  pageLabel: (page: number, total: number) => `第 ${page} 页 / 共 ${total} 页`,
  prevPage: "上一页",
  nextPage: "下一页",
  sheetSizeLabel: "每页卡套数",

  rarityName: {
    common: "普通",
    uncommon: "非普通",
    holo: "闪卡稀有",
    ex: "宝可梦 ex",
    fullArt: "特绘稀有",
    hyper: "极致稀有",
  } as Record<Rarity, string>,

  packName: {
    bolt: "闪电卡包",
    elite: "精英卡包",
    master: "大师卡包",
    special: "特别 ex 卡包",
    god: "神级卡包",
  } as Record<PackType, string>,
  packDesc: {
    bolt: "五张卡，最后一格必定不低于闪卡稀有。",
    elite: "六张卡，保底三张闪卡稀有，最后一格有近一半的概率是宝可梦 ex 或更好。",
    master: "七张卡，保底四张闪卡稀有，最后一格必定不低于宝可梦 ex。",
    special:
      "八张卡：四张闪卡稀有、三个不低于宝可梦 ex 的格子，最后一格特绘稀有起跳。",
    god: "八张卡，全都不低于宝可梦 ex。买不到，只能赢。",
  } as Record<PackType, string>,
  packFloor: (count: number, rarity: string) => `${rarity}以上 ×${count}`,
  packCards: (cards: number) => `${cards} 张`,

  shelfTitle: "你的卡包",
  shelfSubtitle: "挑一个拆开吧。卡牌会直接进入卡册。",
  shelfEmpty: "你没有卡包了",
  shelfEmptyBody:
    "卡包可以通过在 AI 锦标赛夺冠获得，也可以用训练家点数购买。",
  shelfEmptyCta: "前往锦标赛",
  openCta: "拆开",
  packCount: (packs: number) => `×${packs}`,

  swipeHint: "滑动撕开卡包",
  tapToFlip: "点击卡牌翻面",
  tapToContinue: "点击查看下一张",
  holoCta: "全息查看",
  holoHint: "在卡牌上拖动即可倾斜",
  closeOpener: "关闭开包",
  nextCardAria: (name: string, rarity: string) =>
    `${name}，${rarity}。启用以查看下一张卡牌。`,
  openAria: (pack: string, cards: number) => `拆开${pack}（${cards} 张）`,
  slotHiddenAria: (index: number, total: number) =>
    `第 ${index} 张，共 ${total} 张，背面朝上。启动以翻开。`,
  slotRevealedAria: (name: string, rarity: string) =>
    `${name}，${rarity}。启动以放大。`,
  revealAnnounce: (name: string, rarity: string) => `${name}，${rarity}。`,
  revealAll: "全部翻开",
  newBadge: "新卡！",
  dupeBadge: (pe: number) => `重复 · +${pe} TP`,
  summaryTitle: "卡包内容",
  summaryNew: (cards: number) => `${cards} 张新卡`,
  summaryNothingNew: "这次没有新卡",
  dustTally: (pe: number) => `+${pe} TP`,
  dustTallyLabel: "重复卡换得的训练家点数",
  summaryDust: (pe: number) => `重复卡换得 +${pe} TP`,
  backToShelf: "返回卡包",
  openAnother: "再拆一个",
  godPackTitle: "神级卡包！",
  godPackBody: "八张卡，全都不低于宝可梦 ex。",
  zoomAria: (name: string) => `放大${name}的卡牌`,
  closeZoom: "关闭",

  shopTitle: "卡包商店",
  shopSubtitle: "训练家点数来自对战 — 以及卡包里开出的重复卡。",
  balance: (pe: number) => `${pe} TP`,
  balanceLabel: "训练家点数",
  price: (pe: number) => `${pe} TP`,
  buyCta: "购买",
  cantAfford: "点数不足",
  notForSale: "不出售",
  ledgerTitle: "记录",
  ledgerEmpty: "还没有任何记录。",
  ledgerReason: {
    round: "获胜的轮次",
    title: "夺得奖杯",
    flawless: "全员无一倒下",
    consolation: "安慰奖",
    duplicate: "重复卡牌",
    purchase: "购买卡包",
  } as Record<PeReason, string>,

  rewardTitle: "夺冠奖励",
  rewardPe: (pe: number) => `+${pe} TP`,
  rewardFlawless: "全员无一倒下",
  rewardGodPack: "还有一个神级卡包！",
  rewardCta: "去拆我的卡包",
  rewardConsolation: (pe: number) => `激战的回报：${pe} TP。`,
  rewardPreviewLabel: "夺冠奖品",
  rewardStored: "已经放进你的卡包里了",
  xpNote: (cup: string) => `赢下${cup}可得的 TP`,

  resetTitle: "重置收藏",
  resetBody: "所有卡牌、卡包与训练家点数都会被清空，且无法撤销。",
  resetCta: "重置",
  resetConfirm: "是的，全部清空",
  resetCancel: "取消",
};

const zhHant: typeof es = {
  metaTitle: "集換式卡冊",
  metaDescription:
    "拆開卡包，收集真實的寶可夢集換式卡牌，集齊從第一世代到第九世代的整本卡冊。",

  ctaTitle: "集換式卡冊",
  ctaBadge: "收藏",
  ctaTagline: "卡包 · 卡牌 · 收藏",
  ctaAria: (owned: number, total: number) =>
    `打開集換式卡冊（已收集 ${total} 張中的 ${owned} 張）`,
  ctaOpen: "開始收集",
  ctaProgress: (owned: number, total: number) => `${owned} / ${total}`,
  ctaPacks: (packs: number) => `${packs} 個未拆卡包`,

  backToDex: "← 返回寶可夢圖鑑",

  viewAlbum: "卡冊",
  viewPacks: "卡包",
  viewShop: "商店",

  albumTitle: "收藏卡冊",
  albumSubtitle:
    "真實的寶可夢集換式卡牌。從關都到帕底亞，每一個卡套都在等它的主人。",
  progressLabel: (owned: number, total: number, pct: string) =>
    `收藏完成度：${total} 張中的 ${owned} 張（${pct}%）`,
  progressCards: (cards: number) => `${cards} 張不同的卡牌`,
  progressLoading: "正在載入收藏…",
  progressAria: "收藏進度",
  unknownName: "???",
  slotAria: (dex: string, name: string, rarity: string) =>
    `${dex} ${name}，${rarity}。啟動以放大。`,
  lockedAria: (dex: string) => `${dex}，尚未獲得。`,
  emptyTitle: "卡冊還是空的",
  emptyBody:
    "在 AI 錦標賽中奪冠即可獲得卡包，拆開後卡牌就會一張張填滿卡套。",
  emptyCta: "前往錦標賽",

  filterGeneration: "世代",
  filterType: "屬性",
  filterRarity: "稀有度",
  filterOwnership: "狀態",
  optionAll: "全部",
  optionOwned: "已獲得",
  optionMissing: "未獲得",
  clearFilters: "清除篩選",
  filtersToggle: "篩選",
  resultCount: (shown: number, total: number) =>
    `${total} 個卡套中的 ${shown} 個`,
  noResults: "沒有卡套符合這些篩選條件。",

  tabsAria: "收藏模式的分區",
  tabAlbumLabel: "收藏卡冊",
  tabPacksLabel: "拆開卡包",
  tabShopLabel: "卡包商店",

  milestoneAria: "收藏里程碑",
  milestoneLocked: (pct: number, reward: string) =>
    `達到 ${pct}% 即可免費解鎖：${reward}`,
  milestoneDone: (pct: number, reward: string) =>
    `已達 ${pct}%：${reward} 已解鎖`,
  milestoneNext: (pct: number, reward: string) =>
    `下一個里程碑：達到 ${pct}% 免費獲得 ${reward}`,
  milestoneAllDone: "所有里程碑都已解鎖。這本卡冊屬於你了。",

  sheetAria: (page: number, total: number) =>
    `第 ${page} 頁卡冊，共 ${total} 頁`,
  pageLabel: (page: number, total: number) => `第 ${page} 頁 / 共 ${total} 頁`,
  prevPage: "上一頁",
  nextPage: "下一頁",
  sheetSizeLabel: "每頁卡套數",

  rarityName: {
    common: "普通",
    uncommon: "非普通",
    holo: "閃卡稀有",
    ex: "寶可夢 ex",
    fullArt: "特繪稀有",
    hyper: "極致稀有",
  } as Record<Rarity, string>,

  packName: {
    bolt: "閃電卡包",
    elite: "精英卡包",
    master: "大師卡包",
    special: "特別 ex 卡包",
    god: "神級卡包",
  } as Record<PackType, string>,
  packDesc: {
    bolt: "五張卡，最後一格必定不低於閃卡稀有。",
    elite: "六張卡，保底三張閃卡稀有，最後一格有近一半的機率是寶可夢 ex 或更好。",
    master: "七張卡，保底四張閃卡稀有，最後一格必定不低於寶可夢 ex。",
    special:
      "八張卡：四張閃卡稀有、三個不低於寶可夢 ex 的格子，最後一格特繪稀有起跳。",
    god: "八張卡，全都不低於寶可夢 ex。買不到，只能贏。",
  } as Record<PackType, string>,
  packFloor: (count: number, rarity: string) => `${rarity}以上 ×${count}`,
  packCards: (cards: number) => `${cards} 張`,

  shelfTitle: "你的卡包",
  shelfSubtitle: "挑一個拆開吧。卡牌會直接進入卡冊。",
  shelfEmpty: "你沒有卡包了",
  shelfEmptyBody:
    "卡包可以透過在 AI 錦標賽奪冠獲得，也可以用訓練家點數購買。",
  shelfEmptyCta: "前往錦標賽",
  openCta: "拆開",
  packCount: (packs: number) => `×${packs}`,

  swipeHint: "滑動撕開卡包",
  tapToFlip: "點擊卡牌翻面",
  tapToContinue: "點擊查看下一張",
  holoCta: "全息檢視",
  holoHint: "在卡牌上拖曳即可傾斜",
  closeOpener: "關閉開包",
  nextCardAria: (name: string, rarity: string) =>
    `${name}，${rarity}。啟用以檢視下一張卡牌。`,
  openAria: (pack: string, cards: number) => `拆開${pack}（${cards} 張）`,
  slotHiddenAria: (index: number, total: number) =>
    `第 ${index} 張，共 ${total} 張，背面朝上。啟動以翻開。`,
  slotRevealedAria: (name: string, rarity: string) =>
    `${name}，${rarity}。啟動以放大。`,
  revealAnnounce: (name: string, rarity: string) => `${name}，${rarity}。`,
  revealAll: "全部翻開",
  newBadge: "新卡！",
  dupeBadge: (pe: number) => `重複 · +${pe} TP`,
  summaryTitle: "卡包內容",
  summaryNew: (cards: number) => `${cards} 張新卡`,
  summaryNothingNew: "這次沒有新卡",
  dustTally: (pe: number) => `+${pe} TP`,
  dustTallyLabel: "重複卡換得的訓練家點數",
  summaryDust: (pe: number) => `重複卡換得 +${pe} TP`,
  backToShelf: "返回卡包",
  openAnother: "再拆一個",
  godPackTitle: "神級卡包！",
  godPackBody: "八張卡，全都不低於寶可夢 ex。",
  zoomAria: (name: string) => `放大${name}的卡牌`,
  closeZoom: "關閉",

  shopTitle: "卡包商店",
  shopSubtitle: "訓練家點數來自對戰 — 以及卡包裡開出的重複卡。",
  balance: (pe: number) => `${pe} TP`,
  balanceLabel: "訓練家點數",
  price: (pe: number) => `${pe} TP`,
  buyCta: "購買",
  cantAfford: "點數不足",
  notForSale: "不出售",
  ledgerTitle: "紀錄",
  ledgerEmpty: "還沒有任何紀錄。",
  ledgerReason: {
    round: "獲勝的輪次",
    title: "奪得獎盃",
    flawless: "全員無一倒下",
    consolation: "安慰獎",
    duplicate: "重複卡牌",
    purchase: "購買卡包",
  } as Record<PeReason, string>,

  rewardTitle: "奪冠獎勵",
  rewardPe: (pe: number) => `+${pe} TP`,
  rewardFlawless: "全員無一倒下",
  rewardGodPack: "還有一個神級卡包！",
  rewardCta: "去拆我的卡包",
  rewardConsolation: (pe: number) => `激戰的回報：${pe} TP。`,
  rewardPreviewLabel: "奪冠獎品",
  rewardStored: "已經放進你的卡包裡了",
  xpNote: (cup: string) => `贏下${cup}可得的 TP`,

  resetTitle: "重置收藏",
  resetBody: "所有卡牌、卡包與訓練家點數都會被清空，且無法撤銷。",
  resetCta: "重置",
  resetConfirm: "是的，全部清空",
  resetCancel: "取消",
};

export const tcgDict: Record<Lang, typeof es> = {
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

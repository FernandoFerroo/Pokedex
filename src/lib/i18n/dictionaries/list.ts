import type { Lang } from "../config";

/** Pokédex list: search + filter bar, status line, empty state, pagination,
 * favorites toggle. Filter option labels live in pokemon-meta (per-lang maps). */
const es = {
  // FilterBar
  searchPlaceholder: "Buscar por nombre o cadena evolutiva (ej. pikachu)…",
  searchAria: "Buscar Pokémon por nombre o cadena evolutiva",
  filtersToggle: "Filtros",
  filtersToggleAria: "Mostrar u ocultar los filtros",
  allTypes: "Todos los tipos",
  filterByType: "Filtrar por tipo",
  allGenerations: "Todas las generaciones",
  filterByGeneration: "Filtrar por generación",
  sortResults: "Ordenar resultados",
  favoritesButton: "Favoritos",
  favoritesOnlyAria: "Mostrar solo favoritos",
  moreFilters: "Más filtros",
  excluding: "Sin:",
  excludingFamilies: "Sin (y su familia):",
  excludeRemoveAria: (name: string) => `Dejar de excluir a ${name}`,
  clearFilters: "Limpiar",
  allColors: "Todos los colores",
  filterByColor: "Filtrar por color",
  allHabitats: "Todos los hábitats",
  filterByHabitat: "Filtrar por hábitat (solo Gen I–III)",
  allEggGroups: "Todos los grupos huevo",
  filterByEggGroup: "Filtrar por grupo huevo",
  allCategories: "Todas las categorías",
  filterByCategory: "Filtrar por categoría",
  allStages: "Todas las etapas",
  filterByStage: "Filtrar por etapa evolutiva",
  allShapes: "Todas las formas",
  filterByShape: "Filtrar por forma corporal",

  // PokedexView status line + empty state
  statusAll: (total: number) => `${total} entradas registradas · Gen I–IX`,
  statusFiltered: (found: number, total: number) =>
    `${found} / ${total} entradas encontradas`,
  statusPage: (current: number, total: number) => `pág. ${current}/${total}`,
  noResultsTitle: "¡SIN RESULTADOS!",
  noResultsBody:
    "El Pokémon salvaje huyó… Prueba con otro nombre o ajusta los filtros activos.",

  // Pagination
  paginationAria: "Paginación de resultados",
  prevPageAria: "Página anterior",
  nextPageAria: "Página siguiente",
  goToPageAria: (page: number) => `Ir a la página ${page}`,
  pageReadout: (current: string, total: string) => `Pág ${current}/${total}`,

  // FavoriteButton
  favAdd: "Añadir a favoritos",
  favRemove: "Quitar de favoritos",

  // CardGrid (TCG cards + holo lightbox)
  cardZoomAria: (name: string) => `Ampliar carta ${name}`,
  cardAlt: (name: string) => `Carta ${name}`,
  cardDialogAria: (name: string) => `Carta ${name} ampliada`,
  cardCloseAria: "Cerrar",
  cardHoloHint: "Mueve el cursor sobre la carta",
};

const en: typeof es = {
  // FilterBar
  searchPlaceholder: "Search by name or evolution chain (e.g. pikachu)…",
  searchAria: "Search Pokémon by name or evolution chain",
  filtersToggle: "Filters",
  filtersToggleAria: "Show or hide the filters",
  allTypes: "All types",
  filterByType: "Filter by type",
  allGenerations: "All generations",
  filterByGeneration: "Filter by generation",
  sortResults: "Sort results",
  favoritesButton: "Favorites",
  favoritesOnlyAria: "Show favorites only",
  moreFilters: "More filters",
  excluding: "Excluding:",
  excludingFamilies: "Excluding (with family):",
  excludeRemoveAria: (name: string) => `Stop excluding ${name}`,
  clearFilters: "Clear",
  allColors: "All colors",
  filterByColor: "Filter by color",
  allHabitats: "All habitats",
  filterByHabitat: "Filter by habitat (Gen I–III only)",
  allEggGroups: "All egg groups",
  filterByEggGroup: "Filter by egg group",
  allCategories: "All categories",
  filterByCategory: "Filter by category",
  allStages: "All stages",
  filterByStage: "Filter by evolution stage",
  allShapes: "All body shapes",
  filterByShape: "Filter by body shape",

  // PokedexView status line + empty state
  statusAll: (total: number) => `${total} entries registered · Gen I–IX`,
  statusFiltered: (found: number, total: number) =>
    `${found} / ${total} entries found`,
  statusPage: (current: number, total: number) => `page ${current}/${total}`,
  noResultsTitle: "NO RESULTS!",
  noResultsBody:
    "The wild Pokémon fled… Try another name or adjust the active filters.",

  // Pagination
  paginationAria: "Results pagination",
  prevPageAria: "Previous page",
  nextPageAria: "Next page",
  goToPageAria: (page: number) => `Go to page ${page}`,
  pageReadout: (current: string, total: string) => `Page ${current}/${total}`,

  // FavoriteButton
  favAdd: "Add to favorites",
  favRemove: "Remove from favorites",

  // CardGrid (TCG cards + holo lightbox)
  cardZoomAria: (name: string) => `Zoom in on card ${name}`,
  cardAlt: (name: string) => `Card ${name}`,
  cardDialogAria: (name: string) => `Card ${name} enlarged`,
  cardCloseAria: "Close",
  cardHoloHint: "Move the cursor over the card",
};

const fr: typeof es = {
  // FilterBar
  searchPlaceholder: "Rechercher par nom ou chaîne d'évolution (ex. pikachu)…",
  searchAria: "Rechercher un Pokémon par nom ou chaîne d'évolution",
  filtersToggle: "Filtres",
  filtersToggleAria: "Afficher ou masquer les filtres",
  allTypes: "Tous les types",
  filterByType: "Filtrer par type",
  allGenerations: "Toutes les générations",
  filterByGeneration: "Filtrer par génération",
  sortResults: "Trier les résultats",
  favoritesButton: "Favoris",
  favoritesOnlyAria: "Afficher uniquement les favoris",
  moreFilters: "Plus de filtres",
  excluding: "Sans :",
  excludingFamilies: "Sans (et sa famille) :",
  excludeRemoveAria: (name: string) => `Ne plus exclure ${name}`,
  clearFilters: "Effacer",
  allColors: "Toutes les couleurs",
  filterByColor: "Filtrer par couleur",
  allHabitats: "Tous les habitats",
  filterByHabitat: "Filtrer par habitat (Gén. I–III uniquement)",
  allEggGroups: "Tous les Groupes d'Œufs",
  filterByEggGroup: "Filtrer par Groupe d'Œufs",
  allCategories: "Toutes les catégories",
  filterByCategory: "Filtrer par catégorie",
  allStages: "Tous les stades",
  filterByStage: "Filtrer par stade d'évolution",
  allShapes: "Toutes les silhouettes",
  filterByShape: "Filtrer par silhouette",

  // PokedexView status line + empty state
  statusAll: (total: number) => `${total} entrées enregistrées · Gén. I–IX`,
  statusFiltered: (found: number, total: number) =>
    `${found} / ${total} entrées trouvées`,
  statusPage: (current: number, total: number) => `p. ${current}/${total}`,
  noResultsTitle: "AUCUN RÉSULTAT !",
  noResultsBody:
    "Le Pokémon sauvage s'est enfui… Essaie un autre nom ou ajuste les filtres actifs.",

  // Pagination
  paginationAria: "Pagination des résultats",
  prevPageAria: "Page précédente",
  nextPageAria: "Page suivante",
  goToPageAria: (page: number) => `Aller à la page ${page}`,
  pageReadout: (current: string, total: string) => `Page ${current}/${total}`,

  // FavoriteButton
  favAdd: "Ajouter aux favoris",
  favRemove: "Retirer des favoris",

  // CardGrid (TCG cards + holo lightbox)
  cardZoomAria: (name: string) => `Agrandir la carte ${name}`,
  cardAlt: (name: string) => `Carte ${name}`,
  cardDialogAria: (name: string) => `Carte ${name} agrandie`,
  cardCloseAria: "Fermer",
  cardHoloHint: "Passe le curseur sur la carte",
};

const de: typeof es = {
  // FilterBar
  searchPlaceholder: "Nach Name oder Entwicklungsreihe suchen (z. B. pikachu)…",
  searchAria: "Pokémon nach Name oder Entwicklungsreihe suchen",
  filtersToggle: "Filter",
  filtersToggleAria: "Filter ein- oder ausblenden",
  allTypes: "Alle Typen",
  filterByType: "Nach Typ filtern",
  allGenerations: "Alle Generationen",
  filterByGeneration: "Nach Generation filtern",
  sortResults: "Ergebnisse sortieren",
  favoritesButton: "Favoriten",
  favoritesOnlyAria: "Nur Favoriten anzeigen",
  moreFilters: "Mehr Filter",
  excluding: "Ohne:",
  excludingFamilies: "Ohne (samt Familie):",
  excludeRemoveAria: (name: string) => `${name} nicht mehr ausschließen`,
  clearFilters: "Zurücksetzen",
  allColors: "Alle Farben",
  filterByColor: "Nach Farbe filtern",
  allHabitats: "Alle Habitate",
  filterByHabitat: "Nach Habitat filtern (nur Gen. I–III)",
  allEggGroups: "Alle Ei-Gruppen",
  filterByEggGroup: "Nach Ei-Gruppe filtern",
  allCategories: "Alle Kategorien",
  filterByCategory: "Nach Kategorie filtern",
  allStages: "Alle Stufen",
  filterByStage: "Nach Entwicklungsstufe filtern",
  allShapes: "Alle Körperformen",
  filterByShape: "Nach Körperform filtern",

  // PokedexView status line + empty state
  statusAll: (total: number) => `${total} registrierte Einträge · Gen. I–IX`,
  statusFiltered: (found: number, total: number) =>
    `${found} / ${total} Einträge gefunden`,
  statusPage: (current: number, total: number) => `S. ${current}/${total}`,
  noResultsTitle: "KEINE TREFFER!",
  noResultsBody:
    "Das wilde Pokémon ist geflohen… Versuch einen anderen Namen oder passe die aktiven Filter an.",

  // Pagination
  paginationAria: "Seitennavigation der Ergebnisse",
  prevPageAria: "Vorherige Seite",
  nextPageAria: "Nächste Seite",
  goToPageAria: (page: number) => `Zu Seite ${page} wechseln`,
  pageReadout: (current: string, total: string) => `Seite ${current}/${total}`,

  // FavoriteButton
  favAdd: "Zu Favoriten hinzufügen",
  favRemove: "Aus Favoriten entfernen",

  // CardGrid (TCG cards + holo lightbox)
  cardZoomAria: (name: string) => `Karte ${name} vergrößern`,
  cardAlt: (name: string) => `Karte ${name}`,
  cardDialogAria: (name: string) => `Karte ${name} vergrößert`,
  cardCloseAria: "Schließen",
  cardHoloHint: "Beweg den Cursor über die Karte",
};

const it: typeof es = {
  // FilterBar
  searchPlaceholder: "Cerca per nome o catena evolutiva (es. pikachu)…",
  searchAria: "Cerca Pokémon per nome o catena evolutiva",
  filtersToggle: "Filtri",
  filtersToggleAria: "Mostra o nascondi i filtri",
  allTypes: "Tutti i tipi",
  filterByType: "Filtra per tipo",
  allGenerations: "Tutte le generazioni",
  filterByGeneration: "Filtra per generazione",
  sortResults: "Ordina i risultati",
  favoritesButton: "Preferiti",
  favoritesOnlyAria: "Mostra solo i preferiti",
  moreFilters: "Altri filtri",
  excluding: "Senza:",
  excludingFamilies: "Senza (e la sua famiglia):",
  excludeRemoveAria: (name: string) => `Smetti di escludere ${name}`,
  clearFilters: "Azzera",
  allColors: "Tutti i colori",
  filterByColor: "Filtra per colore",
  allHabitats: "Tutti gli habitat",
  filterByHabitat: "Filtra per habitat (solo Gen I–III)",
  allEggGroups: "Tutti i Gruppi Uova",
  filterByEggGroup: "Filtra per Gruppo Uova",
  allCategories: "Tutte le categorie",
  filterByCategory: "Filtra per categoria",
  allStages: "Tutti gli stadi",
  filterByStage: "Filtra per stadio evolutivo",
  allShapes: "Tutte le forme",
  filterByShape: "Filtra per forma corporea",

  // PokedexView status line + empty state
  statusAll: (total: number) => `${total} voci registrate · Gen I–IX`,
  statusFiltered: (found: number, total: number) =>
    `${found} / ${total} voci trovate`,
  statusPage: (current: number, total: number) => `pag. ${current}/${total}`,
  noResultsTitle: "NESSUN RISULTATO!",
  noResultsBody:
    "Il Pokémon selvatico è fuggito… Prova un altro nome o modifica i filtri attivi.",

  // Pagination
  paginationAria: "Paginazione dei risultati",
  prevPageAria: "Pagina precedente",
  nextPageAria: "Pagina successiva",
  goToPageAria: (page: number) => `Vai alla pagina ${page}`,
  pageReadout: (current: string, total: string) => `Pag. ${current}/${total}`,

  // FavoriteButton
  favAdd: "Aggiungi ai preferiti",
  favRemove: "Rimuovi dai preferiti",

  // CardGrid (TCG cards + holo lightbox)
  cardZoomAria: (name: string) => `Ingrandisci la carta ${name}`,
  cardAlt: (name: string) => `Carta ${name}`,
  cardDialogAria: (name: string) => `Carta ${name} ingrandita`,
  cardCloseAria: "Chiudi",
  cardHoloHint: "Muovi il cursore sulla carta",
};

const ja: typeof es = {
  // FilterBar
  searchPlaceholder: "名前や進化系統で検索（例: pikachu）…",
  searchAria: "名前や進化系統でポケモンを検索",
  filtersToggle: "フィルター",
  filtersToggleAria: "フィルターの表示切り替え",
  allTypes: "すべてのタイプ",
  filterByType: "タイプで絞り込む",
  allGenerations: "すべての世代",
  filterByGeneration: "世代で絞り込む",
  sortResults: "並べ替え",
  favoritesButton: "お気に入り",
  favoritesOnlyAria: "お気に入りのみ表示",
  moreFilters: "その他のフィルター",
  excluding: "のぞく：",
  excludingFamilies: "のぞく（進化系もふくむ）：",
  excludeRemoveAria: (name: string) => `${name}の除外をやめる`,
  clearFilters: "クリア",
  allColors: "すべての色",
  filterByColor: "色で絞り込む",
  allHabitats: "すべての生息地",
  filterByHabitat: "生息地で絞り込む（第1〜3世代のみ）",
  allEggGroups: "すべてのタマゴグループ",
  filterByEggGroup: "タマゴグループで絞り込む",
  allCategories: "すべての分類",
  filterByCategory: "分類で絞り込む",
  allStages: "すべての進化段階",
  filterByStage: "進化段階で絞り込む",
  allShapes: "すべての体形",
  filterByShape: "体形で絞り込む",

  // PokedexView status line + empty state
  statusAll: (total: number) => `登録数 ${total}件 · 第1〜9世代`,
  statusFiltered: (found: number, total: number) =>
    `${found} / ${total}件 ヒット`,
  statusPage: (current: number, total: number) =>
    `${current}/${total}ページ`,
  noResultsTitle: "結果なし！",
  noResultsBody:
    "やせいのポケモンは にげだした… 別の名前を試すか、フィルターを調整してみよう。",

  // Pagination
  paginationAria: "検索結果のページ送り",
  prevPageAria: "前のページ",
  nextPageAria: "次のページ",
  goToPageAria: (page: number) => `${page}ページ目へ移動`,
  pageReadout: (current: string, total: string) =>
    `${current}/${total}ページ`,

  // FavoriteButton
  favAdd: "お気に入りに追加",
  favRemove: "お気に入りから削除",

  // CardGrid (TCG cards + holo lightbox)
  cardZoomAria: (name: string) => `カード「${name}」を拡大`,
  cardAlt: (name: string) => `カード「${name}」`,
  cardDialogAria: (name: string) => `カード「${name}」を拡大表示`,
  cardCloseAria: "閉じる",
  cardHoloHint: "カードの上でカーソルを動かそう",
};

const ko: typeof es = {
  // FilterBar
  searchPlaceholder: "이름 또는 진화 계보로 검색 (예: pikachu)…",
  searchAria: "이름이나 진화 계보로 포켓몬 검색",
  filtersToggle: "필터",
  filtersToggleAria: "필터 표시/숨기기",
  allTypes: "모든 타입",
  filterByType: "타입별 필터",
  allGenerations: "모든 세대",
  filterByGeneration: "세대별 필터",
  sortResults: "결과 정렬",
  favoritesButton: "즐겨찾기",
  favoritesOnlyAria: "즐겨찾기만 표시",
  moreFilters: "필터 더 보기",
  excluding: "제외:",
  excludingFamilies: "제외(진화형 포함):",
  excludeRemoveAria: (name: string) => `${name} 제외 해제`,
  clearFilters: "초기화",
  allColors: "모든 색",
  filterByColor: "색깔별 필터",
  allHabitats: "모든 서식지",
  filterByHabitat: "서식지별 필터 (1~3세대만)",
  allEggGroups: "모든 알그룹",
  filterByEggGroup: "알그룹별 필터",
  allCategories: "모든 분류",
  filterByCategory: "분류별 필터",
  allStages: "모든 진화 단계",
  filterByStage: "진화 단계별 필터",
  allShapes: "모든 체형",
  filterByShape: "체형별 필터",

  // PokedexView status line + empty state
  statusAll: (total: number) => `등록된 도감 항목 ${total}개 · 1~9세대`,
  statusFiltered: (found: number, total: number) =>
    `${found} / ${total}개 항목 발견`,
  statusPage: (current: number, total: number) =>
    `${current}/${total}페이지`,
  noResultsTitle: "결과 없음!",
  noResultsBody:
    "야생 포켓몬은 도망쳤다… 다른 이름을 시도하거나 필터를 조정해 보세요.",

  // Pagination
  paginationAria: "검색 결과 페이지 이동",
  prevPageAria: "이전 페이지",
  nextPageAria: "다음 페이지",
  goToPageAria: (page: number) => `${page}페이지로 이동`,
  pageReadout: (current: string, total: string) =>
    `${current}/${total}페이지`,

  // FavoriteButton
  favAdd: "즐겨찾기에 추가",
  favRemove: "즐겨찾기에서 제거",

  // CardGrid (TCG cards + holo lightbox)
  cardZoomAria: (name: string) => `${name} 카드 확대`,
  cardAlt: (name: string) => `${name} 카드`,
  cardDialogAria: (name: string) => `${name} 카드 확대 보기`,
  cardCloseAria: "닫기",
  cardHoloHint: "카드 위로 커서를 움직여 보세요",
};

const zhHans: typeof es = {
  // FilterBar
  searchPlaceholder: "按名称或进化链搜索（如 pikachu）…",
  searchAria: "按名称或进化链搜索宝可梦",
  filtersToggle: "筛选",
  filtersToggleAria: "显示或隐藏筛选器",
  allTypes: "全部属性",
  filterByType: "按属性筛选",
  allGenerations: "全部世代",
  filterByGeneration: "按世代筛选",
  sortResults: "结果排序",
  favoritesButton: "收藏",
  favoritesOnlyAria: "只显示收藏",
  moreFilters: "更多筛选",
  excluding: "排除：",
  excludingFamilies: "排除（含进化系）：",
  excludeRemoveAria: (name: string) => `取消排除${name}`,
  clearFilters: "清除",
  allColors: "全部颜色",
  filterByColor: "按颜色筛选",
  allHabitats: "全部栖息地",
  filterByHabitat: "按栖息地筛选（仅第1～3世代）",
  allEggGroups: "全部蛋群",
  filterByEggGroup: "按蛋群筛选",
  allCategories: "全部分类",
  filterByCategory: "按分类筛选",
  allStages: "全部进化阶段",
  filterByStage: "按进化阶段筛选",
  allShapes: "全部体形",
  filterByShape: "按体形筛选",

  // PokedexView status line + empty state
  statusAll: (total: number) => `已登录 ${total} 条图鉴 · 第1～9世代`,
  statusFiltered: (found: number, total: number) =>
    `找到 ${found} / ${total} 条图鉴`,
  statusPage: (current: number, total: number) =>
    `第 ${current}/${total} 页`,
  noResultsTitle: "没有结果！",
  noResultsBody:
    "野生的宝可梦逃走了… 换个名字试试，或调整当前筛选条件。",

  // Pagination
  paginationAria: "结果分页",
  prevPageAria: "上一页",
  nextPageAria: "下一页",
  goToPageAria: (page: number) => `前往第 ${page} 页`,
  pageReadout: (current: string, total: string) =>
    `第 ${current}/${total} 页`,

  // FavoriteButton
  favAdd: "加入收藏",
  favRemove: "取消收藏",

  // CardGrid (TCG cards + holo lightbox)
  cardZoomAria: (name: string) => `放大卡牌 ${name}`,
  cardAlt: (name: string) => `卡牌 ${name}`,
  cardDialogAria: (name: string) => `卡牌 ${name} 放大视图`,
  cardCloseAria: "关闭",
  cardHoloHint: "在卡牌上移动光标",
};

const zhHant: typeof es = {
  // FilterBar
  searchPlaceholder: "依名稱或進化鏈搜尋（例如 pikachu）…",
  searchAria: "依名稱或進化鏈搜尋寶可夢",
  filtersToggle: "篩選",
  filtersToggleAria: "顯示或隱藏篩選器",
  allTypes: "全部屬性",
  filterByType: "依屬性篩選",
  allGenerations: "全部世代",
  filterByGeneration: "依世代篩選",
  sortResults: "排序結果",
  favoritesButton: "收藏",
  favoritesOnlyAria: "只顯示收藏",
  moreFilters: "更多篩選",
  excluding: "排除：",
  excludingFamilies: "排除（含進化系）：",
  excludeRemoveAria: (name: string) => `取消排除${name}`,
  clearFilters: "清除",
  allColors: "全部顏色",
  filterByColor: "依顏色篩選",
  allHabitats: "全部棲息地",
  filterByHabitat: "依棲息地篩選（僅第1～3世代）",
  allEggGroups: "全部蛋群",
  filterByEggGroup: "依蛋群篩選",
  allCategories: "全部分類",
  filterByCategory: "依分類篩選",
  allStages: "全部進化階段",
  filterByStage: "依進化階段篩選",
  allShapes: "全部體形",
  filterByShape: "依體形篩選",

  // PokedexView status line + empty state
  statusAll: (total: number) => `已登錄 ${total} 筆圖鑑 · 第1～9世代`,
  statusFiltered: (found: number, total: number) =>
    `找到 ${found} / ${total} 筆圖鑑`,
  statusPage: (current: number, total: number) =>
    `第 ${current}/${total} 頁`,
  noResultsTitle: "沒有結果！",
  noResultsBody:
    "野生的寶可夢逃走了… 換個名字試試，或調整目前的篩選條件。",

  // Pagination
  paginationAria: "結果分頁",
  prevPageAria: "上一頁",
  nextPageAria: "下一頁",
  goToPageAria: (page: number) => `前往第 ${page} 頁`,
  pageReadout: (current: string, total: string) =>
    `第 ${current}/${total} 頁`,

  // FavoriteButton
  favAdd: "加入收藏",
  favRemove: "移除收藏",

  // CardGrid (TCG cards + holo lightbox)
  cardZoomAria: (name: string) => `放大卡牌 ${name}`,
  cardAlt: (name: string) => `卡牌 ${name}`,
  cardDialogAria: (name: string) => `卡牌 ${name} 放大檢視`,
  cardCloseAria: "關閉",
  cardHoloHint: "在卡牌上移動游標",
};

export const listDict: Record<Lang, typeof es> = {
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

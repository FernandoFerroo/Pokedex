import type { Lang } from "../config";

/** App chrome: header, footer, intro splash, 404, loading, metadata. */
const es = {
  metaDescription:
    "Pokédex construida con Next.js (App Router), TypeScript y Tailwind CSS sobre PokéAPI: filtros por tipo y generación, y búsqueda por nombre y cadena evolutiva.",
  headerTagline: "Sistema Nacional · Gen I–IX",
  online: "Online",
  teamButton: "Equipo",
  openTeamAria: (count: number, size: number) =>
    `Abrir el equipo (${count} de ${size})`,
  themeToLight: "Cambiar a modo claro",
  themeToDark: "Cambiar a modo oscuro",
  langSwitchAria: "Cambiar idioma",
  footerSystem: "Sistema Pokédex · Gen I–IX",
  footerData: "Datos",
  footerCards: "Cartas",
  footerLegal:
    "Proyecto de fans, sin ánimo de lucro. Pokémon © Nintendo / Game Freak / The Pokémon Company.",
  introBooting: "INICIANDO POKÉDEX",
  loadingData: "Cargando datos…",
  notFoundFled: "¡El Pokémon salvaje huyó!",
  notFoundBody:
    "Ese Pokémon no está registrado en la Pokédex. Puede que sea un MissingNo…",
  notFoundBack: "Volver al Centro Pokémon",
};

const en: typeof es = {
  metaDescription:
    "Pokédex built with Next.js (App Router), TypeScript and Tailwind CSS on top of PokéAPI: type and generation filters, plus search by name and evolution chain.",
  headerTagline: "National System · Gen I–IX",
  online: "Online",
  teamButton: "Team",
  openTeamAria: (count: number, size: number) =>
    `Open the team (${count} of ${size})`,
  themeToLight: "Switch to light mode",
  themeToDark: "Switch to dark mode",
  langSwitchAria: "Change language",
  footerSystem: "Pokédex System · Gen I–IX",
  footerData: "Data",
  footerCards: "Cards",
  footerLegal:
    "Non-profit fan project. Pokémon © Nintendo / Game Freak / The Pokémon Company.",
  introBooting: "BOOTING POKÉDEX",
  loadingData: "Loading data…",
  notFoundFled: "The wild Pokémon fled!",
  notFoundBody:
    "That Pokémon isn't registered in the Pokédex. It might be a MissingNo…",
  notFoundBack: "Back to the Pokémon Center",
};

const fr: typeof es = {
  metaDescription:
    "Pokédex construit avec Next.js (App Router), TypeScript et Tailwind CSS sur PokéAPI : filtres par type et génération, recherche par nom et chaîne d'évolution.",
  headerTagline: "Système National · Gén. I–IX",
  online: "En ligne",
  teamButton: "Équipe",
  openTeamAria: (count: number, size: number) =>
    `Ouvrir l'équipe (${count} sur ${size})`,
  themeToLight: "Passer en mode clair",
  themeToDark: "Passer en mode sombre",
  langSwitchAria: "Changer de langue",
  footerSystem: "Système Pokédex · Gén. I–IX",
  footerData: "Données",
  footerCards: "Cartes",
  footerLegal:
    "Projet de fans à but non lucratif. Pokémon © Nintendo / Game Freak / The Pokémon Company.",
  introBooting: "DÉMARRAGE DU POKÉDEX",
  loadingData: "Chargement des données…",
  notFoundFled: "Le Pokémon sauvage s'est enfui !",
  notFoundBody:
    "Ce Pokémon n'est pas enregistré dans le Pokédex. C'est peut-être un MissingNo…",
  notFoundBack: "Retour au Centre Pokémon",
};

const de: typeof es = {
  metaDescription:
    "Pokédex, gebaut mit Next.js (App Router), TypeScript und Tailwind CSS auf Basis der PokéAPI: Filter nach Typ und Generation sowie Suche nach Name und Entwicklungsreihe.",
  headerTagline: "Nationales System · Gen. I–IX",
  online: "Online",
  teamButton: "Team",
  openTeamAria: (count: number, size: number) =>
    `Team öffnen (${count} von ${size})`,
  themeToLight: "Zum hellen Modus wechseln",
  themeToDark: "Zum dunklen Modus wechseln",
  langSwitchAria: "Sprache ändern",
  footerSystem: "Pokédex-System · Gen. I–IX",
  footerData: "Daten",
  footerCards: "Karten",
  footerLegal:
    "Nicht-kommerzielles Fanprojekt. Pokémon © Nintendo / Game Freak / The Pokémon Company.",
  introBooting: "POKÉDEX WIRD GESTARTET",
  loadingData: "Daten werden geladen…",
  notFoundFled: "Das wilde Pokémon ist geflohen!",
  notFoundBody:
    "Dieses Pokémon ist nicht im Pokédex registriert. Vielleicht ist es ein MissingNo…",
  notFoundBack: "Zurück zum Pokémon-Center",
};

const it: typeof es = {
  metaDescription:
    "Pokédex realizzato con Next.js (App Router), TypeScript e Tailwind CSS su PokéAPI: filtri per tipo e generazione, ricerca per nome e catena evolutiva.",
  headerTagline: "Sistema Nazionale · Gen I–IX",
  online: "Online",
  teamButton: "Squadra",
  openTeamAria: (count: number, size: number) =>
    `Apri la squadra (${count} di ${size})`,
  themeToLight: "Passa alla modalità chiara",
  themeToDark: "Passa alla modalità scura",
  langSwitchAria: "Cambia lingua",
  footerSystem: "Sistema Pokédex · Gen I–IX",
  footerData: "Dati",
  footerCards: "Carte",
  footerLegal:
    "Progetto amatoriale senza scopo di lucro. Pokémon © Nintendo / Game Freak / The Pokémon Company.",
  introBooting: "AVVIO DEL POKÉDEX",
  loadingData: "Caricamento dati…",
  notFoundFled: "Il Pokémon selvatico è fuggito!",
  notFoundBody:
    "Questo Pokémon non è registrato nel Pokédex. Forse è un MissingNo…",
  notFoundBack: "Torna al Centro Pokémon",
};

const ja: typeof es = {
  metaDescription:
    "Next.js（App Router）、TypeScript、Tailwind CSSでPokéAPIの上に構築したポケモン図鑑。タイプ・世代フィルター、名前や進化系統での検索に対応。",
  headerTagline: "全国システム · 第1〜9世代",
  online: "オンライン",
  teamButton: "手持ち",
  openTeamAria: (count: number, size: number) =>
    `手持ちを開く（${count}/${size}）`,
  themeToLight: "ライトモードに切り替え",
  themeToDark: "ダークモードに切り替え",
  langSwitchAria: "言語を変更",
  footerSystem: "ポケモン図鑑システム · 第1〜9世代",
  footerData: "データ",
  footerCards: "カード",
  footerLegal:
    "非営利のファンプロジェクトです。Pokémon © Nintendo / Game Freak / The Pokémon Company.",
  introBooting: "ポケモン図鑑 起動中",
  loadingData: "データを読み込み中…",
  notFoundFled: "やせいのポケモンは にげだした！",
  notFoundBody:
    "そのポケモンは図鑑に登録されていません。もしかして、けつばん…？",
  notFoundBack: "ポケモンセンターに戻る",
};

const ko: typeof es = {
  metaDescription:
    "Next.js(App Router), TypeScript, Tailwind CSS로 PokéAPI 위에 만든 포켓몬 도감. 타입·세대 필터와 이름·진화 계보 검색을 지원합니다.",
  headerTagline: "전국 시스템 · 1~9세대",
  online: "온라인",
  teamButton: "팀",
  openTeamAria: (count: number, size: number) =>
    `팀 열기 (${count}/${size})`,
  themeToLight: "라이트 모드로 전환",
  themeToDark: "다크 모드로 전환",
  langSwitchAria: "언어 변경",
  footerSystem: "포켓몬 도감 시스템 · 1~9세대",
  footerData: "데이터",
  footerCards: "카드",
  footerLegal:
    "비영리 팬 프로젝트입니다. Pokémon © Nintendo / Game Freak / The Pokémon Company.",
  introBooting: "포켓몬 도감 부팅 중",
  loadingData: "데이터 로딩 중…",
  notFoundFled: "야생 포켓몬은 도망쳤다!",
  notFoundBody:
    "그 포켓몬은 도감에 등록되어 있지 않습니다. 어쩌면 미싱노일지도…",
  notFoundBack: "포켓몬센터로 돌아가기",
};

const zhHans: typeof es = {
  metaDescription:
    "基于 PokéAPI，使用 Next.js（App Router）、TypeScript 和 Tailwind CSS 构建的宝可梦图鉴：支持按属性与世代筛选，以及按名称和进化链搜索。",
  headerTagline: "全国系统 · 第1～9世代",
  online: "在线",
  teamButton: "队伍",
  openTeamAria: (count: number, size: number) =>
    `打开队伍（${count}/${size}）`,
  themeToLight: "切换到浅色模式",
  themeToDark: "切换到深色模式",
  langSwitchAria: "切换语言",
  footerSystem: "宝可梦图鉴系统 · 第1～9世代",
  footerData: "数据",
  footerCards: "卡牌",
  footerLegal:
    "非营利粉丝项目。Pokémon © Nintendo / Game Freak / The Pokémon Company.",
  introBooting: "宝可梦图鉴启动中",
  loadingData: "正在加载数据…",
  notFoundFled: "野生的宝可梦逃走了！",
  notFoundBody: "这只宝可梦未登录在图鉴中。也许它是 MissingNo…",
  notFoundBack: "返回宝可梦中心",
};

const zhHant: typeof es = {
  metaDescription:
    "基於 PokéAPI，使用 Next.js（App Router）、TypeScript 與 Tailwind CSS 打造的寶可夢圖鑑：支援依屬性與世代篩選，以及依名稱和進化鏈搜尋。",
  headerTagline: "全國系統 · 第1～9世代",
  online: "線上",
  teamButton: "隊伍",
  openTeamAria: (count: number, size: number) =>
    `開啟隊伍（${count}/${size}）`,
  themeToLight: "切換至淺色模式",
  themeToDark: "切換至深色模式",
  langSwitchAria: "切換語言",
  footerSystem: "寶可夢圖鑑系統 · 第1～9世代",
  footerData: "資料",
  footerCards: "卡牌",
  footerLegal:
    "非營利粉絲專案。Pokémon © Nintendo / Game Freak / The Pokémon Company.",
  introBooting: "寶可夢圖鑑啟動中",
  loadingData: "正在載入資料…",
  notFoundFled: "野生的寶可夢逃走了！",
  notFoundBody: "這隻寶可夢未登錄在圖鑑中。也許牠是 MissingNo…",
  notFoundBack: "返回寶可夢中心",
};

export const layoutDict: Record<Lang, typeof es> = {
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

import type { Lang } from "../config";

/** Home page: daily Pokémon banner, team/battle CTA banners + soundtrack player. */
const es = {
  // Daily banner
  dailyTitle: "Pokémon del día",
  funFact: "Dato curioso",
  starStat: "Stat estrella",
  viewEntry: "Explorar ficha",
  artworkAlt: (name: string) => `Ilustración de ${name}`,
  skeletonTuning: "Sintonizando Pokémon del día…",
  statLabels: {
    hp: "PS",
    attack: "Ataque",
    defense: "Defensa",
    "special-attack": "At. Esp.",
    "special-defense": "Def. Esp.",
    speed: "Velocidad",
  } as Record<string, string>,
  factCapture: (rate: number) =>
    `Su ratio de captura es ${rate}/255: ${
      rate <= 45
        ? "de los más difíciles de atrapar"
        : rate >= 190
          ? "cae en casi cualquier Poké Ball"
          : "un desafío moderado con la Poké Ball adecuada"
    }.`,
  factHabitat: (habitat: string) =>
    `En Kanto se le avistaba sobre todo en un hábitat de tipo ${habitat}.`,
  factGenderless: "No se le conoce género: es una especie asexuada.",
  factAllFemale: "Todos los ejemplares conocidos son hembras.",
  factAllMale: "Todos los ejemplares conocidos son machos.",
  factBaseExp: (xp: number) =>
    `Derrotarlo otorga ${xp} puntos de experiencia base.`,

  // Team builder CTA banner
  teamOpenBuilderAria: (count: number, size: number) =>
    `Abrir el creador de equipos (${count} de ${size} ranuras ocupadas)`,
  teamTitle: "MI EQUIPO",
  teamProBadge: "PRO",
  teamTagline: "Cobertura · Análisis · Coach IA",
  teamClearAria: "Vaciar el equipo",
  teamClear: "Vaciar",
  teamOpen: "Abrir",
  teamOpenAria: "Abrir el creador de equipos",

  // Battle mode CTA banner
  battleAria: (count: number, size: number) =>
    `Entrar al Modo Combate contra la IA (${count} de ${size} miembros en tu equipo)`,
  battleTitle: "COMBATE IA",
  battleEliteBadge: "ELITE",
  battleTagline: "Arena 3D · Rival IA · Turnos",
  battleTeamCount: (count: number, size: number) => `Equipo ${count}/${size}`,
  battleFight: "Luchar",

  // Comparator CTA banner
  compareAria: "Abrir el Comparador de Pokémon con IA",
  compareTitle: "COMPARADOR IA",
  compareBadge: "IA",
  compareTagline: "Radar dual · Ventaja de tipos · Veredicto IA",
  compareDuel: "Cara a cara",
  compareOpen: "Comparar",

  // Soundtrack player
  playerGroupAria: "Reproductor de música",
  openPlayerAria: "Abrir reproductor de música",
  openPlayerTitle: "Ver el reproductor",
  muteAria: "Silenciar",
  unmuteAria: "Activar sonido",
  volumeAria: "Volumen",
  bgmTitle: "BGM · Soundtrack",
  minimizeAria: "Minimizar reproductor",
  loadingSoundtrack: "Cargando soundtrack…",
  mutedHint: "Silenciado — toca el altavoz para escuchar.",
  minimizeHint: "Minimiza el panel y la música seguirá sonando.",
};

const en: typeof es = {
  // Daily banner
  dailyTitle: "Pokémon of the Day",
  funFact: "Fun fact",
  starStat: "Star stat",
  viewEntry: "View entry",
  artworkAlt: (name: string) => `Artwork of ${name}`,
  skeletonTuning: "Tuning in the Pokémon of the Day…",
  statLabels: {
    hp: "HP",
    attack: "Attack",
    defense: "Defense",
    "special-attack": "Sp. Atk",
    "special-defense": "Sp. Def",
    speed: "Speed",
  } as Record<string, string>,
  factCapture: (rate: number) =>
    `Its capture rate is ${rate}/255: ${
      rate <= 45
        ? "among the hardest to catch"
        : rate >= 190
          ? "it drops into almost any Poké Ball"
          : "a moderate challenge with the right Poké Ball"
    }.`,
  factHabitat: (habitat: string) =>
    `In Kanto it was mostly spotted in ${habitat} habitats.`,
  factGenderless: "It has no known gender: it is a genderless species.",
  factAllFemale: "All known specimens are female.",
  factAllMale: "All known specimens are male.",
  factBaseExp: (xp: number) =>
    `Defeating it yields ${xp} base experience points.`,

  // Team builder CTA banner
  teamOpenBuilderAria: (count: number, size: number) =>
    `Open the team builder (${count} of ${size} slots filled)`,
  teamTitle: "MY TEAM",
  teamProBadge: "PRO",
  teamTagline: "Coverage · Analysis · AI Coach",
  teamClearAria: "Empty the team",
  teamClear: "Clear",
  teamOpen: "Open",
  teamOpenAria: "Open the team builder",

  // Battle mode CTA banner
  battleAria: (count: number, size: number) =>
    `Enter AI Battle Mode (${count} of ${size} members on your team)`,
  battleTitle: "AI BATTLE",
  battleEliteBadge: "ELITE",
  battleTagline: "3D Arena · AI Rival · Turn-based",
  battleTeamCount: (count: number, size: number) => `Team ${count}/${size}`,
  battleFight: "Fight",

  // Comparator CTA banner
  compareAria: "Open the AI Pokémon Comparator",
  compareTitle: "AI COMPARATOR",
  compareBadge: "AI",
  compareTagline: "Dual radar · Type advantage · AI verdict",
  compareDuel: "Head to head",
  compareOpen: "Compare",

  // Soundtrack player
  playerGroupAria: "Music player",
  openPlayerAria: "Open the music player",
  openPlayerTitle: "Show the player",
  muteAria: "Mute",
  unmuteAria: "Unmute",
  volumeAria: "Volume",
  bgmTitle: "BGM · Soundtrack",
  minimizeAria: "Minimize the player",
  loadingSoundtrack: "Loading soundtrack…",
  mutedHint: "Muted — tap the speaker to listen.",
  minimizeHint: "Minimize the panel and the music keeps playing.",
};

const fr: typeof es = {
  // Daily banner
  dailyTitle: "Pokémon du jour",
  funFact: "Anecdote",
  starStat: "Stat vedette",
  viewEntry: "Voir la fiche",
  artworkAlt: (name: string) => `Illustration de ${name}`,
  skeletonTuning: "Réception du Pokémon du jour…",
  statLabels: {
    hp: "PV",
    attack: "Attaque",
    defense: "Défense",
    "special-attack": "Atq. Spé.",
    "special-defense": "Déf. Spé.",
    speed: "Vitesse",
  } as Record<string, string>,
  factCapture: (rate: number) =>
    `Son taux de capture est de ${rate}/255 : ${
      rate <= 45
        ? "l'un des plus difficiles à attraper"
        : rate >= 190
          ? "il tombe dans presque n'importe quelle Poké Ball"
          : "un défi modéré avec la bonne Poké Ball"
    }.`,
  factHabitat: (habitat: string) =>
    `À Kanto, on l'observait surtout dans un habitat de type ${habitat}.`,
  factGenderless: "Aucun genre connu : c'est une espèce asexuée.",
  factAllFemale: "Tous les spécimens connus sont des femelles.",
  factAllMale: "Tous les spécimens connus sont des mâles.",
  factBaseExp: (xp: number) =>
    `Le vaincre rapporte ${xp} points d'expérience de base.`,

  // Team builder CTA banner
  teamOpenBuilderAria: (count: number, size: number) =>
    `Ouvrir le créateur d'équipes (${count} sur ${size} emplacements occupés)`,
  teamTitle: "MON ÉQUIPE",
  teamProBadge: "PRO",
  teamTagline: "Couverture · Analyse · Coach IA",
  teamClearAria: "Vider l'équipe",
  teamClear: "Vider",
  teamOpen: "Ouvrir",
  teamOpenAria: "Ouvrir le créateur d'équipes",

  // Battle mode CTA banner
  battleAria: (count: number, size: number) =>
    `Entrer en Mode Combat contre l'IA (${count} sur ${size} membres dans ton équipe)`,
  battleTitle: "COMBAT IA",
  battleEliteBadge: "ELITE",
  battleTagline: "Arène 3D · Rival IA · Tour par tour",
  battleTeamCount: (count: number, size: number) => `Équipe ${count}/${size}`,
  battleFight: "Combattre",

  // Comparator CTA banner
  compareAria: "Ouvrir le Comparateur de Pokémon IA",
  compareTitle: "COMPARATEUR IA",
  compareBadge: "IA",
  compareTagline: "Radar double · Avantage de type · Verdict IA",
  compareDuel: "Face à face",
  compareOpen: "Comparer",

  // Soundtrack player
  playerGroupAria: "Lecteur de musique",
  openPlayerAria: "Ouvrir le lecteur de musique",
  openPlayerTitle: "Afficher le lecteur",
  muteAria: "Couper le son",
  unmuteAria: "Réactiver le son",
  volumeAria: "Volume",
  bgmTitle: "BGM · Bande-son",
  minimizeAria: "Réduire le lecteur",
  loadingSoundtrack: "Chargement de la bande-son…",
  mutedHint: "Son coupé — touche le haut-parleur pour écouter.",
  minimizeHint: "Réduis le panneau, la musique continue.",
};

const de: typeof es = {
  // Daily banner
  dailyTitle: "Pokémon des Tages",
  funFact: "Fun Fact",
  starStat: "Star-Statuswert",
  viewEntry: "Eintrag ansehen",
  artworkAlt: (name: string) => `Artwork von ${name}`,
  skeletonTuning: "Pokémon des Tages wird empfangen…",
  statLabels: {
    hp: "KP",
    attack: "Angriff",
    defense: "Verteidigung",
    "special-attack": "Sp.-Ang.",
    "special-defense": "Sp.-Vert.",
    speed: "Initiative",
  } as Record<string, string>,
  factCapture: (rate: number) =>
    `Seine Fangrate beträgt ${rate}/255: ${
      rate <= 45
        ? "eines der am schwersten zu fangenden Pokémon"
        : rate >= 190
          ? "es landet in fast jedem Pokéball"
          : "eine moderate Herausforderung mit dem richtigen Pokéball"
    }.`,
  factHabitat: (habitat: string) =>
    `In Kanto wurde es vor allem in einem Habitat vom Typ ${habitat} gesichtet.`,
  factGenderless: "Kein Geschlecht bekannt: eine geschlechtslose Spezies.",
  factAllFemale: "Alle bekannten Exemplare sind weiblich.",
  factAllMale: "Alle bekannten Exemplare sind männlich.",
  factBaseExp: (xp: number) =>
    `Ein Sieg über dieses Pokémon bringt ${xp} Basis-Erfahrungspunkte.`,

  // Team builder CTA banner
  teamOpenBuilderAria: (count: number, size: number) =>
    `Team-Builder öffnen (${count} von ${size} Plätzen belegt)`,
  teamTitle: "MEIN TEAM",
  teamProBadge: "PRO",
  teamTagline: "Abdeckung · Analyse · KI-Coach",
  teamClearAria: "Team leeren",
  teamClear: "Leeren",
  teamOpen: "Öffnen",
  teamOpenAria: "Team-Builder öffnen",

  // Battle mode CTA banner
  battleAria: (count: number, size: number) =>
    `KI-Kampfmodus betreten (${count} von ${size} Mitgliedern in deinem Team)`,
  battleTitle: "KI-KAMPF",
  battleEliteBadge: "ELITE",
  battleTagline: "3D-Arena · KI-Rivale · Rundenbasiert",
  battleTeamCount: (count: number, size: number) => `Team ${count}/${size}`,
  battleFight: "Kämpfen",

  // Comparator CTA banner
  compareAria: "Den KI-Pokémon-Vergleich öffnen",
  compareTitle: "KI-VERGLEICH",
  compareBadge: "KI",
  compareTagline: "Doppel-Radar · Typvorteil · KI-Urteil",
  compareDuel: "Direktvergleich",
  compareOpen: "Vergleichen",

  // Soundtrack player
  playerGroupAria: "Musikplayer",
  openPlayerAria: "Musikplayer öffnen",
  openPlayerTitle: "Player anzeigen",
  muteAria: "Stummschalten",
  unmuteAria: "Ton einschalten",
  volumeAria: "Lautstärke",
  bgmTitle: "BGM · Soundtrack",
  minimizeAria: "Player minimieren",
  loadingSoundtrack: "Soundtrack wird geladen…",
  mutedHint: "Stumm — tippe auf den Lautsprecher, um zuzuhören.",
  minimizeHint: "Minimiere das Panel, die Musik läuft weiter.",
};

const it: typeof es = {
  // Daily banner
  dailyTitle: "Pokémon del giorno",
  funFact: "Curiosità",
  starStat: "Statistica di punta",
  viewEntry: "Apri la scheda",
  artworkAlt: (name: string) => `Illustrazione di ${name}`,
  skeletonTuning: "Sintonizzazione sul Pokémon del giorno…",
  statLabels: {
    hp: "PS",
    attack: "Attacco",
    defense: "Difesa",
    "special-attack": "Att. Sp.",
    "special-defense": "Dif. Sp.",
    speed: "Velocità",
  } as Record<string, string>,
  factCapture: (rate: number) =>
    `Il suo tasso di cattura è ${rate}/255: ${
      rate <= 45
        ? "tra i più difficili da catturare"
        : rate >= 190
          ? "entra in quasi qualsiasi Poké Ball"
          : "una sfida moderata con la Poké Ball giusta"
    }.`,
  factHabitat: (habitat: string) =>
    `A Kanto veniva avvistato soprattutto in habitat di tipo ${habitat}.`,
  factGenderless: "Non ha genere conosciuto: è una specie asessuata.",
  factAllFemale: "Tutti gli esemplari conosciuti sono femmine.",
  factAllMale: "Tutti gli esemplari conosciuti sono maschi.",
  factBaseExp: (xp: number) =>
    `Sconfiggerlo fa guadagnare ${xp} punti esperienza base.`,

  // Team builder CTA banner
  teamOpenBuilderAria: (count: number, size: number) =>
    `Apri il costruttore di squadre (${count} di ${size} slot occupati)`,
  teamTitle: "LA MIA SQUADRA",
  teamProBadge: "PRO",
  teamTagline: "Copertura · Analisi · Coach IA",
  teamClearAria: "Svuota la squadra",
  teamClear: "Svuota",
  teamOpen: "Apri",
  teamOpenAria: "Apri il costruttore di squadre",

  // Battle mode CTA banner
  battleAria: (count: number, size: number) =>
    `Entra in Modalità Lotta contro l'IA (${count} di ${size} membri in squadra)`,
  battleTitle: "LOTTA IA",
  battleEliteBadge: "ELITE",
  battleTagline: "Arena 3D · Rivale IA · A turni",
  battleTeamCount: (count: number, size: number) => `Squadra ${count}/${size}`,
  battleFight: "Lotta",

  // Comparator CTA banner
  compareAria: "Apri il Comparatore di Pokémon IA",
  compareTitle: "COMPARATORE IA",
  compareBadge: "IA",
  compareTagline: "Radar doppio · Vantaggio di tipo · Verdetto IA",
  compareDuel: "Faccia a faccia",
  compareOpen: "Confronta",

  // Soundtrack player
  playerGroupAria: "Lettore musicale",
  openPlayerAria: "Apri il lettore musicale",
  openPlayerTitle: "Mostra il lettore",
  muteAria: "Silenzia",
  unmuteAria: "Riattiva l'audio",
  volumeAria: "Volume",
  bgmTitle: "BGM · Colonna sonora",
  minimizeAria: "Riduci il lettore",
  loadingSoundtrack: "Caricamento colonna sonora…",
  mutedHint: "Audio disattivato — tocca l'altoparlante per ascoltare.",
  minimizeHint: "Riduci il pannello: la musica continuerà a suonare.",
};

const ja: typeof es = {
  // Daily banner
  dailyTitle: "今日のポケモン",
  funFact: "豆知識",
  starStat: "注目のステータス",
  viewEntry: "詳細を見る",
  artworkAlt: (name: string) => `${name}のイラスト`,
  skeletonTuning: "今日のポケモンを受信中…",
  statLabels: {
    hp: "HP",
    attack: "こうげき",
    defense: "ぼうぎょ",
    "special-attack": "とくこう",
    "special-defense": "とくぼう",
    speed: "すばやさ",
  } as Record<string, string>,
  factCapture: (rate: number) =>
    `捕捉率は${rate}/255：${
      rate <= 45
        ? "最も捕まえにくい部類"
        : rate >= 190
          ? "ほぼどのモンスターボールでも捕まる"
          : "適切なボールなら程よい挑戦"
    }。`,
  factHabitat: (habitat: string) =>
    `カントー地方では主に${habitat}の生息地で目撃されていた。`,
  factGenderless: "性別は不明。無性別の種族だ。",
  factAllFemale: "確認されている個体はすべてメスだ。",
  factAllMale: "確認されている個体はすべてオスだ。",
  factBaseExp: (xp: number) => `倒すと基礎経験値${xp}ポイントを得られる。`,

  // Team builder CTA banner
  teamOpenBuilderAria: (count: number, size: number) =>
    `チームビルダーを開く（${size}枠中${count}枠使用）`,
  teamTitle: "マイチーム",
  teamProBadge: "PRO",
  teamTagline: "相性カバー · 分析 · AIコーチ",
  teamClearAria: "チームを空にする",
  teamClear: "クリア",
  teamOpen: "開く",
  teamOpenAria: "チームビルダーを開く",

  // Battle mode CTA banner
  battleAria: (count: number, size: number) =>
    `AIバトルモードに入る（手持ち${count}/${size}匹）`,
  battleTitle: "AIバトル",
  battleEliteBadge: "ELITE",
  battleTagline: "3Dアリーナ · AIライバル · ターン制",
  battleTeamCount: (count: number, size: number) =>
    `手持ち ${count}/${size}`,
  battleFight: "たたかう",

  // Comparator CTA banner
  compareAria: "AIポケモン比較ツールを開く",
  compareTitle: "AI比較",
  compareBadge: "AI",
  compareTagline: "デュアルレーダー · タイプ相性 · AI判定",
  compareDuel: "直接対決",
  compareOpen: "比較する",

  // Soundtrack player
  playerGroupAria: "ミュージックプレイヤー",
  openPlayerAria: "ミュージックプレイヤーを開く",
  openPlayerTitle: "プレイヤーを表示",
  muteAria: "ミュート",
  unmuteAria: "ミュート解除",
  volumeAria: "音量",
  bgmTitle: "BGM · サウンドトラック",
  minimizeAria: "プレイヤーを最小化",
  loadingSoundtrack: "サウンドトラックを読み込み中…",
  mutedHint: "ミュート中 — スピーカーをタップすると聴けます。",
  minimizeHint: "パネルを最小化しても音楽は流れ続けます。",
};

const ko: typeof es = {
  // Daily banner
  dailyTitle: "오늘의 포켓몬",
  funFact: "토막 상식",
  starStat: "대표 능력치",
  viewEntry: "상세 보기",
  artworkAlt: (name: string) => `${name}의 일러스트`,
  skeletonTuning: "오늘의 포켓몬 수신 중…",
  statLabels: {
    hp: "HP",
    attack: "공격",
    defense: "방어",
    "special-attack": "특수공격",
    "special-defense": "특수방어",
    speed: "스피드",
  } as Record<string, string>,
  factCapture: (rate: number) =>
    `포획률은 ${rate}/255로, ${
      rate <= 45
        ? "가장 잡기 어려운 축에 든다"
        : rate >= 190
          ? "거의 아무 몬스터볼에나 들어간다"
          : "알맞은 몬스터볼이면 무난히 도전할 만하다"
    }.`,
  factHabitat: (habitat: string) =>
    `관동지방에서는 주로 ${habitat} 서식지에서 목격되었다.`,
  factGenderless: "성별이 알려지지 않은 무성별 종이다.",
  factAllFemale: "알려진 개체는 모두 암컷이다.",
  factAllMale: "알려진 개체는 모두 수컷이다.",
  factBaseExp: (xp: number) =>
    `쓰러뜨리면 기초 경험치 ${xp}포인트를 얻는다.`,

  // Team builder CTA banner
  teamOpenBuilderAria: (count: number, size: number) =>
    `팀 빌더 열기 (${size}칸 중 ${count}칸 사용 중)`,
  teamTitle: "내 팀",
  teamProBadge: "PRO",
  teamTagline: "상성 커버 · 분석 · AI 코치",
  teamClearAria: "팀 비우기",
  teamClear: "비우기",
  teamOpen: "열기",
  teamOpenAria: "팀 빌더 열기",

  // Battle mode CTA banner
  battleAria: (count: number, size: number) =>
    `AI 배틀 모드 입장 (팀 ${count}/${size}마리)`,
  battleTitle: "AI 배틀",
  battleEliteBadge: "ELITE",
  battleTagline: "3D 아레나 · AI 라이벌 · 턴제",
  battleTeamCount: (count: number, size: number) => `팀 ${count}/${size}`,
  battleFight: "싸운다",

  // Comparator CTA banner
  compareAria: "AI 포켓몬 비교기 열기",
  compareTitle: "AI 비교기",
  compareBadge: "AI",
  compareTagline: "듀얼 레이더 · 타입 상성 · AI 판정",
  compareDuel: "정면 대결",
  compareOpen: "비교하기",

  // Soundtrack player
  playerGroupAria: "음악 플레이어",
  openPlayerAria: "음악 플레이어 열기",
  openPlayerTitle: "플레이어 표시",
  muteAria: "음소거",
  unmuteAria: "음소거 해제",
  volumeAria: "볼륨",
  bgmTitle: "BGM · 사운드트랙",
  minimizeAria: "플레이어 최소화",
  loadingSoundtrack: "사운드트랙 로딩 중…",
  mutedHint: "음소거 상태 — 스피커를 누르면 들을 수 있어요.",
  minimizeHint: "패널을 최소화해도 음악은 계속 재생돼요.",
};

const zhHans: typeof es = {
  // Daily banner
  dailyTitle: "每日宝可梦",
  funFact: "冷知识",
  starStat: "明星能力",
  viewEntry: "查看图鉴",
  artworkAlt: (name: string) => `${name}的插画`,
  skeletonTuning: "正在接收每日宝可梦…",
  statLabels: {
    hp: "HP",
    attack: "攻击",
    defense: "防御",
    "special-attack": "特攻",
    "special-defense": "特防",
    speed: "速度",
  } as Record<string, string>,
  factCapture: (rate: number) =>
    `它的捕获率为 ${rate}/255：${
      rate <= 45
        ? "属于最难捕捉的一类"
        : rate >= 190
          ? "几乎任何精灵球都能收服它"
          : "用对精灵球就是适中的挑战"
    }。`,
  factHabitat: (habitat: string) =>
    `在关都地区，它主要出没于${habitat}类栖息地。`,
  factGenderless: "性别不明：这是无性别的物种。",
  factAllFemale: "已知个体全部为雌性。",
  factAllMale: "已知个体全部为雄性。",
  factBaseExp: (xp: number) => `打败它可获得 ${xp} 点基础经验值。`,

  // Team builder CTA banner
  teamOpenBuilderAria: (count: number, size: number) =>
    `打开队伍编成（已占用 ${count}/${size} 个位置）`,
  teamTitle: "我的队伍",
  teamProBadge: "PRO",
  teamTagline: "属性覆盖 · 分析 · AI教练",
  teamClearAria: "清空队伍",
  teamClear: "清空",
  teamOpen: "打开",
  teamOpenAria: "打开队伍编成",

  // Battle mode CTA banner
  battleAria: (count: number, size: number) =>
    `进入AI对战模式（队伍中有 ${count}/${size} 只宝可梦）`,
  battleTitle: "AI对战",
  battleEliteBadge: "ELITE",
  battleTagline: "3D竞技场 · AI对手 · 回合制",
  battleTeamCount: (count: number, size: number) => `队伍 ${count}/${size}`,
  battleFight: "战斗",

  // Comparator CTA banner
  compareAria: "打开AI宝可梦对比器",
  compareTitle: "AI对比",
  compareBadge: "AI",
  compareTagline: "双雷达 · 属性克制 · AI裁定",
  compareDuel: "正面对决",
  compareOpen: "对比",

  // Soundtrack player
  playerGroupAria: "音乐播放器",
  openPlayerAria: "打开音乐播放器",
  openPlayerTitle: "显示播放器",
  muteAria: "静音",
  unmuteAria: "取消静音",
  volumeAria: "音量",
  bgmTitle: "BGM · 原声音乐",
  minimizeAria: "最小化播放器",
  loadingSoundtrack: "正在加载原声音乐…",
  mutedHint: "已静音 — 点按喇叭即可收听。",
  minimizeHint: "最小化面板后音乐仍会继续播放。",
};

const zhHant: typeof es = {
  // Daily banner
  dailyTitle: "每日寶可夢",
  funFact: "冷知識",
  starStat: "明星能力",
  viewEntry: "查看圖鑑",
  artworkAlt: (name: string) => `${name}的插畫`,
  skeletonTuning: "正在接收每日寶可夢…",
  statLabels: {
    hp: "HP",
    attack: "攻擊",
    defense: "防禦",
    "special-attack": "特攻",
    "special-defense": "特防",
    speed: "速度",
  } as Record<string, string>,
  factCapture: (rate: number) =>
    `牠的捕獲率為 ${rate}/255：${
      rate <= 45
        ? "屬於最難捕捉的一類"
        : rate >= 190
          ? "幾乎任何精靈球都能收服牠"
          : "用對精靈球就是適中的挑戰"
    }。`,
  factHabitat: (habitat: string) =>
    `在關都地區，牠主要出沒於${habitat}類棲息地。`,
  factGenderless: "性別不明：這是無性別的物種。",
  factAllFemale: "已知個體全部為雌性。",
  factAllMale: "已知個體全部為雄性。",
  factBaseExp: (xp: number) => `打敗牠可獲得 ${xp} 點基礎經驗值。`,

  // Team builder CTA banner
  teamOpenBuilderAria: (count: number, size: number) =>
    `開啟隊伍編成（已使用 ${count}/${size} 個欄位）`,
  teamTitle: "我的隊伍",
  teamProBadge: "PRO",
  teamTagline: "屬性覆蓋 · 分析 · AI教練",
  teamClearAria: "清空隊伍",
  teamClear: "清空",
  teamOpen: "開啟",
  teamOpenAria: "開啟隊伍編成",

  // Battle mode CTA banner
  battleAria: (count: number, size: number) =>
    `進入AI對戰模式（隊伍中有 ${count}/${size} 隻寶可夢）`,
  battleTitle: "AI對戰",
  battleEliteBadge: "ELITE",
  battleTagline: "3D競技場 · AI對手 · 回合制",
  battleTeamCount: (count: number, size: number) => `隊伍 ${count}/${size}`,
  battleFight: "戰鬥",

  // Comparator CTA banner
  compareAria: "開啟AI寶可夢對比器",
  compareTitle: "AI對比",
  compareBadge: "AI",
  compareTagline: "雙雷達 · 屬性克制 · AI裁定",
  compareDuel: "正面對決",
  compareOpen: "對比",

  // Soundtrack player
  playerGroupAria: "音樂播放器",
  openPlayerAria: "開啟音樂播放器",
  openPlayerTitle: "顯示播放器",
  muteAria: "靜音",
  unmuteAria: "取消靜音",
  volumeAria: "音量",
  bgmTitle: "BGM · 原聲音樂",
  minimizeAria: "最小化播放器",
  loadingSoundtrack: "正在載入原聲音樂…",
  mutedHint: "已靜音 — 點按喇叭即可聆聽。",
  minimizeHint: "最小化面板後音樂仍會繼續播放。",
};

export const homeDict: Record<Lang, typeof es> = {
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

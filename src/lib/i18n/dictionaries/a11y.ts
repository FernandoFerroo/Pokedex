import type { Lang } from "../config";

/**
 * Strings that exist purely for assistive technology: skip link, live-region
 * labels, progress-bar readouts, keyboard hints and descriptive alt text.
 *
 * They live in their own bundle (instead of being sprinkled across the
 * layout/detail/battle dictionaries) so the accessibility layer can be
 * audited — and translated — in one place.
 */
const es = {
  // Bypass blocks (WCAG 2.4.1)
  skipToContent: "Saltar al contenido principal",

  // Alt text
  artOf: (name: string) => `Ilustración oficial de ${name}`,
  shinyArtOf: (name: string) => `Ilustración oficial de ${name} variocolor`,
  model3dOf: (name: string) =>
    `Modelo 3D interactivo de ${name}; arrastra para girarlo`,
  battleSpriteOf: (name: string, facing: "front" | "back") =>
    facing === "back"
      ? `Sprite de ${name} de espaldas en posición de combate`
      : `Sprite de ${name} de frente en posición de combate`,
  rivalPortraitOf: (name: string) => `Retrato del entrenador rival ${name}`,
  rivalTrainerOnField: (name: string) =>
    `${name}, el entrenador rival, de pie junto a su Pokémon`,

  // Battle: regions and live areas
  battleTitle: "Simulador de combate Pokémon",
  battleLogAria: "Registro de combate",
  dialogueAria: (name: string) => `Diálogo de ${name}`,
  databoxAria: (name: string, side: "player" | "enemy") =>
    side === "player"
      ? `Datos de tu ${name}`
      : `Datos de ${name}, el Pokémon rival`,

  // Battle: HP + team status
  hpBarAria: (name: string) => `Puntos de salud de ${name}`,
  hpValueText: (hp: number, maxHp: number) => `${hp} de ${maxHp} PS`,
  teamPipsAria: (alive: number, total: number) =>
    `Pokémon en condiciones de combatir: ${alive} de ${total}`,
  genderMale: "Macho",
  genderFemale: "Hembra",

  // Battle: keyboard-driven menus
  keyboardHint: "Flechas o WASD para elegir · Enter o Espacio para confirmar",
  actionsMenuAria: "Acciones de combate",
  movesMenuAria: "Movimientos disponibles",
  bagMenuAria: "Objetos de la mochila",
  partyMenuAria: "Tu equipo Pokémon",
  /** Full spoken description of a move pill. */
  moveOptionAria: (
    label: string,
    type: string,
    pp: number,
    maxPp: number,
    hint: string | null,
  ) =>
    `${label}, tipo ${type}, ${pp} de ${maxPp} PP${hint ? `, ${hint}` : ""}`,
  moveNoPp: "sin PP restantes",

  // Battle: dialogs
  introDialogAria: "Presentación del entrenador rival",
  fleeDialogAria: "Confirmar la huida del combate",
  resultDialogAria: "Resultado del combate",
  partyDialogAria: "Cambiar de Pokémon",

  // Pokédex + team chrome
  chatLogAria: "Conversación con el Profesor Oak",
  openChatAria: "Abrir el chat con el Profesor Oak",
  playerPanelAria: "Panel del reproductor de música",
  volumeValueText: (volume: number) => `Volumen al ${volume} por ciento`,
  learnMethodPanelAria: "Lista de movimientos",
};

const en: typeof es = {
  skipToContent: "Skip to main content",

  artOf: (name: string) => `Official artwork of ${name}`,
  shinyArtOf: (name: string) => `Official artwork of shiny ${name}`,
  model3dOf: (name: string) =>
    `Interactive 3D model of ${name}; drag to rotate it`,
  battleSpriteOf: (name: string, facing: "front" | "back") =>
    facing === "back"
      ? `Back sprite of ${name} in battle stance`
      : `Front sprite of ${name} in battle stance`,
  rivalPortraitOf: (name: string) => `Portrait of the rival trainer ${name}`,
  rivalTrainerOnField: (name: string) =>
    `${name}, the rival trainer, standing beside their Pokémon`,

  battleTitle: "Pokémon battle simulator",
  battleLogAria: "Battle log",
  dialogueAria: (name: string) => `${name}'s dialogue`,
  databoxAria: (name: string, side: "player" | "enemy") =>
    side === "player" ? `Your ${name}'s data` : `Data for the opposing ${name}`,

  hpBarAria: (name: string) => `${name}'s hit points`,
  hpValueText: (hp: number, maxHp: number) => `${hp} of ${maxHp} HP`,
  teamPipsAria: (alive: number, total: number) =>
    `Pokémon still able to battle: ${alive} of ${total}`,
  genderMale: "Male",
  genderFemale: "Female",

  keyboardHint: "Arrow keys or WASD to choose · Enter or Space to confirm",
  actionsMenuAria: "Battle actions",
  movesMenuAria: "Available moves",
  bagMenuAria: "Bag items",
  partyMenuAria: "Your Pokémon party",
  moveOptionAria: (label, type, pp, maxPp, hint) =>
    `${label}, ${type} type, ${pp} of ${maxPp} PP${hint ? `, ${hint}` : ""}`,
  moveNoPp: "no PP left",

  introDialogAria: "Rival trainer introduction",
  fleeDialogAria: "Confirm fleeing the battle",
  resultDialogAria: "Battle result",
  partyDialogAria: "Switch Pokémon",

  chatLogAria: "Conversation with Professor Oak",
  openChatAria: "Open the chat with Professor Oak",
  playerPanelAria: "Music player panel",
  volumeValueText: (volume: number) => `Volume at ${volume} percent`,
  learnMethodPanelAria: "Move list",
};

const fr: typeof es = {
  skipToContent: "Aller au contenu principal",

  artOf: (name: string) => `Illustration officielle de ${name}`,
  shinyArtOf: (name: string) =>
    `Illustration officielle de ${name} chromatique`,
  model3dOf: (name: string) =>
    `Modèle 3D interactif de ${name} ; fais glisser pour le faire pivoter`,
  battleSpriteOf: (name: string, facing: "front" | "back") =>
    facing === "back"
      ? `Sprite de dos de ${name} en position de combat`
      : `Sprite de face de ${name} en position de combat`,
  rivalPortraitOf: (name: string) => `Portrait du dresseur rival ${name}`,
  rivalTrainerOnField: (name: string) =>
    `${name}, le dresseur rival, debout à côté de son Pokémon`,

  battleTitle: "Simulateur de combat Pokémon",
  battleLogAria: "Journal du combat",
  dialogueAria: (name: string) => `Dialogue de ${name}`,
  databoxAria: (name: string, side: "player" | "enemy") =>
    side === "player"
      ? `Données de ton ${name}`
      : `Données de ${name}, le Pokémon rival`,

  hpBarAria: (name: string) => `Points de vie de ${name}`,
  hpValueText: (hp: number, maxHp: number) => `${hp} sur ${maxHp} PV`,
  teamPipsAria: (alive: number, total: number) =>
    `Pokémon encore en état de combattre : ${alive} sur ${total}`,
  genderMale: "Mâle",
  genderFemale: "Femelle",

  keyboardHint:
    "Flèches ou WASD pour choisir · Entrée ou Espace pour confirmer",
  actionsMenuAria: "Actions de combat",
  movesMenuAria: "Capacités disponibles",
  bagMenuAria: "Objets du sac",
  partyMenuAria: "Ton équipe Pokémon",
  moveOptionAria: (label, type, pp, maxPp, hint) =>
    `${label}, type ${type}, ${pp} sur ${maxPp} PP${hint ? `, ${hint}` : ""}`,
  moveNoPp: "plus de PP",

  introDialogAria: "Présentation du dresseur rival",
  fleeDialogAria: "Confirmer la fuite du combat",
  resultDialogAria: "Résultat du combat",
  partyDialogAria: "Changer de Pokémon",

  chatLogAria: "Conversation avec le Professeur Chen",
  openChatAria: "Ouvrir le chat avec le Professeur Chen",
  playerPanelAria: "Panneau du lecteur de musique",
  volumeValueText: (volume: number) => `Volume à ${volume} pour cent`,
  learnMethodPanelAria: "Liste des capacités",
};

const de: typeof es = {
  skipToContent: "Zum Hauptinhalt springen",

  artOf: (name: string) => `Offizielles Artwork von ${name}`,
  shinyArtOf: (name: string) =>
    `Offizielles Artwork von ${name} in schillernder Form`,
  model3dOf: (name: string) =>
    `Interaktives 3D-Modell von ${name}; zum Drehen ziehen`,
  battleSpriteOf: (name: string, facing: "front" | "back") =>
    facing === "back"
      ? `Rückansicht von ${name} in Kampfstellung`
      : `Vorderansicht von ${name} in Kampfstellung`,
  rivalPortraitOf: (name: string) => `Porträt des rivalisierenden Trainers ${name}`,
  rivalTrainerOnField: (name: string) =>
    `${name}, der gegnerische Trainer, steht neben seinem Pokémon`,

  battleTitle: "Pokémon-Kampfsimulator",
  battleLogAria: "Kampfprotokoll",
  dialogueAria: (name: string) => `Dialog von ${name}`,
  databoxAria: (name: string, side: "player" | "enemy") =>
    side === "player"
      ? `Daten deines ${name}`
      : `Daten des gegnerischen ${name}`,

  hpBarAria: (name: string) => `Kraftpunkte von ${name}`,
  hpValueText: (hp: number, maxHp: number) => `${hp} von ${maxHp} KP`,
  teamPipsAria: (alive: number, total: number) =>
    `Noch kampffähige Pokémon: ${alive} von ${total}`,
  genderMale: "Männlich",
  genderFemale: "Weiblich",

  keyboardHint:
    "Pfeiltasten oder WASD zum Auswählen · Enter oder Leertaste zum Bestätigen",
  actionsMenuAria: "Kampfaktionen",
  movesMenuAria: "Verfügbare Attacken",
  bagMenuAria: "Items im Beutel",
  partyMenuAria: "Dein Pokémon-Team",
  moveOptionAria: (label, type, pp, maxPp, hint) =>
    `${label}, Typ ${type}, ${pp} von ${maxPp} AP${hint ? `, ${hint}` : ""}`,
  moveNoPp: "keine AP mehr",

  introDialogAria: "Vorstellung des rivalisierenden Trainers",
  fleeDialogAria: "Flucht aus dem Kampf bestätigen",
  resultDialogAria: "Kampfergebnis",
  partyDialogAria: "Pokémon wechseln",

  chatLogAria: "Unterhaltung mit Professor Eich",
  openChatAria: "Chat mit Professor Eich öffnen",
  playerPanelAria: "Musikplayer-Panel",
  volumeValueText: (volume: number) => `Lautstärke bei ${volume} Prozent`,
  learnMethodPanelAria: "Attackenliste",
};

const it: typeof es = {
  skipToContent: "Vai al contenuto principale",

  artOf: (name: string) => `Illustrazione ufficiale di ${name}`,
  shinyArtOf: (name: string) =>
    `Illustrazione ufficiale di ${name} cromatico`,
  model3dOf: (name: string) =>
    `Modello 3D interattivo di ${name}; trascina per ruotarlo`,
  battleSpriteOf: (name: string, facing: "front" | "back") =>
    facing === "back"
      ? `Sprite di ${name} di spalle in posizione di lotta`
      : `Sprite di ${name} di fronte in posizione di lotta`,
  rivalPortraitOf: (name: string) => `Ritratto dell'allenatore rivale ${name}`,
  rivalTrainerOnField: (name: string) =>
    `${name}, l'allenatore rivale, in piedi accanto al suo Pokémon`,

  battleTitle: "Simulatore di lotta Pokémon",
  battleLogAria: "Registro della lotta",
  dialogueAria: (name: string) => `Dialogo di ${name}`,
  databoxAria: (name: string, side: "player" | "enemy") =>
    side === "player"
      ? `Dati del tuo ${name}`
      : `Dati di ${name}, il Pokémon rivale`,

  hpBarAria: (name: string) => `Punti salute di ${name}`,
  hpValueText: (hp: number, maxHp: number) => `${hp} su ${maxHp} PS`,
  teamPipsAria: (alive: number, total: number) =>
    `Pokémon ancora in grado di lottare: ${alive} su ${total}`,
  genderMale: "Maschio",
  genderFemale: "Femmina",

  keyboardHint:
    "Frecce o WASD per scegliere · Invio o Spazio per confermare",
  actionsMenuAria: "Azioni di lotta",
  movesMenuAria: "Mosse disponibili",
  bagMenuAria: "Strumenti nella borsa",
  partyMenuAria: "La tua squadra Pokémon",
  moveOptionAria: (label, type, pp, maxPp, hint) =>
    `${label}, tipo ${type}, ${pp} su ${maxPp} PP${hint ? `, ${hint}` : ""}`,
  moveNoPp: "PP esauriti",

  introDialogAria: "Presentazione dell'allenatore rivale",
  fleeDialogAria: "Conferma la fuga dalla lotta",
  resultDialogAria: "Risultato della lotta",
  partyDialogAria: "Cambia Pokémon",

  chatLogAria: "Conversazione con il Professor Oak",
  openChatAria: "Apri la chat con il Professor Oak",
  playerPanelAria: "Pannello del lettore musicale",
  volumeValueText: (volume: number) => `Volume al ${volume} per cento`,
  learnMethodPanelAria: "Elenco delle mosse",
};

const ja: typeof es = {
  skipToContent: "メインコンテンツへスキップ",

  artOf: (name: string) => `${name}の公式イラスト`,
  shinyArtOf: (name: string) => `色違いの${name}の公式イラスト`,
  model3dOf: (name: string) =>
    `${name}のインタラクティブな3Dモデル。ドラッグで回転できます`,
  battleSpriteOf: (name: string, facing: "front" | "back") =>
    facing === "back"
      ? `戦闘中の${name}の後ろ姿のスプライト`
      : `戦闘中の${name}の正面のスプライト`,
  rivalPortraitOf: (name: string) => `ライバルトレーナー${name}の肖像`,
  rivalTrainerOnField: (name: string) =>
    `ポケモンの隣に立つライバルトレーナー${name}`,

  battleTitle: "ポケモンバトルシミュレーター",
  battleLogAria: "バトルログ",
  dialogueAria: (name: string) => `${name}のセリフ`,
  databoxAria: (name: string, side: "player" | "enemy") =>
    side === "player" ? `手持ちの${name}のデータ` : `相手の${name}のデータ`,

  hpBarAria: (name: string) => `${name}のHP`,
  hpValueText: (hp: number, maxHp: number) => `HP ${maxHp}中${hp}`,
  teamPipsAria: (alive: number, total: number) =>
    `戦えるポケモン：${total}匹中${alive}匹`,
  genderMale: "オス",
  genderFemale: "メス",

  keyboardHint: "矢印キーまたはWASDで選択 · EnterまたはSpaceで決定",
  actionsMenuAria: "バトルの行動",
  movesMenuAria: "使えるわざ",
  bagMenuAria: "バッグの道具",
  partyMenuAria: "手持ちポケモン",
  moveOptionAria: (label, type, pp, maxPp, hint) =>
    `${label}、${type}タイプ、PP ${maxPp}中${pp}${hint ? `、${hint}` : ""}`,
  moveNoPp: "PPが残っていません",

  introDialogAria: "ライバルトレーナーの紹介",
  fleeDialogAria: "バトルから逃げる確認",
  resultDialogAria: "バトルの結果",
  partyDialogAria: "ポケモンを交代",

  chatLogAria: "オーキド博士との会話",
  openChatAria: "オーキド博士とのチャットを開く",
  playerPanelAria: "音楽プレーヤーのパネル",
  volumeValueText: (volume: number) => `音量${volume}パーセント`,
  learnMethodPanelAria: "わざのリスト",
};

const ko: typeof es = {
  skipToContent: "본문으로 건너뛰기",

  artOf: (name: string) => `${name}의 공식 일러스트`,
  shinyArtOf: (name: string) => `색이 다른 ${name}의 공식 일러스트`,
  model3dOf: (name: string) =>
    `${name}의 인터랙티브 3D 모델. 드래그해서 회전할 수 있습니다`,
  battleSpriteOf: (name: string, facing: "front" | "back") =>
    facing === "back"
      ? `배틀 자세를 취한 ${name}의 뒷모습 스프라이트`
      : `배틀 자세를 취한 ${name}의 앞모습 스프라이트`,
  rivalPortraitOf: (name: string) => `라이벌 트레이너 ${name}의 초상`,
  rivalTrainerOnField: (name: string) =>
    `포켓몬 옆에 서 있는 라이벌 트레이너 ${name}`,

  battleTitle: "포켓몬 배틀 시뮬레이터",
  battleLogAria: "배틀 기록",
  dialogueAria: (name: string) => `${name}의 대사`,
  databoxAria: (name: string, side: "player" | "enemy") =>
    side === "player" ? `내 ${name}의 정보` : `상대 ${name}의 정보`,

  hpBarAria: (name: string) => `${name}의 HP`,
  hpValueText: (hp: number, maxHp: number) => `HP ${maxHp} 중 ${hp}`,
  teamPipsAria: (alive: number, total: number) =>
    `싸울 수 있는 포켓몬: ${total}마리 중 ${alive}마리`,
  genderMale: "수컷",
  genderFemale: "암컷",

  keyboardHint: "방향키 또는 WASD로 선택 · Enter 또는 Space로 확인",
  actionsMenuAria: "배틀 행동",
  movesMenuAria: "사용할 수 있는 기술",
  bagMenuAria: "가방 속 도구",
  partyMenuAria: "내 포켓몬 파티",
  moveOptionAria: (label, type, pp, maxPp, hint) =>
    `${label}, ${type} 타입, PP ${maxPp} 중 ${pp}${hint ? `, ${hint}` : ""}`,
  moveNoPp: "남은 PP 없음",

  introDialogAria: "라이벌 트레이너 소개",
  fleeDialogAria: "배틀에서 도망칠지 확인",
  resultDialogAria: "배틀 결과",
  partyDialogAria: "포켓몬 교체",

  chatLogAria: "오박사와의 대화",
  openChatAria: "오박사와의 채팅 열기",
  playerPanelAria: "음악 플레이어 패널",
  volumeValueText: (volume: number) => `볼륨 ${volume}퍼센트`,
  learnMethodPanelAria: "기술 목록",
};

const zhHans: typeof es = {
  skipToContent: "跳到主要内容",

  artOf: (name: string) => `${name}的官方插画`,
  shinyArtOf: (name: string) => `异色${name}的官方插画`,
  model3dOf: (name: string) => `${name}的交互式3D模型，可拖动旋转`,
  battleSpriteOf: (name: string, facing: "front" | "back") =>
    facing === "back"
      ? `${name}在战斗姿态下的背面精灵图`
      : `${name}在战斗姿态下的正面精灵图`,
  rivalPortraitOf: (name: string) => `对手训练家${name}的肖像`,
  rivalTrainerOnField: (name: string) =>
    `站在宝可梦旁边的对手训练家${name}`,

  battleTitle: "宝可梦对战模拟器",
  battleLogAria: "对战记录",
  dialogueAria: (name: string) => `${name}的对话`,
  databoxAria: (name: string, side: "player" | "enemy") =>
    side === "player" ? `你的${name}的数据` : `对手${name}的数据`,

  hpBarAria: (name: string) => `${name}的HP`,
  hpValueText: (hp: number, maxHp: number) => `HP ${maxHp} 中的 ${hp}`,
  teamPipsAria: (alive: number, total: number) =>
    `还能战斗的宝可梦：${total}只中的${alive}只`,
  genderMale: "雄性",
  genderFemale: "雌性",

  keyboardHint: "方向键或WASD选择 · Enter或空格确认",
  actionsMenuAria: "对战指令",
  movesMenuAria: "可用招式",
  bagMenuAria: "背包道具",
  partyMenuAria: "你的宝可梦队伍",
  moveOptionAria: (label, type, pp, maxPp, hint) =>
    `${label}，${type}属性，PP ${maxPp} 中的 ${pp}${hint ? `，${hint}` : ""}`,
  moveNoPp: "PP已耗尽",

  introDialogAria: "对手训练家介绍",
  fleeDialogAria: "确认逃离对战",
  resultDialogAria: "对战结果",
  partyDialogAria: "更换宝可梦",

  chatLogAria: "与大木博士的对话",
  openChatAria: "打开与大木博士的聊天",
  playerPanelAria: "音乐播放器面板",
  volumeValueText: (volume: number) => `音量 ${volume}%`,
  learnMethodPanelAria: "招式列表",
};

const zhHant: typeof es = {
  skipToContent: "跳至主要內容",

  artOf: (name: string) => `${name}的官方插畫`,
  shinyArtOf: (name: string) => `異色${name}的官方插畫`,
  model3dOf: (name: string) => `${name}的互動式3D模型，可拖曳旋轉`,
  battleSpriteOf: (name: string, facing: "front" | "back") =>
    facing === "back"
      ? `${name}在戰鬥姿態下的背面精靈圖`
      : `${name}在戰鬥姿態下的正面精靈圖`,
  rivalPortraitOf: (name: string) => `對手訓練家${name}的肖像`,
  rivalTrainerOnField: (name: string) =>
    `站在寶可夢旁邊的對手訓練家${name}`,

  battleTitle: "寶可夢對戰模擬器",
  battleLogAria: "對戰記錄",
  dialogueAria: (name: string) => `${name}的對話`,
  databoxAria: (name: string, side: "player" | "enemy") =>
    side === "player" ? `你的${name}的資料` : `對手${name}的資料`,

  hpBarAria: (name: string) => `${name}的HP`,
  hpValueText: (hp: number, maxHp: number) => `HP ${maxHp} 中的 ${hp}`,
  teamPipsAria: (alive: number, total: number) =>
    `還能戰鬥的寶可夢：${total}隻中的${alive}隻`,
  genderMale: "雄性",
  genderFemale: "雌性",

  keyboardHint: "方向鍵或WASD選擇 · Enter或空白鍵確認",
  actionsMenuAria: "對戰指令",
  movesMenuAria: "可用招式",
  bagMenuAria: "背包道具",
  partyMenuAria: "你的寶可夢隊伍",
  moveOptionAria: (label, type, pp, maxPp, hint) =>
    `${label}，${type}屬性，PP ${maxPp} 中的 ${pp}${hint ? `，${hint}` : ""}`,
  moveNoPp: "PP已耗盡",

  introDialogAria: "對手訓練家介紹",
  fleeDialogAria: "確認逃離對戰",
  resultDialogAria: "對戰結果",
  partyDialogAria: "更換寶可夢",

  chatLogAria: "與大木博士的對話",
  openChatAria: "開啟與大木博士的聊天",
  playerPanelAria: "音樂播放器面板",
  volumeValueText: (volume: number) => `音量 ${volume}%`,
  learnMethodPanelAria: "招式列表",
};

export const a11yDict: Record<Lang, typeof es> = {
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

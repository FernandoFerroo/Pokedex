import type { Lang } from "../config";

/** Professor Oak trainer chat: launcher, panel, action chips and API errors. */
const es = {
  // Floating launcher
  launcherAria: "Hablar con el Profesor Oak",
  launcherTitle: "Habla con el Profesor Oak",
  launcherTagline: "Pregunta · Filtra · Explora",
  // Panel chrome
  panelAria: "Chat con el Profesor Oak",
  headerName: "PROFESOR OAK",
  headerRole: "Investigador Pokémon · Pueblo Paleta",
  closeAria: "Cerrar chat",
  typing: "EL PROFESOR ESTÁ ESCRIBIENDO…",
  inputPlaceholder: "Pregúntale al Profesor Oak…",
  inputAria: "Mensaje para el Profesor Oak",
  sendAria: "Enviar mensaje",
  // Conversation
  welcome:
    "¡Hola, joven entrenador! Soy el Profesor Oak, investigador Pokémon de Pueblo Paleta, y esta Pokédex es mi gran invento. Pregúntame lo que quieras del mundo Pokémon, o pídeme cosas como «enséñame los legendarios de Kanto» o «abre la ficha de Charizard». ¡La ciencia Pokémon nos espera!",
  suggestions: [
    "Enséñame los legendarios de Kanto",
    "Los de tipo eléctrico menos Pikachu y su familia",
    "Abre la ficha de Charizard",
    "Pon todo mi equipo a nivel 5",
  ],
  errorNoResponse:
    "El transmisor de la Pokédex no responde. ¡Inténtalo de nuevo!",
  errorConnection:
    "Se ha cortado la conexión con el laboratorio de Pueblo Paleta…",
  // Action chips under Oak's replies
  actionCleared: "Filtros limpiados",
  actionOpening: (name: string) => `Abriendo ficha: ${name}`,
  actionSearch: (q: string) => `búsqueda «${q}»`,
  actionType: (label: string) => `tipo ${label}`,
  actionGen: (gen: number) => `Gen ${gen}`,
  actionColor: (label: string) => `color ${label}`,
  actionHabitat: (label: string) => `hábitat ${label}`,
  actionShape: (label: string) => `forma ${label}`,
  actionEgg: (label: string) => `huevo ${label}`,
  actionStage: (stage: string) => `etapa ${stage}`,
  actionRemoved: "Filtros retirados",
  actionFiltersOnly: "Filtros",
  actionExclude: (list: string) => `sin ${list}`,
  actionExcludeFamily: (list: string) => `sin ${list} y su familia`,
  actionTeamCleared: "Equipo vaciado",
  actionTeamSet: (list: string) => `Equipo: ${list}`,
  actionMemberLevel: (name: string, level: number) => `${name} Nv.${level}`,
  actionOpenTeam: "Abriendo tu equipo",
  actionStartBattle: "Al Modo Combate",
  actionFilters: (list: string) => `Filtros: ${list}`,
  // Server (API route) messages
  errMissingKey: "Falta OPENAI_API_KEY en el servidor.",
  errBadJson: "JSON inválido.",
  errNoMessage: "Falta el mensaje.",
  errBadApiKey: "La API key de OpenAI no es válida o ha caducado.",
  errUpstream: "El transmisor de la Pokédex falló al contactar con la IA.",
  fallbackEmpty: "¡Uy! Me he quedado sin palabras… ¡inténtalo otra vez!",
  fallbackError: "¡Vaya! Algo salió mal.",
  // Coach report route (/api/coach)
  coachErrEmptyTeam: "El equipo está vacío: añade al menos un Pokémon.",
  coachErrUpstream: "El Coach Bot no pudo contactar con la IA. Inténtalo de nuevo.",
  coachErrUnreadable: "El Coach Bot devolvió un informe ilegible. Prueba otra vez.",
  // Team suggestion route (/api/team-suggest)
  suggestErrNoPrompt: "Describe el equipo que quieres.",
  suggestErrFailed:
    "El Coach Bot no supo montar ese equipo. Prueba a describirlo de otra forma.",
  suggestFallbackMotivo: "Equipo generado a partir de tu descripción.",
};

const en: typeof es = {
  // Floating launcher
  launcherAria: "Talk to Professor Oak",
  launcherTitle: "Talk to Professor Oak",
  launcherTagline: "Ask · Filter · Explore",
  // Panel chrome
  panelAria: "Chat with Professor Oak",
  headerName: "PROFESSOR OAK",
  headerRole: "Pokémon Researcher · Pallet Town",
  closeAria: "Close chat",
  typing: "THE PROFESSOR IS TYPING…",
  inputPlaceholder: "Ask Professor Oak…",
  inputAria: "Message for Professor Oak",
  sendAria: "Send message",
  // Conversation
  welcome:
    "Hello there, young Trainer! I'm Professor Oak, Pokémon researcher from Pallet Town, and this Pokédex is my greatest invention. Ask me anything about the Pokémon world, or try things like “show me the Legendary Pokémon of Kanto” or “open Charizard's entry”. Pokémon science awaits!",
  suggestions: [
    "Show me the Legendary Pokémon of Kanto",
    "Electric types except Pikachu and its family",
    "Open Charizard's entry",
    "Set my whole team to level 5",
  ],
  errorNoResponse: "The Pokédex transmitter isn't responding. Try again!",
  errorConnection: "The link to the Pallet Town lab has been cut off…",
  // Action chips under Oak's replies
  actionCleared: "Filters cleared",
  actionOpening: (name: string) => `Opening entry: ${name}`,
  actionSearch: (q: string) => `search “${q}”`,
  actionType: (label: string) => `${label} type`,
  actionGen: (gen: number) => `Gen ${gen}`,
  actionColor: (label: string) => `color ${label}`,
  actionHabitat: (label: string) => `habitat ${label}`,
  actionShape: (label: string) => `shape ${label}`,
  actionEgg: (label: string) => `${label} egg group`,
  actionStage: (stage: string) => `stage ${stage}`,
  actionRemoved: "Filters removed",
  actionFiltersOnly: "Filters",
  actionExclude: (list: string) => `without ${list}`,
  actionExcludeFamily: (list: string) => `without ${list} and its family`,
  actionTeamCleared: "Team cleared",
  actionTeamSet: (list: string) => `Team: ${list}`,
  actionMemberLevel: (name: string, level: number) => `${name} Lv.${level}`,
  actionOpenTeam: "Opening your team",
  actionStartBattle: "To Battle Mode",
  actionFilters: (list: string) => `Filters: ${list}`,
  // Server (API route) messages
  errMissingKey: "OPENAI_API_KEY is missing on the server.",
  errBadJson: "Invalid JSON.",
  errNoMessage: "Missing message.",
  errBadApiKey: "The OpenAI API key is invalid or has expired.",
  errUpstream: "The Pokédex transmitter failed to reach the AI.",
  fallbackEmpty: "Oh my! I'm at a loss for words… try again!",
  fallbackError: "Oh dear! Something went wrong.",
  // Coach report route (/api/coach)
  coachErrEmptyTeam: "The team is empty: add at least one Pokémon.",
  coachErrUpstream: "The Coach Bot couldn't reach the AI. Try again.",
  coachErrUnreadable: "The Coach Bot returned an unreadable report. Try again.",
  // Team suggestion route (/api/team-suggest)
  suggestErrNoPrompt: "Describe the team you want.",
  suggestErrFailed:
    "The Coach Bot couldn't put that team together. Try describing it another way.",
  suggestFallbackMotivo: "Team generated from your description.",
};

const fr: typeof es = {
  // Floating launcher
  launcherAria: "Parler au Professeur Chen",
  launcherTitle: "Parle au Professeur Chen",
  launcherTagline: "Demande · Filtre · Explore",
  // Panel chrome
  panelAria: "Discussion avec le Professeur Chen",
  headerName: "PROFESSEUR CHEN",
  headerRole: "Chercheur Pokémon · Bourg Palette",
  closeAria: "Fermer la discussion",
  typing: "LE PROFESSEUR ÉCRIT…",
  inputPlaceholder: "Pose ta question au Professeur Chen…",
  inputAria: "Message pour le Professeur Chen",
  sendAria: "Envoyer le message",
  // Conversation
  welcome:
    "Bonjour, jeune Dresseur ! Je suis le Professeur Chen, chercheur Pokémon du Bourg Palette, et ce Pokédex est ma plus grande invention. Pose-moi toutes tes questions sur le monde Pokémon, ou essaie des choses comme « montre-moi les Pokémon légendaires de Kanto » ou « ouvre la fiche de Dracaufeu ». La science Pokémon nous attend !",
  suggestions: [
    "Montre-moi les Pokémon légendaires de Kanto",
    "Les types Électrik sauf Pikachu et sa famille",
    "Ouvre la fiche de Dracaufeu",
    "Mets toute mon équipe au niveau 5",
  ],
  errorNoResponse: "Le transmetteur du Pokédex ne répond pas. Réessaie !",
  errorConnection:
    "La liaison avec le laboratoire du Bourg Palette a été coupée…",
  // Action chips under Oak's replies
  actionCleared: "Filtres effacés",
  actionOpening: (name: string) => `Ouverture de la fiche : ${name}`,
  actionSearch: (q: string) => `recherche « ${q} »`,
  actionType: (label: string) => `type ${label}`,
  actionGen: (gen: number) => `Gén. ${gen}`,
  actionColor: (label: string) => `couleur ${label}`,
  actionHabitat: (label: string) => `habitat ${label}`,
  actionShape: (label: string) => `forme ${label}`,
  actionEgg: (label: string) => `œuf ${label}`,
  actionStage: (stage: string) => `stade ${stage}`,
  actionRemoved: "Filtres retirés",
  actionFiltersOnly: "Filtres",
  actionExclude: (list: string) => `sans ${list}`,
  actionExcludeFamily: (list: string) => `sans ${list} ni sa famille`,
  actionTeamCleared: "Équipe vidée",
  actionTeamSet: (list: string) => `Équipe : ${list}`,
  actionMemberLevel: (name: string, level: number) => `${name} N.${level}`,
  actionOpenTeam: "Ouverture de ton équipe",
  actionStartBattle: "Vers le Mode Combat",
  actionFilters: (list: string) => `Filtres : ${list}`,
  // Server (API route) messages
  errMissingKey: "OPENAI_API_KEY est absente du serveur.",
  errBadJson: "JSON invalide.",
  errNoMessage: "Message manquant.",
  errBadApiKey: "La clé API OpenAI est invalide ou a expiré.",
  errUpstream: "Le transmetteur du Pokédex n'a pas pu joindre l'IA.",
  fallbackEmpty: "Oh là là ! Les mots me manquent… réessaie !",
  fallbackError: "Oh non ! Quelque chose s'est mal passé.",
  // Coach report route (/api/coach)
  coachErrEmptyTeam: "L'équipe est vide : ajoute au moins un Pokémon.",
  coachErrUpstream: "Le Coach Bot n'a pas pu joindre l'IA. Réessaie.",
  coachErrUnreadable:
    "Le Coach Bot a renvoyé un rapport illisible. Réessaie.",
  // Team suggestion route (/api/team-suggest)
  suggestErrNoPrompt: "Décris l'équipe que tu veux.",
  suggestErrFailed:
    "Le Coach Bot n'a pas su composer cette équipe. Essaie de la décrire autrement.",
  suggestFallbackMotivo: "Équipe générée à partir de ta description.",
};

const de: typeof es = {
  // Floating launcher
  launcherAria: "Mit Professor Eich sprechen",
  launcherTitle: "Sprich mit Professor Eich",
  launcherTagline: "Fragen · Filtern · Erkunden",
  // Panel chrome
  panelAria: "Chat mit Professor Eich",
  headerName: "PROFESSOR EICH",
  headerRole: "Pokémon-Forscher · Alabastia",
  closeAria: "Chat schließen",
  typing: "DER PROFESSOR SCHREIBT…",
  inputPlaceholder: "Frag Professor Eich…",
  inputAria: "Nachricht an Professor Eich",
  sendAria: "Nachricht senden",
  // Conversation
  welcome:
    "Hallo, junger Trainer! Ich bin Professor Eich, Pokémon-Forscher aus Alabastia, und dieser Pokédex ist meine größte Erfindung. Frag mich alles über die Pokémon-Welt, oder probiere Dinge wie „zeig mir die legendären Pokémon aus Kanto“ oder „öffne den Eintrag von Glurak“. Die Pokémon-Forschung wartet auf uns!",
  suggestions: [
    "Zeig mir die legendären Pokémon aus Kanto",
    "Elektro-Pokémon außer Pikachu und seiner Familie",
    "Öffne den Eintrag von Glurak",
    "Setz mein ganzes Team auf Level 5",
  ],
  errorNoResponse:
    "Der Pokédex-Sender antwortet nicht. Versuch es noch einmal!",
  errorConnection: "Die Verbindung zum Labor in Alabastia ist abgebrochen…",
  // Action chips under Oak's replies
  actionCleared: "Filter zurückgesetzt",
  actionOpening: (name: string) => `Eintrag wird geöffnet: ${name}`,
  actionSearch: (q: string) => `Suche „${q}“`,
  actionType: (label: string) => `Typ ${label}`,
  actionGen: (gen: number) => `Gen. ${gen}`,
  actionColor: (label: string) => `Farbe ${label}`,
  actionHabitat: (label: string) => `Lebensraum ${label}`,
  actionShape: (label: string) => `Form ${label}`,
  actionEgg: (label: string) => `Ei-Gruppe ${label}`,
  actionStage: (stage: string) => `Stufe ${stage}`,
  actionRemoved: "Filter entfernt",
  actionFiltersOnly: "Filter",
  actionExclude: (list: string) => `ohne ${list}`,
  actionExcludeFamily: (list: string) => `ohne ${list} und seine Familie`,
  actionTeamCleared: "Team geleert",
  actionTeamSet: (list: string) => `Team: ${list}`,
  actionMemberLevel: (name: string, level: number) => `${name} Lv.${level}`,
  actionOpenTeam: "Dein Team wird geöffnet",
  actionStartBattle: "Zum Kampfmodus",
  actionFilters: (list: string) => `Filter: ${list}`,
  // Server (API route) messages
  errMissingKey: "OPENAI_API_KEY fehlt auf dem Server.",
  errBadJson: "Ungültiges JSON.",
  errNoMessage: "Nachricht fehlt.",
  errBadApiKey: "Der OpenAI-API-Schlüssel ist ungültig oder abgelaufen.",
  errUpstream: "Der Pokédex-Sender konnte die KI nicht erreichen.",
  fallbackEmpty: "Oje! Mir fehlen die Worte… versuch es noch einmal!",
  fallbackError: "Oh je! Etwas ist schiefgelaufen.",
  // Coach report route (/api/coach)
  coachErrEmptyTeam: "Das Team ist leer: Füge mindestens ein Pokémon hinzu.",
  coachErrUpstream:
    "Der Coach-Bot konnte die KI nicht erreichen. Versuch es noch einmal.",
  coachErrUnreadable:
    "Der Coach-Bot hat einen unlesbaren Bericht geliefert. Versuch es noch einmal.",
  // Team suggestion route (/api/team-suggest)
  suggestErrNoPrompt: "Beschreibe das Team, das du möchtest.",
  suggestErrFailed:
    "Der Coach-Bot konnte dieses Team nicht zusammenstellen. Versuche, es anders zu beschreiben.",
  suggestFallbackMotivo: "Team anhand deiner Beschreibung erstellt.",
};

const it: typeof es = {
  // Floating launcher
  launcherAria: "Parla con il Professor Oak",
  launcherTitle: "Parla con il Professor Oak",
  launcherTagline: "Chiedi · Filtra · Esplora",
  // Panel chrome
  panelAria: "Chat con il Professor Oak",
  headerName: "PROFESSOR OAK",
  headerRole: "Ricercatore Pokémon · Biancavilla",
  closeAria: "Chiudi la chat",
  typing: "IL PROFESSORE STA SCRIVENDO…",
  inputPlaceholder: "Chiedi al Professor Oak…",
  inputAria: "Messaggio per il Professor Oak",
  sendAria: "Invia messaggio",
  // Conversation
  welcome:
    "Salve, giovane Allenatore! Sono il Professor Oak, ricercatore Pokémon di Biancavilla, e questo Pokédex è la mia più grande invenzione. Chiedimi qualsiasi cosa sul mondo dei Pokémon, oppure prova con «mostrami i Pokémon leggendari di Kanto» o «apri la scheda di Charizard». La scienza Pokémon ci aspetta!",
  suggestions: [
    "Mostrami i Pokémon leggendari di Kanto",
    "I tipo Elettro tranne Pikachu e la sua famiglia",
    "Apri la scheda di Charizard",
    "Porta tutta la mia squadra al livello 5",
  ],
  errorNoResponse: "Il trasmettitore del Pokédex non risponde. Riprova!",
  errorConnection:
    "Il collegamento con il laboratorio di Biancavilla si è interrotto…",
  // Action chips under Oak's replies
  actionCleared: "Filtri azzerati",
  actionOpening: (name: string) => `Apertura scheda: ${name}`,
  actionSearch: (q: string) => `ricerca «${q}»`,
  actionType: (label: string) => `tipo ${label}`,
  actionGen: (gen: number) => `Gen ${gen}`,
  actionColor: (label: string) => `colore ${label}`,
  actionHabitat: (label: string) => `habitat ${label}`,
  actionShape: (label: string) => `forma ${label}`,
  actionEgg: (label: string) => `gruppo uova ${label}`,
  actionStage: (stage: string) => `stadio ${stage}`,
  actionRemoved: "Filtri rimossi",
  actionFiltersOnly: "Filtri",
  actionExclude: (list: string) => `senza ${list}`,
  actionExcludeFamily: (list: string) => `senza ${list} e la sua famiglia`,
  actionTeamCleared: "Squadra svuotata",
  actionTeamSet: (list: string) => `Squadra: ${list}`,
  actionMemberLevel: (name: string, level: number) => `${name} Lv.${level}`,
  actionOpenTeam: "Apro la tua squadra",
  actionStartBattle: "Alla Modalità Lotta",
  actionFilters: (list: string) => `Filtri: ${list}`,
  // Server (API route) messages
  errMissingKey: "OPENAI_API_KEY mancante sul server.",
  errBadJson: "JSON non valido.",
  errNoMessage: "Messaggio mancante.",
  errBadApiKey: "La chiave API di OpenAI non è valida o è scaduta.",
  errUpstream: "Il trasmettitore del Pokédex non è riuscito a contattare l'IA.",
  fallbackEmpty: "Oh! Sono rimasto senza parole… riprova!",
  fallbackError: "Accidenti! Qualcosa è andato storto.",
  // Coach report route (/api/coach)
  coachErrEmptyTeam: "La squadra è vuota: aggiungi almeno un Pokémon.",
  coachErrUpstream:
    "Il Coach Bot non è riuscito a contattare l'IA. Riprova.",
  coachErrUnreadable:
    "Il Coach Bot ha restituito un report illeggibile. Riprova.",
  // Team suggestion route (/api/team-suggest)
  suggestErrNoPrompt: "Descrivi la squadra che vuoi.",
  suggestErrFailed:
    "Il Coach Bot non è riuscito a comporre quella squadra. Prova a descriverla in un altro modo.",
  suggestFallbackMotivo: "Squadra generata dalla tua descrizione.",
};

const ja: typeof es = {
  // Floating launcher
  launcherAria: "オーキド博士と話す",
  launcherTitle: "オーキド博士と話そう",
  launcherTagline: "質問 · 絞り込み · 探索",
  // Panel chrome
  panelAria: "オーキド博士とのチャット",
  headerName: "オーキド博士",
  headerRole: "ポケモン研究者 · マサラタウン",
  closeAria: "チャットを閉じる",
  typing: "博士が入力中…",
  inputPlaceholder: "オーキド博士に聞いてみよう…",
  inputAria: "オーキド博士へのメッセージ",
  sendAria: "メッセージを送信",
  // Conversation
  welcome:
    "やあ、若きトレーナーよ！わしはマサラタウンのポケモン研究者、オーキド博士じゃ。このポケモン図鑑はわしの最高の発明でな。ポケモンの世界のことなら何でも聞いてくれたまえ。「カントーの伝説のポケモンを見せて」や「リザードンのページを開いて」と頼むこともできるぞ。ポケモンの科学が待っておる！",
  suggestions: [
    "カントーの伝説のポケモンを見せて",
    "ピカチュウと進化系をのぞいたでんきタイプ",
    "リザードンのページを開いて",
    "チーム全員をレベル5にして",
  ],
  errorNoResponse:
    "ポケモン図鑑の通信機が応答しないようじゃ。もう一度試してくれ！",
  errorConnection: "マサラタウンの研究所との通信が途切れてしまった…",
  // Action chips under Oak's replies
  actionCleared: "フィルターを解除しました",
  actionOpening: (name: string) => `ページを開く: ${name}`,
  actionSearch: (q: string) => `検索「${q}」`,
  actionType: (label: string) => `${label}タイプ`,
  actionGen: (gen: number) => `第${gen}世代`,
  actionColor: (label: string) => `色: ${label}`,
  actionHabitat: (label: string) => `生息地: ${label}`,
  actionShape: (label: string) => `姿: ${label}`,
  actionEgg: (label: string) => `タマゴグループ: ${label}`,
  actionStage: (stage: string) => `進化段階: ${stage}`,
  actionRemoved: "フィルターを外しました",
  actionFiltersOnly: "フィルター",
  actionExclude: (list: string) => `${list}をのぞく`,
  actionExcludeFamily: (list: string) => `${list}と進化系をのぞく`,
  actionTeamCleared: "チームを空にしました",
  actionTeamSet: (list: string) => `チーム: ${list}`,
  actionMemberLevel: (name: string, level: number) => `${name} Lv.${level}`,
  actionOpenTeam: "チームを開きます",
  actionStartBattle: "バトルモードへ",
  actionFilters: (list: string) => `フィルター: ${list}`,
  // Server (API route) messages
  errMissingKey: "サーバーに OPENAI_API_KEY がありません。",
  errBadJson: "無効な JSON です。",
  errNoMessage: "メッセージがありません。",
  errBadApiKey: "OpenAI の API キーが無効か、期限切れです。",
  errUpstream: "ポケモン図鑑の通信機が AI に接続できませんでした。",
  fallbackEmpty: "おっと！言葉が出てこんわい…もう一度試してくれ！",
  fallbackError: "しまった！何かがうまくいかなかったようじゃ。",
  // Coach report route (/api/coach)
  coachErrEmptyTeam:
    "チームが空です。少なくとも 1 匹のポケモンを追加してください。",
  coachErrUpstream:
    "コーチボットが AI に接続できませんでした。もう一度お試しください。",
  coachErrUnreadable:
    "コーチボットのレポートが読み取れませんでした。もう一度お試しください。",
  // Team suggestion route (/api/team-suggest)
  suggestErrNoPrompt: "ほしいチームを説明してください。",
  suggestErrFailed:
    "コーチボットはそのチームを組めませんでした。別の言い方で説明してみてください。",
  suggestFallbackMotivo: "あなたの説明から生成したチームです。",
};

const ko: typeof es = {
  // Floating launcher
  launcherAria: "오박사와 대화하기",
  launcherTitle: "오박사와 이야기해 보세요",
  launcherTagline: "질문 · 필터 · 탐험",
  // Panel chrome
  panelAria: "오박사와의 채팅",
  headerName: "오박사",
  headerRole: "포켓몬 연구자 · 태초마을",
  closeAria: "채팅 닫기",
  typing: "박사님이 입력 중…",
  inputPlaceholder: "오박사에게 물어보세요…",
  inputAria: "오박사에게 보낼 메시지",
  sendAria: "메시지 보내기",
  // Conversation
  welcome:
    "안녕, 젊은 트레이너! 나는 태초마을의 포켓몬 연구자 오박사란다. 이 포켓몬 도감은 내 최고의 발명품이지. 포켓몬 세계에 대해 무엇이든 물어보렴. “관동지방의 전설의 포켓몬을 보여줘”나 “리자몽의 도감 페이지를 열어줘” 같은 부탁도 할 수 있단다. 포켓몬 과학이 우리를 기다리고 있어!",
  suggestions: [
    "관동지방의 전설의 포켓몬을 보여줘",
    "피카츄와 진화형을 뺀 전기 타입",
    "리자몽의 도감 페이지를 열어줘",
    "내 팀 전원을 레벨 5로 만들어줘",
  ],
  errorNoResponse:
    "포켓몬 도감의 송신기가 응답하지 않는구나. 다시 시도해 보렴!",
  errorConnection: "태초마을 연구소와의 연결이 끊어졌어…",
  // Action chips under Oak's replies
  actionCleared: "필터 초기화됨",
  actionOpening: (name: string) => `도감 페이지 열기: ${name}`,
  actionSearch: (q: string) => `검색 “${q}”`,
  actionType: (label: string) => `${label} 타입`,
  actionGen: (gen: number) => `${gen}세대`,
  actionColor: (label: string) => `색상 ${label}`,
  actionHabitat: (label: string) => `서식지 ${label}`,
  actionShape: (label: string) => `모습 ${label}`,
  actionEgg: (label: string) => `알그룹 ${label}`,
  actionStage: (stage: string) => `진화 단계 ${stage}`,
  actionRemoved: "필터 해제됨",
  actionFiltersOnly: "필터",
  actionExclude: (list: string) => `${list} 제외`,
  actionExcludeFamily: (list: string) => `${list}와(과) 진화형 제외`,
  actionTeamCleared: "팀을 비웠습니다",
  actionTeamSet: (list: string) => `팀: ${list}`,
  actionMemberLevel: (name: string, level: number) => `${name} Lv.${level}`,
  actionOpenTeam: "팀을 여는 중",
  actionStartBattle: "대전 모드로",
  actionFilters: (list: string) => `필터: ${list}`,
  // Server (API route) messages
  errMissingKey: "서버에 OPENAI_API_KEY가 없습니다.",
  errBadJson: "잘못된 JSON입니다.",
  errNoMessage: "메시지가 없습니다.",
  errBadApiKey: "OpenAI API 키가 유효하지 않거나 만료되었습니다.",
  errUpstream: "포켓몬 도감의 송신기가 AI에 연결하지 못했습니다.",
  fallbackEmpty: "이런! 할 말을 잃었구나… 다시 시도해 보렴!",
  fallbackError: "저런! 뭔가 잘못됐구나.",
  // Coach report route (/api/coach)
  coachErrEmptyTeam: "팀이 비어 있습니다. 포켓몬을 한 마리 이상 추가하세요.",
  coachErrUpstream:
    "코치 봇이 AI에 연결하지 못했습니다. 다시 시도해 주세요.",
  coachErrUnreadable:
    "코치 봇이 읽을 수 없는 리포트를 반환했습니다. 다시 시도해 주세요.",
  // Team suggestion route (/api/team-suggest)
  suggestErrNoPrompt: "원하는 팀을 설명해 주세요.",
  suggestErrFailed:
    "코치 봇이 그 팀을 구성하지 못했습니다. 다른 방식으로 설명해 보세요.",
  suggestFallbackMotivo: "설명을 바탕으로 생성된 팀입니다.",
};

const zhHans: typeof es = {
  // Floating launcher
  launcherAria: "和大木博士对话",
  launcherTitle: "和大木博士聊聊吧",
  launcherTagline: "提问 · 筛选 · 探索",
  // Panel chrome
  panelAria: "与大木博士的对话",
  headerName: "大木博士",
  headerRole: "宝可梦研究者 · 真新镇",
  closeAria: "关闭对话",
  typing: "博士正在输入…",
  inputPlaceholder: "向大木博士提问…",
  inputAria: "发给大木博士的消息",
  sendAria: "发送消息",
  // Conversation
  welcome:
    "你好啊，年轻的训练家！我是真新镇的宝可梦研究者大木博士，这台宝可梦图鉴是我最得意的发明。关于宝可梦世界的事尽管问我，也可以试试“给我看看关都的传说宝可梦”或“打开喷火龙的图鉴页”这样的指令。宝可梦科学在等着我们！",
  suggestions: [
    "给我看看关都的传说宝可梦",
    "电属性，但排除皮卡丘及其进化系",
    "打开喷火龙的图鉴页",
    "把我的队伍全部设为5级",
  ],
  errorNoResponse: "宝可梦图鉴的传输器没有响应，再试一次吧！",
  errorConnection: "与真新镇研究所的连接中断了…",
  // Action chips under Oak's replies
  actionCleared: "已清除筛选",
  actionOpening: (name: string) => `正在打开图鉴页：${name}`,
  actionSearch: (q: string) => `搜索“${q}”`,
  actionType: (label: string) => `${label}属性`,
  actionGen: (gen: number) => `第${gen}世代`,
  actionColor: (label: string) => `颜色 ${label}`,
  actionHabitat: (label: string) => `栖息地 ${label}`,
  actionShape: (label: string) => `体形 ${label}`,
  actionEgg: (label: string) => `蛋群 ${label}`,
  actionStage: (stage: string) => `进化阶段 ${stage}`,
  actionRemoved: "已移除筛选",
  actionFiltersOnly: "筛选",
  actionExclude: (list: string) => `排除${list}`,
  actionExcludeFamily: (list: string) => `排除${list}及其进化系`,
  actionTeamCleared: "已清空队伍",
  actionTeamSet: (list: string) => `队伍：${list}`,
  actionMemberLevel: (name: string, level: number) => `${name} Lv.${level}`,
  actionOpenTeam: "正在打开你的队伍",
  actionStartBattle: "前往对战模式",
  actionFilters: (list: string) => `筛选：${list}`,
  // Server (API route) messages
  errMissingKey: "服务器缺少 OPENAI_API_KEY。",
  errBadJson: "JSON 无效。",
  errNoMessage: "缺少消息。",
  errBadApiKey: "OpenAI API 密钥无效或已过期。",
  errUpstream: "宝可梦图鉴的传输器无法连接 AI。",
  fallbackEmpty: "哎呀！我一时语塞了…再试一次吧！",
  fallbackError: "糟糕！出了点问题。",
  // Coach report route (/api/coach)
  coachErrEmptyTeam: "队伍是空的：请至少添加一只宝可梦。",
  coachErrUpstream: "教练机器人无法连接 AI。请再试一次。",
  coachErrUnreadable: "教练机器人返回的报告无法读取。请再试一次。",
  // Team suggestion route (/api/team-suggest)
  suggestErrNoPrompt: "请描述你想要的队伍。",
  suggestErrFailed: "教练机器人没能组出这支队伍。请换种方式描述试试。",
  suggestFallbackMotivo: "根据你的描述生成的队伍。",
};

const zhHant: typeof es = {
  // Floating launcher
  launcherAria: "和大木博士對話",
  launcherTitle: "和大木博士聊聊吧",
  launcherTagline: "提問 · 篩選 · 探索",
  // Panel chrome
  panelAria: "與大木博士的對話",
  headerName: "大木博士",
  headerRole: "寶可夢研究者 · 真新鎮",
  closeAria: "關閉對話",
  typing: "博士正在輸入…",
  inputPlaceholder: "向大木博士提問…",
  inputAria: "傳給大木博士的訊息",
  sendAria: "傳送訊息",
  // Conversation
  welcome:
    "你好啊，年輕的訓練家！我是真新鎮的寶可夢研究者大木博士，這台寶可夢圖鑑是我最得意的發明。關於寶可夢世界的事儘管問我，也可以試試「給我看看關都的傳說寶可夢」或「打開噴火龍的圖鑑頁」這樣的指令。寶可夢科學在等著我們！",
  suggestions: [
    "給我看看關都的傳說寶可夢",
    "電屬性，但排除皮卡丘及其進化系",
    "打開噴火龍的圖鑑頁",
    "把我的隊伍全部設為5級",
  ],
  errorNoResponse: "寶可夢圖鑑的傳輸器沒有回應，再試一次吧！",
  errorConnection: "與真新鎮研究所的連線中斷了…",
  // Action chips under Oak's replies
  actionCleared: "已清除篩選",
  actionOpening: (name: string) => `正在打開圖鑑頁：${name}`,
  actionSearch: (q: string) => `搜尋「${q}」`,
  actionType: (label: string) => `${label}屬性`,
  actionGen: (gen: number) => `第${gen}世代`,
  actionColor: (label: string) => `顏色 ${label}`,
  actionHabitat: (label: string) => `棲息地 ${label}`,
  actionShape: (label: string) => `體形 ${label}`,
  actionEgg: (label: string) => `蛋群 ${label}`,
  actionStage: (stage: string) => `進化階段 ${stage}`,
  actionRemoved: "已移除篩選",
  actionFiltersOnly: "篩選",
  actionExclude: (list: string) => `排除${list}`,
  actionExcludeFamily: (list: string) => `排除${list}及其進化系`,
  actionTeamCleared: "已清空隊伍",
  actionTeamSet: (list: string) => `隊伍：${list}`,
  actionMemberLevel: (name: string, level: number) => `${name} Lv.${level}`,
  actionOpenTeam: "正在開啟你的隊伍",
  actionStartBattle: "前往對戰模式",
  actionFilters: (list: string) => `篩選：${list}`,
  // Server (API route) messages
  errMissingKey: "伺服器缺少 OPENAI_API_KEY。",
  errBadJson: "JSON 無效。",
  errNoMessage: "缺少訊息。",
  errBadApiKey: "OpenAI API 金鑰無效或已過期。",
  errUpstream: "寶可夢圖鑑的傳輸器無法連上 AI。",
  fallbackEmpty: "哎呀！我一時語塞了…再試一次吧！",
  fallbackError: "糟糕！出了點問題。",
  // Coach report route (/api/coach)
  coachErrEmptyTeam: "隊伍是空的：請至少加入一隻寶可夢。",
  coachErrUpstream: "教練機器人無法連上 AI。請再試一次。",
  coachErrUnreadable: "教練機器人回傳的報告無法讀取。請再試一次。",
  // Team suggestion route (/api/team-suggest)
  suggestErrNoPrompt: "請描述你想要的隊伍。",
  suggestErrFailed: "教練機器人沒能組出這支隊伍。請換個方式描述看看。",
  suggestFallbackMotivo: "根據你的描述產生的隊伍。",
};

export const trainerDict: Record<Lang, typeof es> = {
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

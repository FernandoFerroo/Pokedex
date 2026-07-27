import type { BagItemId } from "@/lib/battle/items";
import type { Side } from "@/types/battle";
import type { Lang } from "../config";

/** Battle lines the engine emits when an item is used. */
export interface ItemTexts {
  /** "¡Usaste una Poción!" / "¡El rival usó una Poción!" */
  use(itemLabel: string, side: Side): string;
  /** HP restored, with the amount. */
  restored(label: string, side: Side, amount: number): string;
  /** Full Heal / Full Restore clearing a condition. */
  cured(label: string, side: Side): string;
  /** A fainted party member is brought back. */
  revived(label: string, side: Side): string;
}

/** Bag: item names and descriptions, the packing screen and engine lines. */
const es = {
  itemName: {
    potion: "Poción",
    "super-potion": "Superpoción",
    "hyper-potion": "Hiperpoción",
    "full-restore": "Restaurar todo",
    revive: "Revivir",
    "full-heal": "Cura total",
    "x-attack": "Ataque X",
    "x-defense": "Defensa X",
  } as Record<BagItemId, string>,
  itemDesc: {
    potion: "Restaura un tercio de los PS.",
    "super-potion": "Restaura la mitad de los PS.",
    "hyper-potion": "Restaura cuatro quintos de los PS.",
    "full-restore": "Restaura todos los PS y cura el estado.",
    revive: "Revive a un Pokémon debilitado con la mitad de sus PS.",
    "full-heal": "Cura cualquier problema de estado.",
    "x-attack": "Sube el Ataque un nivel.",
    "x-defense": "Sube la Defensa un nivel.",
  } as Record<BagItemId, string>,
  turnCost: "Gasta el turno.",

  // Pre-battle packing screen
  title: "MOCHILA",
  subtitle: (used: number, capacity: number) => `${used}/${capacity} objetos`,
  intro:
    "Elige qué te llevas al combate. Podrás usar un objeto por turno, igual que en los juegos.",
  addAria: (name: string) => `Añadir ${name} a la mochila`,
  removeAria: (name: string) => `Quitar ${name} de la mochila`,
  full: "Mochila llena",
  maxOf: (name: string) => `Ya llevas el máximo de ${name}`,
  reset: "Mochila estándar",
  empty: "Vas sin objetos: el combate será a pelo.",

  // In-battle bag menu
  noneLeft: "No te queda ninguno",
  useless: "Ahora mismo no haría nada",
  whichPokemon: "¿A qué Pokémon quieres revivir?",

  engine: {
    use: (itemLabel, side) =>
      side === "player"
        ? `¡Usaste ${itemLabel}!`
        : `¡El rival usó ${itemLabel}!`,
    restored: (label, side, amount) =>
      `${label}${side === "player" ? "" : " enemigo"} recuperó ${amount} PS.`,
    cured: (label, side) =>
      `¡${label}${side === "player" ? "" : " enemigo"} se ha recuperado!`,
    revived: (label, side) =>
      `¡${label}${side === "player" ? "" : " enemigo"} ha revivido!`,
  } satisfies ItemTexts,
};

const en: typeof es = {
  itemName: {
    potion: "Potion",
    "super-potion": "Super Potion",
    "hyper-potion": "Hyper Potion",
    "full-restore": "Full Restore",
    revive: "Revive",
    "full-heal": "Full Heal",
    "x-attack": "X Attack",
    "x-defense": "X Defense",
  },
  itemDesc: {
    potion: "Restores a third of max HP.",
    "super-potion": "Restores half of max HP.",
    "hyper-potion": "Restores four fifths of max HP.",
    "full-restore": "Restores all HP and cures any status.",
    revive: "Revives a fainted Pokémon with half its HP.",
    "full-heal": "Cures any status condition.",
    "x-attack": "Raises Attack by one stage.",
    "x-defense": "Raises Defense by one stage.",
  },
  turnCost: "Uses up the turn.",

  title: "BAG",
  subtitle: (used, capacity) => `${used}/${capacity} items`,
  intro:
    "Pack what you're taking into battle. You can use one item per turn, just like in the games.",
  addAria: (name) => `Add ${name} to the bag`,
  removeAria: (name) => `Remove ${name} from the bag`,
  full: "Bag full",
  maxOf: (name) => `You're already carrying the maximum of ${name}`,
  reset: "Standard bag",
  empty: "No items packed: this one's bare-knuckle.",

  noneLeft: "None left",
  useless: "It wouldn't do anything right now",
  whichPokemon: "Which Pokémon do you want to revive?",

  engine: {
    use: (itemLabel, side) =>
      side === "player"
        ? `You used a ${itemLabel}!`
        : `The rival used a ${itemLabel}!`,
    restored: (label, side, amount) =>
      side === "player"
        ? `${label} recovered ${amount} HP.`
        : `The opposing ${label} recovered ${amount} HP.`,
    cured: (label, side) =>
      side === "player"
        ? `${label} was cured!`
        : `The opposing ${label} was cured!`,
    revived: (label, side) =>
      side === "player"
        ? `${label} was revived!`
        : `The opposing ${label} was revived!`,
  },
};

const fr: typeof es = {
  itemName: {
    potion: "Potion",
    "super-potion": "Super Potion",
    "hyper-potion": "Hyper Potion",
    "full-restore": "Guérison",
    revive: "Rappel",
    "full-heal": "Total Soin",
    "x-attack": "Attaque +",
    "x-defense": "Défense +",
  },
  itemDesc: {
    potion: "Rend un tiers des PV max.",
    "super-potion": "Rend la moitié des PV max.",
    "hyper-potion": "Rend quatre cinquièmes des PV max.",
    "full-restore": "Rend tous les PV et soigne les statuts.",
    revive: "Ranime un Pokémon K.O. avec la moitié de ses PV.",
    "full-heal": "Soigne tous les problèmes de statut.",
    "x-attack": "Augmente l'Attaque d'un niveau.",
    "x-defense": "Augmente la Défense d'un niveau.",
  },
  turnCost: "Consomme le tour.",

  title: "SAC",
  subtitle: (used, capacity) => `${used}/${capacity} objets`,
  intro:
    "Choisis ce que tu emportes au combat. Tu pourras utiliser un objet par tour, comme dans les jeux.",
  addAria: (name) => `Ajouter ${name} au sac`,
  removeAria: (name) => `Retirer ${name} du sac`,
  full: "Sac plein",
  maxOf: (name) => `Tu portes déjà le maximum de ${name}`,
  reset: "Sac standard",
  empty: "Aucun objet : ce combat se fera à mains nues.",

  noneLeft: "Il n'en reste plus",
  useless: "Ça ne servirait à rien maintenant",
  whichPokemon: "Quel Pokémon veux-tu ranimer ?",

  engine: {
    use: (itemLabel, side) =>
      side === "player"
        ? `Tu utilises ${itemLabel} !`
        : `Le rival utilise ${itemLabel} !`,
    restored: (label, side, amount) =>
      `${label}${side === "player" ? "" : " ennemi"} récupère ${amount} PV.`,
    cured: (label, side) =>
      `${label}${side === "player" ? "" : " ennemi"} est guéri !`,
    revived: (label, side) =>
      `${label}${side === "player" ? "" : " ennemi"} est ranimé !`,
  },
};

const de: typeof es = {
  itemName: {
    potion: "Trank",
    "super-potion": "Supertrank",
    "hyper-potion": "Hypertrank",
    "full-restore": "Top-Genesung",
    revive: "Beleber",
    "full-heal": "Hyperheiler",
    "x-attack": "X-Angriff",
    "x-defense": "X-Abwehr",
  },
  itemDesc: {
    potion: "Stellt ein Drittel der maximalen KP wieder her.",
    "super-potion": "Stellt die Hälfte der maximalen KP wieder her.",
    "hyper-potion": "Stellt vier Fünftel der maximalen KP wieder her.",
    "full-restore": "Stellt alle KP wieder her und heilt den Status.",
    revive: "Belebt ein besiegtes Pokémon mit der Hälfte seiner KP.",
    "full-heal": "Heilt jeden Statuszustand.",
    "x-attack": "Erhöht den Angriff um eine Stufe.",
    "x-defense": "Erhöht die Verteidigung um eine Stufe.",
  },
  turnCost: "Verbraucht den Zug.",

  title: "BEUTEL",
  subtitle: (used, capacity) => `${used}/${capacity} Items`,
  intro:
    "Pack ein, was du in den Kampf mitnimmst. Pro Zug darfst du ein Item benutzen, wie in den Spielen.",
  addAria: (name) => `${name} in den Beutel legen`,
  removeAria: (name) => `${name} aus dem Beutel nehmen`,
  full: "Beutel voll",
  maxOf: (name) => `Du trägst bereits das Maximum an ${name}`,
  reset: "Standardbeutel",
  empty: "Keine Items dabei: das wird ein Kampf ohne Netz.",

  noneLeft: "Keine mehr übrig",
  useless: "Das würde gerade nichts bringen",
  whichPokemon: "Welches Pokémon möchtest du beleben?",

  engine: {
    use: (itemLabel, side) =>
      side === "player"
        ? `Du hast ${itemLabel} eingesetzt!`
        : `Der Rivale hat ${itemLabel} eingesetzt!`,
    restored: (label, side, amount) =>
      side === "player"
        ? `${label} erhält ${amount} KP zurück.`
        : `Das gegnerische ${label} erhält ${amount} KP zurück.`,
    cured: (label, side) =>
      side === "player"
        ? `${label} wurde geheilt!`
        : `Das gegnerische ${label} wurde geheilt!`,
    revived: (label, side) =>
      side === "player"
        ? `${label} wurde wiederbelebt!`
        : `Das gegnerische ${label} wurde wiederbelebt!`,
  },
};

const it: typeof es = {
  itemName: {
    potion: "Pozione",
    "super-potion": "Superpozione",
    "hyper-potion": "Iperpozione",
    "full-restore": "Ricarica totale",
    revive: "Revitalizzante",
    "full-heal": "Cura totale",
    "x-attack": "Attacco X",
    "x-defense": "Difesa X",
  },
  itemDesc: {
    potion: "Ripristina un terzo dei PS massimi.",
    "super-potion": "Ripristina metà dei PS massimi.",
    "hyper-potion": "Ripristina quattro quinti dei PS massimi.",
    "full-restore": "Ripristina tutti i PS e cura lo stato.",
    revive: "Rianima un Pokémon esausto con metà dei suoi PS.",
    "full-heal": "Cura qualsiasi problema di stato.",
    "x-attack": "Aumenta l'Attacco di un livello.",
    "x-defense": "Aumenta la Difesa di un livello.",
  },
  turnCost: "Consuma il turno.",

  title: "BORSA",
  subtitle: (used, capacity) => `${used}/${capacity} strumenti`,
  intro:
    "Scegli cosa porti in lotta. Potrai usare uno strumento per turno, come nei giochi.",
  addAria: (name) => `Aggiungi ${name} alla borsa`,
  removeAria: (name) => `Togli ${name} dalla borsa`,
  full: "Borsa piena",
  maxOf: (name) => `Hai già il massimo di ${name}`,
  reset: "Borsa standard",
  empty: "Nessuno strumento: si lotta a mani nude.",

  noneLeft: "Non ne hai più",
  useless: "Ora come ora non servirebbe",
  whichPokemon: "Quale Pokémon vuoi rianimare?",

  engine: {
    use: (itemLabel, side) =>
      side === "player"
        ? `Hai usato ${itemLabel}!`
        : `Il rivale ha usato ${itemLabel}!`,
    restored: (label, side, amount) =>
      `${label}${side === "player" ? "" : " nemico"} recupera ${amount} PS.`,
    cured: (label, side) =>
      `${label}${side === "player" ? "" : " nemico"} è guarito!`,
    revived: (label, side) =>
      `${label}${side === "player" ? "" : " nemico"} è stato rianimato!`,
  },
};

const ja: typeof es = {
  itemName: {
    potion: "キズぐすり",
    "super-potion": "いいキズぐすり",
    "hyper-potion": "すごいキズぐすり",
    "full-restore": "かいふくのくすり",
    revive: "げんきのかけら",
    "full-heal": "なんでもなおし",
    "x-attack": "プラスパワー",
    "x-defense": "ディフェンダー",
  },
  itemDesc: {
    potion: "さいだいHPの3ぶんの1をかいふくする。",
    "super-potion": "さいだいHPのはんぶんをかいふくする。",
    "hyper-potion": "さいだいHPの5ぶんの4をかいふくする。",
    "full-restore": "HPをぜんかいふくし じょうたいいじょうもなおす。",
    revive: "ひんしのポケモンをHPはんぶんでふっかつさせる。",
    "full-heal": "すべてのじょうたいいじょうをなおす。",
    "x-attack": "こうげきを1だんかいあげる。",
    "x-defense": "ぼうぎょを1だんかいあげる。",
  },
  turnCost: "ターンを消費する。",

  title: "バッグ",
  subtitle: (used, capacity) => `どうぐ ${used}/${capacity}`,
  intro:
    "バトルに持っていくどうぐを選ぼう。ゲームと同じで、1ターンに1つ使えるよ。",
  addAria: (name) => `${name}をバッグに入れる`,
  removeAria: (name) => `${name}をバッグから出す`,
  full: "バッグがいっぱい",
  maxOf: (name) => `${name}はもうこれ以上持てない`,
  reset: "標準のバッグ",
  empty: "どうぐなし：素手で勝負だ。",

  noneLeft: "もう残っていない",
  useless: "今はつかっても意味がない",
  whichPokemon: "どのポケモンをふっかつさせる？",

  engine: {
    use: (itemLabel, side) =>
      side === "player"
        ? `${itemLabel}を つかった！`
        : `ライバルは ${itemLabel}を つかった！`,
    restored: (label, side, amount) =>
      `${side === "player" ? "" : "てきの "}${label}は HPを ${amount} かいふくした。`,
    cured: (label, side) =>
      `${side === "player" ? "" : "てきの "}${label}は げんきになった！`,
    revived: (label, side) =>
      `${side === "player" ? "" : "てきの "}${label}は ふっかつした！`,
  },
};

const ko: typeof es = {
  itemName: {
    potion: "상처약",
    "super-potion": "좋은상처약",
    "hyper-potion": "고급상처약",
    "full-restore": "회복약",
    revive: "기력의조각",
    "full-heal": "만능치료제",
    "x-attack": "플러스파워",
    "x-defense": "디펜드가드",
  },
  itemDesc: {
    potion: "최대 HP의 3분의 1을 회복한다.",
    "super-potion": "최대 HP의 절반을 회복한다.",
    "hyper-potion": "최대 HP의 5분의 4를 회복한다.",
    "full-restore": "HP를 모두 회복하고 상태 이상도 치료한다.",
    revive: "기절한 포켓몬을 HP 절반으로 되살린다.",
    "full-heal": "모든 상태 이상을 치료한다.",
    "x-attack": "공격을 1랭크 올린다.",
    "x-defense": "방어를 1랭크 올린다.",
  },
  turnCost: "턴을 소비한다.",

  title: "가방",
  subtitle: (used, capacity) => `도구 ${used}/${capacity}`,
  intro:
    "대전에 가져갈 도구를 고르자. 게임처럼 한 턴에 하나씩 사용할 수 있다.",
  addAria: (name) => `${name}을(를) 가방에 넣기`,
  removeAria: (name) => `${name}을(를) 가방에서 빼기`,
  full: "가방이 가득 찼다",
  maxOf: (name) => `${name}은(는) 더 이상 넣을 수 없다`,
  reset: "기본 가방",
  empty: "도구 없음: 맨몸으로 승부한다.",

  noneLeft: "더 이상 없다",
  useless: "지금은 써도 소용없다",
  whichPokemon: "어느 포켓몬을 되살릴까?",

  engine: {
    use: (itemLabel, side) =>
      side === "player"
        ? `${itemLabel}을(를) 사용했다!`
        : `라이벌이 ${itemLabel}을(를) 사용했다!`,
    restored: (label, side, amount) =>
      `${side === "player" ? "" : "상대의 "}${label}은(는) HP를 ${amount} 회복했다.`,
    cured: (label, side) =>
      `${side === "player" ? "" : "상대의 "}${label}은(는) 회복되었다!`,
    revived: (label, side) =>
      `${side === "player" ? "" : "상대의 "}${label}은(는) 되살아났다!`,
  },
};

const zhHans: typeof es = {
  itemName: {
    potion: "伤药",
    "super-potion": "好伤药",
    "hyper-potion": "厉害伤药",
    "full-restore": "全满药",
    revive: "元气碎片",
    "full-heal": "万能药",
    "x-attack": "力量强化",
    "x-defense": "防御强化",
  },
  itemDesc: {
    potion: "回复最大HP的三分之一。",
    "super-potion": "回复最大HP的一半。",
    "hyper-potion": "回复最大HP的五分之四。",
    "full-restore": "回复全部HP并治愈异常状态。",
    revive: "让陷入濒死的宝可梦以一半HP复活。",
    "full-heal": "治愈所有异常状态。",
    "x-attack": "提升1个等级的攻击。",
    "x-defense": "提升1个等级的防御。",
  },
  turnCost: "消耗一回合。",

  title: "背包",
  subtitle: (used, capacity) => `道具 ${used}/${capacity}`,
  intro: "挑选带进对战的道具。和游戏一样，每回合可以使用一个。",
  addAria: (name) => `将${name}放入背包`,
  removeAria: (name) => `将${name}移出背包`,
  full: "背包已满",
  maxOf: (name) => `${name}已达上限`,
  reset: "标准背包",
  empty: "没带道具：赤手空拳上阵。",

  noneLeft: "已经没有了",
  useless: "现在用了也没有效果",
  whichPokemon: "要让哪只宝可梦复活？",

  engine: {
    use: (itemLabel, side) =>
      side === "player" ? `你使用了${itemLabel}！` : `对手使用了${itemLabel}！`,
    restored: (label, side, amount) =>
      `${side === "player" ? "" : "对手的"}${label}回复了${amount}点HP。`,
    cured: (label, side) =>
      `${side === "player" ? "" : "对手的"}${label}恢复了健康！`,
    revived: (label, side) =>
      `${side === "player" ? "" : "对手的"}${label}复活了！`,
  },
};

const zhHant: typeof es = {
  itemName: {
    potion: "傷藥",
    "super-potion": "好傷藥",
    "hyper-potion": "厲害傷藥",
    "full-restore": "全滿藥",
    revive: "元氣碎片",
    "full-heal": "萬能藥",
    "x-attack": "力量強化",
    "x-defense": "防禦強化",
  },
  itemDesc: {
    potion: "回復最大HP的三分之一。",
    "super-potion": "回復最大HP的一半。",
    "hyper-potion": "回復最大HP的五分之四。",
    "full-restore": "回復全部HP並治癒異常狀態。",
    revive: "讓陷入瀕死的寶可夢以一半HP復活。",
    "full-heal": "治癒所有異常狀態。",
    "x-attack": "提升1個等級的攻擊。",
    "x-defense": "提升1個等級的防禦。",
  },
  turnCost: "消耗一回合。",

  title: "背包",
  subtitle: (used, capacity) => `道具 ${used}/${capacity}`,
  intro: "挑選帶進對戰的道具。和遊戲一樣，每回合可以使用一個。",
  addAria: (name) => `將${name}放入背包`,
  removeAria: (name) => `將${name}移出背包`,
  full: "背包已滿",
  maxOf: (name) => `${name}已達上限`,
  reset: "標準背包",
  empty: "沒帶道具：赤手空拳上陣。",

  noneLeft: "已經沒有了",
  useless: "現在用了也沒有效果",
  whichPokemon: "要讓哪隻寶可夢復活？",

  engine: {
    use: (itemLabel, side) =>
      side === "player" ? `你使用了${itemLabel}！` : `對手使用了${itemLabel}！`,
    restored: (label, side, amount) =>
      `${side === "player" ? "" : "對手的"}${label}回復了${amount}點HP。`,
    cured: (label, side) =>
      `${side === "player" ? "" : "對手的"}${label}恢復了健康！`,
    revived: (label, side) =>
      `${side === "player" ? "" : "對手的"}${label}復活了！`,
  },
};

export const bagDict: Record<Lang, typeof es> = {
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

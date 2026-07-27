import type { Lang } from "./config";
import { a11yDict } from "./dictionaries/a11y";
import { bagDict } from "./dictionaries/bag";
import { battleDict } from "./dictionaries/battle";
import { compareDict } from "./dictionaries/compare";
import { detailDict } from "./dictionaries/detail";
import { homeDict } from "./dictionaries/home";
import { layoutDict } from "./dictionaries/layout";
import { listDict } from "./dictionaries/list";
import { teamDict } from "./dictionaries/team";
import { tournamentDict } from "./dictionaries/tournament";
import { trainerDict } from "./dictionaries/trainer";

/** All UI strings for one language, grouped by domain. Server components call
 * `getDict(await getLang())`; client components use the `useT()` hook. */
export function getDict(lang: Lang) {
  return {
    layout: layoutDict[lang],
    home: homeDict[lang],
    list: listDict[lang],
    detail: detailDict[lang],
    team: teamDict[lang],
    battle: battleDict[lang],
    tournament: tournamentDict[lang],
    bag: bagDict[lang],
    compare: compareDict[lang],
    trainer: trainerDict[lang],
    a11y: a11yDict[lang],
  };
}

export type Dict = ReturnType<typeof getDict>;

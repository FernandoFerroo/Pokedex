import { NextResponse } from "next/server";
import { buildTeam, type LoadoutMember } from "@/lib/battle/loadout";
import { sanitizeTeam } from "@/lib/battle/sanitize";
import { battleDict } from "@/lib/i18n/dictionaries/battle";
import { getLang } from "@/lib/i18n/server";
import { TOURNAMENT_LEVEL, type TournamentRoundResponse } from "@/types/tournament";

/**
 * Hydrates the rosters of one tournament round into battle-ready Battlers.
 *
 * Unlike /api/battle/setup this route never talks to the language model — the
 * personas were already drafted when the bracket was drawn — so a round costs
 * nothing but the (cached) PokéAPI reads. The player's team is only rebuilt
 * when the client asks for it: from round two on it carries its own battlers
 * over, HP, PP and status included.
 *
 * Everything fights at the flat tournament level, like a Battle Tower set.
 */
export async function POST(request: Request) {
  const lang = await getLang();
  const t = battleDict[lang].api;

  let body: { team?: unknown; rival?: unknown; withPlayer?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: t.errBadJson }, { status: 400 });
  }

  const rival = sanitizeTeam(body.rival);
  if (rival.length === 0) {
    return NextResponse.json({ error: t.errNeedTeam }, { status: 400 });
  }
  const player = body.withPlayer === true ? sanitizeTeam(body.team) : [];
  if (body.withPlayer === true && player.length === 0) {
    return NextResponse.json({ error: t.errNeedTeam }, { status: 400 });
  }

  const atTournamentLevel = (m: {
    id: number;
    name: string;
    types: string[];
    build?: LoadoutMember["build"];
  }): LoadoutMember => ({
    id: m.id,
    name: m.name,
    types: m.types,
    level: TOURNAMENT_LEVEL,
    build: m.build,
  });

  try {
    const [rivalTeam, playerTeam] = await Promise.all([
      buildTeam(rival.map(atTournamentLevel), lang),
      player.length > 0
        ? buildTeam(player.map(atTournamentLevel), lang)
        : Promise.resolve(undefined),
    ]);
    const payload: TournamentRoundResponse = {
      rival: rivalTeam,
      ...(playerTeam ? { player: playerTeam } : {}),
    };
    return NextResponse.json(payload);
  } catch (err) {
    console.error("tournament/round loadout failed", err);
    return NextResponse.json({ error: t.errLoadout }, { status: 502 });
  }
}

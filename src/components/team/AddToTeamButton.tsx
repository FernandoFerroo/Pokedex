"use client";

import { Check, Plus } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { formatName } from "@/lib/pokemon-meta";
import { cn } from "@/lib/utils";
import { useTeam } from "@/components/team/TeamProvider";
import type { TeamMember } from "@/types/team";

/**
 * Quick-add toggle rendered over each Pokédex card: one click adds the
 * Pokémon to the team, another removes it. Lives inside the card's <Link>,
 * so it must swallow the click before the navigation fires.
 */
export function AddToTeamButton({ member }: { member: TeamMember }) {
  const { add, remove, has, isFull } = useTeam();
  const t = useT().team;
  const inTeam = has(member.id);
  const disabled = !inTeam && isFull;
  const tooltip = inTeam
    ? t.removeFromMyTeam
    : disabled
      ? t.teamFull
      : t.addToMyTeam;
  const label = inTeam
    ? t.removeNameFromTeam(formatName(member.name))
    : disabled
      ? t.teamFull
      : t.addNameToTeam(formatName(member.name));

  return (
    <span className="group/team relative flex">
      <button
        type="button"
        disabled={disabled}
        aria-label={label}
        // Same toggle semantics as the favourite heart: the ✓/+ swap is the
        // only visual cue that the Pokémon is already on the team.
        aria-pressed={inTeam}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (inTeam) remove(member.id);
          else add(member);
        }}
        className={cn(
          // Matches FavoriteButton: tighter on phones, where both toggles sit
          // over a ~111px card.
          "flex h-7 w-7 items-center justify-center rounded-full border backdrop-blur transition sm:h-8 sm:w-8",
          inTeam
            ? "border-emerald-400/70 bg-emerald-400/15 text-emerald-300 shadow-[0_0_12px_-2px_rgba(16,185,129,0.7)]"
            : disabled
              ? "border-slate-700/80 bg-black/50 text-slate-600"
              : "border-slate-600/80 bg-black/50 text-slate-300 hover:border-emerald-400/70 hover:text-emerald-300 hover:shadow-[0_0_12px_-2px_rgba(16,185,129,0.7)]",
        )}
      >
        {inTeam ? <Check size={16} /> : <Plus size={16} />}
      </button>
      {/* Tooltip a la izquierda, visible mientras el cursor está encima. */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-full mr-2 -translate-y-1/2 rounded border border-emerald-400/40 bg-hud-1/95 px-2 py-1 font-mono text-[11px] whitespace-nowrap text-emerald-200 opacity-0 shadow-[0_0_10px_-2px_rgba(16,185,129,0.5)] backdrop-blur transition-opacity duration-150 group-hover/team:opacity-100"
      >
        {tooltip}
      </span>
    </span>
  );
}

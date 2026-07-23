"use client";

import { Check, Plus } from "lucide-react";
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
  const inTeam = has(member.id);
  const disabled = !inTeam && isFull;
  const tooltip = inTeam
    ? "Quitar de mi equipo"
    : disabled
      ? "Equipo completo (6/6)"
      : "Añadir a mi equipo";
  const label = inTeam
    ? `Quitar a ${formatName(member.name)} del equipo`
    : disabled
      ? "Equipo completo (6/6)"
      : `Añadir a ${formatName(member.name)} al equipo`;

  return (
    <span className="group/team relative flex">
      <button
        type="button"
        disabled={disabled}
        aria-label={label}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (inTeam) remove(member.id);
          else add(member);
        }}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur transition",
          inTeam
            ? "border-amber-400/70 bg-amber-400/15 text-amber-300 shadow-[0_0_12px_-2px_rgba(251,191,36,0.7)]"
            : disabled
              ? "border-slate-700/80 bg-black/50 text-slate-600"
              : "border-slate-600/80 bg-black/50 text-slate-300 hover:border-amber-400/70 hover:text-amber-300 hover:shadow-[0_0_12px_-2px_rgba(251,191,36,0.7)]",
        )}
      >
        {inTeam ? <Check size={16} /> : <Plus size={16} />}
      </button>
      {/* Tooltip a la izquierda, visible mientras el cursor está encima. */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-full mr-2 -translate-y-1/2 rounded border border-amber-400/40 bg-[#0a101d]/95 px-2 py-1 font-mono text-[11px] whitespace-nowrap text-amber-200 opacity-0 shadow-[0_0_10px_-2px_rgba(251,191,36,0.5)] backdrop-blur transition-opacity duration-150 group-hover/team:opacity-100"
      >
        {tooltip}
      </span>
    </span>
  );
}

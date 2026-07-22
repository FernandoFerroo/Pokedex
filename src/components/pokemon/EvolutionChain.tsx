import { ArrowDown, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { idFromUrl } from "@/lib/pokeapi/client";
import type { ChainLink, EvolutionChainResponse } from "@/lib/pokeapi/types";
import { artworkUrl, formatName } from "@/lib/pokemon-meta";
import { cn } from "@/lib/utils";

interface EvolutionChainProps {
  chain: EvolutionChainResponse;
  /** Species currently shown in the detail view (highlighted, not clickable). */
  currentName: string;
}

/**
 * Flattens the recursive chain into evolution stages. Branched chains
 * (e.g. Eevee) simply produce a stage with several members.
 */
function toStages(root: ChainLink): Array<Array<{ name: string; id: number }>> {
  const stages: Array<Array<{ name: string; id: number }>> = [];
  let current: ChainLink[] = [root];
  while (current.length > 0) {
    stages.push(
      current.map((link) => ({
        name: link.species.name,
        id: idFromUrl(link.species.url),
      })),
    );
    current = current.flatMap((link) => link.evolves_to);
  }
  return stages;
}

export function EvolutionChain({ chain, currentName }: EvolutionChainProps) {
  const stages = toStages(chain.chain);

  return (
    <section aria-label="Cadena evolutiva">
      <h2 className="mb-3 font-pixel text-[10px] text-slate-400">
        <span aria-hidden className="mr-1.5 text-red-500">
          ►
        </span>
        Cadena evolutiva
      </h2>
      {stages.length <= 1 ? (
        <p className="font-mono text-sm text-slate-400">
          Este Pokémon no evoluciona.
        </p>
      ) : (
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-3">
          {stages.map((stage, i) => (
            <Fragment key={i}>
              {i > 0 && (
                <>
                  <ArrowDown className="text-red-500/60 sm:hidden" />
                  <ArrowRight className="hidden shrink-0 text-red-500/60 sm:block" />
                </>
              )}
              <div className="flex flex-wrap justify-center gap-2">
                {stage.map((species) => {
                  const isCurrent = species.name === currentName;
                  const card = (
                    <>
                      <div className="relative h-20 w-20">
                        <Image
                          src={artworkUrl(species.id)}
                          alt={formatName(species.name)}
                          fill
                          sizes="80px"
                          className="object-contain"
                        />
                      </div>
                      <span className="max-w-24 truncate text-xs font-medium">
                        {formatName(species.name)}
                      </span>
                    </>
                  );
                  const cardClasses = cn(
                    "flex w-28 flex-col items-center gap-1 rounded-lg border p-3 text-center transition",
                    isCurrent
                      ? "border-red-500/60 bg-red-500/[0.07] shadow-[0_0_18px_-4px_rgba(239,68,68,0.5)]"
                      : "border-slate-800 bg-[#0a101d] hover:border-cyan-400/60 hover:shadow-[0_0_16px_-4px_rgba(34,211,238,0.5)] motion-safe:hover:-translate-y-0.5",
                  );
                  return isCurrent ? (
                    <div
                      key={species.name}
                      aria-current="page"
                      className={cardClasses}
                    >
                      {card}
                    </div>
                  ) : (
                    <Link
                      key={species.name}
                      href={`/pokemon/${species.name}`}
                      className={cardClasses}
                    >
                      {card}
                    </Link>
                  );
                })}
              </div>
            </Fragment>
          ))}
        </div>
      )}
    </section>
  );
}

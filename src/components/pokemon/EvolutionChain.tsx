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
      <h2 className="mb-3 text-xs font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
        Cadena evolutiva
      </h2>
      {stages.length <= 1 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Este Pokémon no evoluciona.
        </p>
      ) : (
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-3">
          {stages.map((stage, i) => (
            <Fragment key={i}>
              {i > 0 && (
                <>
                  <ArrowDown className="text-slate-300 sm:hidden dark:text-slate-600" />
                  <ArrowRight className="hidden shrink-0 text-slate-300 sm:block dark:text-slate-600" />
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
                    "flex w-28 flex-col items-center gap-1 rounded-xl border p-3 text-center transition",
                    isCurrent
                      ? "border-slate-400 bg-slate-100 dark:border-slate-500 dark:bg-slate-800"
                      : "border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md motion-safe:hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-500",
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

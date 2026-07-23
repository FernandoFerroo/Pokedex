import { NextResponse } from "next/server";
import { getPokemonIndex } from "@/lib/index/build-index";

/**
 * Minimal species index for the team drawer's search picker: one cached
 * payload (~30KB) the client filters locally, so results are instant on
 * every keystroke and on every page.
 */
export const revalidate = 86400;

export async function GET() {
  const index = await getPokemonIndex();
  return NextResponse.json({
    entries: index.entries.map(({ id, name, types }) => ({ id, name, types })),
  });
}

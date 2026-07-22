import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <p className="glitch neon-red font-pixel text-5xl">404</p>
      <p className="font-pixel text-xs text-slate-300">
        ¡El Pokémon salvaje huyó!
      </p>
      <p className="max-w-sm font-mono text-sm text-slate-500">
        Ese Pokémon no está registrado en la Pokédex. Puede que sea un
        MissingNo…
      </p>
      <Link
        href="/"
        className="mt-2 rounded-md border border-red-500/60 bg-red-500/10 px-4 py-2 font-mono text-sm font-semibold tracking-wider text-red-300 uppercase transition hover:bg-red-500/20 hover:shadow-[0_0_18px_-2px_rgba(239,68,68,0.6)]"
      >
        Volver al Centro Pokémon
      </Link>
    </main>
  );
}

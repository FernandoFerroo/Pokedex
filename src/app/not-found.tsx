import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center">
      <p className="text-5xl font-bold">404</p>
      <p className="text-slate-500">
        No hemos encontrado ese Pokémon en la Pokédex.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        Volver al listado
      </Link>
    </main>
  );
}

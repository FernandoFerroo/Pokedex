export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="h-10 flex-1 animate-pulse rounded-md bg-slate-800/60" />
        <div className="h-10 w-full animate-pulse rounded-md bg-slate-800/60 sm:w-40" />
        <div className="h-10 w-full animate-pulse rounded-md bg-slate-800/60 sm:w-48" />
      </div>
      <p className="cursor-blink mt-4 font-mono text-[13px] tracking-widest text-emerald-400/80 uppercase">
        Cargando datos…
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 18 }, (_, i) => (
          <div
            key={i}
            className="h-56 animate-pulse rounded-lg border border-slate-800/60 bg-slate-800/40"
          />
        ))}
      </div>
    </main>
  );
}

export default function Loading() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto w-full max-w-5xl flex-1 px-4 py-6"
    >
      <div className="h-8 w-36 animate-pulse rounded-md bg-slate-800/60" />
      <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
        <div className="aspect-square animate-pulse rounded-xl border border-slate-800/60 bg-slate-800/40" />
        <div className="flex flex-col gap-4">
          <div className="h-9 w-56 animate-pulse rounded-md bg-slate-800/60" />
          <div className="h-7 w-72 animate-pulse rounded-full bg-slate-800/60" />
          <div className="h-24 animate-pulse rounded-md bg-slate-800/60" />
          <div className="h-48 animate-pulse rounded-md bg-slate-800/60" />
        </div>
      </div>
      <div className="mt-8 h-44 animate-pulse rounded-xl border border-slate-800/60 bg-slate-800/40" />
    </main>
  );
}

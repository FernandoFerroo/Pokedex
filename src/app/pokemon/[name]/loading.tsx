export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <div className="h-8 w-36 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
      <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
        <div className="aspect-square animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="flex flex-col gap-4">
          <div className="h-9 w-56 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-7 w-72 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
      <div className="mt-8 h-44 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
    </main>
  );
}

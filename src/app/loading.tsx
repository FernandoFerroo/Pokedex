export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="h-10 flex-1 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-slate-200 sm:w-40 dark:bg-slate-800" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-slate-200 sm:w-48 dark:bg-slate-800" />
      </div>
      <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 18 }, (_, i) => (
          <div
            key={i}
            className="h-56 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
          />
        ))}
      </div>
    </main>
  );
}

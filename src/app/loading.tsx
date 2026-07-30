export default function Loading() {
  return (
    <main
      className="mx-auto max-w-[1440px] space-y-6 p-8"
      aria-label="Memuat dashboard"
    >
      <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-36 animate-pulse rounded-2xl bg-slate-200"
          />
        ))}
      </div>
    </main>
  );
}

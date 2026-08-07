export default function AdminLoading() {
  return (
    <main className="admin-grid-background min-h-[calc(100vh-3.5rem)] bg-[#090a0d] px-4 py-7 text-slate-100 sm:px-6 lg:px-10 lg:py-9">
      <div
        className="mx-auto max-w-7xl animate-pulse"
        aria-label="Loading administration workspace"
        role="status"
      >
        <div className="h-3 w-40 rounded bg-white/10" />
        <div className="mt-5 h-10 w-72 rounded-lg bg-white/10" />
        <div className="mt-8 grid overflow-hidden rounded-xl border border-white/10 bg-[#111318] sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div className="h-32 border-white/10 p-5 sm:border-l" key={item}>
              <div className="h-3 w-24 rounded bg-white/10" />
              <div className="mt-6 h-8 w-16 rounded bg-white/10" />
            </div>
          ))}
        </div>
        <div className="mt-6 min-h-96 rounded-xl border border-white/10 bg-[#111318]" />
        <span className="sr-only">Loading…</span>
      </div>
    </main>
  );
}

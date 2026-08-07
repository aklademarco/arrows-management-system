export default function MemberLoading() {
  return (
    <main className="min-h-screen bg-[#f8f7fb] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
      <div
        className="mx-auto max-w-6xl animate-pulse"
        aria-label="Loading member workspace"
        role="status"
      >
        <div className="h-4 w-36 rounded-full bg-purple-100" />
        <div className="mt-3 h-10 w-72 max-w-full rounded-2xl bg-slate-200" />
        <div className="mt-3 h-4 w-96 max-w-full rounded-full bg-slate-100" />
        <div className="mt-8 grid gap-5 lg:grid-cols-[1.18fr_0.82fr]">
          <div className="min-h-96 rounded-[2rem] bg-gradient-to-br from-[#6b21a8] to-[#9c4dcc]" />
          <div className="min-h-96 rounded-[2rem] border border-purple-100 bg-white p-7">
            <div className="h-5 w-28 rounded-full bg-purple-100" />
            <div className="mt-5 h-8 w-44 rounded-xl bg-slate-200" />
            <div className="mt-12 grid grid-cols-3 gap-4">
              {[0, 1, 2].map((item) => (
                <div
                  className="mx-auto size-20 rounded-full bg-slate-100"
                  key={item}
                />
              ))}
            </div>
          </div>
        </div>
        <span className="sr-only">Loading…</span>
      </div>
    </main>
  );
}

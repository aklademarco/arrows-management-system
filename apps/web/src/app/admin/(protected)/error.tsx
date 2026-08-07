"use client";

import Link from "next/link";
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-[calc(100vh-3.5rem)] place-items-center bg-[#090a0d] px-5 py-12 text-slate-100">
      <section className="w-full max-w-lg rounded-xl border border-white/10 bg-[#111318] p-8 text-center shadow-2xl">
        <span className="mx-auto grid size-14 place-items-center rounded-lg bg-amber-400/10 text-2xl text-amber-300">
          <FiAlertTriangle />
        </span>
        <h1 className="mt-5 text-2xl font-semibold">Workspace unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          The requested administration data could not be loaded. Retry the
          request or return to the overview.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-500 px-5 text-sm font-semibold"
            onClick={reset}
          >
            <FiRefreshCw /> Retry
          </button>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-lg border border-white/10 px-5 text-sm font-semibold text-slate-300"
            href="/admin/dashboard"
          >
            Return to overview
          </Link>
        </div>
      </section>
    </main>
  );
}

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
    <main className="grid min-h-[calc(100vh-3.5rem)] place-items-center bg-[#e9edee] px-5 py-12 text-[#252b2d]">
      <section className="w-full max-w-lg rounded-xl border border-[#dce3e4] bg-white/70 p-8 text-center shadow-2xl">
        <span className="mx-auto grid size-14 place-items-center rounded-lg bg-amber-50 text-2xl text-amber-800">
          <FiAlertTriangle />
        </span>
        <h1 className="mt-5 text-2xl font-semibold">Workspace unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The requested administration data could not be loaded. Retry the
          request or return to the overview.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#242929] text-white px-5 text-sm font-semibold"
            onClick={reset}
          >
            <FiRefreshCw /> Retry
          </button>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#dce3e4] px-5 text-sm font-semibold text-slate-700"
            href="/admin/dashboard"
          >
            Return to overview
          </Link>
        </div>
      </section>
    </main>
  );
}

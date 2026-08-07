"use client";

import Link from "next/link";
import { FiRefreshCw, FiWifiOff } from "react-icons/fi";

export default function MemberError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-[calc(100vh-4rem)] place-items-center bg-[#f8f7fb] px-5 py-12 text-slate-950">
      <section className="w-full max-w-md rounded-[2rem] border border-purple-100 bg-white p-8 text-center shadow-[0_24px_70px_rgba(76,22,119,0.1)]">
        <span className="mx-auto grid size-20 place-items-center rounded-[1.6rem] bg-amber-100 text-4xl text-amber-700">
          <FiWifiOff />
        </span>
        <h1 className="mt-6 text-3xl font-black tracking-[-0.04em]">
          We couldn’t load this
        </h1>
        <p className="mt-3 leading-7 text-slate-500">
          Check your connection and try again. Your saved church activity is
          safe.
        </p>
        <button
          className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#6b21a8] font-extrabold text-white shadow-[0_6px_0_#4c1677]"
          onClick={reset}
        >
          <FiRefreshCw /> Try again
        </button>
        <Link
          className="mt-5 inline-flex text-sm font-extrabold text-[#6b21a8]"
          href="/member"
        >
          Return home
        </Link>
      </section>
    </main>
  );
}

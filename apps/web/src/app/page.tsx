import Link from "next/link";

export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center bg-emerald-950 px-6 text-white">
      <section className="max-w-3xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Arrows Church</p>
        <h1 className="mt-5 text-5xl font-bold tracking-tight sm:text-7xl">Church life, organized.</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-emerald-100">
          A secure home for member records, departments, events, attendance, and service growth.
        </p>
        <Link
          className="mt-10 inline-flex h-12 items-center rounded-xl bg-amber-400 px-7 font-bold text-emerald-950 transition hover:bg-amber-300"
          href="/register"
        >
          Create member account
        </Link>
      </section>
    </main>
  );
}

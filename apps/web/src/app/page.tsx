import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#240046] px-6 text-white">
      <section className="max-w-3xl text-center">
        <div className="inline-flex items-center justify-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border-[3px] border-white p-1">
            <Image
              src="/apple-touch-icon.png"
              alt=""
              width={180}
              height={180}
              className="size-full object-contain"
              priority
            />
          </span>
          <p className="text-left text-sm font-bold uppercase tracking-[0.22em] text-amber-300">
            Love Community Chapel Youth Ministry-Arrows
          </p>
        </div>
        <h1 className="mt-5 text-5xl font-bold tracking-tight sm:text-7xl">
          Church life, organized.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#eadcff]">
          A secure home for member records, departments, events, attendance, and
          service growth.
        </p>
        <Link
          className="mt-10 inline-flex h-12 items-center rounded-xl bg-amber-400 px-7 font-bold text-[#240046] transition hover:bg-amber-300"
          href="/register"
        >
          Create member account
        </Link>
      </section>
    </main>
  );
}

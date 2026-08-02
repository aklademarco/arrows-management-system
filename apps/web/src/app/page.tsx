import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#240046] px-6 text-white">
      <section className="max-w-3xl text-center">
        <div className="inline-flex flex-col items-center justify-center gap-4">
          <span className="grid shrink-0 place-items-center rounded-full border-[3px] border-white p-3">
            <span className="grid size-40 place-items-center overflow-hidden rounded-full bg-white">
              <Image
                src="/assets/logo.jpg"
                alt=""
                width={1080}
                height={1057}
                className="size-full scale-125 object-cover"
                priority
              />
            </span>
          </span>
          <p className="text-center text-sm font-bold uppercase tracking-[0.22em] text-amber-300">
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
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link className="inline-flex h-12 items-center rounded-lg bg-amber-400 px-7 font-bold text-[#240046] transition hover:bg-amber-300" href="/login">Member sign in</Link>
          <Link className="inline-flex h-12 items-center rounded-lg border border-white px-7 font-bold text-white transition hover:bg-white/10" href="/register">Create member account</Link>
        </div>
      </section>
    </main>
  );
}

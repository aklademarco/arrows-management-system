import Image from "next/image";
import Link from "next/link";
import { Fraunces, DM_Sans } from "next/font/google";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});
const body = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const SLIDES = [
  { src: "/images/worship-congregation.jpg", pos: "50% 35%" },
  { src: "/images/worship-leader.jpg", pos: "60% 50%" },
  { src: "/images/worship-hands.jpg", pos: "50% 30%" },
  { src: "/images/worship-procession.jpg", pos: "55% 40%" },
];

export default function AuthLanding() {
  return (
    <div
      className={`${body.className} fixed inset-0 overflow-hidden bg-night text-ink
                  pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]`}
    >
      {/* Background slideshow */}
      <div className="absolute inset-0" aria-hidden="true">
        {SLIDES.map((s, i) => (
          <div
            key={s.src}
            className={`absolute inset-0 animate-slide opacity-0 motion-reduce:animate-none
                        ${i === 0 ? "motion-reduce:opacity-100" : ""}`}
            style={{ animationDelay: `${i * 6}s` }}
          >
            <Image
              src={s.src}
              alt=""
              fill
              sizes="100vw"
              priority={i === 0}
              className="object-cover"
              style={{ objectPosition: s.pos }}
            />
          </div>
        ))}
        {/* Readability gradient: bottom on mobile, left on desktop */}
        <div
          className="absolute inset-0
                     bg-[linear-gradient(to_top,rgba(7,11,24,.97)_0%,rgba(7,11,24,.8)_38%,rgba(7,11,24,.15)_70%,rgba(7,11,24,.45)_100%)]
                     min-[900px]:bg-[linear-gradient(to_right,rgba(7,11,24,.97)_0%,rgba(7,11,24,.88)_34%,rgba(7,11,24,.1)_70%)]"
        />
      </div>

      {/* Content */}
      <main
        className="relative z-10 flex h-full max-w-[560px] flex-col justify-between
                   px-6 pt-5.5 pb-7 min-[900px]:max-w-[640px] min-[900px]:px-16 min-[900px]:py-10"
      >
        {/* Brand */}
        <div
          className={`${display.className} flex items-center gap-2.5 text-xl font-semibold`}
        >
          <span className="grid size-[30px] place-items-center rounded-[9px] bg-gradient-to-br from-accent to-glow">
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="#070b18"
              strokeWidth="2.6"
              strokeLinecap="round"
            >
              <path d="M12 3v18M6 9h12" />
            </svg>
          </span>
          Fellowship
        </div>

        <section>
          <p className="mb-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-glow">
            Your church, online
          </p>

          <h1
            className={`${display.className} text-[clamp(34px,9vw,52px)] font-medium leading-[1.06] tracking-tight`}
          >
            Worship together,
            <br />
            wherever you are.
          </h1>

          <p className="mt-3.5 max-w-[42ch] text-base leading-relaxed text-muted">
            Join your church’s own space for live services, announcements and
            community. Private to your congregation.
          </p>

          {/* Actions */}
          <div className="mt-7 grid gap-3 min-[900px]:grid-cols-2">
            <Link
              href="/signup"
              className="flex h-[54px] items-center justify-center rounded-2xl bg-ink text-base font-semibold
                         text-[#0b1020] transition hover:bg-white active:scale-[0.98]
                         focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-glow"
            >
              Create account
            </Link>
            <Link
              href="/signin"
              className="flex h-[54px] items-center justify-center rounded-2xl border-[1.5px] border-white/35
                         bg-white/[0.06] text-base font-semibold text-ink backdrop-blur-md transition
                         hover:bg-white/15 active:scale-[0.98]
                         focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-glow"
            >
              Sign in
            </Link>
          </div>

          {/* Slide progress */}
          <div className="mt-5.5 flex gap-1.5" aria-hidden="true">
            {SLIDES.map((s, i) => (
              <span
                key={s.src}
                className="relative h-[3px] w-[22px] overflow-hidden rounded-sm bg-white/25"
              >
                <span
                  className="absolute inset-0 origin-left scale-x-0 bg-ink animate-bar motion-reduce:animate-none"
                  style={{ animationDelay: `${i * 6}s` }}
                />
              </span>
            ))}
          </div>

          <p className="mt-4 text-[12.5px] leading-normal text-[#9aa0b4]">
            By continuing you agree to our Terms and Privacy Policy.
          </p>
        </section>
      </main>
    </div>
  );
}

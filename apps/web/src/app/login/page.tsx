import Image from "next/image";
import Link from "next/link";
import { FiActivity, FiCheckCircle, FiMapPin } from "react-icons/fi";
import MemberLoginForm from "./login-form";

export default function MemberLoginPage() {
  return (
    <main className="min-h-screen bg-[#f8f7fb] p-3 text-slate-950 sm:p-5 lg:grid lg:place-items-center">
      <section className="mx-auto grid min-h-[calc(100vh-1.5rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-purple-100 bg-white shadow-[0_30px_90px_rgba(76,22,119,0.14)] sm:min-h-[calc(100vh-2.5rem)] lg:min-h-[720px] lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative isolate hidden overflow-hidden bg-gradient-to-br from-[#4c1677] via-[#6b21a8] to-[#9333ea] p-10 text-white lg:flex lg:flex-col xl:p-14">
          <div
            aria-hidden="true"
            className="absolute -right-28 -top-24 -z-10 size-96 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-32 -left-28 -z-10 size-96 rounded-full bg-[#b7f34a]/15 blur-2xl"
          />
          <Brand />
          <div className="my-auto py-14">
          <h2 className="max-w-md text-5xl font-black leading-[1.04] tracking-[-0.055em]">
              Show up.
              <br />
              Keep growing.
              <br />
              <span className="text-[#d5ff85]">Serve together.</span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-7 text-purple-100">
              Check in securely, follow your attendance progress, and stay
              connected to every event and department.
            </p>
            <div className="mt-9 grid gap-3">
              <Feature icon={FiMapPin} label="Secure location check-in" />
              <Feature
                icon={FiActivity}
                label="Progress, points, and streaks"
              />
              <Feature icon={FiCheckCircle} label="One clear service history" />
            </div>
          </div>
          <p className="text-xs font-semibold text-purple-200">
            The Arrows Church · Accra
          </p>
        </div>
        <div className="flex flex-col px-6 py-7 sm:px-10 sm:py-10 lg:px-16 lg:py-12 xl:px-20">
          <div className="flex items-center justify-between lg:justify-end">
            <div className="lg:hidden">
              <Brand dark />
            </div>
            <Link className="text-sm font-extrabold text-[#6b21a8]" href="/">
              Church home
            </Link>
          </div>
          <div className="my-auto w-full py-12">
            <div className="mx-auto max-w-md">
              <p className="text-sm font-extrabold text-[#6b21a8]">
                Welcome back
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] sm:text-5xl">
                Sign in to ACMS
              </h1>
              <p className="mt-3 leading-7 text-slate-500">
                Continue your attendance journey and see what’s happening at
                church.
              </p>
              <MemberLoginForm />
              <div className="mt-7 border-t border-slate-100 pt-6 text-center">
                <p className="text-sm font-medium text-slate-500">
                  New to Arrows ACMS?
                </p>
                <Link
                  className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-2xl border-2 border-purple-100 font-extrabold text-[#6b21a8] transition hover:border-purple-200 hover:bg-purple-50"
                  href="/register"
                >
                  Create member account
                </Link>
                <Link
                  className="mt-4 inline-flex text-sm font-bold text-slate-500 hover:text-[#6b21a8]"
                  href="/account-status"
                >
                  Already registered? Check approval status →
                </Link>
              </div>
            </div>
          </div>
          <p className="text-center text-xs font-medium text-slate-400">
            By signing in, you’re accessing your private church member account.
          </p>
        </div>
      </section>
    </main>
  );
}

function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <Link className="flex items-center gap-3" href="/">
      <span className="grid size-11 place-items-center rounded-2xl bg-white">
        <Image
          alt="The Arrows"
          height={38}
          src="/assets/arrows.PNG"
          width={38}
        />
      </span>
      <span>
        <span
          className={`block font-black ${dark ? "text-[#240046]" : "text-white"}`}
        >
          Arrows ACMS
        </span>
        <span
          className={`text-xs font-semibold ${dark ? "text-slate-400" : "text-purple-200"}`}
        >
          Member experience
        </span>
      </span>
    </Link>
  );
}

function Feature({
  icon: Icon,
  label,
}: {
  icon: typeof FiMapPin;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm font-extrabold">
      <span className="grid size-9 place-items-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/10">
        <Icon />
      </span>
      {label}
    </div>
  );
}

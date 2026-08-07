import Image from "next/image";
import Link from "next/link";
import { FiArrowLeft, FiCheck, FiShield } from "react-icons/fi";
import { AdminLoginForm } from "./login-form";

export const metadata = {
  title: "Administrator sign in",
  description: "Secure administrator access for ACMS.",
};

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[0.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="admin-grid-background absolute inset-0 opacity-30" />
        <div className="absolute -left-32 top-1/3 size-96 rounded-full bg-[#6b21a8]/30 blur-3xl" />
        <div className="relative">
          <Link className="inline-flex items-center gap-3" href="/">
            <span className="grid size-10 place-items-center overflow-hidden rounded-xl bg-white">
              <Image alt="" className="size-full object-cover" height={80} src="/assets/logo.jpg" width={80} />
            </span>
            <span className="font-semibold">Arrows ACMS</span>
          </Link>
        </div>

        <div className="relative max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-300">Church operations workspace</p>
          <h1 className="mt-5 text-5xl font-semibold tracking-[-0.055em] xl:text-6xl">Quiet tools for meaningful work.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-400">Review people, plan events, and manage attendance from one focused administration space.</p>
          <div className="mt-9 grid gap-3 text-sm text-slate-300">
            <p className="flex items-center gap-3"><span className="grid size-6 place-items-center rounded-full bg-white/10 text-emerald-300"><FiCheck aria-hidden="true" /></span> Secure role-based access</p>
            <p className="flex items-center gap-3"><span className="grid size-6 place-items-center rounded-full bg-white/10 text-emerald-300"><FiCheck aria-hidden="true" /></span> Mobile-ready church workflows</p>
            <p className="flex items-center gap-3"><span className="grid size-6 place-items-center rounded-full bg-white/10 text-emerald-300"><FiCheck aria-hidden="true" /></span> Clear attendance operations</p>
          </div>
        </div>

        <p className="relative text-xs text-slate-500">Arrows Church Management System</p>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-[#fafafa] px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-950 lg:hidden" href="/"><FiArrowLeft aria-hidden="true" /> Church home</Link>
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm"><FiShield aria-hidden="true" /></span>
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Administrator access</p><p className="text-sm font-medium text-slate-700">Protected workspace</p></div>
          </div>
          <h2 className="mt-8 text-4xl font-semibold tracking-[-0.05em] text-slate-950">Welcome back</h2>
          <p className="mt-3 leading-7 text-slate-500">Enter your administrator account details to continue.</p>
          <AdminLoginForm />
          <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-5 text-xs text-slate-400">
            <span>ACMS secure sign-in</span>
            <Link className="font-medium text-slate-600 hover:text-slate-950" href="/">Return home</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

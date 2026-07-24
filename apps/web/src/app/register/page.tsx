import Link from "next/link";
import { RegistrationForm } from "./registration-form";

export const metadata = {
  title: "Register | Arrows Church",
  description: "Create an Arrows Church member account.",
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#d1fae5,_transparent_36%),linear-gradient(135deg,#f8fafc,#ecfdf5)] px-5 py-10 sm:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-emerald-950/10 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="bg-emerald-950 p-8 text-white sm:p-12">
          <Link className="inline-flex items-center gap-3 font-bold" href="/">
            <span className="grid size-10 place-items-center rounded-xl bg-amber-400 text-lg text-emerald-950">A</span>
            Arrows Church
          </Link>
          <div className="mt-20">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">Member registration</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight">Serve, grow, and stay connected.</h1>
            <p className="mt-5 max-w-sm leading-7 text-emerald-100">
              Create your member account to access attendance, events, departments, and your service history.
            </p>
          </div>
        </section>
        <section className="p-7 sm:p-12">
          <h2 className="text-3xl font-bold tracking-tight text-slate-950">Create your account</h2>
          <p className="mt-2 mb-8 text-slate-600">Enter your details exactly as you use them at church.</p>
          <RegistrationForm />
        </section>
      </div>
    </main>
  );
}

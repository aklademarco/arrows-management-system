import Link from "next/link";
import MemberLoginForm from "./login-form";

export default function MemberLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#240046] px-5 py-12">
      <section className="w-full max-w-md rounded-lg bg-white p-8 shadow-2xl sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#6b21a8]">
          Arrows members
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">
          Member sign in
        </h1>
        <p className="mt-2 leading-7 text-slate-600">
          Access attendance, events, departments, and your service history.
        </p>
        <MemberLoginForm />
        <Link
          className="mt-4 inline-flex text-sm font-semibold text-[#6b21a8]"
          href="/forgot-password"
        >
          Forgot your password?
        </Link>
        <Link
          className="ml-4 mt-4 inline-flex text-sm font-semibold text-[#6b21a8]"
          href="/account-status"
        >
          Check approval status
        </Link>
        <div className="mt-6 flex justify-between gap-4 text-sm font-semibold text-[#6b21a8]">
          <Link href="/">Church home</Link>
          <Link href="/register">Create account</Link>
        </div>
      </section>
    </main>
  );
}

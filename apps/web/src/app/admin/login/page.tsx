import Link from "next/link";
import { AdminLoginForm } from "./login-form";

export const metadata = {
  title: "Administrator sign in",
  description: "Secure administrator access for ACMS.",
};

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#240046] px-5 py-12">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#6b21a8]">
          ACMS Administration
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          Welcome back
        </h1>
        <p className="mt-2 leading-7 text-slate-600">
          Sign in to review registrations and manage church operations.
        </p>
        <AdminLoginForm />
        <Link
          className="mt-6 inline-flex text-sm font-semibold text-[#6b21a8] hover:underline"
          href="/"
        >
          Return to church home
        </Link>
      </section>
    </main>
  );
}

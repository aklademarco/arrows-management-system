import Link from "next/link";
import MemberLoginForm from "./login-form";

export default function MemberLoginPage() {
  return (
    <main className="auth-shell flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#fbf9fd,#f3f0ff)] p-6 text-slate-950 sm:p-8">
      <section className="mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-[0_30px_90px_rgba(76,22,119,0.14)] p-8 sm:p-12 lg:min-h-140">
        <div className="flex flex-col items-center px-6 py-6 sm:px-8 sm:py-8">
         
          <div className="w-full py-8">
            <div className="mx-auto max-w-md text-center sm:text-left">
              <p className="text-sm font-extrabold text-[#6b21a8]">
                Welcome back
              </p>
              <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-5xl">
                Sign in here
              </h1>
              <div className="mt-6">
                <MemberLoginForm />
              </div>
              <div className="mt-7 border-t border-slate-100 pt-6 text-center sm:text-left">
                <Link
                  className="mt-4 inline-flex text-sm underline  text-slate-500 hover:text-[#6b21a8]"
                  href="/register"
                >
                  New Here? Create member account
                </Link>
                <Link
                  className="mt-4 inline-flex text-sm underline text-slate-500 hover:text-[#6b21a1]"
                  href="/account-status"
                >
                  Already registered? Check approval status...
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}





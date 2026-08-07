"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { FiEye, FiEyeOff, FiLock, FiLogIn, FiMail } from "react-icons/fi";
import { memberLogin, type MemberLoginState } from "./actions";

const initialState: MemberLoginState = { message: "" };

export default function MemberLoginForm() {
  const [state, formAction, pending] = useActionState(
    memberLogin,
    initialState,
  );
  const [passwordVisible, setPasswordVisible] = useState(false);
  return (
    <form action={formAction} className="mt-8 grid gap-5" noValidate>
      <label className="grid gap-2 text-sm font-extrabold text-slate-800">
        Email address
        <span className="relative">
          <FiMail
            aria-hidden="true"
            className="absolute left-4 top-4 text-slate-400"
          />
          <input
            aria-invalid={Boolean(state.errors?.email)}
            autoComplete="email"
            className="h-13 w-full rounded-2xl border border-slate-200 bg-[#fbfafc] pl-11 pr-4 text-base outline-none transition focus:border-[#6b21a8] focus:bg-white focus:ring-4 focus:ring-purple-100"
            name="email"
            required
            type="email"
          />
        </span>
        {state.errors?.email ? (
          <span className="text-sm font-semibold text-red-700">
            {state.errors.email[0]}
          </span>
        ) : null}
      </label>
      <label className="grid gap-2 text-sm font-extrabold text-slate-800">
        <span className="flex items-center justify-between">
          Password
          <Link
            className="text-xs font-extrabold text-[#6b21a8] hover:underline"
            href="/forgot-password"
          >
            Forgot password?
          </Link>
        </span>
        <span className="relative">
          <FiLock
            aria-hidden="true"
            className="absolute left-4 top-4 text-slate-400"
          />
          <input
            aria-invalid={Boolean(state.errors?.password)}
            autoComplete="current-password"
            className="h-13 w-full rounded-2xl border border-slate-200 bg-[#fbfafc] pl-11 pr-12 text-base outline-none transition focus:border-[#6b21a8] focus:bg-white focus:ring-4 focus:ring-purple-100"
            name="password"
            required
            type={passwordVisible ? "text" : "password"}
          />
          <button
            aria-label={passwordVisible ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-2xl text-xl text-slate-400 hover:text-[#6b21a8]"
            onClick={() => setPasswordVisible((value) => !value)}
            type="button"
          >
            {passwordVisible ? (
              <FiEyeOff aria-hidden="true" />
            ) : (
              <FiEye aria-hidden="true" />
            )}
          </button>
        </span>
        {state.errors?.password ? (
          <span className="text-sm font-semibold text-red-700">
            {state.errors.password[0]}
          </span>
        ) : null}
      </label>
      {state.message ? (
        <p
          className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}
      <button
        className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-[#6b21a8] px-6 font-extrabold text-white shadow-[0_6px_0_#4c1677] transition hover:bg-[#7e22ce] active:translate-y-1 active:shadow-[0_2px_0_#4c1677] disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
        disabled={pending}
        type="submit"
      >
        <FiLogIn aria-hidden="true" />
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

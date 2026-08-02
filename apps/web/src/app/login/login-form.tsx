"use client";

import { useActionState, useState } from "react";
import { FiEye, FiEyeOff, FiLogIn } from "react-icons/fi";
import { memberLogin, type MemberLoginState } from "./actions";

const initialState: MemberLoginState = { message: "" };

export default function MemberLoginForm() {
  const [state, formAction, pending] = useActionState(memberLogin, initialState);
  const [passwordVisible, setPasswordVisible] = useState(false);
  return (
    <form action={formAction} className="mt-7 grid gap-5" noValidate>
      <label className="grid gap-2 text-sm font-semibold text-slate-800">
        Email address
        <input className="h-12 rounded-lg border border-slate-300 px-4" name="email" type="email" autoComplete="email" aria-invalid={Boolean(state.errors?.email)} required />
        {state.errors?.email ? <span className="text-red-700">{state.errors.email[0]}</span> : null}
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-800">
        Password
        <span className="relative">
          <input className="h-12 w-full rounded-lg border border-slate-300 px-4 pr-12" name="password" type={passwordVisible ? "text" : "password"} autoComplete="current-password" aria-invalid={Boolean(state.errors?.password)} required />
          <button className="absolute inset-y-0 right-0 grid w-12 place-items-center text-xl text-slate-500" onClick={() => setPasswordVisible((value) => !value)} type="button" aria-label={passwordVisible ? "Hide password" : "Show password"}>{passwordVisible ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}</button>
        </span>
        {state.errors?.password ? <span className="text-red-700">{state.errors.password[0]}</span> : null}
      </label>
      {state.message ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{state.message}</p> : null}
      <button className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#240046] px-6 font-bold text-white disabled:opacity-60" disabled={pending} type="submit"><FiLogIn aria-hidden="true" />{pending ? "Signing in..." : "Sign in"}</button>
    </form>
  );
}

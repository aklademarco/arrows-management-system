"use client";

import { useActionState, useState } from "react";
import { FiEye, FiEyeOff, FiLogIn } from "react-icons/fi";
import { adminLogin, type AdminLoginState } from "./actions";

const initialState: AdminLoginState = { message: "" };

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminLogin, initialState);
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <form action={formAction} className="mt-8 grid gap-5" noValidate>
      <div className="grid gap-2">
        <label className="text-sm font-semibold text-slate-800" htmlFor="email">
          Email address
        </label>
        <input
          className="h-12 rounded-xl border border-slate-300 px-4 outline-none transition focus:border-[#240046] focus:ring-4 focus:ring-[#eadcff]"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(state.errors?.email)}
        />
        {state.errors?.email && (
          <p className="text-sm text-red-700">{state.errors.email[0]}</p>
        )}
      </div>
      <div className="grid gap-2">
        <label
          className="text-sm font-semibold text-slate-800"
          htmlFor="password"
        >
          Password
        </label>
        <div className="relative">
          <input
            className="h-12 w-full rounded-xl border border-slate-300 px-4 pr-12 outline-none transition focus:border-[#240046] focus:ring-4 focus:ring-[#eadcff]"
            id="password"
            name="password"
            type={passwordVisible ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-invalid={Boolean(state.errors?.password)}
          />
          <button
            className="absolute inset-y-0 right-0 grid w-12 place-items-center text-xl text-slate-500 hover:text-[#240046]"
            type="button"
            aria-label={passwordVisible ? "Hide password" : "Show password"}
            onClick={() => setPasswordVisible((visible) => !visible)}
          >
            {passwordVisible ? (
              <FiEyeOff aria-hidden="true" />
            ) : (
              <FiEye aria-hidden="true" />
            )}
          </button>
        </div>
        {state.errors?.password && (
          <p className="text-sm text-red-700">{state.errors.password[0]}</p>
        )}
      </div>
      {state.message && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
          {state.message}
        </p>
      )}
      <button
        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#240046] px-6 font-bold text-white transition hover:bg-[#17002e] disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        <FiLogIn aria-hidden="true" />
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

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
        <label className="text-sm font-medium text-slate-800" htmlFor="email">
          Email address
        </label>
        <input
          className="h-12 rounded-lg border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
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
          className="text-sm font-medium text-slate-800"
          htmlFor="password"
        >
          Password
        </label>
        <div className="relative">
          <input
            className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 pr-12 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
            id="password"
            name="password"
            type={passwordVisible ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-invalid={Boolean(state.errors?.password)}
          />
          <button
            className="absolute inset-y-0 right-0 grid w-12 place-items-center text-lg text-slate-400 hover:text-slate-950"
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
        <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {state.message}
        </p>
      )}
      <button
        className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-slate-950 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        <FiLogIn aria-hidden="true" />
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

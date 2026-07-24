"use client";

import { useActionState } from "react";
import { register, type RegistrationState } from "./actions";

const initialState: RegistrationState = { success: false, message: "" };

function Field({
  id,
  label,
  type = "text",
  autoComplete,
  required,
  error,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  error?: string[];
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-slate-800" htmlFor={id}>
        {label}
      </label>
      <input
        className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-700">
          {error[0]}
        </p>
      )}
    </div>
  );
}

export function RegistrationForm() {
  const [state, formAction, pending] = useActionState(register, initialState);

  if (state.success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-950" role="status">
        <p className="text-lg font-bold">Your registration was received.</p>
        <p className="mt-2 leading-7">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="firstName" label="First name" autoComplete="given-name" required error={state.errors?.firstName} />
        <Field id="lastName" label="Last name" autoComplete="family-name" required error={state.errors?.lastName} />
      </div>
      <Field id="otherNames" label="Other names (optional)" autoComplete="additional-name" error={state.errors?.otherNames} />
      <Field id="email" label="Email address" type="email" autoComplete="email" required error={state.errors?.email} />
      <Field id="phone" label="Phone number (optional)" type="tel" autoComplete="tel" error={state.errors?.phone} />
      <Field id="password" label="Password" type="password" autoComplete="new-password" required error={state.errors?.password} />
      <Field id="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" required error={state.errors?.confirmPassword} />

      {state.message && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
          {state.message}
        </p>
      )}
      <button
        className="mt-2 h-12 rounded-xl bg-emerald-800 px-5 font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Submitting…" : "Create account"}
      </button>
      <p className="text-center text-sm leading-6 text-slate-600">
        Your account will need email verification and administrator approval before you can sign in.
      </p>
    </form>
  );
}

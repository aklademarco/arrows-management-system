"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
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
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-slate-800" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          className={`h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-[#240046] focus:ring-4 focus:ring-[#eadcff] ${
            isPassword ? "pr-12" : ""
          }`}
          id={id}
          name={id}
          type={isPassword && passwordVisible ? "text" : type}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {isPassword && (
          <button
            className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-xl text-slate-500 transition hover:text-[#240046] focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#240046]"
            type="button"
            aria-label={passwordVisible ? "Hide password" : "Show password"}
            aria-pressed={passwordVisible}
            onClick={() => setPasswordVisible((visible) => !visible)}
          >
            {passwordVisible ? (
              <FiEyeOff aria-hidden="true" />
            ) : (
              <FiEye aria-hidden="true" />
            )}
          </button>
        )}
      </div>
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
      <div role="status">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#6b21a8]">
          Registration successful
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          Thank you for registering.
        </h2>
        <p className="mt-3 leading-7 text-slate-600">
          Your member account has been created. Check your email for the
          verification link before administrator review.
        </p>
        <div className="mt-8 rounded-2xl border border-[#d8b4fe] bg-[#faf5ff] p-6 text-[#240046]">
          <p className="font-bold">What happens next?</p>
          <p className="mt-2 leading-7">
            {state.message} During local development, open Mailpit at{" "}
            <span className="font-semibold">localhost:8025</span> to view the
            message.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="inline-flex h-12 items-center justify-center rounded-xl bg-[#240046] px-6 font-bold text-white transition hover:bg-[#17002e]"
            href="/account-status"
          >
            Check approval status
          </Link>
          <Link
            className="inline-flex h-12 items-center justify-center rounded-xl border border-[#240046] px-6 font-bold text-[#240046] transition hover:bg-[#faf5ff]"
            href="/verify-email/request"
          >
            Request another email
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-3xl font-bold tracking-tight text-slate-950">
        Create your account
      </h2>
      <p className="mt-2 mb-8 text-slate-600">
        Enter your details exactly as you use them at church.
      </p>
      <form action={formAction} className="grid gap-5" noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="firstName"
            label="First name"
            autoComplete="given-name"
            required
            error={state.errors?.firstName}
          />
          <Field
            id="lastName"
            label="Last name"
            autoComplete="family-name"
            required
            error={state.errors?.lastName}
          />
        </div>
        <Field
          id="otherNames"
          label="Other names (optional)"
          autoComplete="additional-name"
          error={state.errors?.otherNames}
        />
        <Field
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          required
          error={state.errors?.email}
        />
        <Field
          id="phone"
          label="Phone number (optional)"
          type="tel"
          autoComplete="tel"
          error={state.errors?.phone}
        />
        <Field
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          error={state.errors?.password}
        />
        <Field
          id="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          error={state.errors?.confirmPassword}
        />

        {state.message && (
          <p
            className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
            role="alert"
          >
            {state.message}
          </p>
        )}
        <button
          className="mt-2 h-12 rounded-xl bg-[#240046] px-5 font-bold text-white transition hover:bg-[#17002e] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Submitting…" : "Create account"}
        </button>
        <p className="text-center text-sm leading-6 text-slate-600">
          Your account will need email verification and administrator approval
          before you can sign in.
        </p>
      </form>
    </>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FiCheckCircle, FiMail } from "react-icons/fi";
import {
  requestVerificationEmail,
  type EmailVerificationState,
} from "../actions";

const initialState: EmailVerificationState = { success: false, message: "" };

export function RequestVerificationForm() {
  const [state, formAction, pending] = useActionState(
    requestVerificationEmail,
    initialState,
  );

  if (state.success) {
    return (
      <div className="text-center" role="status">
        <FiCheckCircle
          className="mx-auto text-6xl text-[#6b21a8]"
          aria-hidden="true"
        />
        <h1 className="mt-5 text-3xl font-bold text-slate-950">
          Check your inbox
        </h1>
        <p className="mt-3 leading-7 text-slate-600">{state.message}</p>
        <p className="mt-2 leading-7 text-slate-600">
          During local development, open Mailpit at localhost:8025.
        </p>
        <Link
          className="mt-8 inline-flex font-semibold text-[#6b21a8] underline-offset-4 hover:underline"
          href="/"
        >
          Return to home
        </Link>
      </div>
    );
  }

  return (
    <>
      <FiMail
        className="text-5xl text-[#6b21a8]"
        aria-hidden="true"
      />
      <h1 className="mt-5 text-3xl font-bold text-slate-950">
        Request a verification email
      </h1>
      <p className="mt-3 leading-7 text-slate-600">
        Enter the email address used for your member registration.
      </p>
      <form action={formAction} className="mt-8 grid gap-5" noValidate>
        <div className="grid gap-2">
          <label className="text-sm font-semibold text-slate-800" htmlFor="email">
            Email address
          </label>
          <input
            className="h-12 rounded-xl border border-slate-300 px-4 text-slate-950 outline-none transition focus:border-[#240046] focus:ring-4 focus:ring-[#eadcff]"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        {state.message && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
            {state.message}
          </p>
        )}
        <button
          className="h-12 rounded-xl bg-[#240046] px-6 font-bold text-white transition hover:bg-[#17002e] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Sending…" : "Send verification email"}
        </button>
      </form>
    </>
  );
}

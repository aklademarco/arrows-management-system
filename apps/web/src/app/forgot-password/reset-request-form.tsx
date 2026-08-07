"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FiCheckCircle, FiMail } from "react-icons/fi";
import { requestPasswordReset, type PasswordResetState } from "./actions";

const initialState: PasswordResetState = { success: false, message: "" };

export function ResetRequestForm() {
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );
  if (state.success)
    return (
      <div className="text-center" role="status">
        <span className="mx-auto grid size-20 place-items-center rounded-[1.6rem] bg-[#efffce] text-4xl text-[#5b8c1b]">
          <FiCheckCircle />
        </span>
        <h1 className="mt-6 text-3xl font-black tracking-[-0.04em]">
          Check your inbox
        </h1>
        <p className="mt-3 leading-7 text-slate-500">{state.message}</p>
        <Link
          className="mt-7 inline-flex font-extrabold text-[#6b21a8]"
          href="/login"
        >
          Return to sign in →
        </Link>
      </div>
    );
  return (
    <>
      <span className="grid size-14 place-items-center rounded-2xl bg-purple-100 text-2xl text-[#6b21a8]">
        <FiMail />
      </span>
      <h1 className="mt-5 text-3xl font-black tracking-[-0.04em]">
        Reset your password
      </h1>
      <p className="mt-2 leading-7 text-slate-500">
        Enter your member email and we’ll send a secure, single-use link.
      </p>
      <form action={action} className="mt-7 grid gap-4" noValidate>
        <label className="grid gap-2 text-sm font-extrabold">
          Email address
          <input
            autoComplete="email"
            className="h-12 rounded-2xl border border-purple-100 bg-[#fbfafc] px-4 font-medium outline-none focus:border-[#6b21a8] focus:ring-4 focus:ring-purple-100"
            name="email"
            required
            type="email"
          />
        </label>
        {state.message ? (
          <p
            className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700"
            role="alert"
          >
            {state.message}
          </p>
        ) : null}
        <button
          className="h-12 rounded-2xl bg-[#6b21a8] font-extrabold text-white shadow-[0_6px_0_#4c1677] active:translate-y-1 active:shadow-[0_2px_0_#4c1677] disabled:opacity-60"
          disabled={pending}
        >
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <Link
        className="mt-6 inline-flex text-sm font-extrabold text-[#6b21a8]"
        href="/login"
      >
        ← Back to sign in
      </Link>
    </>
  );
}

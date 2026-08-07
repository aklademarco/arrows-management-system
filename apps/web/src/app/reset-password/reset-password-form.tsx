"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FiCheckCircle, FiLock } from "react-icons/fi";
import {
  confirmPasswordReset,
  type PasswordResetState,
} from "../forgot-password/actions";

const initialState: PasswordResetState = { success: false, message: "" };

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(
    confirmPasswordReset,
    initialState,
  );
  if (state.success)
    return (
      <div className="text-center" role="status">
        <span className="mx-auto grid size-20 place-items-center rounded-[1.6rem] bg-[#efffce] text-4xl text-[#5b8c1b]">
          <FiCheckCircle />
        </span>
        <h1 className="mt-6 text-3xl font-black tracking-[-0.04em]">
          Password updated
        </h1>
        <p className="mt-3 leading-7 text-slate-500">{state.message}</p>
        <Link
          className="mt-7 inline-flex rounded-2xl bg-[#6b21a8] px-6 py-3 font-extrabold text-white"
          href="/login"
        >
          Sign in now
        </Link>
      </div>
    );
  return (
    <>
      <span className="grid size-14 place-items-center rounded-2xl bg-purple-100 text-2xl text-[#6b21a8]">
        <FiLock />
      </span>
      <h1 className="mt-5 text-3xl font-black tracking-[-0.04em]">
        Choose a new password
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Use 12 or more characters with uppercase, lowercase, number, and special
        characters.
      </p>
      <form action={action} className="mt-7 grid gap-4" noValidate>
        <input name="token" type="hidden" value={token} />
        <PasswordField label="New password" name="password" />
        <PasswordField label="Confirm password" name="passwordConfirmation" />
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
          {pending ? "Updating…" : "Update password"}
        </button>
      </form>
    </>
  );
}

function PasswordField({ label, name }: { label: string; name: string }) {
  return (
    <label className="grid gap-2 text-sm font-extrabold">
      {label}
      <input
        autoComplete="new-password"
        className="h-12 rounded-2xl border border-purple-100 bg-[#fbfafc] px-4 outline-none focus:border-[#6b21a8] focus:ring-4 focus:ring-purple-100"
        minLength={12}
        name={name}
        required
        type="password"
      />
    </label>
  );
}

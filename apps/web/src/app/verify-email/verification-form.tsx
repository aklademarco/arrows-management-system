"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FiAlertCircle, FiCheckCircle, FiMail } from "react-icons/fi";
import { confirmEmail, type EmailVerificationState } from "./actions";

const initialState: EmailVerificationState = { success: false, message: "" };

export function VerificationForm({ token }: { token?: string }) {
  const [state, formAction, pending] = useActionState(
    confirmEmail,
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
          Email verified
        </h1>
        <p className="mt-3 leading-7 text-slate-600">{state.message}</p>
        <p className="mt-2 leading-7 text-slate-600">
          Your registration can now be reviewed by an administrator.
        </p>
        <Link
          className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-[#240046] px-6 font-bold text-white transition hover:bg-[#17002e]"
          href="/account-status"
        >
          Check approval status
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      {token ? (
        <FiMail
          className="mx-auto text-6xl text-[#6b21a8]"
          aria-hidden="true"
        />
      ) : (
        <FiAlertCircle
          className="mx-auto text-6xl text-red-700"
          aria-hidden="true"
        />
      )}
      <h1 className="mt-5 text-3xl font-bold text-slate-950">
        {token ? "Verify your email" : "Verification link missing"}
      </h1>
      <p className="mt-3 leading-7 text-slate-600">
        {token
          ? "Confirm that you want to verify the email address used for your member registration."
          : "Open the complete link from your verification email or request a new one."}
      </p>

      {state.message && (
        <p
          className="mt-6 rounded-xl bg-red-50 p-4 text-left text-sm text-red-800"
          role="alert"
        >
          {state.message}
        </p>
      )}

      {token && (
        <form action={formAction}>
          <input name="token" type="hidden" value={token} />
          <button
            className="mt-8 h-12 w-full rounded-xl bg-[#240046] px-6 font-bold text-white transition hover:bg-[#17002e] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            {pending ? "Verifying…" : "Verify my email"}
          </button>
        </form>
      )}

      <Link
        className="mt-5 inline-flex font-semibold text-[#6b21a8] underline-offset-4 hover:underline"
        href="/verify-email/request"
      >
        Request a new verification email
      </Link>
    </div>
  );
}

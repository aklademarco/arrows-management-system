"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiLock,
  FiMail,
  FiXCircle,
} from "react-icons/fi";
import { checkAccountStatus, type AccountStatusState } from "./actions";

const initialState: AccountStatusState = { success: false, message: "" };

export function StatusForm() {
  const [state, action, pending] = useActionState(
    checkAccountStatus,
    initialState,
  );
  if (state.success) return <StatusResult state={state} />;
  return (
    <>
      <span className="grid size-14 place-items-center rounded-2xl bg-purple-100 text-2xl text-[#6b21a8]">
        <FiClock />
      </span>
      <h1 className="mt-5 text-3xl font-black tracking-[-0.04em]">
        Check your progress
      </h1>
      <p className="mt-2 leading-7 text-slate-500">
        Use your registration details to see where your account is in the
        approval journey.
      </p>
      <form action={action} className="mt-7 grid gap-4" noValidate>
        <Field label="Email address" name="email" type="email" />
        <Field label="Password" name="password" type="password" />
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
          {pending ? "Checking…" : "Check account status"}
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

function StatusResult({ state }: { state: AccountStatusState }) {
  const active = state.accountStatus === "ACTIVE",
    rejected = state.accountStatus === "REJECTED";
  const Icon = active
    ? FiCheckCircle
    : rejected
      ? FiXCircle
      : state.emailVerified
        ? FiClock
        : FiMail;
  const title = active
    ? "You’re approved!"
    : rejected
      ? "Registration not approved"
      : state.emailVerified
        ? "Review in progress"
        : "Verify your email";
  const description = active
    ? "Your member account is ready. You can sign in and start using ACMS."
    : rejected
      ? "Your registration was not approved. Contact the church office if you need more information."
      : state.emailVerified
        ? "Your email is verified and an administrator is reviewing your registration."
        : "Open the verification email we sent before an administrator can review your account.";
  return (
    <div className="text-center" role="status">
      <span
        className={`mx-auto grid size-20 place-items-center rounded-[1.6rem] text-4xl ${active ? "bg-[#efffce] text-[#5b8c1b]" : rejected ? "bg-red-50 text-red-600" : "bg-[#fffc00] text-[#6b4f00]"}`}
      >
        <Icon />
      </span>
      <h1 className="mt-6 text-3xl font-black tracking-[-0.04em]">{title}</h1>
      <p className="mt-3 leading-7 text-slate-500">{description}</p>
      <div className="mt-7 flex flex-col gap-3">
        {active ? (
          <Link
            className="rounded-2xl bg-[#6b21a8] px-6 py-3 font-extrabold text-white"
            href="/login"
          >
            Sign in
          </Link>
        ) : !state.emailVerified ? (
          <Link
            className="rounded-2xl bg-[#6b21a8] px-6 py-3 font-extrabold text-white"
            href="/verify-email/request"
          >
            Resend verification email
          </Link>
        ) : null}
        <Link
          className="text-sm font-extrabold text-[#6b21a8]"
          href="/account-status"
        >
          Check again
        </Link>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type,
}: {
  label: string;
  name: string;
  type: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-extrabold">
      {label}
      <span className="relative">
        <span className="absolute inset-y-0 left-4 grid place-items-center text-slate-400">
          {type === "password" ? <FiLock /> : <FiMail />}
        </span>
        <input
          autoComplete={type === "password" ? "current-password" : "email"}
          className="h-12 w-full rounded-2xl border border-purple-100 bg-[#fbfafc] pl-11 pr-4 outline-none focus:border-[#6b21a8] focus:ring-4 focus:ring-purple-100"
          name={name}
          required
          type={type}
        />
      </span>
    </label>
  );
}

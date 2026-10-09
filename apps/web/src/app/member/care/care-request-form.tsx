"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiHeart,
  FiMessageCircle,
  FiSend,
} from "react-icons/fi";
import {
  submitCareRequest,
  type CareRequestState,
} from "./actions";

const initialState: CareRequestState = { status: "idle", message: "" };

export function CareRequestForm() {
  const [type, setType] = useState<"MESSAGE" | "PRAYER_REQUEST">(
    "PRAYER_REQUEST",
  );
  const [state, action, pending] = useActionState(
    submitCareRequest,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form
      action={action}
      className="rounded-4xl border border-purple-100 bg-white p-5 shadow-[0_18px_45px_rgba(70,40,100,0.07)] sm:p-7"
      ref={formRef}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-purple-100 text-xl text-[#6b21a8]">
          <FiHeart aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-black">How can we support you?</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Your request is shared privately with authorized pastors and care
            administrators.
          </p>
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          Request type
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <RequestTypeChoice
            checked={type === "PRAYER_REQUEST"}
            icon={<FiHeart />}
            label="Prayer request"
            onChange={() => setType("PRAYER_REQUEST")}
            value="PRAYER_REQUEST"
          />
          <RequestTypeChoice
            checked={type === "MESSAGE"}
            icon={<FiMessageCircle />}
            label="Message a pastor"
            onChange={() => setType("MESSAGE")}
            value="MESSAGE"
          />
        </div>
      </fieldset>

      <label className="mt-5 grid gap-2 text-sm font-bold text-slate-700">
        Subject
        <input
          className="h-12 rounded-2xl border border-slate-200 bg-[#fbfafc] px-4 font-medium outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
          maxLength={160}
          minLength={3}
          name="subject"
          placeholder={
            type === "PRAYER_REQUEST"
              ? "What would you like prayer for?"
              : "What would you like to discuss?"
          }
          required
        />
      </label>

      <label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
        Your message
        <textarea
          className="min-h-44 resize-y rounded-2xl border border-slate-200 bg-[#fbfafc] p-4 font-medium leading-6 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
          maxLength={5_000}
          minLength={10}
          name="body"
          placeholder="Share as much as you are comfortable sharing…"
          required
        />
      </label>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold leading-5 text-slate-400">
          This is not posted to the public member directory.
        </p>
        <button
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#6b21a8] px-6 text-sm font-black text-white transition hover:bg-[#581c87] disabled:cursor-wait disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          <FiSend aria-hidden="true" />
          {pending ? "Sending…" : "Send privately"}
        </button>
      </div>

      {state.message ? (
        <p
          className={`mt-4 flex items-start gap-2 rounded-2xl px-4 py-3 text-sm font-bold ${state.status === "success" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.status === "success" ? (
            <FiCheckCircle className="mt-0.5 shrink-0" />
          ) : (
            <FiAlertCircle className="mt-0.5 shrink-0" />
          )}
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function RequestTypeChoice({
  checked,
  icon,
  label,
  onChange,
  value,
}: {
  checked: boolean;
  icon: React.ReactNode;
  label: string;
  onChange: () => void;
  value: "MESSAGE" | "PRAYER_REQUEST";
}) {
  return (
    <label
      className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-3 text-sm font-extrabold transition sm:px-4 ${checked ? "border-purple-400 bg-purple-50 text-[#6b21a8]" : "border-slate-200 bg-white text-slate-500"}`}
    >
      <input
        checked={checked}
        className="sr-only"
        name="type"
        onChange={onChange}
        type="radio"
        value={value}
      />
      <span className="text-lg" aria-hidden="true">
        {icon}
      </span>
      {label}
    </label>
  );
}

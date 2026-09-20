"use client";

import { useActionState, type ReactNode } from "react";
import { FiAlertCircle, FiCheckCircle, FiLoader } from "react-icons/fi";
import {
  updateEvent,
  type EventUpdateState,
} from "../actions";

const initialState: EventUpdateState = { status: "idle", message: "" };

export function EventEditForm({ children }: { children: ReactNode }) {
  const [state, action, pending] = useActionState(updateEvent, initialState);

  return (
    <form
      action={action}
      className="mt-8 grid gap-4 border-y border-white/10 bg-[#111318] px-5 py-6 md:grid-cols-2"
    >
      {children}
      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 font-bold text-white transition hover:bg-violet-500 disabled:cursor-wait disabled:opacity-70"
          disabled={pending}
          type="submit"
        >
          {pending ? <FiLoader aria-hidden="true" className="animate-spin" /> : null}
          {pending ? "Saving…" : "Save changes"}
        </button>
        {state.message ? (
          <p
            aria-live="polite"
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold ${
              state.status === "success"
                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                : "border-red-400/25 bg-red-400/10 text-red-300"
            }`}
            role={state.status === "error" ? "alert" : "status"}
          >
            {state.status === "success" ? (
              <FiCheckCircle aria-hidden="true" />
            ) : (
              <FiAlertCircle aria-hidden="true" />
            )}
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

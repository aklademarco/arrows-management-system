"use client";

import { useActionState, type ReactNode } from "react";
import { FiAlertCircle, FiCheckCircle, FiLoader } from "react-icons/fi";
import Link from "next/link";
import { createEvent, type EventCreateState } from "./actions";

const initialState: EventCreateState = {
  status: "idle",
  message: "",
  eventId: null,
};

export default function EventCreateForm({ children }: { children: ReactNode }) {
  const [state, action, pending] = useActionState(createEvent, initialState);

  return (
    <form action={action} className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {children}
      <div className="flex flex-col gap-3 md:col-span-2 lg:col-span-3 lg:flex-row lg:items-center">
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 font-bold text-white disabled:cursor-wait disabled:opacity-70 md:w-fit"
          disabled={pending}
          type="submit"
        >
          {pending ? <FiLoader className="animate-spin" aria-hidden="true" /> : null}
          {pending ? "Scheduling event…" : "Schedule event"}
        </button>
        {state.status !== "idle" ? (
          <p
            aria-live="polite"
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold ${
              state.status === "success"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                : "border-red-400/30 bg-red-400/10 text-red-300"
            }`}
            role={state.status === "error" ? "alert" : "status"}
          >
            {state.status === "success" ? (
              <FiCheckCircle aria-hidden="true" />
            ) : (
              <FiAlertCircle aria-hidden="true" />
            )}
            {state.message}
            {state.status === "success" && state.eventId ? (
              <Link
                className="ml-1 underline underline-offset-2"
                href={`/admin/events/${state.eventId}`}
              >
                Manage event
              </Link>
            ) : null}
          </p>
        ) : null}
      </div>
    </form>
  );
}

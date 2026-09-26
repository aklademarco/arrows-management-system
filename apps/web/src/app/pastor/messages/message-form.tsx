"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiMessageSquare,
  FiSend,
  FiSmartphone,
  FiUsers,
} from "react-icons/fi";

import { sendPastorMessage, type MessageState } from "./actions";

const initialState: MessageState = {
  status: "idle",
  message: "",
};

export function PastorMessageForm({ smsAvailable }: { smsAvailable: boolean }) {
  const [state, action, pending] = useActionState(
    sendPastorMessage,
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
      className="overflow-hidden rounded-3xl border border-purple-100 bg-white"
      ref={formRef}
    >
      <div className="border-b border-purple-100 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-purple-100 text-xl text-purple-700">
            <FiMessageSquare />
          </span>

          <div>
            <h2 className="text-lg font-black">New Church Message</h2>

            <p className="mt-1 text-sm text-slate-500">
              Send an announcement to the whole church.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-6">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">
            Audience
          </p>

          <div className="flex items-center gap-3 rounded-2xl border border-purple-100 bg-purple-50 p-4">
            <span className="grid size-10 place-items-center rounded-xl bg-white text-purple-700">
              <FiUsers />
            </span>

            <div>
              <p className="text-sm font-black text-slate-900">Whole Church</p>

              <p className="mt-0.5 text-xs text-slate-500">
                All active church members will receive this message.
              </p>
            </div>

            <FiCheckCircle className="ml-auto text-xl text-purple-600" />
          </div>
        </div>

        <label className="grid gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
            Message title
          </span>

          <input
            className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            maxLength={180}
            name="title"
            placeholder="Sunday Service Reminder"
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
            Message
          </span>

          <textarea
            className="min-h-44 resize-y rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            maxLength={5000}
            name="body"
            placeholder="Good evening church family..."
            required
          />
        </label>

        {smsAvailable ? (
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4">
            <input
              className="mt-1 size-4 accent-purple-600"
              name="smsRequested"
              type="checkbox"
            />

            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
              <FiSmartphone />
            </span>

            <span>
              <span className="block text-sm font-black">Also send by SMS</span>

              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Members with a phone number will also receive the message
                through SMS.
              </span>
            </span>
          </label>
        ) : (
          <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-amber-800">
            <FiAlertCircle className="mt-0.5 shrink-0" />

            <p className="text-xs font-bold leading-5">
              SMS is not configured. The message will still be delivered through
              ACMS notifications.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-purple-50 pt-5">
          <p className="text-xs text-slate-400">
            The message will be recorded for accountability.
          </p>

          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 text-sm font-black text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            <FiSend />

            {pending ? "Sending..." : "Send to Church"}
          </button>
        </div>

        {state.message && (
          <div
            className={
              state.status === "success"
                ? "flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
                : "flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700"
            }
            role={state.status === "error" ? "alert" : "status"}
          >
            {state.status === "success" ? <FiCheckCircle /> : <FiAlertCircle />}

            {state.message}
          </div>
        )}
      </div>
    </form>
  );
}

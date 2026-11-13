"use client";

import { useActionState } from "react";

import type { FeedActionState } from "@/app/feed-actions";
import { IDLE_FEED_STATE } from "@/lib/feed";

import { ActionMessage } from "./action-message";

type Action = (
  previous: FeedActionState,
  formData: FormData,
) => Promise<FeedActionState>;

/** A short "why?" form used for reporting and hiding comments. */
export function ReasonForm({
  action,
  fields,
  label,
  placeholder,
  submitLabel,
  pendingLabel,
  tone = "neutral",
  onDone,
  onCancel,
}: {
  action: Action;
  fields: Record<string, string>;
  label: string;
  placeholder: string;
  submitLabel: string;
  pendingLabel: string;
  tone?: "neutral" | "danger";
  onDone?: () => void;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (previous: FeedActionState, formData: FormData) => {
      const result = await action(previous, formData);
      if (result.status === "success") onDone?.();
      return result;
    },
    IDLE_FEED_STATE,
  );

  return (
    <form action={formAction} className="mt-2 grid gap-2">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} name={name} type="hidden" value={value} />
      ))}
      <label className="grid gap-1 text-xs font-medium text-slate-600">
        {label}
        <input
          autoFocus
          className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          maxLength={300}
          minLength={3}
          name="reason"
          placeholder={placeholder}
          required
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button
          className={`inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold text-white disabled:opacity-60 ${tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-slate-900 hover:bg-slate-700"}`}
          disabled={pending}
          type="submit"
        >
          {pending ? pendingLabel : submitLabel}
        </button>
        <button
          className="inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium text-slate-600 hover:bg-slate-100"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <ActionMessage state={state} showSuccess />
      </div>
    </form>
  );
}

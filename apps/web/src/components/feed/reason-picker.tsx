"use client";

import { useActionState, useState } from "react";
import { FiCheckCircle, FiChevronRight } from "react-icons/fi";

import type { FeedActionState } from "@/app/feed-actions";
import { IDLE_FEED_STATE } from "@/lib/feed";

import { SheetHeader, sheetOption } from "./sheet";

type Action = (
  previous: FeedActionState,
  formData: FormData,
) => Promise<FeedActionState>;

const OTHER = "Something else";

/**
 * Tap a reason to send it, Instagram style. "Something else" opens a short
 * text field instead.
 */
export function ReasonPicker({
  action,
  fields,
  title,
  detail,
  reasons,
  doneTitle,
  doneDetail,
  onClose,
}: {
  action: Action;
  fields: Record<string, string>;
  title: string;
  detail?: string;
  reasons: string[];
  /** Shown after success; when omitted the sheet simply closes. */
  doneTitle?: string;
  doneDetail?: string;
  onClose: () => void;
}) {
  const [custom, setCustom] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (previous: FeedActionState, formData: FormData) => {
      const result = await action(previous, formData);
      if (result.status === "success" && !doneTitle) onClose();
      return result;
    },
    IDLE_FEED_STATE,
  );

  const hidden = Object.entries(fields).map(([name, value]) => (
    <input key={name} name={name} type="hidden" value={value} />
  ));

  if (state.status === "success" && doneTitle) {
    return (
      <div className="px-6 pb-2 pt-8 text-center">
        <FiCheckCircle aria-hidden className="mx-auto text-5xl text-black" />
        <h2 className="mt-3 text-lg font-semibold" role="status">
          {doneTitle}
        </h2>
        {doneDetail ? (
          <p className="mt-1 text-sm leading-5 text-slate-500">{doneDetail}</p>
        ) : null}
        <button
          className="mt-6 mb-4 min-h-11 w-full rounded-lg bg-black text-sm font-semibold text-white hover:bg-slate-800"
          onClick={onClose}
          type="button"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div>
      <SheetHeader detail={detail} title={title} />
      {state.status === "error" ? (
        <p className="bg-red-50 px-4 py-2.5 text-center text-sm text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}
      {custom ? (
        <form action={formAction} className="grid gap-3 p-4">
          {hidden}
          <label className="sr-only" htmlFor="custom-reason">
            Tell us more
          </label>
          <textarea
            autoFocus
            className="field-sizing-content min-h-20 w-full resize-none rounded-xl bg-slate-100 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black"
            id="custom-reason"
            maxLength={300}
            minLength={3}
            name="reason"
            placeholder="Tell us more…"
            required
          />
          <button
            className="min-h-11 rounded-lg bg-black text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            {pending ? "Sending…" : "Submit"}
          </button>
        </form>
      ) : (
        <form action={formAction}>
          {hidden}
          {reasons.map((reason) => (
            <button
              className={`${sheetOption()} justify-between text-left`}
              disabled={pending}
              key={reason}
              name="reason"
              type="submit"
              value={reason}
            >
              {reason}
              <FiChevronRight aria-hidden className="text-slate-400" />
            </button>
          ))}
          <button
            className={`${sheetOption()} justify-between text-left`}
            onClick={() => setCustom(true)}
            type="button"
          >
            {OTHER}
            <FiChevronRight aria-hidden className="text-slate-400" />
          </button>
        </form>
      )}
      <button className={sheetOption()} onClick={onClose} type="button">
        Cancel
      </button>
    </div>
  );
}

export const REPORT_REASONS = [
  "It's unkind or hurtful",
  "It's spam or off-topic",
  "It shares someone's private information",
  "It's false or misleading",
];

export const HIDE_REASONS = [
  "Abusive or hurtful language",
  "Spam or off-topic",
  "Shares private information",
  "False or misleading",
];

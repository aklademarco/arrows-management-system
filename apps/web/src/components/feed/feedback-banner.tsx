import { FiAlertCircle, FiCheckCircle } from "react-icons/fi";

import type { FeedFeedback } from "@/lib/feed-data";

export function FeedbackBanner({ feedback }: { feedback: FeedFeedback | null }) {
  if (!feedback) return null;
  const success = feedback.kind === "success";
  return (
    <p
      className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}
      role={success ? "status" : "alert"}
    >
      {success ? (
        <FiCheckCircle aria-hidden className="mt-0.5 shrink-0" />
      ) : (
        <FiAlertCircle aria-hidden className="mt-0.5 shrink-0" />
      )}
      {feedback.message}
    </p>
  );
}

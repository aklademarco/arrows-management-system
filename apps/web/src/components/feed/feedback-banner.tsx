import { FiAlertCircle, FiCheckCircle } from "react-icons/fi";

import type { FeedFeedback } from "@/lib/feed-data";

/** A small toast-style message, e.g. "Your post has been shared". */
export function FeedbackBanner({ feedback }: { feedback: FeedFeedback | null }) {
  if (!feedback) return null;
  const success = feedback.kind === "success";
  return (
    <p
      className={`mx-auto mb-3 flex w-fit max-w-full items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg ${success ? "bg-black text-white" : "bg-red-600 text-white"}`}
      role={success ? "status" : "alert"}
    >
      {success ? (
        <FiCheckCircle aria-hidden className="shrink-0" />
      ) : (
        <FiAlertCircle aria-hidden className="shrink-0" />
      )}
      {feedback.message}
    </p>
  );
}

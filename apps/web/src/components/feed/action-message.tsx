import type { FeedActionState } from "@/app/feed-actions";

/** Inline result of a feed action, announced to screen readers. */
export function ActionMessage({
  state,
  showSuccess = false,
}: {
  state: FeedActionState;
  showSuccess?: boolean;
}) {
  const visible =
    state.status === "error" || (showSuccess && state.status === "success");
  return (
    <p
      aria-live="polite"
      className={
        visible
          ? `text-xs ${state.status === "error" ? "text-red-700" : "text-emerald-700"}`
          : "sr-only"
      }
      role={state.status === "error" ? "alert" : "status"}
    >
      {visible ? state.message : ""}
    </p>
  );
}

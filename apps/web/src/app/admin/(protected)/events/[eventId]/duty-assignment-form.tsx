"use client";
import { useActionState } from "react";
import { assignServiceDuty } from "./liturgy-actions";

export type DutyMember = { id: string; firstName: string; lastName: string };
export function DutyAssignmentForm({
  eventId,
  itemId,
  memberId,
  members,
}: {
  eventId: string;
  itemId: string;
  memberId: string | null;
  members: DutyMember[];
}) {
  const [state, action, pending] = useActionState(assignServiceDuty, {
    message: "",
    success: false,
  });
  return (
    <form action={action} className="mt-3 flex flex-wrap items-end gap-2">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="itemId" value={itemId} />
      <label className="grid gap-1 text-xs text-slate-300">
        Assigned member
        <select
          name="memberId"
          defaultValue={memberId ?? ""}
          disabled={pending}
          className="min-h-11 max-w-60 rounded-lg border border-slate-600 bg-slate-900 px-2 text-sm text-white"
        >
          <option value="">Unassigned</option>
          {memberId && !members.some((member) => member.id === memberId) && (
            <option value={memberId}>
              Current member (no longer eligible)
            </option>
          )}
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.firstName} {member.lastName}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-lg bg-violet-600 px-3 text-xs font-bold disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save assignment"}
      </button>
      {state.message && (
        <p
          role="status"
          className={`w-full text-xs ${state.success ? "text-emerald-300" : "text-red-300"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

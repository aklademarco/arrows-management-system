"use client";

import { useActionState } from "react";
import { saveAttendance, type AttendanceActionState } from "./actions";

const initialState: AttendanceActionState = { status: "idle", message: "" };
export function AttendanceForm({
  eventId,
  memberId,
  attendanceId,
  status,
  memberName,
}: {
  eventId: string;
  memberId: string;
  attendanceId: string | null;
  status: string | null;
  memberName: string;
}) {
  const [state, action, pending] = useActionState(saveAttendance, initialState);
  const present = ["EARLY", "ON_TIME", "LATE"].includes(status ?? "");
  return (
    <form
      action={action}
      aria-label={`Attendance for ${memberName}`}
      className="min-w-0"
    >
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="attendanceId" value={attendanceId ?? ""} />
      <fieldset
        disabled={pending}
        className="grid min-w-0 gap-3 sm:grid-cols-[9rem_minmax(0,1fr)]"
      >
        <label className="grid gap-1 text-sm font-semibold">
          Attendance
          <select
            name="status"
            required
            defaultValue={present ? status! : ""}
            className="min-h-11 min-w-0 rounded-xl border border-[#d4dcdd] bg-white px-3 text-base"
          >
            <option value="" disabled>
              Choose status
            </option>
            <option value="EARLY">Early</option>
            <option value="ON_TIME">On time</option>
            <option value="LATE">Late</option>
            {attendanceId && (
              <>
                <option value="ABSENT">Absent</option>
                <option value="EXCUSED">Excused</option>
              </>
            )}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Reason
          <input
            name="reason"
            required
            minLength={3}
            maxLength={1000}
            placeholder="Why are you updating attendance?"
            className="min-h-11 min-w-0 rounded-xl border border-[#d4dcdd] bg-white px-3 text-base"
          />
        </label>
        <button
          type="submit"
          className="min-h-11 rounded-full bg-[#242929] px-5 font-semibold text-white disabled:opacity-50 sm:col-span-2 sm:justify-self-end"
        >
          {pending
            ? "Saving…"
            : present
              ? "Save correction"
              : "Save attendance"}
        </button>
      </fieldset>
      <p
        role={state.status === "error" ? "alert" : "status"}
        className={`mt-2 text-sm ${state.status === "error" ? "text-red-700" : "text-green-800"}`}
      >
        {state.message}
      </p>
    </form>
  );
}

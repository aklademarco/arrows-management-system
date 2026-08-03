import Link from "next/link";
import { FiArrowLeft, FiAlertTriangle } from "react-icons/fi";
import { getAdminResource } from "../../registrations/admin-api";
import { cancelEvent, finalizeAttendance, updateEvent } from "../actions";

type Event = {
  id: string;
  name: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  attendanceOpensAt: string;
  attendanceClosesAt: string;
  earlyUntil: string | null;
  lateAfter: string;
  locationName: string | null;
  geofenceRadiusMeters: number;
  maximumAccuracyMeters: number;
  status: string;
  cancellationReason: string | null;
  attendanceFinalizedAt: string | null;
};
const inputDate = (value: string | null) => (value ? value.slice(0, 16) : "");

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await getAdminResource<Event>(`/events/${eventId}`);
  const editable = event.status === "DRAFT" || event.status === "SCHEDULED";
  const cancellable = !["CANCELLED", "COMPLETED"].includes(event.status);
  const finalizable =
    !["CANCELLED", "COMPLETED"].includes(event.status) &&
    !event.attendanceFinalizedAt;
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <Link
          className="inline-flex items-center gap-2 font-bold text-[#6b21a8]"
          href="/admin/events"
        >
          <FiArrowLeft aria-hidden="true" />
          Back to events
        </Link>
        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">{event.name}</h1>
            <span className="bg-purple-50 px-3 py-1 text-xs font-bold text-[#6b21a8]">
              {event.status}
            </span>
          </div>
          <p className="mt-2 text-slate-600">
            Manage the event schedule and attendance settings.
          </p>
        </header>
        <Link
          className="mt-5 inline-flex font-bold text-[#6b21a8]"
          href={`/admin/events/${event.id}/attendance`}
        >
          View attendance roster
        </Link>
        {editable ? (
          <form
            action={updateEvent}
            className="mt-8 grid gap-4 border-y border-slate-200 bg-white px-5 py-6 md:grid-cols-2"
          >
            <input name="eventId" type="hidden" value={event.id} />
            <label className="grid gap-1 text-sm font-bold">
              Event name
              <input
                className="h-11 rounded-lg border border-slate-300 px-3 font-normal"
                defaultValue={event.name}
                name="name"
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Location
              <input
                className="h-11 rounded-lg border border-slate-300 px-3 font-normal"
                defaultValue={event.locationName ?? ""}
                name="locationName"
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Starts
              <input
                className="h-11 rounded-lg border border-slate-300 px-3 font-normal"
                defaultValue={inputDate(event.startsAt)}
                name="startsAt"
                type="datetime-local"
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Ends
              <input
                className="h-11 rounded-lg border border-slate-300 px-3 font-normal"
                defaultValue={inputDate(event.endsAt)}
                name="endsAt"
                type="datetime-local"
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Attendance opens
              <input
                className="h-11 rounded-lg border border-slate-300 px-3 font-normal"
                defaultValue={inputDate(event.attendanceOpensAt)}
                name="attendanceOpensAt"
                type="datetime-local"
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Attendance closes
              <input
                className="h-11 rounded-lg border border-slate-300 px-3 font-normal"
                defaultValue={inputDate(event.attendanceClosesAt)}
                name="attendanceClosesAt"
                type="datetime-local"
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Early until
              <input
                className="h-11 rounded-lg border border-slate-300 px-3 font-normal"
                defaultValue={inputDate(event.earlyUntil)}
                name="earlyUntil"
                type="datetime-local"
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Late after
              <input
                className="h-11 rounded-lg border border-slate-300 px-3 font-normal"
                defaultValue={inputDate(event.lateAfter)}
                name="lateAfter"
                type="datetime-local"
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Boundary radius (m)
              <input
                className="h-11 rounded-lg border border-slate-300 px-3 font-normal"
                defaultValue={event.geofenceRadiusMeters}
                name="geofenceRadiusMeters"
                type="number"
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Maximum GPS error (m)
              <input
                className="h-11 rounded-lg border border-slate-300 px-3 font-normal"
                defaultValue={event.maximumAccuracyMeters}
                name="maximumAccuracyMeters"
                type="number"
              />
            </label>
            <label className="grid gap-1 text-sm font-bold md:col-span-2">
              Description
              <textarea
                className="min-h-24 rounded-lg border border-slate-300 p-3 font-normal"
                defaultValue={event.description ?? ""}
                name="description"
              />
            </label>
            <button
              className="h-11 rounded-lg bg-[#240046] px-5 font-bold text-white md:w-fit"
              type="submit"
            >
              Save changes
            </button>
          </form>
        ) : (
          <p className="mt-8 border-y border-slate-200 bg-white px-5 py-6 text-slate-600">
            This event is read-only.
          </p>
        )}
        {cancellable ? (
          <section className="mt-10 border-t border-red-200 pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <FiAlertTriangle aria-hidden="true" />
              <h2 className="text-lg font-bold">Cancel event</h2>
            </div>
            <form action={cancelEvent} className="mt-4 flex max-w-2xl gap-3">
              <input name="eventId" type="hidden" value={event.id} />
              <input
                className="h-11 min-w-0 flex-1 rounded-lg border border-red-200 px-3"
                minLength={3}
                name="reason"
                placeholder="Cancellation reason"
                required
              />
              <button
                className="h-11 rounded-lg bg-red-700 px-5 font-bold text-white"
                type="submit"
              >
                Cancel event
              </button>
            </form>
          </section>
        ) : event.cancellationReason ? (
          <p className="mt-8 text-sm text-red-800">
            Cancellation reason: {event.cancellationReason}
          </p>
        ) : null}
        {finalizable ? (
          <section className="mt-10 border-t border-slate-200 pt-6">
            <h2 className="text-lg font-bold">Finalize attendance</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Create absent records for eligible active members without
              attendance and complete this event.
            </p>
            <form action={finalizeAttendance} className="mt-4">
              <input name="eventId" type="hidden" value={event.id} />
              <button
                className="h-11 rounded-lg bg-green-700 px-5 font-bold text-white"
                type="submit"
              >
                Finalize attendance
              </button>
            </form>
          </section>
        ) : event.attendanceFinalizedAt ? (
          <p className="mt-8 text-sm font-semibold text-green-800">
            Attendance finalized.
          </p>
        ) : null}
      </div>
    </main>
  );
}

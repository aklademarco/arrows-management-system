import Link from "next/link";
import Image from "next/image";
import { FiArrowLeft, FiAlertTriangle, FiClock, FiMonitor } from "react-icons/fi";
import { getAdminResource } from "../../registrations/admin-api";
import { cancelEvent, finalizeAttendance, updateEvent } from "../actions";
import { LiturgyGenerator } from "./liturgy-generator";

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
type Template = { id: string; name: string; recurrenceRule: string; items: { id: string }[] };
type LiturgyItem = { id: string; position: number; title: string; plannedStartAt: string; plannedDurationMinutes: number; ownerLabel: string | null; status: string; showOnProjection: boolean };
type Liturgy = { id: string; preacherName: string | null; sermonTitle: string | null; preacherImageUrl: string | null; projectionEnabled: boolean; items: LiturgyItem[] };
const inputDate = (value: string | null) => (value ? value.slice(0, 16) : "");

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const [event, templates, liturgy] = await Promise.all([
    getAdminResource<Event>(`/events/${eventId}`),
    getAdminResource<Template[]>("/liturgies/templates"),
    getAdminResource<Liturgy | null>(`/liturgies/events/${eventId}`),
  ]);
  const editable = event.status === "DRAFT" || event.status === "SCHEDULED";
  const cancellable = !["CANCELLED", "COMPLETED"].includes(event.status);
  const finalizable =
    !["CANCELLED", "COMPLETED"].includes(event.status) &&
    !event.attendanceFinalizedAt;
  return (
    <main className="min-h-screen bg-[#090a0d] px-5 py-8 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <Link
          className="inline-flex items-center gap-2 font-bold text-violet-400"
          href="/admin/events"
        >
          <FiArrowLeft aria-hidden="true" />
          Back to events
        </Link>
        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">{event.name}</h1>
            <span className="bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-400">
              {event.status}
            </span>
          </div>
          <p className="mt-2 text-slate-400">
            Manage the event schedule and attendance settings.
          </p>
        </header>
        <Link
          className="mt-5 inline-flex font-bold text-violet-400"
          href={`/admin/events/${event.id}/attendance`}
        >
          View attendance roster
        </Link>
        {liturgy ? <Link className="ml-5 mt-5 inline-flex font-bold text-emerald-300" href={`/admin/events/${event.id}/liturgy`}>Open live operator →</Link> : null}
        <section className="mt-8 rounded-2xl border border-white/10 bg-[#111318] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-400">Service production</p><h2 className="mt-1 text-xl font-bold">Event liturgy</h2><p className="mt-2 text-sm text-slate-400">Generate a timed running order from the correct Sunday template.</p></div>{liturgy?.projectionEnabled ? <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300"><FiMonitor /> Projection ready</span> : null}</div>
          {!liturgy ? <LiturgyGenerator eventId={event.id} templates={templates} /> : <div className="mt-5"><div className="flex flex-wrap items-center gap-4 rounded-xl bg-violet-500/[0.08] p-4">{liturgy.preacherImageUrl ? <Image alt={liturgy.preacherName ?? "Preacher"} className="size-20 rounded-xl object-cover" height={80} src={liturgy.preacherImageUrl} unoptimized width={80} /> : null}<div><p className="text-xs font-bold uppercase tracking-wider text-violet-400">Preacher</p><p className="mt-1 font-bold">{liturgy.preacherName ?? "To be announced"}</p>{liturgy.sermonTitle ? <p className="mt-1 text-sm text-slate-400">{liturgy.sermonTitle}</p> : null}</div></div><ol className="mt-4 divide-y divide-white/[0.07]">{liturgy.items.map((item) => <li className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 py-3" key={item.id}><span className="grid size-8 place-items-center rounded-lg bg-violet-500/10 text-xs font-bold text-violet-300">{item.position}</span><div><p className="text-sm font-bold">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.ownerLabel ?? "To be assigned"}{item.showOnProjection ? " · Projected" : ""}</p></div><div className="text-right"><p className="text-xs font-bold text-slate-300">{new Intl.DateTimeFormat("en-GH", { hour: "numeric", minute: "2-digit", timeZone: "Africa/Accra" }).format(new Date(item.plannedStartAt))}</p><p className="mt-1 flex items-center justify-end gap-1 text-[10px] font-bold text-slate-500"><FiClock />{item.plannedDurationMinutes}m</p></div></li>)}</ol></div>}
        </section>
        {editable ? (
          <form
            action={updateEvent}
            className="mt-8 grid gap-4 border-y border-white/10 bg-[#111318] px-5 py-6 md:grid-cols-2"
          >
            <input name="eventId" type="hidden" value={event.id} />
            <label className="grid gap-1 text-sm font-bold">
              Event name
              <input
                className="h-11 rounded-lg border border-white/15 px-3 font-normal"
                defaultValue={event.name}
                name="name"
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Location
              <input
                className="h-11 rounded-lg border border-white/15 px-3 font-normal"
                defaultValue={event.locationName ?? ""}
                name="locationName"
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Starts
              <input
                className="h-11 rounded-lg border border-white/15 px-3 font-normal"
                defaultValue={inputDate(event.startsAt)}
                name="startsAt"
                type="datetime-local"
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Ends
              <input
                className="h-11 rounded-lg border border-white/15 px-3 font-normal"
                defaultValue={inputDate(event.endsAt)}
                name="endsAt"
                type="datetime-local"
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Attendance opens
              <input
                className="h-11 rounded-lg border border-white/15 px-3 font-normal"
                defaultValue={inputDate(event.attendanceOpensAt)}
                name="attendanceOpensAt"
                type="datetime-local"
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Attendance closes
              <input
                className="h-11 rounded-lg border border-white/15 px-3 font-normal"
                defaultValue={inputDate(event.attendanceClosesAt)}
                name="attendanceClosesAt"
                type="datetime-local"
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Early until
              <input
                className="h-11 rounded-lg border border-white/15 px-3 font-normal"
                defaultValue={inputDate(event.earlyUntil)}
                name="earlyUntil"
                type="datetime-local"
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Late after
              <input
                className="h-11 rounded-lg border border-white/15 px-3 font-normal"
                defaultValue={inputDate(event.lateAfter)}
                name="lateAfter"
                type="datetime-local"
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Boundary radius (m)
              <input
                className="h-11 rounded-lg border border-white/15 px-3 font-normal"
                defaultValue={event.geofenceRadiusMeters}
                name="geofenceRadiusMeters"
                type="number"
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Maximum GPS error (m)
              <input
                className="h-11 rounded-lg border border-white/15 px-3 font-normal"
                defaultValue={event.maximumAccuracyMeters}
                name="maximumAccuracyMeters"
                type="number"
              />
            </label>
            <label className="grid gap-1 text-sm font-bold md:col-span-2">
              Description
              <textarea
                className="min-h-24 rounded-lg border border-white/15 p-3 font-normal"
                defaultValue={event.description ?? ""}
                name="description"
              />
            </label>
            <button
              className="h-11 rounded-lg bg-violet-600 px-5 font-bold text-white md:w-fit"
              type="submit"
            >
              Save changes
            </button>
          </form>
        ) : (
          <p className="mt-8 border-y border-white/10 bg-[#111318] px-5 py-6 text-slate-400">
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
          <section className="mt-10 border-t border-white/10 pt-6">
            <h2 className="text-lg font-bold">Finalize attendance</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
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

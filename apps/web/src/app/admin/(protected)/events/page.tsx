import Link from "next/link";
import { FiArrowLeft, FiCalendar, FiFilter, FiMapPin, FiX } from "react-icons/fi";
import { getAdminResource } from "../registrations/admin-api";
import { createEvent } from "./actions";

type Event = {
  id: string;
  name: string;
  eventType: string;
  startsAt: string;
  attendanceOpensAt: string;
  attendanceClosesAt: string;
  status: string;
  locationName: string | null;
};

type RecurringDefault = {
  id: string;
  name: string;
  recurrenceRule: "FIRST_SUNDAY" | "EVERY_SUNDAY";
  startsAtLocal: string;
  durationMinutes: number;
  priority: number;
  isActive: boolean;
};

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ status?: string; from?: string; to?: string }> }) {
  const parameters = await searchParams;
  const query = new URLSearchParams();
  if (parameters.status) query.set("status", parameters.status);
  if (parameters.from) query.set("from", parameters.from);
  if (parameters.to) query.set("to", parameters.to);
  const [events, recurringDefaults] = await Promise.all([
    getAdminResource<Event[]>(`/events?${query.toString()}`),
    getAdminResource<RecurringDefault[]>("/events/recurring-defaults"),
  ]);
  const hasFilters = query.size > 0;

  return (
    <main className="min-h-screen bg-[#090a0d] px-5 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <Link
          className="inline-flex items-center gap-2 font-bold text-violet-400"
          href="/admin/dashboard"
        >
          <FiArrowLeft aria-hidden="true" />
          Back to dashboard
        </Link>
        <header className="mt-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-400">
            Attendance operations
          </p>
          <h1 className="mt-2 text-3xl font-bold">Events</h1>
          <p className="mt-2 text-slate-400">
            Schedule an event and define when eligible members may check in.
          </p>
        </header>

        <section className="mt-8 rounded-xl border border-violet-400/20 bg-violet-400/[0.06] p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-400">
                Automatic schedule
              </p>
              <h2 className="mt-1 text-xl font-bold">Default Sunday services</h2>
              <p className="mt-1 text-sm text-slate-400">
                A specially scheduled event replaces the default for that Sunday.
              </p>
            </div>
            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
              Active all year
            </span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {recurringDefaults.map((service) => {
              const hours = Math.floor(service.durationMinutes / 60);
              const minutes = service.durationMinutes % 60;
              return (
                <article className="rounded-xl border border-white/10 bg-[#111318] p-4" key={service.id}>
                  <h3 className="font-bold text-white">{service.name}</h3>
                  <p className="mt-2 text-sm text-slate-300">
                    {service.recurrenceRule === "FIRST_SUNDAY"
                      ? "Every first Sunday"
                      : "Every other Sunday"}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Starts {service.startsAtLocal} · {hours}h {minutes}m
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 border-y border-white/10 bg-[#111318] py-6">
          <div className="max-w-5xl px-5">
            <h2 className="text-xl font-bold">Schedule event</h2>
            <form
              action={createEvent}
              className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              <label className="grid gap-1 text-sm font-bold">
                Event name
                <input
                  className="h-11 rounded-lg border border-white/15 px-3 font-normal"
                  name="name"
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Event type
                <select
                  className="h-11 rounded-lg border border-white/15 bg-[#111318] px-3 font-normal"
                  name="eventType"
                >
                  <option value="YOUTH_SERVICE">Youth service</option>
                  <option value="MEETING">Meeting</option>
                  <option value="OUTREACH">Outreach</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Location
                <input
                  className="h-11 rounded-lg border border-white/15 px-3 font-normal"
                  defaultValue="Love Community Chapel compound"
                  name="locationName"
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Starts
                <input
                  className="h-11 rounded-lg border border-white/15 px-3 font-normal"
                  name="startsAt"
                  type="datetime-local"
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Ends
                <input
                  className="h-11 rounded-lg border border-white/15 px-3 font-normal"
                  name="endsAt"
                  type="datetime-local"
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Attendance opens
                <input
                  className="h-11 rounded-lg border border-white/15 px-3 font-normal"
                  name="attendanceOpensAt"
                  type="datetime-local"
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Early until
                <input
                  className="h-11 rounded-lg border border-white/15 px-3 font-normal"
                  name="earlyUntil"
                  type="datetime-local"
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Late after
                <input
                  className="h-11 rounded-lg border border-white/15 px-3 font-normal"
                  name="lateAfter"
                  type="datetime-local"
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Attendance closes
                <input
                  className="h-11 rounded-lg border border-white/15 px-3 font-normal"
                  name="attendanceClosesAt"
                  type="datetime-local"
                  required
                />
              </label>
              <input name="latitude" type="hidden" value="5.576584" />
              <input name="longitude" type="hidden" value="-0.234440" />
              <label className="grid gap-1 text-sm font-bold">
                Boundary radius (m)
                <input
                  className="h-11 rounded-lg border border-white/15 px-3 font-normal"
                  defaultValue="40"
                  min="1"
                  name="geofenceRadiusMeters"
                  type="number"
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Maximum GPS error (m)
                <input
                  className="h-11 rounded-lg border border-white/15 px-3 font-normal"
                  defaultValue="50"
                  min="1"
                  name="maximumAccuracyMeters"
                  type="number"
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-bold md:col-span-2 lg:col-span-3">
                Description
                <textarea
                  className="min-h-24 rounded-lg border border-white/15 p-3 font-normal"
                  name="description"
                />
              </label>
              <button
                className="h-11 rounded-lg bg-violet-600 px-5 font-bold text-white md:w-fit"
                type="submit"
              >
                Schedule event
              </button>
            </form>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><h2 className="text-xl font-bold">Event directory</h2><p className="mt-1 text-sm text-slate-400">{events.length} matching event{events.length === 1 ? "" : "s"}</p></div>
          </div>
          <form className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-[#111318] p-4 md:grid-cols-[13rem_1fr_1fr_auto_auto]">
            <select className="h-11 rounded-lg border border-white/15 px-3" defaultValue={parameters.status ?? ""} name="status">
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option><option value="SCHEDULED">Scheduled</option><option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option>
            </select>
            <label className="grid gap-1 text-xs font-semibold text-slate-400"><span>From</span><input className="h-11 rounded-lg border border-white/15 px-3" defaultValue={parameters.from} name="from" type="date" /></label>
            <label className="grid gap-1 text-xs font-semibold text-slate-400"><span>To</span><input className="h-11 rounded-lg border border-white/15 px-3" defaultValue={parameters.to} name="to" type="date" /></label>
            <button className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-lg bg-slate-100 px-4 font-bold text-slate-950 hover:bg-white"><FiFilter /> Filter</button>
            {hasFilters ? <Link className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-lg border border-white/10 px-4 text-sm font-semibold text-slate-300 hover:border-white/20" href="/admin/events"><FiX /> Clear</Link> : null}
          </form>
          {events.length === 0 ? <div className="mt-4 grid min-h-48 place-items-center rounded-xl border border-dashed border-white/15 bg-[#111318] text-center"><div><FiCalendar className="mx-auto text-4xl text-violet-400" /><p className="mt-3 font-bold">No events match these filters</p></div></div> : <div className="mt-4 divide-y divide-white/10 border-y border-white/10 bg-[#111318]">
            {events.map((event) => (
              <article
                className="grid gap-3 px-5 py-5 md:grid-cols-[1fr_auto]"
                key={event.id}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <FiCalendar className="text-violet-400" aria-hidden="true" />
                    <h3 className="font-bold">{event.name}</h3>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    {new Intl.DateTimeFormat("en-GH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(event.startsAt))}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                    <FiMapPin aria-hidden="true" />
                    {event.locationName ?? "No location"}
                  </p>
                  <Link
                    className="mt-3 inline-flex text-sm font-bold text-violet-400"
                    href={`/admin/events/${event.id}`}
                  >
                    Manage event
                  </Link>
                </div>
                <span className={`h-fit rounded-full border px-3 py-1 text-xs font-bold ${event.status === "CANCELLED" ? "border-rose-400/20 bg-rose-400/10 text-rose-300" : event.status === "COMPLETED" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : event.status === "ACTIVE" ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300" : "border-violet-400/20 bg-violet-400/10 text-violet-300"}`}>
                  {event.status}
                </span>
              </article>
            ))}
          </div>}
        </section>
      </div>
    </main>
  );
}

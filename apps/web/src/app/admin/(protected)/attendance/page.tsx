import Link from "next/link";
import { getAdminResource } from "../registrations/admin-api";

type ChurchEvent = {
  id: string;
  name: string;
  startsAt: string;
  status: string;
};
export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search = "" } = await searchParams;
  const events = (await getAdminResource<ChurchEvent[]>("/events"))
    .filter((event) =>
      event.name.toLowerCase().includes(search.trim().toLowerCase()),
    )
    .sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt));
  const date = new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Accra",
  });
  return (
    <main className="min-h-screen bg-[#e9edee] px-5 py-8 text-[#252b2d]">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin/dashboard" className="font-semibold text-[#527193]">
          Back to dashboard
        </Link>
        <h1 className="mt-6 text-3xl font-bold">Mark attendance</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Choose an event, find the member, and record their attendance with a
          reason. For completed events, you can correct an existing absent or
          excused record.
        </p>
        <form className="mt-6 flex flex-wrap items-end gap-3">
          <label className="grid flex-1 gap-2 text-sm font-semibold">
            Find an event
            <input
              name="search"
              defaultValue={search}
              placeholder="Search event name"
              className="min-h-11 min-w-0 rounded-xl border border-[#d4dcdd] bg-white px-4 text-base"
            />
          </label>
          <button className="min-h-11 rounded-full bg-[#242929] px-6 font-semibold text-white">
            Search
          </button>
          <Link
            href="/admin/attendance"
            className="inline-flex min-h-11 items-center px-3 font-semibold"
          >
            Clear
          </Link>
        </form>
        <section
          aria-label="Events"
          className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {events.length === 0 && <p>No events match this search.</p>}
          {events.map((event) => (
            <article
              key={event.id}
              className="flex min-w-0 flex-col items-start rounded-3xl border border-[#dce3e4] bg-white/70 p-5"
            >
              <span className="rounded-full bg-[#e1eafa] px-3 py-1 text-xs font-semibold text-[#527193]">
                {event.status}
              </span>
              <h2 className="mt-3 break-words text-xl font-bold">
                {event.name}
              </h2>
              <p className="mb-5 mt-2 text-sm text-slate-600">
                {date.format(new Date(event.startsAt))} (Accra)
              </p>
              <Link
                href={`/admin/events/${event.id}/attendance`}
                className="mt-auto inline-flex min-h-11 items-center rounded-full bg-[#242929] px-5 font-semibold text-white"
              >
                {event.status === "CANCELLED"
                  ? "View attendance"
                  : "Manage attendance"}
              </Link>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

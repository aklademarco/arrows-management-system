import { FiCalendar, FiLogOut, FiMapPin } from "react-icons/fi";
import { memberLogout } from "../login/actions";
import { getMemberProfile } from "./member-api";
import { getMemberResource } from "./member-api";
import CheckInButton from "./check-in-button";

type MemberProfile = { firstName: string; lastName: string; email: string; membershipStatus: string };
type ActiveEvent = { id: string; name: string; locationName: string | null; attendanceClosesAt: string };
type UpcomingEvent = { id: string; name: string; startsAt: string; endsAt: string; attendanceOpensAt: string; locationName: string | null };

export default async function MemberPage() {
  const [member, events, upcomingEvents] = await Promise.all([getMemberProfile<MemberProfile>(), getMemberResource<ActiveEvent[]>("/events/active"), getMemberResource<UpcomingEvent[]>("/events/upcoming")]);
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><div><p className="font-bold text-[#240046]">ACMS</p><p className="text-sm text-slate-500">Member portal</p></div><form action={memberLogout}><button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600"><FiLogOut aria-hidden="true" />Sign out</button></form></div></header>
      <div className="mx-auto max-w-6xl px-5 py-10">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#6b21a8]">Welcome back</p>
        <h1 className="mt-2 text-3xl font-bold">{member.firstName} {member.lastName}</h1>
        <p className="mt-2 text-slate-600">{member.email}</p>
        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><FiMapPin className="text-2xl text-green-700" aria-hidden="true" /><h2 className="mt-4 text-xl font-bold">Attendance check-in</h2>{events.length === 0 ? <p className="mt-2 text-sm leading-6 text-slate-600">No attendance-enabled event is currently open.</p> : events.map((event) => <div className="mt-3" key={event.id}><p className="font-bold">{event.name}</p><p className="mt-1 text-sm text-slate-600">{event.locationName ?? "Church compound"}</p><CheckInButton eventId={event.id} /></div>)}</article>
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><FiCalendar className="text-2xl text-[#6b21a8]" aria-hidden="true" /><h2 className="mt-4 text-xl font-bold">Upcoming events</h2>{upcomingEvents.length === 0 ? <p className="mt-2 text-sm leading-6 text-slate-600">No upcoming events are scheduled.</p> : <div className="mt-3 divide-y divide-slate-100">{upcomingEvents.map((event) => <section className="py-4 first:pt-0" key={event.id}><h3 className="font-bold">{event.name}</h3><p className="mt-1 text-sm text-slate-600">{new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Accra" }).format(new Date(event.startsAt))}</p><p className="mt-1 text-sm text-slate-500">{event.locationName ?? "Location to be announced"}</p><p className="mt-2 text-xs font-semibold text-[#6b21a8]">Check-in opens {new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Accra" }).format(new Date(event.attendanceOpensAt))}</p></section>)}</div>}</article>
        </section>
      </div>
    </main>
  );
}

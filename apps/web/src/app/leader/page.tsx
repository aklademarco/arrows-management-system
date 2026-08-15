import Link from "next/link";
import { FiArrowUpRight, FiBell, FiCalendar, FiHeart, FiSearch, FiUsers } from "react-icons/fi";
import { getLeaderResource } from "./leader-api";

type Account = {
  roles: string[];
  memberProfile: {
    firstName: string;
    lastName: string;
    primaryDepartment: { id: string; name: string } | null;
  } | null;
};
type Event = { id: string; name: string; startsAt: string; locationName: string | null };
type Department = { id: string; name: string; isActive: boolean };

const date = new Intl.DateTimeFormat("en-GH", { weekday: "short", day: "numeric", month: "short", timeZone: "Africa/Accra" });
const time = new Intl.DateTimeFormat("en-GH", { hour: "numeric", minute: "2-digit", timeZone: "Africa/Accra" });

export default async function LeaderDashboard() {
  const [account, upcoming, departments, unread] = await Promise.all([
    getLeaderResource<Account>("/auth/me"),
    getLeaderResource<Event[]>("/events/upcoming"),
    getLeaderResource<Department[]>("/departments"),
    getLeaderResource<{ count: number }>("/notifications/unread-count"),
  ]);
  const profile = account.memberProfile;
  const firstName = profile?.firstName ?? "Leader";
  const isPastor = account.roles.includes("PASTOR");
  const activeDepartments = departments.filter((item) => item.isActive);
  return <main className="min-h-screen p-4 sm:p-6 xl:p-8">
    <div className="mx-auto max-w-[1450px]">
      <div className="flex items-center gap-3">
        <div className="relative flex h-12 flex-1 items-center rounded-2xl border border-purple-100 bg-white pl-12 pr-4 text-sm text-slate-500 shadow-sm"><FiSearch className="absolute left-4 text-slate-400" /><span>Search people, ministries, and events</span></div>
        <Link aria-label="Notifications" className="relative grid size-12 place-items-center rounded-2xl border border-purple-100 bg-white text-slate-500 shadow-sm" href="/leader/inbox"><FiBell />{unread.count ? <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-lime-400 px-1 text-[10px] font-black text-[#240046]">{unread.count}</span> : null}</Link>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_360px]">
        <div className="grid gap-5">
          <section className="relative isolate min-h-64 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#5b148d] via-[#7e22ce] to-[#9d4edd] p-7 text-white sm:p-9">
            <div className="absolute -right-20 -top-20 -z-10 size-80 rounded-full bg-white/10 blur-2xl" />
            <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-200">{isPastor ? "Pastoral workspace" : "Ministry leadership"}</p>
            <h1 className="mt-8 max-w-xl text-4xl font-black tracking-[-0.05em] sm:text-5xl">Good day, {firstName}.</h1>
            <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-purple-100">Care for people, guide your ministry, and stay ready for what is happening across the church.</p>
            <div className="mt-8 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white ring-1 ring-inset ring-white/10">{profile?.primaryDepartment?.name ?? (isPastor ? "Church-wide ministry" : "Leadership team")}</div>
          </section>

          <section id="care" className="grid gap-4 sm:grid-cols-3">
            <Metric icon={FiUsers} label="Ministries" value={activeDepartments.length} detail="Active church teams" />
            <Metric icon={FiCalendar} label="Coming up" value={upcoming.length} detail="Scheduled events" />
            <Metric icon={FiHeart} label="Care focus" value="People" detail="Follow up and connect" />
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-[1.75rem] border border-white/10 bg-[#24202e] p-6"><p className="text-xs font-black uppercase tracking-[0.15em] text-purple-300">People and care</p><h2 className="mt-3 text-xl font-black">Know the people you lead</h2><p className="mt-2 text-sm leading-6 text-slate-400">Find members, learn their gifts, and stay connected beyond Sunday.</p><Link className="mt-5 inline-flex items-center gap-2 font-bold text-lime-300" href="/leader/people">Open people directory <FiArrowUpRight /></Link></article>
            <article className="rounded-[1.75rem] border border-white/10 bg-[#24202e] p-6"><p className="text-xs font-black uppercase tracking-[0.15em] text-purple-300">Communication</p><h2 className="mt-3 text-xl font-black">Reach your people</h2><p className="mt-2 text-sm leading-6 text-slate-400">Send a clear update to the church or the ministry teams you lead.</p><Link className="mt-5 inline-flex items-center gap-2 font-bold text-lime-300" href="/leader/messages">Compose message <FiArrowUpRight /></Link></article>
          </section>
        </div>

        <aside className="grid content-start gap-5">
          <section id="calendar" className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#24202e]"><div className="flex items-center justify-between bg-gradient-to-r from-[#7e22ce] to-[#9333ea] px-6 py-4 text-white"><p className="text-xs font-black uppercase tracking-[0.15em]">Church calendar</p><FiCalendar /></div><div className="divide-y divide-white/[0.07] px-5">{upcoming.slice(0, 5).map((event) => <div className="py-4" key={event.id}><div className="flex items-start justify-between gap-3"><p className="text-sm font-bold">{event.name}</p><time className="shrink-0 text-xs font-bold text-purple-600">{time.format(new Date(event.startsAt))}</time></div><p className="mt-1 text-xs text-slate-500">{date.format(new Date(event.startsAt))} · {event.locationName ?? "Church"}</p></div>)}{upcoming.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No upcoming events.</p> : null}</div></section>
        </aside>
      </div>
    </div>
  </main>;
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof FiUsers; label: string; value: string | number; detail: string }) {
  return <article className="rounded-[1.5rem] border border-white/10 bg-[#24202e] p-5"><div className="flex items-center justify-between"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p><Icon className="text-purple-300" /></div><p className="mt-5 text-3xl font-black">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></article>;
}

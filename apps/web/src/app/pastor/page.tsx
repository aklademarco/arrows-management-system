import Link from "next/link";
import {
  FiArrowUpRight,
  FiBarChart2,
  FiCalendar,
  FiHeart,
  FiLayers,
  FiMessageCircle,
  FiUsers,
} from "react-icons/fi";

import { CheckInHero } from "@/components/check-in-hero";

import { getPastorResource } from "./pastor-api";

type Account = {
  roles: string[];
  memberProfile: {
    firstName: string;
    lastName: string;
  } | null;
};

type MemberPage = {
  total: number;
};

type CareCandidate = {
  memberId: string;
  displayName: string;
  absenceCount: number;
  careStatus: string;
};

type Report = {
  totals: {
    attendanceRate: number;
    attended: number;
    absent: number;
    events: number;
  };
};

type Department = {
  id: string;
  name: string;
  isActive: boolean;
};

type UpcomingEvent = {
  id: string;
  name: string;
  startsAt: string;
  locationName: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("en-GH", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Africa/Accra",
});

const timeFormatter = new Intl.DateTimeFormat("en-GH", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Africa/Accra",
});

const hourFormatter = new Intl.DateTimeFormat("en-GH", {
  hour: "numeric",
  hourCycle: "h23",
  timeZone: "Africa/Accra",
});

function greeting() {
  const hour = Number(hourFormatter.format(new Date()));

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";

  return "Good evening";
}

export default async function PastorPage() {
  const [account, members, care, report, departments, upcomingEvents] =
    await Promise.all([
      getPastorResource<Account>("/auth/me"),

      getPastorResource<MemberPage>("/members?page=1&limit=1"),

      getPastorResource<CareCandidate[]>("/pastoral-care/queue"),

      getPastorResource<Report>("/reports/attendance-summary"),

      getPastorResource<Department[]>("/departments"),

      getPastorResource<UpcomingEvent[]>("/events/upcoming"),
    ]);

  const firstName = account.memberProfile?.firstName ?? "Pastor";

  const activeDepartments = departments.filter(
    (department) => department.isActive,
  );

  const urgentCare = care.filter(
    (person) =>
      person.careStatus === "FOLLOW_UP_DUE" ||
      person.careStatus === "NEEDS_CONTACT",
  );

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-[1400px]">
        <header>
          <p className="text-sm font-bold text-slate-500">Pastoral overview</p>

          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            {greeting()}, {firstName}.
          </h1>

          <p className="mt-2 text-sm font-medium text-slate-500">
            Here&apos;s what needs your attention across the church.
          </p>
        </header>

        <section className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_360px]">
          <CheckInHero className="min-h-[310px]">
            <div className="flex h-full min-h-[250px] flex-col justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-100">
                  Church overview
                </p>

                <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                  Care for people.
                  <br />
                  Lead with clarity.
                </h2>

                <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-purple-100">
                  Stay connected to members, attendance, pastoral care and
                  ministry activity from one place.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-purple-700 transition hover:bg-purple-50"
                  href="/pastor/pastoral-care"
                >
                  Open pastoral care
                  <FiArrowUpRight />
                </Link>

                <Link
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-black text-white ring-1 ring-inset ring-white/20 backdrop-blur transition hover:bg-white/20"
                  href="/pastor/messages"
                >
                  Message church
                  <FiMessageCircle />
                </Link>
              </div>
            </div>
          </CheckInHero>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-purple-600">
                  Church snapshot
                </p>

                <h2 className="mt-1 text-xl font-black">This month</h2>
              </div>

              <FiBarChart2 className="text-xl text-purple-600" />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Snapshot label="Members" value={members.total} />

              <Snapshot label="Departments" value={activeDepartments.length} />

              <Snapshot
                label="Attendance"
                value={`${report.totals.attendanceRate}%`}
              />

              <Snapshot label="Need care" value={urgentCare.length} />
            </div>

            <Link
              className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              href="/pastor/reports"
            >
              View church reports
              <FiArrowUpRight />
            </Link>
          </article>
        </section>

        <div className="mt-10 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-purple-600">
              Pastoral care
            </p>

            <h2 className="mt-1 text-2xl font-black">Needs your attention</h2>
          </div>

          <Link
            className="text-sm font-bold text-purple-700"
            href="/pastor/pastoral-care"
          >
            View all
          </Link>
        </div>

        <section className="mt-4">
          {urgentCare.length === 0 ? (
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-2xl text-emerald-600">
                <FiHeart />
              </span>

              <h3 className="mt-4 font-black">No urgent follow-ups</h3>

              <p className="mt-1 text-sm text-slate-500">
                There are no members requiring immediate pastoral follow-up.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {urgentCare.slice(0, 3).map((person) => (
                <Link
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                  href={`/pastor/members/${person.memberId}`}
                  key={person.memberId}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-11 place-items-center rounded-xl bg-rose-50 text-rose-600">
                      <FiHeart />
                    </span>

                    <span className="rounded-full bg-rose-50 px-3 py-1 text-[10px] font-black uppercase text-rose-700">
                      {person.careStatus.replaceAll("_", " ")}
                    </span>
                  </div>

                  <h3 className="mt-4 font-black">{person.displayName}</h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {person.absenceCount} recent absence
                    {person.absenceCount === 1 ? "" : "s"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="mt-10">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-purple-600">
            Shortcuts
          </p>

          <h2 className="mt-1 text-2xl font-black">Quick access</h2>
        </div>

        <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickLink href="/pastor/members" icon={FiUsers} label="Members" />

          <QuickLink
            href="/pastor/pastoral-care"
            icon={FiHeart}
            label="Pastoral Care"
          />

          <QuickLink
            href="/pastor/messages"
            icon={FiMessageCircle}
            label="Messages"
          />

          <QuickLink
            href="/pastor/reports"
            icon={FiBarChart2}
            label="Reports"
          />
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-purple-600">
                  Calendar
                </p>

                <h2 className="mt-1 text-xl font-black">Coming up</h2>
              </div>

              <FiCalendar className="text-xl text-purple-600" />
            </div>

            {upcomingEvents.length === 0 ? (
              <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                No upcoming church events.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {upcomingEvents.slice(0, 4).map((event) => (
                  <div
                    className="flex items-start justify-between gap-4 py-4"
                    key={event.id}
                  >
                    <div>
                      <p className="font-bold">{event.name}</p>

                      <p className="mt-1 text-xs text-slate-500">
                        {event.locationName ?? "Church"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-purple-700">
                        {dateFormatter.format(new Date(event.startsAt))}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {timeFormatter.format(new Date(event.startsAt))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-purple-600">
                  Ministry
                </p>

                <h2 className="mt-1 text-xl font-black">Departments</h2>
              </div>

              <FiLayers className="text-xl text-purple-600" />
            </div>

            <div className="mt-4 grid gap-2">
              {activeDepartments.slice(0, 5).map((department) => (
                <div
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                  key={department.id}
                >
                  <span className="text-sm font-bold">{department.name}</span>

                  <span className="size-2 rounded-full bg-emerald-500" />
                </div>
              ))}
            </div>

            <Link
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-purple-700"
              href="/pastor/departments"
            >
              View departments
              <FiArrowUpRight />
            </Link>
          </article>
        </section>
      </div>
    </main>
  );
}

function Snapshot({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-2xl font-black tracking-[-0.04em]">{value}</p>

      <p className="mt-1 text-xs font-bold text-slate-400">{label}</p>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof FiUsers;
  label: string;
}) {
  return (
    <Link
      className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md"
      href={href}
    >
      <span className="grid size-11 place-items-center rounded-xl bg-purple-50 text-xl text-purple-700 transition group-hover:bg-purple-100">
        <Icon />
      </span>

      <p className="mt-4 text-sm font-black">{label}</p>
    </Link>
  );
}

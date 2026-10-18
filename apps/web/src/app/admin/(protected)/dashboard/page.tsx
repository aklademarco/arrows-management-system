import Link from "next/link";
import {
  FiArrowUpRight,
  FiCalendar,
  FiCheck,
  FiChevronRight,
  FiClock,
  FiGrid,
  FiHeart,
  FiMapPin,
  FiPlus,
  FiUsers,
  FiUserCheck,
} from "react-icons/fi";
import { getAdminResource } from "../registrations/admin-api";

type CountPage = { total: number };
type Department = { id: string; name: string; isActive: boolean };
type ChurchEvent = {
  id: string;
  name: string;
  startsAt: string;
  locationName: string | null;
  status: string;
};
type CareCandidate = { memberId: string; careStatus: string };
const date = new Intl.DateTimeFormat("en-GH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Accra",
});
const time = new Intl.DateTimeFormat("en-GH", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Africa/Accra",
});

export default async function AdminDashboardPage() {
  const [members, registrations, departments, events, careQueue] =
    await Promise.all([
      getAdminResource<CountPage>(
        "/members?limit=1&accountStatus=ACTIVE&membershipStatus=ACTIVE",
      ),
      getAdminResource<CountPage>("/admin/registrations?limit=1"),
      getAdminResource<Department[]>("/departments"),
      getAdminResource<ChurchEvent[]>("/events"),
      getAdminResource<CareCandidate[]>("/pastoral-care/queue"),
    ]);
  const activeDepartments = departments.filter((item) => item.isActive);
  const now = new Date();
  const upcoming = events
    .filter(
      (item) =>
        ["SCHEDULED", "ACTIVE"].includes(item.status) &&
        new Date(item.startsAt).getTime() >= now.getTime(),
    )
    .sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
  const needsContact = careQueue.filter(
    (item) => item.careStatus === "NEEDS_CONTACT",
  ).length;
  const followUp = careQueue.filter(
    (item) => item.careStatus === "FOLLOW_UP_DUE",
  ).length;
  const completed = careQueue.filter(
    (item) => item.careStatus === "CARE_COMPLETED",
  ).length;
  const activeCare = careQueue.length - completed;
  const progress = careQueue.length
    ? Math.round((completed / careQueue.length) * 100)
    : 0;
  const stages = [
    {
      title: "Welcome & connect",
      subtitle: "Member onboarding",
      icon: FiUserCheck,
      tone: "blue",
      count: registrations.total,
      label: "pending approvals",
      tasks: [
        {
          title: "Review new registrations",
          note: `${registrations.total} awaiting a decision`,
          href: "/admin/registrations",
          value: registrations.total,
        },
        {
          title: "Know your church family",
          note: `${members.total} active members`,
          href: "/admin/members",
          value: members.total,
        },
      ],
    },
    {
      title: "Build your teams",
      subtitle: "Department coordination",
      icon: FiUsers,
      tone: "green",
      count: activeDepartments.length,
      label: "active departments",
      tasks: [
        {
          title: "Organize departments",
          note: "Members and leadership assignments",
          href: "/admin/departments",
          value: activeDepartments.length,
        },
        {
          title: "Coordinate shared work",
          note: "Keep ministry teams connected",
          href: "/admin/ministry-work",
          value: null,
        },
        {
          title: "Review absence requests",
          note: "Plan ahead for your team",
          href: "/admin/absences",
          value: null,
        },
      ],
    },
    {
      title: "Prepare to serve",
      subtitle: "Service operations",
      icon: FiCalendar,
      tone: "peach",
      count: upcoming.length,
      label: "upcoming events",
      tasks: [
        {
          title: "Plan church events",
          note: "Schedule services and gatherings",
          href: "/admin/events",
          value: upcoming.length,
        },
        {
          title: "Prepare service liturgies",
          note: "Order of service and assignments",
          href: "/admin/liturgies",
          value: null,
        },
        {
          title: "Check attendance location",
          note: "Manage your church geofence",
          href: "/admin/geofence",
          value: null,
        },
      ],
    },
    {
      title: "Care & follow through",
      subtitle: "Member wellbeing",
      icon: FiHeart,
      tone: "rose",
      count: activeCare,
      label: "active care cases",
      tasks: [
        {
          title: "Make the first contact",
          note: `${needsContact} awaiting contact`,
          href: "/admin/pastoral-care",
          value: needsContact,
        },
        {
          title: "Continue the conversation",
          note: `${followUp} follow-ups due`,
          href: "/admin/pastoral-care",
          value: followUp,
        },
        {
          title: "Review attendance insights",
          note: "Participation and punctuality",
          href: "/admin/reports",
          value: null,
        },
      ],
    },
  ];
  return (
    <main
      className="admin-journey min-h-screen px-4 pb-10 pt-6 sm:px-6 lg:pl-4 lg:pr-8"
      style={{ colorScheme: "light" }}
    >
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-medium text-[#747c7e]">
              Administration / Overview
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              Church journeys<span className="text-[#9ba6a7]">.</span>
            </h1>
            <p className="mt-2 text-sm text-[#737b7e]">
              A little more connected. A little better cared for.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-[#687173] sm:block">
              {date.format(new Date())}
            </span>
            <Link
              href="/admin/events"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#242929] px-5 text-xs font-semibold text-white transition hover:bg-black"
            >
              <FiPlus aria-hidden="true" /> Manage events
            </Link>
          </div>
        </header>
        <section
          aria-label="Church administration workflow"
          className="rounded-[2rem] border border-white/80 bg-white/35 p-4 sm:p-6"
        >
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-white">
                <FiGrid aria-hidden="true" />
              </span>
              <h2 className="text-sm font-semibold">
                From a warm welcome to lasting connection
              </h2>
            </div>
            <Link
              href="/admin/members"
              className="inline-flex items-center gap-2 text-xs font-medium text-[#687173]"
            >
              View members <FiArrowUpRight aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {stages.map(
              (
                { title, subtitle, icon: Icon, tone, count, label, tasks },
                index,
              ) => (
                <article
                  key={title}
                  className="journey-stage relative flex flex-col"
                >
                  <div className="mb-3 flex items-center justify-between px-1">
                    <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#7d8586]">
                      0{index + 1} / {subtitle}
                    </span>
                    <Icon aria-hidden="true" className="text-[#839091]" />
                  </div>
                  <div className="flex flex-1 flex-col rounded-[1.6rem] bg-[#fbfcfc] p-5 shadow-[0_5px_25px_-18px_rgba(50,65,70,0.25)]">
                    <div className="flex items-center gap-3">
                      <span
                        className={`journey-tone-${tone} grid size-11 shrink-0 place-items-center rounded-full`}
                      >
                        <Icon aria-hidden="true" className="text-lg" />
                      </span>
                      <h3 className="text-sm font-semibold leading-5">
                        {title}
                      </h3>
                    </div>
                    <div className="mb-5 mt-6 flex items-baseline gap-2">
                      <span className="text-4xl font-medium tracking-tight">
                        {count}
                      </span>
                      <span className="text-[11px] text-[#768083]">
                        {label}
                      </span>
                    </div>
                    <div className="grid gap-1 border-t border-[#edf0f0] pt-3">
                      {tasks.map((task) => (
                        <Link
                          key={task.title}
                          href={task.href}
                          className="group flex min-h-20 items-center gap-3 rounded-xl px-1 py-3 transition hover:bg-[#f0f3f3]"
                        >
                          <span
                            className={`journey-tone-${tone} grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold`}
                          >
                            {task.value ?? (
                              <FiArrowUpRight aria-hidden="true" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-semibold leading-5">
                              {task.title}
                            </span>
                            <span className="mt-0.5 block text-[11px] leading-4 text-[#7c8587]">
                              {task.note}
                            </span>
                          </span>
                          <FiChevronRight
                            aria-hidden="true"
                            className="shrink-0 text-[#aeb7b8] transition group-hover:translate-x-0.5"
                          />
                        </Link>
                      ))}
                    </div>
                  </div>
                  {index < 3 && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-4 top-1/2 z-10 hidden size-3 rounded-full border-2 border-[#e9edee] bg-[#91acd4] xl:block"
                    />
                  )}
                </article>
              ),
            )}
          </div>
        </section>
        <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
          <section className="min-w-0 overflow-hidden rounded-[2rem] border border-white/80 bg-white/55">
            <div className="flex items-center justify-between gap-4 p-6">
              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  Coming together
                </h2>
                <p className="mt-1 text-xs text-[#7b8486]">
                  Your next church gatherings
                </p>
              </div>
              <Link
                href="/admin/events"
                aria-label="View all events"
                className="grid size-10 shrink-0 place-items-center rounded-full border border-[#d4dcdd] hover:bg-white"
              >
                <FiArrowUpRight aria-hidden="true" />
              </Link>
            </div>
            {upcoming.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-xs">
                  <thead className="border-y border-[#dce3e4] text-[10px] font-medium uppercase tracking-wider text-[#7d8688]">
                    <tr>
                      <th className="px-6 py-3 font-medium">Gathering</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Date & time</th>
                      <th className="px-6 py-3 font-medium">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.slice(0, 4).map((event) => (
                      <tr
                        key={event.id}
                        className="border-b border-white/80 last:border-0"
                      >
                        <td className="px-6 py-4 font-medium">
                          <Link
                            className="hover:underline"
                            href={`/admin/events/${event.id}`}
                          >
                            {event.name}
                          </Link>
                        </td>
                        <td className="px-3 py-4">
                          <span className="rounded-full bg-[#dce8fa] px-2.5 py-1.5 text-[10px] text-[#426b9f]">
                            {event.status === "ACTIVE" ? "Active" : "Scheduled"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-[#697477]">
                          {date.format(new Date(event.startsAt))}
                          <span className="mt-1 block text-[10px]">
                            {time.format(new Date(event.startsAt))}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#697477]">
                          {event.locationName || "To be confirmed"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 pb-10 pt-6 text-center">
                <FiCalendar
                  aria-hidden="true"
                  className="mx-auto text-3xl text-[#9caeb1]"
                />
                <p className="mt-3 text-sm font-medium">
                  Room for your next gathering
                </p>
                <p className="mt-1 text-xs text-[#788487]">
                  Scheduled future events will appear here.
                </p>
                <Link
                  href="/admin/events"
                  className="mt-4 inline-flex text-xs font-semibold underline underline-offset-4"
                >
                  Plan an event
                </Link>
              </div>
            )}
          </section>
          <section className="rounded-[2rem] border border-white/80 bg-white/55 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  Every person matters
                </h2>
                <p className="mt-1 text-xs text-[#7b8486]">
                  Member care at a glance
                </p>
              </div>
              <Link
                href="/admin/pastoral-care"
                aria-label="Open pastoral care queue"
                className="grid size-10 place-items-center rounded-full border border-[#d4dcdd] hover:bg-white"
              >
                <FiHeart aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-7">
              <div
                role="img"
                aria-label={`${completed} of ${careQueue.length} care cases completed`}
                className="grid size-36 shrink-0 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(#91afd7 ${progress}%, ${careQueue.length ? "#e5b1a9" : "#dce3e4"} 0)`,
                }}
              >
                <div className="flex size-28 flex-col items-center justify-center rounded-full bg-[#f4f6f6]">
                  <span className="text-3xl font-medium tracking-tight">
                    {careQueue.length}
                  </span>
                  <span className="mt-1 text-[10px] text-[#7c8587]">
                    care cases
                  </span>
                </div>
              </div>
              <dl className="grid gap-4 text-xs">
                <div>
                  <dt className="flex items-center gap-2 text-[#748083]">
                    <span className="size-2 rounded-full bg-[#91afd7]" />
                    Completed
                  </dt>
                  <dd className="mt-1 pl-4 text-xl font-medium">{completed}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-2 text-[#748083]">
                    <span className="size-2 rounded-full bg-[#e5b1a9]" />
                    Active care
                  </dt>
                  <dd className="mt-1 pl-4 text-xl font-medium">
                    {activeCare}
                  </dd>
                </div>
              </dl>
            </div>
            <p className="mt-6 flex items-center justify-center gap-2 border-t border-[#dfe5e5] pt-4 text-xs text-[#6d787a]">
              {activeCare ? (
                <FiClock aria-hidden="true" />
              ) : (
                <FiCheck aria-hidden="true" />
              )}
              {activeCare
                ? `${needsContact} awaiting contact · ${followUp} follow-ups due`
                : "No active follow-ups in the care queue"}
            </p>
          </section>
        </div>
        <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 px-1 text-[11px] text-[#7d888b]">
          <span>Arrows Church Management System</span>
          <Link
            href="/admin/geofence"
            className="inline-flex min-h-9 items-center gap-1.5 hover:text-black"
          >
            <FiMapPin aria-hidden="true" /> Attendance location settings
          </Link>
        </footer>
      </div>
    </main>
  );
}

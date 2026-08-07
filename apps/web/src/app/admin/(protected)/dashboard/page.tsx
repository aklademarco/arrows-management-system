import Link from "next/link";
import {
  FiArrowUpRight,
  FiCalendar,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiGrid,
  FiMapPin,
  FiPlus,
  FiUsers,
} from "react-icons/fi";
import { getAdminResource } from "../registrations/admin-api";

type CountPage = { total: number };
type Department = { id: string; name: string; isActive: boolean };
type Event = { id: string; status: string };

export default async function AdminDashboardPage() {
  const [members, registrations, departments, events] = await Promise.all([
    getAdminResource<CountPage>("/members?limit=1"),
    getAdminResource<CountPage>("/admin/registrations?limit=1"),
    getAdminResource<Department[]>("/departments"),
    getAdminResource<Event[]>("/events"),
  ]);
  const activeDepartments = departments.filter(
    (department) => department.isActive,
  );
  const scheduledEvents = events.filter(
    (event) => event.status === "SCHEDULED",
  );
  const metrics = [
    {
      label: "Active members",
      value: members.total,
      detail: "Approved workforce",
      icon: FiUsers,
    },
    {
      label: "Pending approvals",
      value: registrations.total,
      detail: "Needs review",
      icon: FiClock,
    },
    {
      label: "Scheduled events",
      value: scheduledEvents.length,
      detail: "Attendance-ready",
      icon: FiCalendar,
    },
    {
      label: "Departments",
      value: activeDepartments.length,
      detail: "Currently active",
      icon: FiGrid,
    },
  ];
  const workspaceLinks = [
    {
      title: "Member directory",
      description:
        "Search profiles, manage status, and review department assignments.",
      href: "/admin/members",
      icon: FiUsers,
    },
    {
      title: "Registration inbox",
      description:
        "Approve verified accounts and place members into departments.",
      href: "/admin/registrations",
      icon: FiCheckCircle,
    },
    {
      title: "Event operations",
      description: "Schedule events and manage live attendance workflows.",
      href: "/admin/events",
      icon: FiCalendar,
    },
    {
      title: "Church geofence",
      description: "Review the location boundary used for secure check-in.",
      href: "/admin/geofence",
      icon: FiMapPin,
    },
    {
      title: "Attendance reports",
      description:
        "Review participation and punctuality across events and departments.",
      href: "/admin/reports",
      icon: FiBarChart2,
    },
  ];

  return (
    <main className="admin-grid-background min-h-[calc(100vh-3.5rem)] bg-[#090a0d] px-4 py-7 text-slate-100 sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span>Arrows ACMS</span>
              <span>/</span>
              <span className="text-slate-300">Overview</span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              Administration
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              A focused workspace for church people, events, and attendance
              operations.
            </p>
          </div>
          <Link
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(139,92,246,0.22)] transition hover:bg-violet-400"
            href="/admin/events"
          >
            <FiPlus aria-hidden="true" /> New event
          </Link>
        </header>

        <section
          aria-label="Administration metrics"
          className="mt-6 grid overflow-hidden rounded-xl border border-white/10 bg-[#111318] sm:grid-cols-2 xl:grid-cols-4"
        >
          {metrics.map(({ label, value, detail, icon: Icon }, index) => (
            <article
              className={`p-5 ${index > 0 ? "border-t border-white/10 sm:border-l sm:border-t-0" : ""} ${index === 2 ? "sm:border-l-0 sm:border-t xl:border-l xl:border-t-0" : ""}`}
              key={label}
            >
              <div className="flex items-center justify-between text-slate-400">
                <p className="text-xs font-semibold uppercase tracking-[0.12em]">
                  {label}
                </p>
                <Icon aria-hidden="true" />
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
                {value}
              </p>
              <p className="mt-1 text-xs text-slate-400">{detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111318]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="font-semibold">Workspace</h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Core administration areas
                </p>
              </div>
              <span className="text-xs font-medium text-slate-400">
                {workspaceLinks.length} tools
              </span>
            </div>
            <div className="divide-y divide-white/[0.07]">
              {workspaceLinks.map(
                ({ title, description, href, icon: Icon }) => (
                  <Link
                    className="group grid gap-4 px-5 py-5 transition hover:bg-[#090a0d] sm:grid-cols-[auto_1fr_auto] sm:items-center"
                    href={href}
                    key={title}
                  >
                    <span className="grid size-10 place-items-center rounded-lg border border-white/10 bg-[#111318] text-slate-400 shadow-sm">
                      <Icon aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">
                        {title}
                      </span>
                      <span className="mt-1 block text-sm leading-5 text-slate-400">
                        {description}
                      </span>
                    </span>
                    <FiArrowUpRight
                      aria-hidden="true"
                      className="text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-100"
                    />
                  </Link>
                ),
              )}
            </div>
          </div>

          <div className="grid content-start gap-6">
            <article className="rounded-xl border border-white/10 bg-slate-950 p-5 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                System status
              </p>
              <div className="mt-5 flex items-center gap-3">
                <span className="size-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,0.12)]" />
                <div>
                  <p className="text-sm font-semibold">Workspace operational</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Core administration routes are available.
                  </p>
                </div>
              </div>
              <div className="mt-5 border-t border-white/10 pt-4 text-xs text-slate-400">
                Data shown here refreshes on every request.
              </div>
            </article>
            <article className="rounded-xl border border-white/10 bg-[#111318] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Quick note
              </p>
              <h2 className="mt-3 font-semibold">Keep approvals moving</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                There {registrations.total === 1 ? "is" : "are"} currently{" "}
                <strong className="text-slate-100">
                  {registrations.total}
                </strong>{" "}
                registration{registrations.total === 1 ? "" : "s"} waiting for
                review.
              </p>
              <Link
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-100 hover:underline"
                href="/admin/registrations"
              >
                Open inbox <FiArrowUpRight aria-hidden="true" />
              </Link>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}

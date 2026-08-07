import {
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiFilter,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";
import { getAdminResource } from "../registrations/admin-api";

type Department = { id: string; name: string; isActive: boolean };
type AttendanceReport = {
  from: string;
  to: string;
  departmentId: string | null;
  totals: {
    events: number;
    records: number;
    attended: number;
    absent: number;
    excused: number;
    manual: number;
    attendanceRate: number;
    punctualityRate: number;
  };
  events: {
    eventId: string;
    eventName: string;
    startsAt: string;
    total: number;
    attended: number;
    absent: number;
    excused: number;
  }[];
  members: {
    memberId: string;
    displayName: string;
    records: number;
    attended: number;
    absent: number;
    excused: number;
    manual: number;
    attendanceRate: number;
    punctualityRate: number;
  }[];
  departments: {
    departmentId: string;
    departmentName: string;
    events: number;
    records: number;
    attended: number;
    absent: number;
    excused: number;
    attendanceRate: number;
    punctualityRate: number;
  }[];
  repeatedAbsences: {
    memberId: string;
    displayName: string;
    absences: number;
    attended: number;
    excused: number;
  }[];
  manualAttendance: {
    attendanceId: string;
    displayName: string;
    eventName: string;
    eventStartsAt: string;
    status: string;
    reason: string | null;
  }[];
  pendingRegistrations: {
    userId: string;
    displayName: string;
    email: string;
    requestedDepartmentName: string | null;
    emailVerified: boolean;
    registeredAt: string;
  }[];
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; departmentId?: string }>;
}) {
  const parameters = await searchParams;
  const query = new URLSearchParams();
  if (parameters.from) query.set("from", parameters.from);
  if (parameters.to) query.set("to", parameters.to);
  if (parameters.departmentId)
    query.set("departmentId", parameters.departmentId);
  const exportHref = `/admin/reports/export?${query}`;
  const [report, departments] = await Promise.all([
    getAdminResource<AttendanceReport>(`/reports/attendance-summary?${query}`),
    getAdminResource<Department[]>("/departments"),
  ]);
  const cards = [
    {
      label: "Attendance rate",
      value: `${report.totals.attendanceRate}%`,
      detail: `${report.totals.attended} attended`,
      icon: FiCheckCircle,
    },
    {
      label: "Punctuality",
      value: `${report.totals.punctualityRate}%`,
      detail: "Of recorded attendance",
      icon: FiClock,
    },
    {
      label: "Absences",
      value: report.totals.absent,
      detail: `${report.totals.excused} excused`,
      icon: FiXCircle,
    },
    {
      label: "Events",
      value: report.totals.events,
      detail: `${report.totals.records} attendance records`,
      icon: FiCalendar,
    },
  ];

  return (
    <main className="admin-grid-background min-h-[calc(100vh-3.5rem)] bg-[#090a0d] px-4 py-7 text-slate-100 sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span>Arrows ACMS</span>
              <span>/</span>
              <span className="text-slate-300">Reports</span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              Attendance reports
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Measure participation and punctuality across a selected period or
              department.
            </p>
          </div>
          <a
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#111318] px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.07]"
            href={exportHref}
          >
            <FiDownload /> Export CSV
          </a>
        </header>
        <form className="mt-7 grid gap-3 rounded-xl border border-white/10 bg-[#111318] p-4 lg:grid-cols-[1fr_1fr_1.4fr_auto]">
          <label className="grid gap-1.5 text-xs font-semibold text-slate-400">
            From
            <input
              className="h-10 rounded-lg border border-white/10 bg-[#090a0d] px-3 text-sm text-slate-100 [color-scheme:dark]"
              defaultValue={report.from}
              name="from"
              type="date"
            />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-slate-400">
            To
            <input
              className="h-10 rounded-lg border border-white/10 bg-[#090a0d] px-3 text-sm text-slate-100 [color-scheme:dark]"
              defaultValue={report.to}
              name="to"
              type="date"
            />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-slate-400">
            Department
            <select
              className="h-10 rounded-lg border border-white/10 bg-[#090a0d] px-3 text-sm text-slate-100"
              defaultValue={report.departmentId ?? ""}
              name="departmentId"
            >
              <option value="">All departments</option>
              {departments
                .filter((item) => item.isActive)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </label>
          <button className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-500 px-5 text-sm font-semibold text-white hover:bg-violet-400">
            <FiFilter /> Apply filters
          </button>
        </form>
        <section
          aria-label="Report summary"
          className="mt-6 grid overflow-hidden rounded-xl border border-white/10 bg-[#111318] sm:grid-cols-2 xl:grid-cols-4"
        >
          {cards.map(({ label, value, detail, icon: Icon }, index) => (
            <article
              className={`p-5 ${index > 0 ? "border-t border-white/10 sm:border-l sm:border-t-0" : ""} ${index === 2 ? "sm:border-l-0 sm:border-t xl:border-l xl:border-t-0" : ""}`}
              key={label}
            >
              <div className="flex items-center justify-between text-slate-400">
                <p className="text-xs font-semibold uppercase tracking-[0.12em]">
                  {label}
                </p>
                <Icon />
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
                {value}
              </p>
              <p className="mt-1 text-xs text-slate-400">{detail}</p>
            </article>
          ))}
        </section>
        <section className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-[#111318]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="font-semibold">Attendance by event</h2>
              <p className="mt-0.5 text-xs text-slate-400">
                {report.from} to {report.to}
              </p>
            </div>
            <FiBarChart2 className="text-slate-400" />
          </div>
          {report.events.length === 0 ? (
            <div className="grid min-h-52 place-items-center px-5 text-center">
              <div>
                <FiUsers className="mx-auto text-3xl text-slate-600" />
                <h3 className="mt-3 font-semibold">No attendance records</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Try another date range or department.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.07]">
              {report.events.map((event) => (
                <article
                  className="grid gap-4 px-5 py-4 sm:grid-cols-[1fr_repeat(4,minmax(5rem,auto))] sm:items-center"
                  key={event.eventId}
                >
                  <div>
                    <h3 className="text-sm font-semibold">{event.eventName}</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Intl.DateTimeFormat("en-GH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Africa/Accra",
                      }).format(new Date(event.startsAt))}
                    </p>
                  </div>
                  <Metric label="Records" value={event.total} />
                  <Metric label="Attended" value={event.attended} />
                  <Metric label="Absent" value={event.absent} />
                  <Metric label="Excused" value={event.excused} />
                </article>
              ))}
            </div>
          )}
        </section>
        <section className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-[#111318]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="font-semibold">Attendance by department</h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Percentage comparison independent of team size
              </p>
            </div>
            <FiBarChart2 className="text-slate-400" />
          </div>
          {report.departments.length === 0 ? (
            <div className="grid min-h-40 place-items-center px-5 text-sm text-slate-400">
              No department attendance found for these filters.
            </div>
          ) : (
            <div className="grid gap-px bg-white/[0.07] sm:grid-cols-2 xl:grid-cols-3">
              {report.departments.map((department, index) => (
                <article
                  className="bg-[#111318] p-5"
                  key={department.departmentId}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        #{index + 1} department
                      </p>
                      <h3 className="mt-1 font-semibold">
                        {department.departmentName}
                      </h3>
                    </div>
                    <Rate value={department.attendanceRate} />
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-4">
                    <SmallMetric
                      label="Punctual"
                      value={`${department.punctualityRate}%`}
                    />
                    <SmallMetric label="Events" value={department.events} />
                    <SmallMetric label="Absent" value={department.absent} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <section className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-[#111318]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="font-semibold">Attendance by member</h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Members needing attention appear first
              </p>
            </div>
            <FiUsers className="text-slate-400" />
          </div>
          {report.members.length === 0 ? (
            <div className="grid min-h-40 place-items-center px-5 text-sm text-slate-400">
              No member attendance found for these filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-white/10 bg-[#0d0f13] text-[10px] uppercase tracking-[0.12em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Member</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Attendance
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Punctuality
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Present
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Absent
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Excused
                    </th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Manual
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.07]">
                  {report.members.map((member) => (
                    <tr
                      className="transition hover:bg-white/[0.025]"
                      key={member.memberId}
                    >
                      <td className="px-5 py-4 font-semibold">
                        {member.displayName}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Rate value={member.attendanceRate} />
                      </td>
                      <td className="px-4 py-4 text-right text-slate-300">
                        {member.punctualityRate}%
                      </td>
                      <td className="px-4 py-4 text-right text-slate-300">
                        {member.attended}
                      </td>
                      <td className="px-4 py-4 text-right text-slate-300">
                        {member.absent}
                      </td>
                      <td className="px-4 py-4 text-right text-slate-300">
                        {member.excused}
                      </td>
                      <td className="px-5 py-4 text-right text-slate-300">
                        {member.manual}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="mt-6 grid gap-6 xl:grid-cols-3">
          <ReportList
            title="Repeated absences"
            description="Two or more unexcused absences"
            empty="No repeated absences in this period."
          >
            {report.repeatedAbsences.map((member) => (
              <div
                className="flex items-center justify-between gap-4 px-5 py-4"
                key={member.memberId}
              >
                <div>
                  <p className="text-sm font-semibold">{member.displayName}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {member.attended} attended · {member.excused} excused
                  </p>
                </div>
                <span className="rounded-md bg-rose-400/10 px-2 py-1 text-xs font-semibold text-rose-300">
                  {member.absences} absent
                </span>
              </div>
            ))}
          </ReportList>
          <ReportList
            title="Manual attendance"
            description="Administrator-entered records"
            empty="No manual attendance in this period."
          >
            {report.manualAttendance.map((record) => (
              <div className="px-5 py-4" key={record.attendanceId}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{record.displayName}</p>
                  <span className="text-xs font-semibold text-violet-300">
                    {record.status.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {record.eventName} ·{" "}
                  {new Intl.DateTimeFormat("en-GH", {
                    dateStyle: "medium",
                    timeZone: "Africa/Accra",
                  }).format(new Date(record.eventStartsAt))}
                </p>
                {record.reason ? (
                  <p className="mt-1 text-xs text-slate-500">{record.reason}</p>
                ) : null}
              </div>
            ))}
          </ReportList>
          <ReportList
            title="Pending registrations"
            description="Accounts awaiting administrator review"
            empty="No registrations are waiting."
          >
            {report.pendingRegistrations.map((registration) => (
              <div className="px-5 py-4" key={registration.userId}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">
                    {registration.displayName}
                  </p>
                  <span
                    className={
                      registration.emailVerified
                        ? "text-xs font-semibold text-emerald-300"
                        : "text-xs font-semibold text-amber-300"
                    }
                  >
                    {registration.emailVerified ? "Verified" : "Unverified"}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-slate-400">
                  {registration.email}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {registration.requestedDepartmentName ??
                    "No department requested"}
                </p>
              </div>
            ))}
          </ReportList>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="sm:text-right">
      <p className="font-semibold">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
    </div>
  );
}

function Rate({ value }: { value: number }) {
  const tone =
    value >= 80
      ? "bg-emerald-400/10 text-emerald-300"
      : value >= 60
        ? "bg-amber-400/10 text-amber-300"
        : "bg-rose-400/10 text-rose-300";
  return (
    <span
      className={`inline-flex min-w-16 justify-center rounded-md px-2 py-1 text-xs font-semibold ${tone}`}
    >
      {value}%
    </span>
  );
}

function SmallMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-200">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
    </div>
  );
}

function ReportList({
  title,
  description,
  empty,
  children,
}: {
  title: string;
  description: string;
  empty: string;
  children: React.ReactNode;
}) {
  const hasItems = Array.isArray(children)
    ? children.length > 0
    : Boolean(children);
  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-[#111318]">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-400">{description}</p>
      </div>
      {hasItems ? (
        <div className="max-h-96 divide-y divide-white/[0.07] overflow-y-auto">
          {children}
        </div>
      ) : (
        <p className="px-5 py-8 text-center text-sm text-slate-400">{empty}</p>
      )}
    </section>
  );
}

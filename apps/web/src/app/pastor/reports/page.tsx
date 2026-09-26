import Link from "next/link";
import type { ReactNode } from "react";
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

import { getPastorResource } from "../pastor-api";

type Department = {
  id: string;
  name: string;
  isActive: boolean;
};

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
    memberId: string;
    displayName: string;
    eventName: string;
    eventStartsAt: string;
    status: string;
    reason: string | null;
  }[];
};

const dateFormatter = new Intl.DateTimeFormat("en-GH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Accra",
});

export default async function PastorReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    departmentId?: string;
  }>;
}) {
  const parameters = await searchParams;

  const query = new URLSearchParams();

  if (parameters.from) {
    query.set("from", parameters.from);
  }

  if (parameters.to) {
    query.set("to", parameters.to);
  }

  if (parameters.departmentId) {
    query.set("departmentId", parameters.departmentId);
  }

  const [report, departments] = await Promise.all([
    getPastorResource<AttendanceReport>(
      `/reports/attendance-summary?${query.toString()}`,
    ),
    getPastorResource<Department[]>("/departments"),
  ]);

  const exportHref = `/pastor/reports/export?${query.toString()}`;

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
      detail: `${report.totals.records} records`,
      icon: FiCalendar,
    },
  ];

  return (
    <main className="min-h-screen p-5 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-600">
              Church insights
            </p>

            <h1 className="mt-2 text-3xl font-black">Attendance Reports</h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Review church attendance, punctuality, absences and department
              participation.
            </p>
          </div>

          <a
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-purple-100 bg-white px-4 text-sm font-bold text-purple-700 transition hover:bg-purple-50"
            href={exportHref}
          >
            <FiDownload />
            Export CSV
          </a>
        </header>

        <form className="mt-7 grid gap-3 rounded-2xl border border-purple-100 bg-white p-4 lg:grid-cols-[1fr_1fr_1.4fr_auto]">
          <label className="grid gap-1.5 text-xs font-bold text-slate-500">
            From
            <input
              className="h-11 rounded-xl border border-purple-100 px-3"
              defaultValue={report.from}
              name="from"
              type="date"
            />
          </label>

          <label className="grid gap-1.5 text-xs font-bold text-slate-500">
            To
            <input
              className="h-11 rounded-xl border border-purple-100 px-3"
              defaultValue={report.to}
              name="to"
              type="date"
            />
          </label>

          <label className="grid gap-1.5 text-xs font-bold text-slate-500">
            Department
            <select
              className="h-11 rounded-xl border border-purple-100 bg-white px-3"
              defaultValue={report.departmentId ?? ""}
              name="departmentId"
            >
              <option value="">All departments</option>

              {departments
                .filter((department) => department.isActive)
                .map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
            </select>
          </label>

          <button className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 text-sm font-bold text-white hover:bg-purple-700">
            <FiFilter />
            Apply
          </button>
        </form>

        <section className="mt-6 grid overflow-hidden rounded-2xl border border-purple-100 bg-white sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, detail, icon: Icon }) => (
            <article
              className="border-b border-purple-50 p-5 last:border-0 sm:border-r"
              key={label}
            >
              <div className="flex items-center justify-between text-slate-400">
                <p className="text-xs font-black uppercase tracking-wide">
                  {label}
                </p>

                <Icon />
              </div>

              <p className="mt-4 text-3xl font-black">{value}</p>

              <p className="mt-1 text-xs text-slate-500">{detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-purple-100 bg-white">
          <div className="flex items-center justify-between border-b border-purple-100 px-5 py-4">
            <div>
              <h2 className="font-black">Attendance by event</h2>

              <p className="mt-1 text-xs text-slate-500">
                {report.from} to {report.to}
              </p>
            </div>

            <FiBarChart2 className="text-purple-500" />
          </div>

          {report.events.length === 0 ? (
            <EmptyState message="No attendance records found." />
          ) : (
            <div className="divide-y divide-purple-50">
              {report.events.map((event) => (
                <article
                  className="grid gap-4 px-5 py-4 sm:grid-cols-[1fr_repeat(4,minmax(5rem,auto))] sm:items-center"
                  key={event.eventId}
                >
                  <div>
                    <h3 className="font-bold">{event.eventName}</h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {dateFormatter.format(new Date(event.startsAt))}
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

        <section className="mt-6 overflow-hidden rounded-2xl border border-purple-100 bg-white">
          <div className="flex items-center justify-between border-b border-purple-100 px-5 py-4">
            <div>
              <h2 className="font-black">Attendance by department</h2>

              <p className="mt-1 text-xs text-slate-500">
                Compare participation across departments.
              </p>
            </div>

            <FiBarChart2 className="text-purple-500" />
          </div>

          {report.departments.length === 0 ? (
            <EmptyState message="No department attendance found." />
          ) : (
            <div className="grid gap-px bg-purple-100 sm:grid-cols-2 xl:grid-cols-3">
              {report.departments.map((department) => (
                <article className="bg-white p-5" key={department.departmentId}>
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-black">{department.departmentName}</h3>

                    <Rate value={department.attendanceRate} />
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3 border-t border-purple-50 pt-4">
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

        <section className="mt-6 overflow-hidden rounded-2xl border border-purple-100 bg-white">
          <div className="flex items-center justify-between border-b border-purple-100 px-5 py-4">
            <div>
              <h2 className="font-black">Attendance by member</h2>

              <p className="mt-1 text-xs text-slate-500">
                Members with lower attendance appear first.
              </p>
            </div>

            <FiUsers className="text-purple-500" />
          </div>

          {report.members.length === 0 ? (
            <EmptyState message="No member attendance found." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-purple-100 bg-purple-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Member</th>

                    <th className="px-4 py-3 text-right">Attendance</th>

                    <th className="px-4 py-3 text-right">Punctuality</th>

                    <th className="px-4 py-3 text-right">Present</th>

                    <th className="px-4 py-3 text-right">Absent</th>

                    <th className="px-5 py-3 text-right">Excused</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-purple-50">
                  {report.members.map((member) => (
                    <tr key={member.memberId}>
                      <td className="px-5 py-4">
                        <Link
                          className="font-bold text-slate-900 hover:text-purple-700"
                          href={`/pastor/members/${member.memberId}`}
                        >
                          {member.displayName}
                        </Link>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <Rate value={member.attendanceRate} />
                      </td>

                      <td className="px-4 py-4 text-right">
                        {member.punctualityRate}%
                      </td>

                      <td className="px-4 py-4 text-right">
                        {member.attended}
                      </td>

                      <td className="px-4 py-4 text-right">{member.absent}</td>

                      <td className="px-5 py-4 text-right">{member.excused}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <ReportList
            description="Members with two or more unexcused absences."
            empty="No repeated absences in this period."
            title="Repeated absences"
          >
            {report.repeatedAbsences.map((member) => (
              <Link
                className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-purple-50"
                href={`/pastor/members/${member.memberId}`}
                key={member.memberId}
              >
                <div>
                  <p className="font-bold">{member.displayName}</p>

                  <p className="mt-1 text-xs text-slate-500">
                    {member.attended} attended · {member.excused} excused
                  </p>
                </div>

                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                  {member.absences} absent
                </span>
              </Link>
            ))}
          </ReportList>

          <ReportList
            description="Attendance records entered manually."
            empty="No manual attendance in this period."
            title="Manual attendance"
          >
            {report.manualAttendance.map((record) => (
              <div className="px-5 py-4" key={record.attendanceId}>
                <div className="flex items-center justify-between gap-3">
                  <Link
                    className="font-bold hover:text-purple-700"
                    href={`/pastor/members/${record.memberId}`}
                  >
                    {record.displayName}
                  </Link>

                  <span className="text-xs font-bold text-purple-700">
                    {record.status.replaceAll("_", " ")}
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  {record.eventName} ·{" "}
                  {dateFormatter.format(new Date(record.eventStartsAt))}
                </p>

                {record.reason && (
                  <p className="mt-2 text-xs text-slate-500">{record.reason}</p>
                )}
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
      <p className="font-black">{value}</p>

      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
    </div>
  );
}

function Rate({ value }: { value: number }) {
  const tone =
    value >= 80
      ? "bg-emerald-50 text-emerald-700"
      : value >= 60
        ? "bg-amber-50 text-amber-700"
        : "bg-rose-50 text-rose-700";

  return (
    <span
      className={`inline-flex min-w-16 justify-center rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}
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
  value: string | number;
}) {
  return (
    <div>
      <p className="font-black">{value}</p>

      <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">
        {label}
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="grid min-h-40 place-items-center p-5 text-center">
      <div>
        <FiUsers className="mx-auto text-3xl text-purple-200" />

        <p className="mt-3 text-sm font-bold text-slate-500">{message}</p>
      </div>
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
  children: ReactNode;
}) {
  const items = Array.isArray(children) ? children : children ? [children] : [];

  return (
    <section className="overflow-hidden rounded-2xl border border-purple-100 bg-white">
      <div className="border-b border-purple-100 px-5 py-4">
        <h2 className="font-black">{title}</h2>

        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>

      {items.length > 0 ? (
        <div className="max-h-96 divide-y divide-purple-50 overflow-y-auto">
          {children}
        </div>
      ) : (
        <p className="px-5 py-8 text-center text-sm text-slate-500">{empty}</p>
      )}
    </section>
  );
}

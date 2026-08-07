import Link from "next/link";
import { FiArrowLeft, FiCalendar, FiMapPin } from "react-icons/fi";
import { getMemberResource } from "../member-api";
import type { Attendance } from "../member-types";

const dateFormatter = new Intl.DateTimeFormat("en-GH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Accra",
});

export default async function AttendanceHistoryPage() {
  const attendanceHistory = await getMemberResource<Attendance[]>("/attendance/me");

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <Link className="inline-flex items-center gap-2 text-sm font-bold text-[#6b21a8] hover:text-[#240046]" href="/member">
          <FiArrowLeft aria-hidden="true" /> Back to dashboard
        </Link>
        <header className="mt-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#6b21a8]">Your records</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Attendance history</h1>
          <p className="mt-2 max-w-2xl text-slate-600">Review your recorded attendance, check-in method, and points for recent church events.</p>
        </header>

        {attendanceHistory.length === 0 ? (
          <section className="mt-8 grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <div>
              <FiCalendar aria-hidden="true" className="mx-auto text-4xl text-[#6b21a8]" />
              <h2 className="mt-4 text-xl font-bold">No attendance recorded yet</h2>
              <p className="mt-2 text-sm text-slate-600">Your check-ins will appear here after you attend an event.</p>
            </div>
          </section>
        ) : (
          <div className="mt-8 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {attendanceHistory.map((attendance) => (
              <article className="grid gap-4 px-5 py-5 sm:grid-cols-[1fr_auto]" key={attendance.id}>
                <div>
                  <h2 className="font-bold">{attendance.eventName}</h2>
                  <p className="mt-1 text-sm text-slate-600">{dateFormatter.format(new Date(attendance.checkedInAt ?? attendance.eventStartsAt))}</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-500">
                    <FiMapPin aria-hidden="true" /> {attendance.locationName ?? "Church compound"} · {attendance.method.toLowerCase()}
                  </p>
                </div>
                <div className="sm:text-right">
                  <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-800">{attendance.status.replaceAll("_", " ")}</span>
                  <p className="mt-2 text-sm font-bold text-[#240046]">{attendance.pointsAwarded} points</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

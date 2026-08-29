import Link from "next/link";
import { FiArrowLeft, FiCheckCircle, FiMapPin } from "react-icons/fi";
import CheckInButton from "@/components/check-in-button";
import { CheckInHero } from "@/components/check-in-hero";
import { leaderCheckIn } from "../actions";
import { getLeaderResource } from "../leader-api";

type ActiveEvent = {
  id: string;
  name: string;
  locationName: string | null;
};

type Attendance = {
  id: string;
  eventId: string;
  eventName: string;
  eventStartsAt: string;
  checkedInAt: string | null;
  locationName: string | null;
  status: string;
  method: string;
  pointsAwarded: number;
};

const dateFormatter = new Intl.DateTimeFormat("en-GH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Accra",
});

export default async function LeaderAttendancePage() {
  const [events, attendanceHistory] = await Promise.all([
    getLeaderResource<ActiveEvent[]>("/events/active"),
    getLeaderResource<Attendance[]>("/attendance/me"),
  ]);

  return (
    <main className="min-h-screen px-5 py-8 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <header>
          <Link
            className="inline-flex items-center gap-2 text-sm font-bold text-purple-300 hover:text-lime-300"
            href="/leader"
          >
            <FiArrowLeft aria-hidden="true" /> Leadership workspace
          </Link>
          <h1 className="mt-3 text-3xl font-black tracking-tight">My attendance</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            You lead on Sunday and you also show up as a member. Check in to the
            open service window and review your recorded history.
          </p>
        </header>

        <section className="mt-7">
          <CheckInHero>
            <div>
              <h2 className="text-2xl font-black tracking-[-0.03em]">
                Automatic check-in
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-purple-100">
                When an attendance window opens, ACMS checks your precise
                location automatically. If that does not work, use the check-in
                button.
              </p>
            </div>

            {events.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="font-extrabold">No check-in window is open</p>
                <p className="mt-1 text-sm text-purple-100">
                  You are all caught up. We will show the next active event
                  here.
                </p>
              </div>
            ) : (
              <div className="mt-7 grid gap-4">
                {events.map((event) => {
                  const existing = attendanceHistory.find(
                    (attendance) => attendance.eventId === event.id,
                  );
                  return (
                    <div
                      className="rounded-2xl bg-white p-5 text-slate-950"
                      key={event.id}
                    >
                      <p className="text-lg font-black">{event.name}</p>
                      <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-500">
                        <FiMapPin aria-hidden="true" />{" "}
                        {event.locationName ?? "Church compound"}
                      </p>
                      {existing ? (
                        <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-3 py-2 text-sm font-extrabold text-emerald-800">
                          <FiCheckCircle aria-hidden="true" /> Checked in ·{" "}
                          {existing.status.replaceAll("_", " ")}
                        </p>
                      ) : (
                        <CheckInButton eventId={event.id} onCheckIn={leaderCheckIn} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CheckInHero>
        </section>

        {attendanceHistory.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-xl font-black tracking-[-0.02em]">
              Recorded history
            </h2>
            <div className="mt-4 divide-y divide-white/[0.07] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#24202e] shadow-sm">
              {attendanceHistory.slice(0, 10).map((attendance) => (
                <article
                  className="grid gap-4 px-5 py-5 sm:grid-cols-[1fr_auto]"
                  key={attendance.id}
                >
                  <div>
                    <h3 className="font-bold text-white">{attendance.eventName}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {dateFormatter.format(
                        new Date(attendance.checkedInAt ?? attendance.eventStartsAt),
                      )}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-500">
                      <FiMapPin aria-hidden="true" />{" "}
                      {attendance.locationName ?? "Church compound"} ·{" "}
                      {attendance.method.toLowerCase()}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-800">
                      {attendance.status.replaceAll("_", " ")}
                    </span>
                    <p className="mt-2 text-sm font-bold text-lime-300">
                      {attendance.pointsAwarded} points
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

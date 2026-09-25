import { FiCheckCircle, FiMapPin } from "react-icons/fi";

import {
  AttendanceStatusBadge,
  attendanceStatusTone,
} from "@/components/attendance-status";
import CheckInButton from "@/components/check-in-button";
import { CheckInHero } from "@/components/check-in-hero";

import { pastorCheckIn } from "../actions";
import { getPastorResource } from "../pastor-api";

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

export default async function PastorAttendancePage() {
  const [events, attendanceHistory] = await Promise.all([
    getPastorResource<ActiveEvent[]>("/events/active"),
    getPastorResource<Attendance[]>("/attendance/me"),
  ]);

  return (
    <main className="min-h-screen p-5 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <header>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-600">
            Attendance
          </p>

          <h1 className="mt-2 text-3xl font-black">My Attendance</h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Check in to an active church service and review your attendance
            history.
          </p>
        </header>

        <section className="mt-7">
          <CheckInHero>
            <div>
              <h2 className="text-2xl font-black">Automatic check-in</h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-purple-100">
                When a check-in window is open, ACMS uses your location to
                verify that you are at the church.
              </p>
            </div>

            {events.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="font-black">No check-in window is open</p>

                <p className="mt-1 text-sm text-purple-100">
                  An active service will appear here when attendance opens.
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

                      <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                        <FiMapPin />
                        {event.locationName ?? "Church compound"}
                      </p>

                      {existing ? (
                        <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-3 py-2 text-sm font-black text-emerald-800">
                          <FiCheckCircle />
                          Checked in · {existing.status.replaceAll("_", " ")}
                        </p>
                      ) : (
                        <CheckInButton
                          eventId={event.id}
                          onCheckIn={pastorCheckIn}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CheckInHero>
        </section>

        {attendanceHistory.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-black">Attendance history</h2>

            <div className="mt-4 overflow-hidden rounded-2xl border border-purple-100 bg-white">
              {attendanceHistory.slice(0, 10).map((attendance) => (
                <article
                  className={
                    "attendance-row attendance-row-" +
                    attendanceStatusTone(attendance.status) +
                    " grid gap-4 border-b border-purple-50 px-5 py-5 last:border-0 sm:grid-cols-[1fr_auto]"
                  }
                  key={attendance.id}
                >
                  <div>
                    <h3 className="font-bold">{attendance.eventName}</h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {dateFormatter.format(
                        new Date(
                          attendance.checkedInAt ?? attendance.eventStartsAt,
                        ),
                      )}
                    </p>

                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                      <FiMapPin />
                      {attendance.locationName ?? "Church compound"}
                      {" · "}
                      {attendance.method.toLowerCase()}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <AttendanceStatusBadge status={attendance.status} />

                    <p className="mt-2 text-sm font-bold text-slate-500">
                      {attendance.pointsAwarded} points
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

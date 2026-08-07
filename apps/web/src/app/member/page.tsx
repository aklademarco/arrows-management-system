import Link from "next/link";
import {
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiZap,
} from "react-icons/fi";
import { ProfileAvatar } from "@/components/profile-avatar";
import { getMemberProfile, getMemberResource } from "./member-api";
import type {
  ActiveEvent,
  Attendance,
  MemberProfile,
  UpcomingEvent,
} from "./member-types";
import CheckInButton from "./check-in-button";
import { CheckInHero } from "./check-in-hero";

const dateFormatter = new Intl.DateTimeFormat("en-GH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Accra",
});

function ActivityMetric({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="text-center">
      <div
        className="relative mx-auto grid size-24 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${color} 0 82%, #eeeaf2 82% 100%)`,
        }}
      >
        <div className="grid size-[74px] place-items-center rounded-full bg-white shadow-inner">
          <span className="text-2xl font-black tracking-tight text-slate-950">
            {value}
          </span>
        </div>
      </div>
      <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

export default async function MemberPage() {
  const [member, events, upcomingEvents, attendanceHistory] = await Promise.all(
    [
      getMemberProfile<MemberProfile>(),
      getMemberResource<ActiveEvent[]>("/events/active"),
      getMemberResource<UpcomingEvent[]>("/events/upcoming"),
      getMemberResource<Attendance[]>("/attendance/me"),
    ],
  );
  const memberName = `${member.firstName} ${member.lastName}`;
  const totalPoints = attendanceHistory.reduce(
    (sum, attendance) => sum + attendance.pointsAwarded,
    0,
  );
  const recentAttendance = attendanceHistory.slice(0, 4);

  return (
    <main className="min-h-screen bg-[#f8f7fb] px-4 py-6 text-slate-950 sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-extrabold text-[#6b21a8]">
              Your day at Arrows
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Good to see you, {member.firstName}.
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Every check-in is one more step in serving consistently.
            </p>
          </div>
          <Link
            className="hidden items-center gap-3 rounded-2xl border border-purple-100 bg-white p-2 pr-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:flex"
            href="/member/profile"
          >
            <ProfileAvatar name={memberName} size="md" />
            <span>
              <span className="block text-sm font-extrabold">{memberName}</span>
              <span className="block text-xs font-semibold capitalize text-slate-400">
                {member.membershipStatus.toLowerCase()} member
              </span>
            </span>
          </Link>
        </header>

        <section className="mt-7 grid gap-5 lg:grid-cols-[1.18fr_0.82fr]">
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
                        <CheckInButton eventId={event.id} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CheckInHero>

          <article className="rounded-[2rem] border border-purple-100 bg-white p-6 shadow-[0_18px_45px_rgba(70,40,100,0.08)] sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-extrabold text-[#6b21a8]">
                  Activity
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.03em]">
                  Your rhythm
                </h2>
              </div>
              <Link
                aria-label="View attendance history"
                className="grid size-10 place-items-center rounded-full bg-purple-50 text-[#6b21a8] hover:bg-purple-100"
                href="/member/attendance"
              >
                <FiArrowRight aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3">
              <ActivityMetric
                color="#ff6b5f"
                label="Check-ins"
                value={attendanceHistory.length}
              />
              <ActivityMetric
                color="#b7f34a"
                label="Points"
                value={totalPoints}
              />
              <ActivityMetric
                color="#27c4d8"
                label="Upcoming"
                value={upcomingEvents.length}
              />
            </div>
            <div className="mt-8 rounded-2xl bg-[#f6f3fa] p-4">
              <p className="flex items-center gap-2 text-sm font-extrabold text-[#5b148d]">
                <FiZap aria-hidden="true" /> Keep your rhythm going
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Your official attendance rates and streaks will appear here when
                the scoring service is enabled.
              </p>
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[2rem] border border-purple-100 bg-[#efffce] p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-extrabold text-[#497016]">
                  Coming up
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-[#263d09]">
                  Next events
                </h2>
              </div>
              <FiCalendar
                aria-hidden="true"
                className="text-3xl text-[#5b8c1b]"
              />
            </div>
            {upcomingEvents.length === 0 ? (
              <p className="mt-7 rounded-2xl bg-white/70 p-5 text-sm font-medium text-[#527022]">
                No upcoming events are scheduled yet.
              </p>
            ) : (
              <div className="mt-5 grid gap-3">
                {upcomingEvents.slice(0, 3).map((event) => (
                  <div className="rounded-2xl bg-white/80 p-4" key={event.id}>
                    <h3 className="font-extrabold text-[#263d09]">
                      {event.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-[#627b35]">
                      {dateFormatter.format(new Date(event.startsAt))}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#779548]">
                      <FiMapPin aria-hidden="true" />{" "}
                      {event.locationName ?? "Location to be announced"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-[2rem] border border-purple-100 bg-white p-6 shadow-[0_18px_45px_rgba(70,40,100,0.06)] sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-extrabold text-[#6b21a8]">History</p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.03em]">
                  Recent check-ins
                </h2>
              </div>
              <Link
                className="text-sm font-extrabold text-[#6b21a8] hover:text-[#240046]"
                href="/member/attendance"
              >
                View all
              </Link>
            </div>
            {recentAttendance.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-purple-200 bg-purple-50/50 p-8 text-center">
                <FiClock
                  aria-hidden="true"
                  className="mx-auto text-3xl text-purple-300"
                />
                <p className="mt-3 font-extrabold">Your activity starts here</p>
                <p className="mt-1 text-sm text-slate-500">
                  Completed check-ins will appear in this timeline.
                </p>
              </div>
            ) : (
              <div className="mt-5 divide-y divide-slate-100">
                {recentAttendance.map((attendance) => (
                  <div
                    className="flex items-center gap-4 py-4 first:pt-0"
                    key={attendance.id}
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <FiCheck aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-extrabold">
                        {attendance.eventName}
                      </h3>
                      <p className="mt-0.5 text-xs font-medium text-slate-400">
                        {dateFormatter.format(
                          new Date(
                            attendance.checkedInAt ?? attendance.eventStartsAt,
                          ),
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-emerald-700">
                        {attendance.status.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-400">
                        +{attendance.pointsAwarded} pts
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}

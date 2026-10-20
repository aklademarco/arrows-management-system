import Link from "next/link";
import { FiArrowLeft, FiCheckCircle, FiMapPin } from "react-icons/fi";
import { getAdminResource } from "../../../registrations/admin-api";
import { AttendanceForm } from "./attendance-form";

type Member = {
  memberId: string;
  firstName: string;
  lastName: string;
  email: string;
  attendanceId: string | null;
  attendanceStatus: string | null;
  method: string | null;
  distanceMeters: number | null;
};
type Roster = {
  event: { id: string; name: string; status: string };
  members: Member[];
};

export default async function AttendanceRosterPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ search?: string }>;
}) {
  const { eventId } = await params;
  const roster = await getAdminResource<Roster>(
    `/attendance/events/${eventId}`,
  );
  const { search = "" } = await searchParams;
  const members = roster.members.filter((member) =>
    `${member.firstName} ${member.lastName} ${member.email}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  const attended = roster.members.filter((member) =>
    ["EARLY", "ON_TIME", "LATE"].includes(member.attendanceStatus ?? ""),
  ).length;
  const locked = roster.event.status === "CANCELLED";
  return (
    <main className="min-h-screen bg-[#e9edee] px-5 py-8 text-[#252b2d]">
      <div className="mx-auto max-w-7xl">
        <Link
          className="inline-flex items-center gap-2 font-bold text-[#527193]"
          href="/admin/attendance"
        >
          <FiArrowLeft aria-hidden="true" />
          Choose another event
        </Link>
        <header className="mt-6 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#527193]">
              Event attendance
            </p>
            <h1 className="mt-2 text-3xl font-bold">{roster.event.name}</h1>
            <p className="mt-2 text-slate-600">
              {attended} of {roster.members.length} members are present.
            </p>
          </div>
          <span className="bg-[#e1eafa] px-3 py-1 text-xs font-bold text-[#527193]">
            {roster.event.status}
          </span>
        </header>
        <form className="mt-6 flex flex-wrap items-end gap-3">
          <label className="grid flex-1 gap-2 text-sm font-semibold">
            Find a member
            <input
              name="search"
              defaultValue={search}
              placeholder="Search name or email"
              className="min-h-11 min-w-0 rounded-xl border border-[#d4dcdd] bg-white px-4 text-base"
            />
          </label>
          <button className="min-h-11 rounded-full bg-[#242929] px-6 font-semibold text-white">
            Search
          </button>
          <Link
            href={`/admin/events/${eventId}/attendance`}
            className="inline-flex min-h-11 items-center px-3 font-semibold"
          >
            Clear
          </Link>
        </form>
        <section className="mt-8 divide-y divide-[#e1e7e8] rounded-[1.5rem] border border-[#dce3e4] bg-white/70">
          {members.length === 0 && (
            <p className="p-5 text-slate-600">No members match this search.</p>
          )}
          {members.map((member) => (
            <article
              className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(14rem,1fr)_minmax(18rem,1.4fr)]"
              key={member.memberId}
            >
              <div>
                <h2 className="font-bold">
                  {member.firstName} {member.lastName}
                </h2>
                <p className="mt-1 break-all text-sm text-slate-600">
                  {member.email}
                </p>
                {member.attendanceId ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1 font-bold text-slate-800">
                      <FiCheckCircle aria-hidden="true" />
                      {member.attendanceStatus?.replaceAll("_", " ")}
                    </span>
                    <span className="text-slate-600">
                      {member.method?.toLowerCase()}
                    </span>
                    {member.distanceMeters !== null ? (
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <FiMapPin aria-hidden="true" />
                        {member.distanceMeters.toFixed(1)} m
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-3 text-sm font-semibold text-amber-700">
                    No attendance recorded
                  </p>
                )}
              </div>
              {locked ? (
                <p className="text-sm text-slate-600">
                  Cancelled event records are read-only.
                </p>
              ) : !member.attendanceId &&
                roster.event.status === "COMPLETED" ? (
                <p className="text-sm text-slate-600">
                  This event is finalized. Only existing attendance records can
                  be corrected.
                </p>
              ) : (
                <AttendanceForm
                  eventId={eventId}
                  memberId={member.memberId}
                  attendanceId={member.attendanceId}
                  status={member.attendanceStatus}
                  memberName={`${member.firstName} ${member.lastName}`}
                />
              )}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

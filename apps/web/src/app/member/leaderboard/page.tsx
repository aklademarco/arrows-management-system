import Link from "next/link";
import { FiAward, FiFilter, FiStar, FiTrendingUp } from "react-icons/fi";
import { getMemberResource } from "../member-api";

type LeaderboardItem = {
  rank: number | null;
  memberId: string;
  displayName: string;
  expectedEvents: number;
  attendedEvents: number;
  attendanceRate: number;
  punctualityRate: number | null;
  score: number;
  qualified: boolean;
  currentAttendanceStreak: number;
  longestAttendanceStreak: number;
  secondaryPoints: number;
};
type Leaderboard = {
  period: string;
  startsOn: string;
  endsOn: string;
  minimumQualifyingEvents: number;
  items: LeaderboardItem[];
};
type Department = { id: string; name: string; isActive: boolean };

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    date?: string;
    departmentId?: string;
  }>;
}) {
  const parameters = await searchParams;
  const query = new URLSearchParams({ period: parameters.period ?? "MONTHLY" });
  if (parameters.date) query.set("date", parameters.date);
  if (parameters.departmentId)
    query.set("departmentId", parameters.departmentId);
  const [leaderboard, departments] = await Promise.all([
    getMemberResource<Leaderboard>(`/leaderboards/individual?${query}`),
    getMemberResource<Department[]>("/departments"),
  ]);

  return (
    <main className="min-h-screen bg-[#f8f7fb] px-4 py-6 text-slate-950 sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-6xl">
        <header>
          <p className="text-sm font-extrabold text-[#6b21a8]">
            Community progress
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Attendance leaderboard
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Rank is based on attendance and punctuality rates—not points alone.
          </p>
        </header>
        <nav
          aria-label="Leaderboard view"
          className="mt-6 inline-flex rounded-2xl border border-purple-100 bg-white p-1 shadow-sm"
        >
          <span
            aria-current="page"
            className="rounded-xl bg-[#6b21a8] px-4 py-2 text-sm font-extrabold text-white"
          >
            Individuals
          </span>
          <Link
            className="rounded-xl px-4 py-2 text-sm font-extrabold text-slate-500 hover:text-[#6b21a8]"
            href="/member/department-leaderboard"
          >
            Departments
          </Link>
        </nav>
        <form className="mt-5 grid gap-3 rounded-3xl border border-purple-100 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_1fr_auto]">
          <select
            className="h-12 rounded-2xl border border-slate-200 bg-[#fbfafc] px-4 font-bold"
            defaultValue={leaderboard.period}
            name="period"
          >
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="YEARLY">Yearly</option>
          </select>
          <input
            className="h-12 rounded-2xl border border-slate-200 bg-[#fbfafc] px-4"
            defaultValue={parameters.date}
            name="date"
            type="date"
          />
          <select
            className="h-12 rounded-2xl border border-slate-200 bg-[#fbfafc] px-4 font-bold"
            defaultValue={parameters.departmentId ?? ""}
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
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#6b21a8] px-5 font-extrabold text-white">
            <FiFilter /> View period
          </button>
        </form>
        <p className="mt-4 text-xs font-bold text-slate-400">
          {leaderboard.startsOn} – {leaderboard.endsOn} · At least{" "}
          {leaderboard.minimumQualifyingEvents} expected events to rank
        </p>
        {leaderboard.items.length === 0 ? (
          <section className="mt-7 grid min-h-64 place-items-center rounded-[2rem] border border-dashed border-purple-200 bg-white text-center">
            <div>
              <FiAward className="mx-auto text-5xl text-purple-300" />
              <h2 className="mt-4 text-xl font-black">
                No finalized attendance yet
              </h2>
            </div>
          </section>
        ) : (
          <section className="mt-7 overflow-hidden rounded-[2rem] border border-purple-100 bg-white shadow-[0_18px_45px_rgba(70,40,100,0.07)]">
            {leaderboard.items.map((item) => (
              <article
                className="grid gap-4 border-b border-purple-50 p-5 last:border-b-0 sm:grid-cols-[3rem_1fr_auto] sm:items-center"
                key={item.memberId}
              >
                <span
                  className={
                    item.rank && item.rank <= 3
                      ? "grid size-11 place-items-center rounded-2xl bg-[#efffce] text-lg font-black text-[#497016]"
                      : "grid size-11 place-items-center rounded-2xl bg-purple-50 font-black text-[#6b21a8]"
                  }
                >
                  {item.rank ?? "—"}
                </span>
                <div>
                  <h2 className="font-extrabold">{item.displayName}</h2>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-slate-400">
                    <span>
                      {item.attendedEvents}/{item.expectedEvents} attended
                    </span>
                    <span>{item.attendanceRate}% attendance</span>
                    <span>{item.punctualityRate ?? "—"}% punctuality</span>
                  </div>
                  <div className="mt-2 flex gap-3 text-xs font-extrabold">
                    <span className="inline-flex items-center gap-1 text-orange-600">
                      <FiTrendingUp /> {item.currentAttendanceStreak} streak
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#6b21a8]">
                      <FiStar /> {item.secondaryPoints} pts
                    </span>
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="text-2xl font-black text-[#240046]">
                    {item.score}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Score
                  </p>
                  {!item.qualified ? (
                    <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">
                      Building eligibility
                    </span>
                  ) : null}
                </div>
              </article>
            ))}
          </section>
        )}
        <Link
          className="mt-5 inline-flex text-sm font-extrabold text-[#6b21a8]"
          href="/member/attendance"
        >
          View your attendance history →
        </Link>
      </div>
    </main>
  );
}

import Link from "next/link";
import { FiAward, FiFilter, FiUsers } from "react-icons/fi";
import { getMemberResource } from "../member-api";

type DepartmentLeaderboardItem = {
  rank: number | null;
  departmentId: string;
  departmentName: string;
  applicableEvents: number;
  expectedAttendanceSlots: number;
  attendedSlots: number;
  attendanceRate: number;
  punctualityRate: number | null;
  score: number;
  qualified: boolean;
};

type DepartmentLeaderboard = {
  period: string;
  startsOn: string;
  endsOn: string;
  minimumQualifyingEvents: number;
  items: DepartmentLeaderboardItem[];
};

export default async function DepartmentLeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; date?: string }>;
}) {
  const parameters = await searchParams;
  const query = new URLSearchParams({ period: parameters.period ?? "MONTHLY" });
  if (parameters.date) query.set("date", parameters.date);
  const leaderboard = await getMemberResource<DepartmentLeaderboard>(
    `/leaderboards/departments?${query}`,
  );

  return (
    <main className="min-h-screen bg-[#f8f7fb] px-4 py-6 text-slate-950 sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-6xl">
        <header>
          <p className="text-sm font-extrabold text-[#6b21a8]">
            Community progress
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Department leaderboard
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Departments are compared by attendance and punctuality percentages,
            so team size does not decide the winner.
          </p>
        </header>

        <nav
          aria-label="Leaderboard view"
          className="mt-6 inline-flex rounded-2xl border border-purple-100 bg-white p-1 shadow-sm"
        >
          <Link
            className="rounded-xl px-4 py-2 text-sm font-extrabold text-slate-500 hover:text-[#6b21a8]"
            href="/member/leaderboard"
          >
            Individuals
          </Link>
          <span
            aria-current="page"
            className="rounded-xl bg-[#6b21a8] px-4 py-2 text-sm font-extrabold text-white"
          >
            Departments
          </span>
        </nav>

        <form className="mt-5 grid gap-3 rounded-3xl border border-purple-100 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto]">
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
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#6b21a8] px-5 font-extrabold text-white">
            <FiFilter /> View period
          </button>
        </form>

        <p className="mt-4 text-xs font-bold text-slate-400">
          {leaderboard.startsOn} – {leaderboard.endsOn} · At least{" "}
          {leaderboard.minimumQualifyingEvents} applicable events to rank
        </p>

        {leaderboard.items.length === 0 ? (
          <section className="mt-7 grid min-h-64 place-items-center rounded-[2rem] border border-dashed border-purple-200 bg-white text-center">
            <div>
              <FiAward className="mx-auto text-5xl text-purple-300" />
              <h2 className="mt-4 text-xl font-black">
                No department results yet
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Completed event attendance will appear here.
              </p>
            </div>
          </section>
        ) : (
          <section className="mt-7 grid gap-4 md:grid-cols-2">
            {leaderboard.items.map((item) => (
              <article
                className="rounded-[2rem] border border-purple-100 bg-white p-5 shadow-[0_18px_45px_rgba(70,40,100,0.07)]"
                key={item.departmentId}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        item.rank && item.rank <= 3
                          ? "grid size-12 place-items-center rounded-2xl bg-[#efffce] text-lg font-black text-[#497016]"
                          : "grid size-12 place-items-center rounded-2xl bg-purple-50 font-black text-[#6b21a8]"
                      }
                    >
                      {item.rank ?? "—"}
                    </span>
                    <div>
                      <h2 className="text-lg font-black">
                        {item.departmentName}
                      </h2>
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-slate-400">
                        <FiUsers /> {item.attendedSlots}/
                        {item.expectedAttendanceSlots} member slots attended
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-[#240046]">
                      {item.score}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Score
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-purple-50 pt-4 text-center">
                  <div>
                    <p className="font-black text-[#6b21a8]">
                      {item.attendanceRate}%
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">
                      Attendance
                    </p>
                  </div>
                  <div>
                    <p className="font-black text-[#6b21a8]">
                      {item.punctualityRate ?? "—"}%
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">
                      Punctuality
                    </p>
                  </div>
                  <div>
                    <p className="font-black text-[#6b21a8]">
                      {item.applicableEvents}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">
                      Events
                    </p>
                  </div>
                </div>
                {!item.qualified ? (
                  <span className="mt-4 inline-flex rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">
                    Building eligibility
                  </span>
                ) : null}
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

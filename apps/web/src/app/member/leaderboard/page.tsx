import Link from "next/link";
import { FiAward, FiStar } from "react-icons/fi";
import { ProfileAvatar } from "@/components/profile-avatar";
import { getMemberResource } from "../member-api";

type LeaderboardItem = {
  rank: number | null;
  memberId: string;
  displayName: string;
  profilePhotoUrl: string | null;
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
export default async function LeaderboardPage() {
  const leaderboard = await getMemberResource<Leaderboard>(
    "/leaderboards/individual?period=MONTHLY",
  );

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
          <section className="mt-7 overflow-hidden rounded-[1.75rem] border border-purple-100 bg-white shadow-[0_18px_45px_rgba(70,40,100,0.07)]">
            {leaderboard.items.map((item) => (
              <article
                className="flex min-h-24 items-center gap-3 border-b border-purple-50 px-4 py-3 last:border-b-0 sm:gap-4 sm:px-5"
                key={item.memberId}
              >
                <div className="relative shrink-0">
                  <ProfileAvatar imageUrl={item.profilePhotoUrl} name={item.displayName} size="lg" />
                  <span aria-label={`${item.currentAttendanceStreak} attendance streak`} className="absolute -bottom-1 -right-2 inline-flex h-6 min-w-7 items-center justify-center gap-0.5 rounded-full border-2 border-white bg-purple-100 px-1 text-[10px] font-black text-[#6b21a8]">
                    <span aria-hidden="true">🔥</span>{item.currentAttendanceStreak}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-extrabold">{item.displayName}</h2>
                  <div className="mt-1.5 flex items-center text-xs font-extrabold">
                    <span className="inline-flex items-center gap-1 text-[#6b21a8]">
                      <FiStar /> {item.secondaryPoints} pts
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xl font-black text-[#240046] sm:text-2xl">
                    {item.score}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                    Score
                  </p>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

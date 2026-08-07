type MemberStreakProps = {
  current: number;
  longest?: number;
  compact?: boolean;
};

export function MemberStreak({
  current,
  longest,
  compact = false,
}: MemberStreakProps) {
  const active = current > 0;
  return (
    <span
      aria-label={`${current} event attendance streak${longest !== undefined ? `; longest streak ${longest}` : ""}`}
      className={`inline-flex items-center rounded-2xl border font-black shadow-sm ${compact ? "gap-1.5 px-2.5 py-1.5 text-xs" : "gap-2 px-3 py-2 text-sm"} ${active ? "border-amber-200 bg-[#fffc00] text-[#251900] shadow-[0_6px_18px_rgba(255,187,0,0.18)]" : "border-slate-200 bg-slate-100 text-slate-500"}`}
      title={longest !== undefined ? `Longest streak: ${longest}` : undefined}
    >
      <span
        aria-hidden="true"
        className={active ? "drop-shadow-sm" : "grayscale"}
      >
        🔥
      </span>
      <span>{current}</span>
      <span className="font-extrabold opacity-70">streak</span>
      {longest !== undefined && longest > current ? (
        <span className="ml-0.5 border-l border-black/15 pl-2 text-[10px] font-extrabold opacity-60">
          best {longest}
        </span>
      ) : null}
    </span>
  );
}

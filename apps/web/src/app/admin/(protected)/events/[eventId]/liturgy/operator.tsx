"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { FiCheck, FiClock, FiPause, FiPlay, FiPlus, FiSkipForward } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { controlLiturgyItem } from "./actions";

export type LiveItem = { id: string; position: number; title: string; plannedStartAt: string; plannedDurationMinutes: number; ownerLabel: string | null; status: string; actualStartedAt: string | null; pausedAt: string | null; accumulatedPauseSeconds: number };

function remaining(item: LiveItem, now: number) {
  if (!item.actualStartedAt) return item.plannedDurationMinutes * 60;
  const end = item.pausedAt ? new Date(item.pausedAt).getTime() : now;
  const elapsed = Math.max(0, Math.floor((end - new Date(item.actualStartedAt).getTime()) / 1000) - item.accumulatedPauseSeconds);
  return item.plannedDurationMinutes * 60 - elapsed;
}

function display(seconds: number) {
  const sign = seconds < 0 ? "−" : "";
  const absolute = Math.abs(seconds);
  return `${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
}

export function LiturgyOperator({ eventId, items }: { eventId: string; items: LiveItem[] }) {
  const [now, setNow] = useState<number | null>(null);
  const [message, setMessage] = useState<string>();
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { const timer = window.setInterval(() => router.refresh(), 15_000); return () => window.clearInterval(timer); }, [router]);
  const current = useMemo(() => items.find((item) => item.status === "ACTIVE" || item.status === "PAUSED"), [items]);
  const run = (item: LiveItem, action: "START" | "PAUSE" | "RESUME" | "EXTEND" | "SKIP" | "COMPLETE", extensionMinutes?: number) => startTransition(async () => {
    try { setMessage(`${action.toLowerCase()} in progress…`); await controlLiturgyItem({ eventId, itemId: item.id, action, extensionMinutes }); setMessage("Schedule updated."); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Schedule could not be updated."); }
  });
  const currentRemaining = current ? (now === null ? current.plannedDurationMinutes * 60 : remaining(current, now)) : 0;
  return <div>
    <section className="rounded-2xl border border-white/10 bg-[#111318] p-6">
      {current ? <div className="grid gap-6 lg:grid-cols-[1fr_auto]"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400">{current.status === "PAUSED" ? "Paused" : "Now serving"}</p><h2 className="mt-3 text-3xl font-bold">{current.title}</h2><p className="mt-2 text-sm text-slate-400">{current.ownerLabel ?? "Service team"}</p><div className="mt-6 flex flex-wrap gap-2">{current.status === "ACTIVE" ? <Control icon={FiPause} label="Pause" onClick={() => run(current, "PAUSE")} /> : <Control icon={FiPlay} label="Resume" onClick={() => run(current, "RESUME")} />}<Control icon={FiPlus} label="Add 5 min" onClick={() => run(current, "EXTEND", 5)} /><Control icon={FiSkipForward} label="Skip" onClick={() => run(current, "SKIP")} subtle /><Control icon={FiCheck} label="Complete & advance" onClick={() => run(current, "COMPLETE")} primary /></div></div><div className={`grid min-w-52 place-items-center rounded-2xl border p-6 text-center ${currentRemaining < 0 ? "border-red-400/30 bg-red-400/10 text-red-300" : "border-violet-400/20 bg-violet-500/10 text-white"}`}><FiClock className="text-2xl" /><p className="mt-2 font-mono text-5xl font-black tabular-nums">{display(currentRemaining)}</p><p className="mt-2 text-xs font-bold uppercase tracking-wider opacity-70">{currentRemaining < 0 ? "Over time" : "Remaining"}</p></div></div> : <div className="text-center"><FiClock className="mx-auto text-4xl text-violet-400" /><h2 className="mt-3 text-xl font-bold">Service is ready</h2><p className="mt-2 text-sm text-slate-400">Start the first pending activity when the service begins.</p></div>}
      {message ? <p className="mt-4 text-sm font-bold text-violet-300" role="status">{message}</p> : null}
    </section>
    <ol className="mt-5 space-y-2">{items.map((item) => <li className={`grid gap-3 rounded-xl border p-4 sm:grid-cols-[2.5rem_1fr_auto] sm:items-center ${item.status === "ACTIVE" || item.status === "PAUSED" ? "border-violet-400/40 bg-violet-500/10" : "border-white/10 bg-[#111318]"}`} key={item.id}><span className="grid size-8 place-items-center rounded-lg bg-white/5 text-xs font-bold">{item.position}</span><div><p className="font-bold">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.ownerLabel ?? "To be assigned"} · {item.plannedDurationMinutes} min</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold text-slate-300">{item.status}</span>{item.status === "PENDING" && !current ? <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-3 text-xs font-bold disabled:opacity-50" disabled={pending} onClick={() => run(item, "START")}><FiPlay /> Start</button> : null}</div></li>)}</ol>
  </div>;
}

function Control({ icon: Icon, label, onClick, primary = false, subtle = false }: { icon: typeof FiPlay; label: string; onClick: () => void; primary?: boolean; subtle?: boolean }) {
  return <button className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold ${primary ? "bg-emerald-500 text-white" : subtle ? "border border-white/10 text-slate-300" : "bg-violet-600 text-white"}`} onClick={onClick} type="button"><Icon />{label}</button>;
}

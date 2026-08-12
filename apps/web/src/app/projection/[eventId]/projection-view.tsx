"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { FiClock, FiMaximize, FiMinimize } from "react-icons/fi";
import { useRouter } from "next/navigation";

export type ProjectionItem = {
  id: string;
  position: number;
  title: string;
  ownerLabel: string | null;
  plannedStartAt: string;
  plannedDurationMinutes: number;
  showOnProjection: boolean;
  status: string;
  actualStartedAt: string | null;
  pausedAt: string | null;
  accumulatedPauseSeconds: number;
};

type Liturgy = {
  eventName: string;
  preacherName: string | null;
  sermonTitle: string | null;
  preacherImageUrl: string | null;
  completedAt: string | null;
  items: ProjectionItem[];
};

function remaining(item: ProjectionItem, now: number) {
  if (!item.actualStartedAt) return item.plannedDurationMinutes * 60;
  const end = item.pausedAt ? new Date(item.pausedAt).getTime() : now;
  return item.plannedDurationMinutes * 60 - Math.max(0, Math.floor((end - new Date(item.actualStartedAt).getTime()) / 1000) - item.accumulatedPauseSeconds);
}

function clock(seconds: number) {
  const absolute = Math.abs(seconds);
  return `${seconds < 0 ? "−" : ""}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
}

export function ProjectionView({ liturgy }: { liturgy: Liturgy }) {
  const [now, setNow] = useState<number | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const router = useRouter();
  const visible = useMemo(() => liturgy.items.filter((item) => item.showOnProjection), [liturgy.items]);
  const current = visible.find((item) => item.status === "ACTIVE" || item.status === "PAUSED");
  const next = current ? visible.find((item) => item.position > current.position && item.status === "PENDING") : visible.find((item) => item.status === "PENDING");
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { const timer = window.setInterval(() => router.refresh(), 5_000); return () => window.clearInterval(timer); }, [router]);
  useEffect(() => { const update = () => setFullscreen(Boolean(document.fullscreenElement)); document.addEventListener("fullscreenchange", update); return () => document.removeEventListener("fullscreenchange", update); }, []);
  const seconds = current ? (now === null ? current.plannedDurationMinutes * 60 : remaining(current, now)) : 0;
  const completed = Boolean(liturgy.completedAt) || visible.every((item) => item.status === "COMPLETED" || item.status === "SKIPPED");
  return <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#08050d] p-[clamp(1.25rem,3vw,3.5rem)] text-white">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(126,34,206,.28),transparent_40%),radial-gradient(circle_at_10%_90%,rgba(147,51,234,.16),transparent_35%)]" />
    <header className="relative flex items-center justify-between gap-5 border-b border-white/10 pb-5"><div><p className="text-[clamp(.65rem,1vw,.85rem)] font-black uppercase tracking-[0.22em] text-purple-300">ARROWS · Live service</p><h1 className="mt-2 text-[clamp(1.2rem,2.2vw,2.2rem)] font-black">{liturgy.eventName}</h1></div><button aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"} className="grid size-12 place-items-center rounded-xl border border-white/10 bg-white/5 text-xl hover:bg-white/10" onClick={() => fullscreen ? document.exitFullscreen() : document.documentElement.requestFullscreen()}>{fullscreen ? <FiMinimize /> : <FiMaximize />}</button></header>
    <section className="relative grid flex-1 place-items-center py-8 text-center">
      {completed ? <div><p className="text-[clamp(1rem,2vw,1.5rem)] font-bold text-purple-300">Service complete</p><h2 className="mt-5 text-[clamp(3rem,8vw,8rem)] font-black tracking-[-0.06em]">Thank you.</h2><p className="mt-5 text-[clamp(1rem,2vw,1.5rem)] text-slate-400">Go in peace and have a blessed week.</p></div> : current ? <div className="w-full max-w-6xl"><p className="text-[clamp(.8rem,1.4vw,1.15rem)] font-black uppercase tracking-[0.25em] text-purple-300">{current.status === "PAUSED" ? "Paused" : "Now"}</p><h2 className="mx-auto mt-5 max-w-5xl text-balance text-[clamp(3rem,7.5vw,7.5rem)] font-black leading-[.92] tracking-[-0.06em]">{current.title}</h2>{current.ownerLabel ? <p className="mt-7 text-[clamp(1rem,2vw,1.65rem)] font-bold text-slate-300">{current.ownerLabel}</p> : null}<div className={`mx-auto mt-10 inline-flex min-w-[clamp(15rem,28vw,28rem)] items-center justify-center gap-4 rounded-[2rem] border px-8 py-5 ${seconds < 0 ? "border-red-400/30 bg-red-400/10 text-red-300" : "border-purple-400/20 bg-purple-500/10"}`}><FiClock className="text-[clamp(1.5rem,3vw,3rem)]" /><span className="font-mono text-[clamp(3rem,6vw,6rem)] font-black tabular-nums">{clock(seconds)}</span></div></div> : <div><p className="text-[clamp(1rem,2vw,1.5rem)] font-bold text-purple-300">Service schedule ready</p><h2 className="mt-5 text-[clamp(3rem,8vw,8rem)] font-black tracking-[-0.06em]">Welcome.</h2>{liturgy.preacherName ? <div className="mt-8 flex items-center justify-center gap-5">{liturgy.preacherImageUrl ? <Image alt={liturgy.preacherName} className="size-24 rounded-full object-cover ring-4 ring-purple-500/30" height={96} src={liturgy.preacherImageUrl} unoptimized width={96} /> : null}<div className="text-left"><p className="text-xl font-black">{liturgy.preacherName}</p>{liturgy.sermonTitle ? <p className="mt-1 text-slate-400">{liturgy.sermonTitle}</p> : null}</div></div> : null}</div>}
    </section>
    <footer className="relative grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-[1fr_auto]"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Up next</p><p className="mt-2 text-[clamp(1.15rem,2vw,1.8rem)] font-bold">{next?.title ?? (completed ? "Service complete" : "Awaiting operator")}</p></div><div className="flex items-center gap-2 self-end">{visible.map((item) => <span aria-label={`${item.title}: ${item.status}`} className={`h-2 w-[clamp(1rem,2vw,2.5rem)] rounded-full ${item.status === "COMPLETED" ? "bg-emerald-400" : item.status === "ACTIVE" || item.status === "PAUSED" ? "bg-purple-400" : item.status === "SKIPPED" ? "bg-slate-700" : "bg-white/15"}`} key={item.id} />)}</div></footer>
  </main>;
}

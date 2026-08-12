import { FiClock, FiList, FiMonitor } from "react-icons/fi";
import { getAdminResource } from "../registrations/admin-api";

type Item = {
  id: string;
  position: number;
  title: string;
  plannedOffsetMinutes: number;
  plannedDurationMinutes: number;
  ownerLabel: string | null;
  showOnProjection: boolean;
};
type Template = {
  id: string;
  name: string;
  description: string | null;
  recurrenceRule: string;
  priority: number;
  isActive: boolean;
  items: Item[];
};

function clock(offset: number) {
  const total = 8 * 60 + 40 + offset;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${hours}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "pm" : "am"}`;
}

export default async function LiturgiesPage() {
  const templates = await getAdminResource<Template[]>("/liturgies/templates");
  return <main className="min-h-screen bg-[#090a0d] px-5 py-8 text-slate-100"><div className="mx-auto max-w-7xl">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400">Service production</p><h1 className="mt-2 text-3xl font-bold">Liturgy templates</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">The first-Sunday schedule takes priority automatically. A special event schedule will take priority over both defaults.</p></div><span className="rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">Defaults active all year</span></header>
    <section className="mt-8 grid gap-6 xl:grid-cols-2">{templates.map((template) => {
      const duration = template.items.reduce((total, item) => total + item.plannedDurationMinutes, 0);
      return <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#111318]" key={template.id}>
        <div className="border-b border-white/10 bg-gradient-to-r from-violet-500/15 to-transparent p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-violet-400">{template.recurrenceRule === "FIRST_SUNDAY" ? "Every first Sunday" : "Every other Sunday"}</p><h2 className="mt-2 text-xl font-bold">{template.name}</h2></div><span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">Priority {template.priority}</span></div><p className="mt-2 text-sm leading-6 text-slate-400">{template.description}</p><div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-slate-400"><span className="flex items-center gap-2"><FiList /> {template.items.length} items</span><span className="flex items-center gap-2"><FiClock /> {Math.floor(duration / 60)}h {duration % 60}m</span><span className="flex items-center gap-2"><FiMonitor /> Projection ready</span></div></div>
        <ol className="divide-y divide-white/[0.07] p-2">{template.items.map((item) => <li className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/[0.03]" key={item.id}><span className="grid size-8 place-items-center rounded-lg bg-violet-500/10 text-xs font-bold text-violet-300">{item.position}</span><div><p className="text-sm font-bold text-white">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.ownerLabel ?? "To be assigned"}{item.showOnProjection ? " · Projected" : ""}</p></div><div className="text-right"><p className="text-xs font-bold text-slate-300">{clock(item.plannedOffsetMinutes)}</p><p className="mt-1 text-[10px] font-bold text-slate-500">{item.plannedDurationMinutes} min</p></div></li>)}</ol>
      </article>;
    })}</section>
  </div></main>;
}

import Link from "next/link";
import { FiArrowLeft, FiMonitor } from "react-icons/fi";
import { getAdminResource } from "../../../registrations/admin-api";
import { LiturgyOperator, type LiveItem } from "./operator";

type Event = { id: string; name: string; startsAt: string };
type Liturgy = { id: string; preacherName: string | null; sermonTitle: string | null; completedAt: string | null; items: LiveItem[] };

export default async function EventLiturgyPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const [event, liturgy] = await Promise.all([
    getAdminResource<Event>(`/events/${eventId}`, { notFoundOn404: true }),
    getAdminResource<Liturgy | null>(`/live-liturgies/events/${eventId}`),
  ]);
  return <main className="min-h-screen bg-[#090a0d] px-5 py-8 text-slate-100"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link className="inline-flex items-center gap-2 font-bold text-violet-400" href={`/admin/events/${eventId}`}><FiArrowLeft /> Back to event</Link>{liturgy ? <Link className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-bold hover:bg-white/5" href={`/projection/${eventId}`} target="_blank"><FiMonitor /> Open projection</Link> : null}</div>
    <header className="my-7"><p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400">Live service operator</p><h1 className="mt-2 text-3xl font-bold">{event.name}</h1><p className="mt-2 text-sm text-slate-400">Timing controls synchronize the service schedule and projection view.</p></header>
    {liturgy ? <LiturgyOperator eventId={eventId} items={liturgy.items} /> : <section className="rounded-2xl border border-dashed border-white/15 bg-[#111318] p-12 text-center"><h2 className="text-xl font-bold">Generate the event liturgy first</h2><Link className="mt-4 inline-flex font-bold text-violet-400" href={`/admin/events/${eventId}`}>Return to event setup →</Link></section>}
  </div></main>;
}

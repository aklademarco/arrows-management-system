import { getProjection } from "./projection-api";
import { ProjectionView, type ProjectionItem } from "./projection-view";

type Liturgy = {
  eventName: string;
  preacherName: string | null;
  sermonTitle: string | null;
  preacherImageUrl: string | null;
  completedAt: string | null;
  projectionEnabled: boolean;
  items: ProjectionItem[];
};

export default async function ProjectionPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const liturgy = await getProjection<Liturgy | null>(eventId);
  if (!liturgy || !liturgy.projectionEnabled) return <main className="grid min-h-screen place-items-center bg-[#08050d] p-8 text-center text-white"><div><h1 className="text-3xl font-black">Projection unavailable</h1><p className="mt-3 text-slate-400">Generate or enable the event liturgy before opening this screen.</p></div></main>;
  return <ProjectionView liturgy={liturgy} />;
}

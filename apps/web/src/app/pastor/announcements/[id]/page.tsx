import { EventDetail } from "@/components/announcements/event-detail";
import { loadEvent, type EventSearchParams } from "@/lib/event-data";

export default async function PastorEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<EventSearchParams>;
}) {
  const { id } = await params;
  const data = await loadEvent("pastor", id, await searchParams);
  return (
    <main className="min-h-screen px-4 pb-10 pt-4 sm:px-6 lg:px-10 lg:pt-8">
      <EventDetail portal="pastor" {...data} />
    </main>
  );
}

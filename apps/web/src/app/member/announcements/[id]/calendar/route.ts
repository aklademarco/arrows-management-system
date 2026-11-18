import { proxyEventCalendar } from "@/lib/event-calendar-proxy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyEventCalendar(request, "member", id);
}

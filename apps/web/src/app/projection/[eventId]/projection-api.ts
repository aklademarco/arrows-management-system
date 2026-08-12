import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getProjection<T>(eventId: string): Promise<T> {
  const store = await cookies();
  const token =
    store.get("acms_admin_session")?.value ??
    store.get("acms_leader_session")?.value ??
    store.get("acms_member_session")?.value;
  if (!token) redirect("/login");
  const response = await fetch(`${process.env.API_URL ?? "http://localhost:4000/api/v1"}/live-liturgies/events/${eventId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) redirect("/login");
  if (!response.ok) throw new Error("The projection schedule could not be loaded.");
  const body = (await response.json()) as { data: T };
  return body.data;
}

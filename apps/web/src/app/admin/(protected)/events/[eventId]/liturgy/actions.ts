"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const schema = z.object({
  eventId: z.uuid(),
  itemId: z.uuid(),
  action: z.enum(["START", "PAUSE", "RESUME", "EXTEND", "SKIP", "COMPLETE"]),
  extensionMinutes: z.number().int().min(1).max(60).optional(),
});

export async function controlLiturgyItem(input: z.infer<typeof schema>) {
  const data = schema.parse(input);
  const token = (await cookies()).get("acms_admin_session")?.value;
  if (!token) redirect("/admin/login");
  const response = await fetch(`${process.env.API_URL ?? "http://localhost:4000/api/v1"}/live-liturgies/items/${data.itemId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ action: data.action, extensionMinutes: data.extensionMinutes }),
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) redirect("/admin/login");
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    throw new Error(Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? "The live schedule could not be updated.");
  }
  revalidatePath(`/admin/events/${data.eventId}/liturgy`);
  revalidatePath(`/admin/events/${data.eventId}`);
}

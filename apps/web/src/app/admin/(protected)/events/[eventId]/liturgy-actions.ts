"use server";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const schema = z.object({
  eventId: z.uuid(),
  templateId: z.uuid().optional(),
  preacherName: z.string().trim().max(180).optional(),
  sermonTitle: z.string().trim().max(255).optional(),
  imageData: z.string().startsWith("data:image/").optional(),
});

export async function generateEventLiturgy(input: z.infer<typeof schema>) {
  const data = schema.parse(input);
  const token = (await cookies()).get("acms_admin_session")?.value;
  if (!token) redirect("/admin/login");
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  let preacherImageUrl: string | undefined;
  let preacherImagePublicId: string | undefined;
  if (data.imageData) {
    const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(data.imageData);
    if (!match || Buffer.byteLength(match[2], "base64") > 5_000_000) throw new Error("Choose a JPEG, PNG, or WebP image no larger than 5 MB.");
    // This endpoint checks the live administrator role and scopes the event to
    // that administrator's church before we use the Cloudinary credentials.
    const eventResponse = await fetch(`${apiUrl}/events/${data.eventId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (eventResponse.status === 401 || eventResponse.status === 403) redirect("/admin/login");
    if (eventResponse.status === 404) throw new Error("Event not found.");
    if (!eventResponse.ok) throw new Error("Unable to verify your preacher image upload permissions. Try again shortly.");
    const event = z.object({
      success: z.literal(true),
      data: z.object({ id: z.literal(data.eventId) }),
    }).safeParse(await eventResponse.json().catch(() => null));
    if (!event.success) throw new Error("Unable to verify access to this event.");
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloudinary photo storage is not configured.");
    const folder = "acms/preachers";
    const publicId = `${data.eventId}-${crypto.randomUUID()}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash("sha1").update(`folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).digest("hex");
    const form = new FormData();
    for (const [key, value] of Object.entries({ file: data.imageData, api_key: apiKey, timestamp: String(timestamp), signature, folder, public_id: publicId })) form.set(key, value);
    const upload = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: form });
    const uploaded = (await upload.json().catch(() => null)) as { secure_url?: string; public_id?: string; error?: { message?: string } } | null;
    if (!upload.ok || !uploaded?.secure_url || !uploaded.public_id) throw new Error(uploaded?.error?.message ?? "Preacher image could not be uploaded.");
    preacherImageUrl = uploaded.secure_url;
    preacherImagePublicId = uploaded.public_id;
  }
  const response = await fetch(`${apiUrl}/liturgies/events/${data.eventId}/generate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      templateId: data.templateId,
      preacherName: data.preacherName || undefined,
      sermonTitle: data.sermonTitle || undefined,
      preacherImageUrl,
      preacherImagePublicId,
    }),
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) redirect("/admin/login");
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    throw new Error(Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? "Event liturgy could not be generated.");
  }
  revalidatePath(`/admin/events/${data.eventId}`);
}

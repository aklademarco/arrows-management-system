"use server";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const flyerSchema = z.object({
  title: z.string().trim().min(1).max(180),
  instructions: z.string().trim().max(2000).optional(),
  deadlineAt: z.string().optional(),
  imageData: z.string().startsWith("data:image/"),
  fileName: z.string().max(255),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

export async function sendPublicityFlyer(input: z.infer<typeof flyerSchema>) {
  const data = flyerSchema.parse(input);
  const token = (await cookies()).get("acms_member_session")?.value;
  if (!token) redirect("/login");
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloudinary photo storage is not configured.");
  const folder = "acms/ministry-flyers";
  const publicId = `flyer-${crypto.randomUUID()}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha1")
    .update(`folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");
  const form = new FormData();
  Object.entries({ file: data.imageData, api_key: apiKey, timestamp: String(timestamp), signature, folder, public_id: publicId }).forEach(([key, value]) => form.set(key, value));
  const upload = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: form });
  const uploaded = (await upload.json().catch(() => null)) as { secure_url?: string; public_id?: string; error?: { message?: string } } | null;
  if (!upload.ok || !uploaded?.secure_url || !uploaded.public_id) throw new Error(uploaded?.error?.message ?? "Flyer could not be uploaded.");
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiUrl}/ministry-content/publicity-flyers`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      title: data.title,
      instructions: data.instructions || undefined,
      deadlineAt: data.deadlineAt ? new Date(data.deadlineAt).toISOString() : undefined,
      cloudinaryUrl: uploaded.secure_url,
      cloudinaryPublicId: uploaded.public_id,
      fileName: data.fileName,
      mimeType: data.mimeType,
    }),
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) redirect("/login");
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    throw new Error(Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? "Flyer could not be sent.");
  }
  revalidatePath("/member/media-hub");
  revalidatePath("/member", "layout");
}

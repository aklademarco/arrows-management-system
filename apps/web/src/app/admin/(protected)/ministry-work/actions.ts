"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function advanceMinistryWork(formData: FormData) {
  const contentId = z.uuid().parse(formData.get("contentId"));
  const action = z.enum(["ACKNOWLEDGE", "COMPLETE"]).parse(formData.get("action"));
  const token = (await cookies()).get("acms_admin_session")?.value;
  if (!token) redirect("/admin/login");
  const response = await fetch(`${process.env.API_URL ?? "http://localhost:4000/api/v1"}/ministry-content/${contentId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) redirect("/admin/login");
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    throw new Error(Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? "The ministry work item could not be updated.");
  }
  revalidatePath("/admin/ministry-work");
  revalidatePath("/member/media-hub");
  revalidatePath("/leader/ministry");
}

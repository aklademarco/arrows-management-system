"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

const followUpSchema = z.object({
  memberId: z.uuid(),
  method: z.enum(["CALL", "MESSAGE", "VISIT", "IN_PERSON", "OTHER"]),
  outcome: z.enum([
    "NO_RESPONSE",
    "REACHED",
    "NEEDS_PRAYER",
    "NEEDS_VISIT",
    "SICK",
    "TRAVELLING",
    "RETURNING_SOON",
    "CARE_COMPLETED",
  ]),
  notes: z.string().trim().max(2000),
  nextFollowUpOn: z.string().trim(),
});

export async function recordPastoralFollowUp(formData: FormData) {
  const input = followUpSchema.parse({
    memberId: formData.get("memberId"),
    method: formData.get("method"),
    outcome: formData.get("outcome"),
    notes: formData.get("notes") ?? "",
    nextFollowUpOn: formData.get("nextFollowUpOn") ?? "",
  });
  const token = (await cookies()).get("acms_admin_session")?.value;
  if (!token) redirect("/admin/login");
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(
    `${apiUrl}/pastoral-care/members/${input.memberId}/follow-ups`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        method: input.method,
        outcome: input.outcome,
        notes: input.notes || undefined,
        nextFollowUpOn: input.nextFollowUpOn || undefined,
      }),
      cache: "no-store",
    },
  );
  if (response.status === 401 || response.status === 403)
    redirect("/admin/login");
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(" ")
      : body?.message;
    throw new Error(message ?? "The follow-up could not be recorded.");
  }
  revalidatePath("/admin/pastoral-care");
}

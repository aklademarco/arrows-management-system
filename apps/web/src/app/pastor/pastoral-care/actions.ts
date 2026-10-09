"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

const schema = z.object({
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

const requestStatusSchema = z.object({
  requestId: z.uuid(),
  status: z.enum(["IN_REVIEW", "RESOLVED"]),
});

export async function recordPastorFollowUp(formData: FormData) {
  const input = schema.parse({
    memberId: formData.get("memberId"),
    method: formData.get("method"),
    outcome: formData.get("outcome"),
    notes: formData.get("notes") ?? "",
    nextFollowUpOn: formData.get("nextFollowUpOn") ?? "",
  });

  const token = (await cookies()).get("acms_pastor_session")?.value;

  if (!token) redirect("/login");

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
    },
  );

  if (response.status === 401 || response.status === 403) {
    redirect("/login");
  }

  if (!response.ok) {
    throw new Error("The follow-up could not be recorded.");
  }

  revalidatePath("/pastor/pastoral-care");
}

export async function updatePastoralRequestStatus(formData: FormData) {
  const input = requestStatusSchema.parse({
    requestId: formData.get("requestId"),
    status: formData.get("status"),
  });
  const token = (await cookies()).get("acms_pastor_session")?.value;
  if (!token) redirect("/login");

  const response = await fetch(
    `${process.env.API_URL ?? "http://localhost:4000/api/v1"}/pastoral-care/requests/${input.requestId}/status`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: input.status }),
      cache: "no-store",
    },
  );
  if (response.status === 401 || response.status === 403) redirect("/login");
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    throw new Error(
      Array.isArray(body?.message)
        ? body.message.join(" ")
        : (body?.message ?? "The request could not be updated."),
    );
  }

  revalidatePath("/pastor/pastoral-care");
  revalidatePath("/pastor");
}

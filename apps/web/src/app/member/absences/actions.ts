"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function submitAbsence(payload: Record<string, string | undefined>) {
  const token = (await cookies()).get("acms_member_session")?.value;
  if (!token) redirect("/login");
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiUrl}/absence-requests`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) redirect("/login");
  if (!response.ok) {
    const body = (await response.json()) as { message?: string | string[] };
    throw new Error(Array.isArray(body.message) ? body.message.join(" ") : (body.message ?? "Absence request could not be submitted."));
  }
  revalidatePath("/member/absences");
}

export async function submitEventAbsence(formData: FormData) {
  await submitAbsence({
    eventId: String(formData.get("eventId") ?? ""),
    reason: String(formData.get("reason") ?? "").trim(),
    details: String(formData.get("details") ?? "").trim() || undefined,
  });
}

export async function submitDateRangeAbsence(formData: FormData) {
  await submitAbsence({
    startsOn: String(formData.get("startsOn") ?? ""),
    endsOn: String(formData.get("endsOn") ?? ""),
    reason: String(formData.get("reason") ?? "").trim(),
    details: String(formData.get("details") ?? "").trim() || undefined,
  });
}

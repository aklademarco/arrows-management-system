"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function reviewAbsence(formData: FormData) {
  const requestId = z.uuid().parse(formData.get("requestId"));
  const status = z.enum(["APPROVED", "REJECTED", "NEEDS_CLARIFICATION"]).parse(formData.get("status"));
  const token = (await cookies()).get("acms_admin_session")?.value;
  if (!token) redirect("/admin/login");
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiUrl}/absence-requests/${requestId}/review`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ status, reviewNote: String(formData.get("reviewNote") ?? "").trim() }),
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) redirect("/admin/login");
  if (!response.ok) {
    const body = (await response.json()) as { message?: string | string[] };
    throw new Error(Array.isArray(body.message) ? body.message.join(" ") : (body.message ?? "Absence request could not be reviewed."));
  }
  revalidatePath("/admin/absences");
  revalidatePath("/member/absences");
}

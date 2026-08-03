"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function mutate(
  path: string,
  method: "POST" | "PATCH",
  payload: object,
  eventId: string,
) {
  const token = (await cookies()).get("acms_admin_session")?.value;
  if (!token) redirect("/admin/login");
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403)
    redirect("/admin/login");
  if (!response.ok) {
    const body = (await response.json()) as { message?: string | string[] };
    throw new Error(
      Array.isArray(body.message)
        ? body.message.join(" ")
        : (body.message ?? "Attendance action failed."),
    );
  }
  revalidatePath(`/admin/events/${eventId}/attendance`);
  revalidatePath("/member");
}

export async function markManualAttendance(formData: FormData) {
  const eventId = String(formData.get("eventId"));
  await mutate(
    "/attendance/manual",
    "POST",
    {
      eventId,
      memberId: String(formData.get("memberId")),
      status: String(formData.get("status")),
      reason: String(formData.get("reason") ?? "").trim(),
    },
    eventId,
  );
}

export async function correctAttendance(formData: FormData) {
  const eventId = String(formData.get("eventId"));
  await mutate(
    `/attendance/${String(formData.get("attendanceId"))}`,
    "PATCH",
    {
      status: String(formData.get("status")),
      reviewNote: String(formData.get("reviewNote") ?? "").trim(),
    },
    eventId,
  );
}

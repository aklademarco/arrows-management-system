"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

async function update(path: string) {
  const token = (await cookies()).get("acms_leader_session")?.value;
  if (!token) redirect("/login");
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiUrl}${path}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) redirect("/login");
  if (!response.ok) throw new Error("Notification could not be updated.");
  revalidatePath("/leader", "layout");
  revalidatePath("/leader/inbox");
}

export async function markLeaderNotificationRead(formData: FormData) {
  await update(
    `/notifications/${z.uuid().parse(formData.get("notificationId"))}/read`,
  );
}

export async function markAllLeaderNotificationsRead() {
  await update("/notifications/read-all");
}

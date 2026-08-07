"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

async function patchNotification(path: string) {
  const token = (await cookies()).get("acms_member_session")?.value;
  if (!token) redirect("/login");
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiUrl}${path}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) redirect("/login");
  if (!response.ok) throw new Error("Notification could not be updated.");
  revalidatePath("/member", "layout");
}

export async function markNotificationRead(formData: FormData) {
  const notificationId = z.uuid().parse(formData.get("notificationId"));
  await patchNotification(`/notifications/${notificationId}/read`);
}

export async function markAllNotificationsRead() {
  await patchNotification("/notifications/read-all");
}

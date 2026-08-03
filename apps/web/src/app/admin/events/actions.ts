"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function createEvent(formData: FormData) {
  const token = (await cookies()).get("acms_admin_session")?.value;
  if (!token) redirect("/admin/login");
  const value = (name: string) => String(formData.get(name) ?? "").trim();
  const payload = {
    name: value("name"),
    eventType: value("eventType"),
    description: value("description") || undefined,
    startsAt: new Date(value("startsAt")).toISOString(),
    endsAt: new Date(value("endsAt")).toISOString(),
    attendanceOpensAt: new Date(value("attendanceOpensAt")).toISOString(),
    attendanceClosesAt: new Date(value("attendanceClosesAt")).toISOString(),
    earlyUntil: value("earlyUntil") ? new Date(value("earlyUntil")).toISOString() : undefined,
    lateAfter: new Date(value("lateAfter")).toISOString(),
    locationName: value("locationName") || undefined,
    latitude: Number(value("latitude")),
    longitude: Number(value("longitude")),
    geofenceRadiusMeters: Number(value("geofenceRadiusMeters")),
    maximumAccuracyMeters: Number(value("maximumAccuracyMeters")),
  };
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiUrl}/events`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) redirect("/admin/login");
  if (!response.ok) {
    const body = (await response.json()) as { message?: string | string[] };
    throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Event could not be scheduled.");
  }
  revalidatePath("/admin/events");
  revalidatePath("/member");
}

async function mutateEvent(eventId: string, method: "PATCH" | "POST", suffix: string, payload: object) {
  const token = (await cookies()).get("acms_admin_session")?.value;
  if (!token) redirect("/admin/login");
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiUrl}/events/${eventId}${suffix}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) redirect("/admin/login");
  if (!response.ok) {
    const body = (await response.json()) as { message?: string | string[] };
    throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Event action failed.");
  }
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/member");
}

export async function updateEvent(formData: FormData) {
  const eventId = String(formData.get("eventId"));
  const value = (name: string) => String(formData.get(name) ?? "").trim();
  await mutateEvent(eventId, "PATCH", "", {
    name: value("name"),
    description: value("description"),
    startsAt: new Date(value("startsAt")).toISOString(),
    endsAt: new Date(value("endsAt")).toISOString(),
    attendanceOpensAt: new Date(value("attendanceOpensAt")).toISOString(),
    attendanceClosesAt: new Date(value("attendanceClosesAt")).toISOString(),
    earlyUntil: value("earlyUntil") ? new Date(value("earlyUntil")).toISOString() : undefined,
    lateAfter: new Date(value("lateAfter")).toISOString(),
    locationName: value("locationName"),
    geofenceRadiusMeters: Number(value("geofenceRadiusMeters")),
    maximumAccuracyMeters: Number(value("maximumAccuracyMeters")),
  });
}

export async function cancelEvent(formData: FormData) {
  const eventId = String(formData.get("eventId"));
  await mutateEvent(eventId, "POST", "/cancel", { reason: String(formData.get("reason") ?? "").trim() });
}

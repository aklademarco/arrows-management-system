"use server";

import { cookies } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";

export type GeofenceSaveState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function saveGeofence(
  _previousState: GeofenceSaveState,
  formData: FormData,
): Promise<GeofenceSaveState> {
  const token = (await cookies()).get("acms_admin_session")?.value;
  if (!token) redirect("/admin/login");
  const value = (name: string) => String(formData.get(name) ?? "").trim();
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";

  try {
    const response = await fetch(`${apiUrl}/events/geofence-settings`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locationName: value("locationName"),
        latitude: Number(value("latitude")),
        longitude: Number(value("longitude")),
        geofenceRadiusMeters: Number(value("geofenceRadiusMeters")),
        maximumAccuracyMeters: Number(value("maximumAccuracyMeters")),
      }),
      cache: "no-store",
    });
    if (response.status === 401 || response.status === 403) {
      redirect("/admin/login");
    }
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        message?: string | string[];
      } | null;
      throw new Error(
        Array.isArray(body?.message)
          ? body.message.join(" ")
          : body?.message ?? "The church geofence could not be saved.",
      );
    }
    return {
      status: "success",
      message: "Church location saved. Current and upcoming services now use this boundary.",
    };
  } catch (error) {
    unstable_rethrow(error);
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "The church geofence could not be saved.",
    };
  }
}

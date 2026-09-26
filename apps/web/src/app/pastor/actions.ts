"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { performCheckIn, type CheckInResult } from "@/lib/check-in";

export async function pastorLogout() {
  const store = await cookies();

  store.delete("acms_pastor_session");
  store.delete("acms_member_session");

  redirect("/login");
}

export async function pastorCheckIn(
  eventId: string,
  latitude: number,
  longitude: number,
  accuracyMeters: number,
): Promise<CheckInResult> {
  const token = (await cookies()).get("acms_pastor_session")?.value;

  return performCheckIn(token, eventId, latitude, longitude, accuracyMeters);
}

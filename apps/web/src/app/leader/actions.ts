"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { performCheckIn, type CheckInResult } from "@/lib/check-in";

export async function leaderLogout() {
  const store = await cookies();
  store.delete("acms_leader_session");
  store.delete("acms_member_session");
  redirect("/login");
}

export async function leaderCheckIn(eventId: string, latitude: number, longitude: number, accuracyMeters: number): Promise<CheckInResult> {
  const token = (await cookies()).get("acms_leader_session")?.value;
  return performCheckIn(token, eventId, latitude, longitude, accuracyMeters);
}

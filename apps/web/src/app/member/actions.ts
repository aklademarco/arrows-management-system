"use server";

import { cookies } from "next/headers";
import { performCheckIn, type CheckInResult } from "@/lib/check-in";

export type { CheckInResult };

export async function checkIn(eventId: string, latitude: number, longitude: number, accuracyMeters: number): Promise<CheckInResult> {
  const token = (await cookies()).get("acms_member_session")?.value;
  return performCheckIn(token, eventId, latitude, longitude, accuracyMeters);
}

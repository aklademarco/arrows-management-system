"use server";

import { cookies } from "next/headers";
import { z } from "zod";

const inputSchema = z.object({
  token: z.string().min(1).max(4096).regex(/^[A-Za-z0-9_:.-]+$/),
  enabled: z.boolean(),
});

export async function updatePushDevice(input: { token: string; enabled: boolean }) {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Invalid device registration." };
  const session = (await cookies()).get("acms_member_session")?.value;
  if (!session) return { success: false, message: "Sign in again to change notifications." };
  try {
    const response = await fetch(`${process.env.API_URL ?? "http://localhost:4000/api/v1"}/notifications/push-device`, {
      method: parsed.data.enabled ? "PUT" : "DELETE",
      headers: { Authorization: `Bearer ${session}`, "Content-Type": "application/json" },
      body: JSON.stringify({ token: parsed.data.token }),
      cache: "no-store",
    });
    if (!response.ok) return { success: false, message: "Could not save notification settings. Please try again." };
    return { success: true, message: parsed.data.enabled ? "This browser is registered for push notifications." : "Push notifications disabled on this browser." };
  } catch {
    return { success: false, message: "The notification service is unavailable. Please try again." };
  }
}

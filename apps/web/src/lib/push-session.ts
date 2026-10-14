import { cookies } from "next/headers";

export const pushPromptDismissedCookie = "acms_push_prompt_dismissed";

export const pushCookie = "acms_push_revocation";
export async function savePushRevocationSecret(secret: string) {
  if (!/^[a-f0-9]{64}$/.test(secret))
    throw new Error("Invalid device response.");
  (await cookies()).set(pushCookie, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 86400,
  });
}

export async function revokeBrowserPush() {
  const store = await cookies();
  const secret = store.get(pushCookie)?.value;
  if (!secret) return;
  const response = await fetch(
    `${process.env.API_URL ?? "http://localhost:4000/api/v1"}/push-devices/revoke`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    },
  );
  if (!response.ok)
    throw new Error(
      "Could not remove this browser’s previous push registration. Please retry.",
    );
  store.delete(pushCookie);
}

// Always allow logout. Keep the cleanup cookie on failure so the next login retries.
export async function revokePushOnLogout() {
  try {
    await revokeBrowserPush();
  } catch {
    /* No private details are included in push payloads. */
  }
}

"use server";

import { revokeBrowserPush, savePushRevocationSecret } from "@/lib/push-session";
import { z } from "zod";
import { getClientIpHeaders } from "@/lib/client-api";

export type AccountStatusState = {
  success: boolean;
  message: string;
  accountStatus?: string;
  emailVerified?: boolean;
  pushRegistered?: boolean;
};
const schema = z.object({
  pushToken: z.string().min(1).max(4096).regex(/^[A-Za-z0-9_:.-]+$/).optional(),
  email: z.email("Enter a valid email address.").max(255),
  password: z.string().min(1, "Enter your password.").max(128),
});

export async function checkAccountStatus(
  _previous: AccountStatusState,
  formData: FormData,
): Promise<AccountStatusState> {
  const result = schema.safeParse({
    email: formData.get("email"),
    pushToken: formData.get("pushToken") || undefined,
    password: formData.get("password"),
  });
  if (!result.success)
    return { success: false, message: result.error.issues[0].message };
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  try {
    if (result.data.pushToken) await revokeBrowserPush();
    const clientIpHeaders = await getClientIpHeaders();
    const response = await fetch(`${apiUrl}/auth/account-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...clientIpHeaders },
      body: JSON.stringify(result.data),
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as {
      message?: string;
      data?: { accountStatus: string; emailVerified: boolean; pushRegistered?: boolean; revocationSecret?: string };
    } | null;
    if (!response.ok || !body?.data)
      return {
        success: false,
        message: body?.message ?? "The account status could not be checked.",
      };
    if (body.data.revocationSecret) await savePushRevocationSecret(body.data.revocationSecret);
    return {
      success: true,
      message: body.message ?? "Account status retrieved.",
      accountStatus: body.data.accountStatus,
      emailVerified: body.data.emailVerified,
      pushRegistered: body.data.pushRegistered,
    };
  } catch {
    return {
      success: false,
      message: "The account service is unavailable. Try again shortly.",
    };
  }
}

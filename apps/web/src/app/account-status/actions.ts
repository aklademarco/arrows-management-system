"use server";

import { z } from "zod";

export type AccountStatusState = {
  success: boolean;
  message: string;
  accountStatus?: string;
  emailVerified?: boolean;
};
const schema = z.object({
  email: z.email("Enter a valid email address.").max(255),
  password: z.string().min(1, "Enter your password.").max(128),
});

export async function checkAccountStatus(
  _previous: AccountStatusState,
  formData: FormData,
): Promise<AccountStatusState> {
  const result = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!result.success)
    return { success: false, message: result.error.issues[0].message };
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  try {
    const response = await fetch(`${apiUrl}/auth/account-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.data),
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as {
      message?: string;
      data?: { accountStatus: string; emailVerified: boolean };
    } | null;
    if (!response.ok || !body?.data)
      return {
        success: false,
        message: body?.message ?? "The account status could not be checked.",
      };
    return {
      success: true,
      message: body.message ?? "Account status retrieved.",
      ...body.data,
    };
  } catch {
    return {
      success: false,
      message: "The account service is unavailable. Try again shortly.",
    };
  }
}

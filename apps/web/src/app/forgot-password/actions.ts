"use server";

import { z } from "zod";

export type PasswordResetState = { success: boolean; message: string };

const emailSchema = z.email("Enter a valid email address.").max(255);
const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(128)
  .regex(/[a-z]/, "Include a lowercase letter.")
  .regex(/[A-Z]/, "Include an uppercase letter.")
  .regex(/\d/, "Include a number.")
  .regex(/[^A-Za-z0-9]/, "Include a special character.");

async function post(path: string, payload: Record<string, string>) {
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as {
    message?: string | string[];
  } | null;
  const message = Array.isArray(body?.message)
    ? body.message.join(" ")
    : body?.message;
  return { ok: response.ok, message };
}

export async function requestPasswordReset(
  _previousState: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const result = emailSchema.safeParse(formData.get("email"));
  if (!result.success)
    return { success: false, message: result.error.issues[0].message };
  try {
    const response = await post("/auth/password-reset/request", {
      email: result.data.toLowerCase(),
    });
    return {
      success: response.ok,
      message:
        response.message ??
        "If the account exists, reset instructions have been sent.",
    };
  } catch {
    return {
      success: false,
      message: "The password-reset service is unavailable. Try again shortly.",
    };
  }
}

export async function confirmPasswordReset(
  _previousState: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const token = z.string().min(32).max(512).safeParse(formData.get("token"));
  const password = passwordSchema.safeParse(formData.get("password"));
  const confirmation = formData.get("passwordConfirmation");
  if (!token.success)
    return {
      success: false,
      message: "This password-reset link is incomplete or invalid.",
    };
  if (!password.success)
    return { success: false, message: password.error.issues[0].message };
  if (password.data !== confirmation)
    return { success: false, message: "The passwords do not match." };
  try {
    const response = await post("/auth/password-reset/confirm", {
      token: token.data,
      newPassword: password.data,
    });
    return {
      success: response.ok,
      message:
        response.message ??
        (response.ok
          ? "Password updated."
          : "This reset link could not be used."),
    };
  } catch {
    return {
      success: false,
      message: "The password-reset service is unavailable. Try again shortly.",
    };
  }
}

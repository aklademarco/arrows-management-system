"use server";

import { z } from "zod";

export type EmailVerificationState = {
  success: boolean;
  message: string;
};

const tokenSchema = z.string().min(32).max(256);
const emailSchema = z.email().max(255);

async function post(path: string, payload: Record<string, string>) {
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const body = (await response.json()) as { message?: string };
  return { ok: response.ok, message: body.message };
}

export async function confirmEmail(
  _previousState: EmailVerificationState,
  formData: FormData,
): Promise<EmailVerificationState> {
  const result = tokenSchema.safeParse(formData.get("token"));
  if (!result.success) {
    return {
      success: false,
      message: "This verification link is incomplete or invalid.",
    };
  }

  try {
    const response = await post("/auth/email-verification/confirm", {
      token: result.data,
    });
    return {
      success: response.ok,
      message:
        response.message ??
        (response.ok
          ? "Your email address has been verified."
          : "This verification link could not be used."),
    };
  } catch {
    return {
      success: false,
      message: "The verification service is unavailable. Please try again.",
    };
  }
}

export async function requestVerificationEmail(
  _previousState: EmailVerificationState,
  formData: FormData,
): Promise<EmailVerificationState> {
  const result = emailSchema.safeParse(formData.get("email"));
  if (!result.success) {
    return {
      success: false,
      message: "Enter a valid email address.",
    };
  }

  try {
    const response = await post("/auth/email-verification/request", {
      email: result.data.toLowerCase(),
    });
    return {
      success: response.ok,
      message:
        response.message ??
        "If verification is required, instructions have been sent.",
    };
  } catch {
    return {
      success: false,
      message: "The email service is unavailable. Please try again.",
    };
  }
}

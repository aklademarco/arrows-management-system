"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

export type MemberLoginState = {
  message: string;
  errors?: { email?: string[]; password?: string[] };
};

const schema = z.object({
  email: z.email("Enter a valid email address.").max(255),
  password: z.string().min(1, "Enter your password.").max(128),
});

export async function memberLogin(
  _previousState: MemberLoginState,
  formData: FormData,
): Promise<MemberLoginState> {
  const result = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!result.success) {
    return {
      message: "Check the highlighted fields.",
      errors: result.error.flatten().fieldErrors,
    };
  }

  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  try {
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.data),
      cache: "no-store",
    });
    const body = (await response.json()) as {
      message?: string;
      data?: { accessToken: string };
    };
    if (!response.ok || !body.data) {
      return { message: body.message ?? "Unable to sign in." };
    }
    const profileResponse = await fetch(`${apiUrl}/members/me`, {
      headers: { Authorization: `Bearer ${body.data.accessToken}` },
      cache: "no-store",
    });
    if (!profileResponse.ok) {
      return { message: "This account does not have an active member profile." };
    }
    (await cookies()).set("acms_member_session", body.data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    });
  } catch {
    return { message: "The login service is unavailable. Try again shortly." };
  }
  redirect("/member");
}

export async function memberLogout() {
  (await cookies()).delete("acms_member_session");
  redirect("/login");
}

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

export type AdminLoginState = {
  message: string;
  errors?: { email?: string[]; password?: string[] };
};

const schema = z.object({
  email: z.email("Enter a valid email address.").max(255),
  password: z.string().min(1, "Enter your password.").max(128),
});

export async function adminLogin(
  _previousState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const result = schema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return {
      message: "Check the highlighted fields.",
      errors: result.error.flatten().fieldErrors,
    };
  }

  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  let response: Response;
  try {
    response = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.data),
      cache: "no-store",
    });
  } catch {
    return { message: "The login service is unavailable. Try again shortly." };
  }

  const body = (await response.json()) as {
    message?: string;
    data?: {
      accessToken: string;
      user: { roles: string[] };
    };
  };
  if (!response.ok || !body.data) {
    return { message: body.message ?? "Unable to sign in." };
  }
  if (
    !body.data.user.roles.includes("SUPER_ADMIN") &&
    !body.data.user.roles.includes("ADMIN")
  ) {
    return { message: "This account does not have administrator access." };
  }

  const cookieStore = await cookies();
  cookieStore.set("acms_admin_session", body.data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60,
    path: "/",
  });
  redirect("/admin/registrations");
}

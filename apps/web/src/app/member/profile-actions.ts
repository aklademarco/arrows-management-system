"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  otherNames: z.string().trim().max(150).nullable(),
  phone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{7,14}$/, "Use international format, for example +233240000000.")
    .nullable(),
});

export async function updateOwnProfile(formData: FormData) {
  const parseOptional = (name: string) => {
    const value = String(formData.get(name) ?? "").trim();
    return value || null;
  };
  const result = profileSchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    otherNames: parseOptional("otherNames"),
    phone: parseOptional("phone"),
  });
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Check the profile details.");
  }

  const token = (await cookies()).get("acms_member_session")?.value;
  if (!token) redirect("/login");
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiUrl}/members/me`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(result.data),
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) redirect("/login");
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(body?.message) ? body.message.join(" ") : body?.message;
    throw new Error(message ?? "Your profile could not be updated.");
  }
  revalidatePath("/member");
  revalidatePath("/member/profile");
  redirect("/member/profile?updated=1");
}

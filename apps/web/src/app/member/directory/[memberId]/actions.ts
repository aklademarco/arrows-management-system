"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function sayHello(formData: FormData) {
  const memberId = z.uuid().parse(formData.get("memberId"));
  const token = (await cookies()).get("acms_member_session")?.value;
  if (!token) redirect("/login");
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiUrl}/members/directory/${memberId}/hello`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) redirect("/login");
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(" ")
      : body?.message;
    throw new Error(message ?? "Your hello could not be sent.");
  }
  redirect(`/member/directory/${memberId}?hello=1`);
}

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const userIdSchema = z.uuid();

async function review(
  path: string,
  payload: Record<string, string | string[]>,
) {
  const token = (await cookies()).get("acms_admin_session")?.value;
  if (!token) {
    redirect("/admin/login");
  }
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) {
    (await cookies()).delete("acms_admin_session");
    redirect("/admin/login");
  }
  if (!response.ok) {
    const body = (await response.json()) as { message?: string };
    throw new Error(body.message ?? "The administrative action failed.");
  }
  revalidatePath("/admin/registrations");
}

export async function approveRegistration(formData: FormData) {
  const userId = userIdSchema.parse(formData.get("userId"));
  const primaryDepartmentId = userIdSchema.parse(
    formData.get("primaryDepartmentId"),
  );
  const additionalDepartmentIds = z
    .array(userIdSchema)
    .parse(formData.getAll("additionalDepartmentIds"));
  const note = String(formData.get("note") ?? "").trim();
  await review(`/admin/registrations/${userId}/approve`, {
    primaryDepartmentId,
    additionalDepartmentIds,
    ...(note ? { note } : {}),
  });
}

export async function rejectRegistration(formData: FormData) {
  const userId = userIdSchema.parse(formData.get("userId"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 3) {
    throw new Error("Enter a rejection reason.");
  }
  await review(`/admin/registrations/${userId}/reject`, { reason });
}

export async function suspendUser(formData: FormData) {
  const userId = userIdSchema.parse(formData.get("userId"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 3) {
    throw new Error("Enter a suspension reason.");
  }
  await review(`/admin/users/${userId}/suspend`, { reason });
  revalidatePath(`/admin/registrations/${userId}`);
  const memberId = formData.get("memberId");
  if (typeof memberId === "string") {
    revalidatePath(`/admin/members/${userIdSchema.parse(memberId)}`);
  }
}

export async function reactivateUser(formData: FormData) {
  const userId = userIdSchema.parse(formData.get("userId"));
  await review(`/admin/users/${userId}/reactivate`, {});
  revalidatePath(`/admin/registrations/${userId}`);
  const memberId = formData.get("memberId");
  if (typeof memberId === "string") {
    revalidatePath(`/admin/members/${userIdSchema.parse(memberId)}`);
  }
}

export async function adminLogout() {
  (await cookies()).delete("acms_admin_session");
  redirect("/admin/login");
}

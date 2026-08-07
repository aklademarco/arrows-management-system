"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const memberIdSchema = z.uuid();

export async function updateMember(formData: FormData) {
  const memberId = memberIdSchema.parse(formData.get("memberId"));
  const token = (await cookies()).get("acms_admin_session")?.value;
  if (!token) redirect("/admin/login");

  const optionalValue = (name: string) => {
    const value = String(formData.get(name) ?? "").trim();
    return value || null;
  };
  const payload = {
    firstName: String(formData.get("firstName") ?? "").trim(),
    lastName: String(formData.get("lastName") ?? "").trim(),
    otherNames: optionalValue("otherNames"),
    phone: optionalValue("phone"),
    membershipStatus: String(formData.get("membershipStatus") ?? ""),
  };
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiUrl}/members/${memberId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) {
    redirect("/admin/login");
  }
  if (!response.ok) {
    const body = (await response.json()) as { message?: string | string[] };
    throw new Error(
      Array.isArray(body.message)
        ? body.message.join(" ")
        : (body.message ?? "The member could not be updated."),
    );
  }
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin/members");
}

export async function archiveMember(formData: FormData) {
  const memberId = memberIdSchema.parse(formData.get("memberId"));
  const token = (await cookies()).get("acms_admin_session")?.value;
  if (!token) redirect("/admin/login");
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiUrl}/members/${memberId}/archive`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) {
    redirect("/admin/login");
  }
  if (!response.ok) {
    const body = (await response.json()) as { message?: string };
    throw new Error(body.message ?? "The member could not be archived.");
  }
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${memberId}`);
}

export async function addMemberToDepartment(formData: FormData) {
  const memberId = memberIdSchema.parse(formData.get("memberId"));
  const departmentId = memberIdSchema.parse(formData.get("departmentId"));
  const token = (await cookies()).get("acms_admin_session")?.value;
  if (!token) redirect("/admin/login");
  const joinedAt = String(formData.get("joinedAt") ?? "").trim();
  const payload = {
    memberId,
    makePrimary: formData.get("makePrimary") === "on",
    ...(joinedAt ? { joinedAt } : {}),
  };
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(
    `${apiUrl}/departments/${departmentId}/members`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );
  if (response.status === 401 || response.status === 403) {
    redirect("/admin/login");
  }
  if (!response.ok) {
    const body = (await response.json()) as { message?: string };
    throw new Error(body.message ?? "The department assignment failed.");
  }
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin/members");
  revalidatePath("/admin/departments");
}

export async function endDepartmentMembership(formData: FormData) {
  const memberId = memberIdSchema.parse(formData.get("memberId"));
  const departmentId = memberIdSchema.parse(formData.get("departmentId"));
  const membershipId = memberIdSchema.parse(formData.get("membershipId"));
  const token = (await cookies()).get("acms_admin_session")?.value;
  if (!token) redirect("/admin/login");
  const leftAt = String(formData.get("leftAt") ?? "").trim();
  const replacement = String(
    formData.get("replacementPrimaryMembershipId") ?? "",
  ).trim();
  const payload = {
    reason: String(formData.get("reason") ?? "").trim(),
    ...(leftAt ? { leftAt } : {}),
    replacementPrimaryMembershipId: replacement || null,
  };
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(
    `${apiUrl}/departments/${departmentId}/memberships/${membershipId}/end`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );
  if (response.status === 401 || response.status === 403) {
    redirect("/admin/login");
  }
  if (!response.ok) {
    const body = (await response.json()) as { message?: string };
    throw new Error(body.message ?? "The membership could not be ended.");
  }
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin/members");
  revalidatePath("/admin/departments");
}

export async function setPrimaryDepartment(formData: FormData) {
  const memberId = memberIdSchema.parse(formData.get("memberId"));
  const membership = String(
    formData.get("departmentMembershipId") ?? "",
  ).trim();
  const effectiveOn = String(formData.get("effectiveOn") ?? "").trim();
  const token = (await cookies()).get("acms_admin_session")?.value;
  if (!token) redirect("/admin/login");
  const payload = {
    departmentMembershipId: membership || null,
    reason: String(formData.get("reason") ?? "").trim(),
    ...(effectiveOn ? { effectiveOn } : {}),
  };
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(
    `${apiUrl}/members/${memberId}/primary-department`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );
  if (response.status === 401 || response.status === 403) {
    redirect("/admin/login");
  }
  if (!response.ok) {
    const body = (await response.json()) as { message?: string };
    throw new Error(body.message ?? "The primary department update failed.");
  }
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin/members");
}

"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const departmentIdSchema = z.uuid();
const assignmentIdSchema = z.uuid();

export async function createDepartment(formData: FormData) {
  const token = (await cookies()).get("acms_admin_session")?.value;
  if (!token) redirect("/admin/login");
  const payload = {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || undefined,
  };
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiUrl}/departments`, {
    method: "POST",
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
        : (body.message ?? "The department could not be created."),
    );
  }
  revalidatePath("/admin/departments");
  revalidatePath("/admin/dashboard");
}

export async function updateDepartment(formData: FormData) {
  const departmentId = departmentIdSchema.parse(formData.get("departmentId"));
  const token = (await cookies()).get("acms_admin_session")?.value;
  if (!token) redirect("/admin/login");
  const payload = {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
  };
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiUrl}/departments/${departmentId}`, {
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
        : (body.message ?? "The department could not be updated."),
    );
  }
  revalidatePath("/admin/departments");
  revalidatePath("/admin/dashboard");
}

export async function deactivateDepartment(formData: FormData) {
  const departmentId = departmentIdSchema.parse(formData.get("departmentId"));
  const token = (await cookies()).get("acms_admin_session")?.value;
  if (!token) redirect("/admin/login");
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(
    `${apiUrl}/departments/${departmentId}/deactivate`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  if (response.status === 401 || response.status === 403) {
    redirect("/admin/login");
  }
  if (!response.ok) {
    const body = (await response.json()) as { message?: string };
    throw new Error(body.message ?? "The department could not be deactivated.");
  }
  revalidatePath("/admin/departments");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/registrations");
}

export async function assignDepartmentLeader(formData: FormData) {
  const departmentId = departmentIdSchema.parse(formData.get("departmentId"));
  const token = (await cookies()).get("acms_admin_session")?.value;
  if (!token) redirect("/admin/login");
  const payload = {
    memberId: z.uuid().parse(formData.get("memberId")),
    title: String(formData.get("title") ?? "").trim() || undefined,
    startsAt: String(formData.get("startsAt") ?? ""),
    endsAt: String(formData.get("endsAt") ?? "") || null,
  };
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(
    `${apiUrl}/departments/${departmentId}/leaders`,
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
    const body = (await response.json()) as { message?: string | string[] };
    throw new Error(
      Array.isArray(body.message)
        ? body.message.join(" ")
        : (body.message ?? "The department leader could not be assigned."),
    );
  }
  revalidatePath("/admin/departments");
}

export async function revokeDepartmentLeader(formData: FormData) {
  const departmentId = departmentIdSchema.parse(formData.get("departmentId"));
  const assignmentId = assignmentIdSchema.parse(formData.get("assignmentId"));
  const token = (await cookies()).get("acms_admin_session")?.value;
  if (!token) redirect("/admin/login");
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(
    `${apiUrl}/departments/${departmentId}/leaders/${assignmentId}/revoke`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: String(formData.get("reason") ?? "").trim(),
      }),
      cache: "no-store",
    },
  );
  if (response.status === 401 || response.status === 403) {
    redirect("/admin/login");
  }
  if (!response.ok) {
    const body = (await response.json()) as { message?: string | string[] };
    throw new Error(
      Array.isArray(body.message)
        ? body.message.join(" ")
        : (body.message ?? "The department leadership could not be ended."),
    );
  }
  revalidatePath("/admin/departments");
}

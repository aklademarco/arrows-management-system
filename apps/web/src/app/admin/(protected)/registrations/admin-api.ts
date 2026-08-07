import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

export async function getAdminResource<T>(path: string): Promise<T> {
  const token = (await cookies()).get("acms_admin_session")?.value;
  if (!token) {
    redirect("/admin/login");
  }
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as {
    data?: T;
    message?: string | string[];
  } | null;
  if (response.status === 401 || response.status === 403) {
    redirect("/admin/login");
  }
  if (response.status === 404) {
    notFound();
  }
  if (!response.ok) {
    const message = Array.isArray(body?.message)
      ? body.message.join(" ")
      : body?.message;
    throw new Error(
      message ??
        `Registration review data could not be loaded (HTTP ${response.status}).`,
    );
  }
  if (!body || !("data" in body)) {
    throw new Error("The registration API returned an invalid response.");
  }
  return body.data as T;
}

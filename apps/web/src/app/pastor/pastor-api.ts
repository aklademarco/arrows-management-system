import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getPastorResource<T>(path: string): Promise<T> {
  const token = (await cookies()).get("acms_pastor_session")?.value;

  if (!token) redirect("/login");

  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch (error) {
    throw new Error(`Pastoral API could not be reached for ${path}.`, {
      cause: error,
    });
  }

  if (response.status === 401 || response.status === 403) {
    redirect("/login");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(" ")
      : (body?.message ?? response.statusText ?? "Unknown API error");

    throw new Error(
      `Pastoral workspace request ${path} failed (${response.status}): ${message}`,
    );
  }

  const body = (await response.json()) as { data: T };
  return body.data;
}

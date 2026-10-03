import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type ApiResponse<T> = {
  success?: boolean;
  message?: string | string[];
  data?: T;
};

export async function getLeaderResource<T>(path: string): Promise<T> {
  const token = (await cookies()).get("acms_leader_session")?.value;

  if (!token) {
    redirect("/login");
  }

  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";

  const response = await fetch(`${apiUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    redirect("/login");
  }

  const body = (await response
    .json()
    .catch(() => null)) as ApiResponse<T> | null;

  if (response.status === 403) {
    const message = Array.isArray(body?.message)
      ? body.message.join(" ")
      : body?.message;

    throw new Error(
      message ?? "You do not have permission to access this resource.",
    );
  }

  if (!response.ok || body?.data === undefined) {
    const message = Array.isArray(body?.message)
      ? body.message.join(" ")
      : body?.message;

    throw new Error(message ?? "Leadership workspace could not be loaded.");
  }

  return body.data;
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getLeaderResource<T>(path: string): Promise<T> {
  const token = (await cookies()).get("acms_leader_session")?.value;
  if (!token) redirect("/login");
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) redirect("/login");
  if (!response.ok) throw new Error("Leadership workspace could not be loaded.");
  const body = (await response.json()) as { data: T };
  return body.data;
}

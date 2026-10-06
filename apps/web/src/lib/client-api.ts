import { headers } from "next/headers";

export async function getClientIpHeaders(): Promise<Record<string, string>> {
  const requestHeaders = await headers();
  const clientIp = requestHeaders.get("x-real-ip");

  if (!clientIp) {
    return {};
  }

  return {
    "X-Forwarded-For": clientIp,
  };
}

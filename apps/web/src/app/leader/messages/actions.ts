"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

export type MessageState = { status: "idle" | "success" | "error"; message: string };

const schema = z.object({
  audience: z.enum(["CHURCH", "DEPARTMENT"]),
  title: z.string().trim().min(1, "Add a message title.").max(180),
  body: z.string().trim().min(1, "Write the message before sending.").max(5_000),
  departmentIds: z.array(z.uuid()).max(20),
});

export async function sendLeadershipMessage(
  _previous: MessageState,
  formData: FormData,
): Promise<MessageState> {
  const token = (await cookies()).get("acms_leader_session")?.value;
  if (!token) redirect("/login");
  const parsed = schema.safeParse({
    audience: formData.get("audience"),
    title: formData.get("title"),
    body: formData.get("body"),
    departmentIds: formData.getAll("departmentIds"),
  });
  if (!parsed.success)
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the message details." };
  try {
    const response = await fetch(`${process.env.API_URL ?? "http://localhost:4000/api/v1"}/leadership-messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
    if (response.status === 401) redirect("/login");
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
      return { status: "error", message: Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? "The message could not be sent." };
    }
    const body = (await response.json()) as { data: { recipientCount: number } };
    revalidatePath("/leader/messages");
    revalidatePath("/leader", "layout");
    return { status: "success", message: `Message delivered to ${body.data.recipientCount} recipient${body.data.recipientCount === 1 ? "" : "s"}.` };
  } catch {
    return { status: "error", message: "The messaging service is unavailable. Try again shortly." };
  }
}

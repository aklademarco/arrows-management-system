"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

export type MessageState = {
  status: "idle" | "success" | "error";
  message: string;
};

const schema = z.object({
  title: z.string().trim().min(1, "Add a message title.").max(180),
  body: z.string().trim().min(1, "Write the message before sending.").max(5000),
  smsRequested: z.boolean(),
});

export async function sendPastorMessage(
  _previous: MessageState,
  formData: FormData,
): Promise<MessageState> {
  const parsed = schema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    smsRequested: formData.get("smsRequested") === "on",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the message details.",
    };
  }

  const token = (await cookies()).get("acms_pastor_session")?.value;

  if (!token) {
    redirect("/login");
  }

  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";

  let response: Response;

  try {
    response = await fetch(`${apiUrl}/leadership-messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audience: "CHURCH",
        title: parsed.data.title,
        body: parsed.data.body,
        smsRequested: parsed.data.smsRequested,
      }),
      cache: "no-store",
    });
  } catch {
    return {
      status: "error",
      message: "The messaging service is unavailable. Try again shortly.",
    };
  }

  if (response.status === 401) {
    redirect("/login");
  }

  if (response.status === 403) {
    return {
      status: "error",
      message: "You no longer have permission to send church messages.",
    };
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;

    return {
      status: "error",
      message: Array.isArray(body?.message)
        ? body.message.join(" ")
        : (body?.message ?? "The message could not be sent."),
    };
  }

  const body = (await response.json()) as {
    data: {
      recipientCount: number;
    };
  };

  revalidatePath("/pastor/messages");

  return {
    status: "success",
    message: `Church message delivered to ${
      body.data.recipientCount
    } recipient${body.data.recipientCount === 1 ? "" : "s"}${
      parsed.data.smsRequested ? "; SMS delivery has been queued." : "."
    }`,
  };
}

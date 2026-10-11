"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

export type CareRequestState = {
  status: "idle" | "success" | "error";
  message: string;
};

const schema = z.object({
  type: z.enum(["MESSAGE", "PRAYER_REQUEST"]),
  subject: z
    .string()
    .trim()
    .min(3, "Add a short subject.")
    .max(160, "Keep the subject under 160 characters."),
  body: z
    .string()
    .trim()
    .min(10, "Share a little more so the pastoral team can help.")
    .max(5_000, "Keep your message under 5,000 characters."),
});

export async function submitCareRequest(
  _previous: CareRequestState,
  formData: FormData,
): Promise<CareRequestState> {
  const token = (await cookies()).get("acms_member_session")?.value;
  if (!token) redirect("/login");

  const parsed = schema.safeParse({
    type: formData.get("type"),
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? "Check your request details.",
    };
  }

  let response: Response;
  try {
    response = await fetch(
      `${process.env.API_URL ?? "http://localhost:4000/api/v1"}/pastoral-care/requests`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
        cache: "no-store",
      },
    );
  } catch {
    return {
      status: "error",
      message: "The pastoral inbox is unavailable. Try again shortly.",
    };
  }

  if (response.status === 401 || response.status === 403) redirect("/login");
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    return {
      status: "error",
      message: Array.isArray(body?.message)
        ? body.message.join(" ")
        : (body?.message ?? "Your request could not be sent."),
    };
  }

  revalidatePath("/member/care");
  return {
    status: "success",
    message: "Your private request has been sent to the pastoral team.",
  };
}

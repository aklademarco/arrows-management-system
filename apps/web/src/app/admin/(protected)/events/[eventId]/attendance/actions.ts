"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { redirect, unstable_rethrow } from "next/navigation";

async function mutate(
  path: string,
  method: "POST" | "PATCH",
  payload: object,
  eventId: string,
) {
  const token = (await cookies()).get("acms_admin_session")?.value;
  if (!token) redirect("/admin/login");
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403)
    redirect("/admin/login");
  if (!response.ok) {
    const body = (await response.json()) as { message?: string | string[] };
    throw new Error(
      Array.isArray(body.message)
        ? body.message.join(" ")
        : (body.message ?? "Attendance action failed."),
    );
  }
  revalidatePath(`/admin/events/${eventId}/attendance`);
  revalidatePath("/member");
}

export type AttendanceActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function saveAttendance(
  _previous: AttendanceActionState,
  formData: FormData,
): Promise<AttendanceActionState> {
  const schema = z.object({
    eventId: z.uuid(),
    memberId: z.uuid(),
    attendanceId: z.union([z.uuid(), z.literal("")]),
    status: z.enum(["EARLY", "ON_TIME", "LATE", "ABSENT", "EXCUSED"]),
    reason: z.string().trim().min(3).max(1000),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      status: "error",
      message:
        "Choose an attendance status and enter a reason of 3–1000 characters.",
    };
  const { eventId, memberId, attendanceId, status, reason } = parsed.data;
  if (!attendanceId && (status === "ABSENT" || status === "EXCUSED")) {
    return {
      status: "error",
      message: "Manual check-in requires a present status.",
    };
  }
  try {
    await mutate(
      attendanceId ? `/attendance/${attendanceId}` : "/attendance/manual",
      attendanceId ? "PATCH" : "POST",
      attendanceId
        ? { status, reviewNote: reason }
        : { eventId, memberId, status, reason },
      eventId,
    );
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/reports");
    return { status: "success", message: "Attendance saved." };
  } catch (error) {
    unstable_rethrow(error);
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Unable to save attendance. Please try again.",
    };
  }
}

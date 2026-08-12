"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type SongListState = { status: "idle" | "success" | "error"; message: string };

const songSchema = z.object({
  title: z.string().trim().min(1).max(180),
  musicalKey: z.string().trim().max(30).optional(),
  lyrics: z.string().trim().max(20_000).optional(),
  notes: z.string().trim().max(2_000).optional(),
});

const schema = z.object({
  title: z.string().trim().min(1, "Add a name for this song list.").max(180),
  instructions: z.string().trim().max(2_000).optional(),
  songs: z.array(songSchema).min(1).max(30),
});

export async function publishSongList(
  _previous: SongListState,
  formData: FormData,
): Promise<SongListState> {
  const token = (await cookies()).get("acms_leader_session")?.value;
  if (!token) redirect("/login");
  try {
    const data = schema.parse({
      title: formData.get("title"),
      instructions: formData.get("instructions") || undefined,
      songs: JSON.parse(String(formData.get("songs") ?? "[]")) as unknown,
    });
    const response = await fetch(`${process.env.API_URL ?? "http://localhost:4000/api/v1"}/ministry-content/song-lists`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
    });
    if (response.status === 401) redirect("/login");
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
      return { status: "error", message: Array.isArray(body?.message) ? body.message.join(" ") : body?.message ?? "The song list could not be published." };
    }
    revalidatePath("/leader/ministry");
    revalidatePath("/member/media-hub");
    return { status: "success", message: "Song list sent to the Choir and Media teams." };
  } catch (error) {
    if (error instanceof z.ZodError) return { status: "error", message: error.issues[0]?.message ?? "Check the song-list details." };
    return { status: "error", message: "The song list could not be published." };
  }
}

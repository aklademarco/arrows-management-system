"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  ANNOUNCEMENT_PORTALS,
  PUBLISHING_PORTALS,
  type PublishingPortal,
} from "@/lib/announcements";
import { churchWallTimeToIso } from "@/lib/church-time";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import { feedBasePath } from "@/lib/feed";

const FLYER_FOLDER = "acms/announcement-flyers";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null);

const optionalWallTime = z
  .string()
  .trim()
  .transform((value, context) => {
    if (!value) return null;
    const iso = churchWallTimeToIso(value);
    if (!iso) {
      context.addIssue({ code: "custom", message: "Enter a valid date and time." });
      return z.NEVER;
    }
    return iso;
  });

/** Where to return after a save; mapped to a path here, never taken from the client. */
const destinationSchema = z.enum(["events", "feed"]).default("events");
type Destination = z.infer<typeof destinationSchema>;

const saveSchema = z.object({
  portal: z.enum(PUBLISHING_PORTALS),
  destination: destinationSchema,
  id: z.uuid().optional(),
  kind: z.enum(["ANNOUNCEMENT", "EVENT"]),
  title: z.string().trim().min(1, "Add a title.").max(180),
  theme: optionalText(180),
  description: optionalText(2000),
  locationName: optionalText(200),
  startsAt: optionalWallTime,
  endsAt: optionalWallTime,
  flyer: z.discriminatedUnion("action", [
    z.object({ action: z.literal("keep") }),
    z.object({ action: z.literal("remove") }),
    z.object({ action: z.literal("replace"), dataUrl: z.string() }),
  ]),
});

export type SaveAnnouncementInput = z.input<typeof saveSchema>;
export type SaveAnnouncementResult = { error: string };

const apiUrl = () => process.env.API_URL ?? "http://localhost:4000/api/v1";

async function sessionToken(portal: PublishingPortal) {
  const { cookie, loginPath } = ANNOUNCEMENT_PORTALS[portal];
  const token = (await cookies()).get(cookie)?.value;
  if (!token) redirect(loginPath);
  return token;
}

async function apiErrorMessage(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as {
    message?: string | string[];
  } | null;
  if (Array.isArray(body?.message)) return body.message.join(" ");
  return body?.message ?? fallback;
}

function revalidateBoards() {
  for (const portal of Object.keys(ANNOUNCEMENT_PORTALS) as Array<
    keyof typeof ANNOUNCEMENT_PORTALS
  >) {
    revalidatePath(ANNOUNCEMENT_PORTALS[portal].basePath);
    revalidatePath(feedBasePath(portal));
  }
}

function backToBoard(
  portal: PublishingPortal,
  destination: Destination,
  kind: "success" | "error",
  message: string,
): never {
  const path =
    destination === "feed"
      ? feedBasePath(portal)
      : ANNOUNCEMENT_PORTALS[portal].basePath;
  redirect(`${path}?feedback=${kind}&message=${encodeURIComponent(message)}`);
}

/**
 * Asks the API whether this user may post (or edit this post) before any
 * image is sent to Cloudinary, so a refused request never uploads a file.
 */
async function canWrite(token: string, id: string | undefined) {
  const response = await fetch(
    id ? `${apiUrl()}/announcements/${id}` : `${apiUrl()}/announcements?limit=1`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  if (!response.ok) return false;
  const body = (await response.json().catch(() => null)) as {
    data?: { canPublish?: boolean; canManage?: boolean };
  } | null;
  return id ? body?.data?.canManage === true : body?.data?.canPublish === true;
}

export async function saveAnnouncement(
  input: SaveAnnouncementInput,
): Promise<SaveAnnouncementResult> {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  const data = parsed.data;
  const token = await sessionToken(data.portal);

  let flyer: { flyerUrl: string | null; flyerPublicId: string | null } | undefined;
  if (data.flyer.action === "remove") {
    flyer = { flyerUrl: null, flyerPublicId: null };
  } else if (data.flyer.action === "replace") {
    if (!(await canWrite(token, data.id))) {
      return { error: "You do not have permission to save this post." };
    }
    try {
      const uploaded = await uploadImageToCloudinary({
        dataUrl: data.flyer.dataUrl,
        folder: FLYER_FOLDER,
        namePrefix: "flyer",
      });
      flyer = { flyerUrl: uploaded.url, flyerPublicId: uploaded.publicId };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "The flyer could not be uploaded.",
      };
    }
  }

  const payload = {
    kind: data.kind,
    title: data.title,
    theme: data.theme,
    description: data.description,
    locationName: data.locationName,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    ...flyer,
  };
  const response = await fetch(
    data.id ? `${apiUrl()}/announcements/${data.id}` : `${apiUrl()}/announcements`,
    {
      method: data.id ? "PATCH" : "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );
  if (response.status === 401) redirect(ANNOUNCEMENT_PORTALS[data.portal].loginPath);
  if (!response.ok) {
    return { error: await apiErrorMessage(response, "The post could not be saved.") };
  }

  revalidateBoards();
  backToBoard(
    data.portal,
    data.destination,
    "success",
    data.id ? "Post updated." : `${data.kind === "EVENT" ? "Event" : "Announcement"} published.`,
  );
}

export async function archiveAnnouncement(formData: FormData) {
  const portal = z.enum(PUBLISHING_PORTALS).parse(formData.get("portal"));
  const id = z.uuid().parse(formData.get("id"));
  const destination = destinationSchema.parse(
    formData.get("destination") ?? undefined,
  );
  const token = await sessionToken(portal);

  const response = await fetch(`${apiUrl()}/announcements/${id}/archive`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (response.status === 401) redirect(ANNOUNCEMENT_PORTALS[portal].loginPath);
  if (!response.ok) {
    backToBoard(
      portal,
      destination,
      "error",
      await apiErrorMessage(response, "The post could not be archived."),
    );
  }
  revalidateBoards();
  backToBoard(portal, destination, "success", "Post archived.");
}

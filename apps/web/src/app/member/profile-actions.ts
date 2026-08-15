"use server";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  otherNames: z.string().trim().max(150).nullable(),
  phone: z
    .string()
    .trim()
    .regex(
      /^\+[1-9]\d{7,14}$/,
      "Use international format, for example +233240000000.",
    )
    .nullable(),
  directoryBio: z.string().trim().max(300).nullable(),
  directoryVisible: z.boolean(),
  directoryPhoneVisible: z.boolean(),
  skills: z.array(z.string().trim().min(1).max(40)).max(12),
});

export async function updateOwnProfile(formData: FormData) {
  const parseOptional = (name: string) => {
    const value = String(formData.get(name) ?? "").trim();
    return value || null;
  };
  const result = profileSchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    otherNames: parseOptional("otherNames"),
    phone: parseOptional("phone"),
    directoryBio: parseOptional("directoryBio"),
    directoryVisible: formData.get("directoryVisible") === "on",
    directoryPhoneVisible:
      formData.get("directoryPhoneVisible") === "on",
    skills: String(formData.get("skills") ?? "")
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean),
  });
  if (!result.success) {
    throw new Error(
      result.error.issues[0]?.message ?? "Check the profile details.",
    );
  }

  const token = (await cookies()).get("acms_member_session")?.value;
  if (!token) redirect("/login");
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiUrl}/members/me`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(result.data),
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) redirect("/login");
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(" ")
      : body?.message;
    throw new Error(message ?? "Your profile could not be updated.");
  }
  revalidatePath("/member");
  revalidatePath("/member/profile");
  revalidatePath("/member/directory");
  redirect("/member/profile?updated=1");
}

export async function uploadMemberPhoto(imageData: string) {
  const token = (await cookies()).get("acms_member_session")?.value;
  if (!token) redirect("/login");
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const match =
    /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(
      imageData,
    );
  if (!match || Buffer.byteLength(match[2], "base64") > 5_000_000)
    throw new Error("Choose a JPEG, PNG, or WebP image no larger than 5 MB.");
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME,
    apiKey = process.env.CLOUDINARY_API_KEY,
    apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret)
    throw new Error("Cloudinary photo storage is not configured.");
  const profileResponse = await fetch(`${apiUrl}/members/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!profileResponse.ok)
    throw new Error("Your member profile could not be loaded.");
  const profileBody = (await profileResponse.json()) as {
    data: { id: string };
  };
  const folder = "acms/members",
    publicId = `${profileBody.data.id}-profile`,
    timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha1")
    .update(
      `folder=${folder}&overwrite=true&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`,
    )
    .digest("hex");
  const form = new FormData();
  for (const [key, value] of Object.entries({
    file: imageData,
    api_key: apiKey,
    timestamp: String(timestamp),
    signature,
    folder,
    public_id: publicId,
    overwrite: "true",
  }))
    form.set(key, value);
  const upload = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form },
  );
  const uploaded = (await upload.json().catch(() => null)) as {
    secure_url?: string;
    error?: { message?: string };
  } | null;
  if (!upload.ok || !uploaded?.secure_url)
    throw new Error(
      uploaded?.error?.message ?? "Photo could not be uploaded to Cloudinary.",
    );
  const response = await fetch(`${apiUrl}/members/me/profile-photo`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ profilePhotoUrl: uploaded.secure_url }),
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) redirect("/login");
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    throw new Error(
      Array.isArray(body?.message)
        ? body.message.join(" ")
        : (body?.message ?? "Photo could not be updated."),
    );
  }
  revalidatePath("/member", "layout");
  revalidatePath("/member/profile");
  return uploaded.secure_url;
}

export async function removeMemberPhoto() {
  const token = (await cookies()).get("acms_member_session")?.value;
  if (!token) redirect("/login");
  const apiUrl = process.env.API_URL ?? "http://localhost:4000/api/v1";
  const profileResponse = await fetch(`${apiUrl}/members/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!profileResponse.ok)
    throw new Error("Your member profile could not be loaded.");
  const profileBody = (await profileResponse.json()) as {
    data: { id: string };
  };
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME,
    apiKey = process.env.CLOUDINARY_API_KEY,
    apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret)
    throw new Error("Cloudinary photo storage is not configured.");
  const publicId = `acms/members/${profileBody.data.id}-profile`,
    timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha1")
    .update(
      `invalidate=true&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`,
    )
    .digest("hex");
  const form = new FormData();
  for (const [key, value] of Object.entries({
    public_id: publicId,
    api_key: apiKey,
    timestamp: String(timestamp),
    signature,
    invalidate: "true",
  }))
    form.set(key, value);
  const destroyed = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    { method: "POST", body: form },
  );
  if (!destroyed.ok)
    throw new Error("The Cloudinary photo could not be removed.");
  const response = await fetch(`${apiUrl}/members/me/profile-photo`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ profilePhotoUrl: null }),
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error("The saved photo reference could not be removed.");
  revalidatePath("/member", "layout");
  revalidatePath("/member/profile");
}
